import fs from "fs";
import path from "path";
import zlib from "zlib";

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcVal = zlib.crc32(crcInput);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function createFixFlowPng(size) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData.writeUInt8(8, 8); // bit depth 8
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace
  const ihdrChunk = makeChunk("IHDR", ihdrData);

  // Raw image bytes with filter byte 0 at start of each scanline
  const scanlineLength = 1 + size * 4;
  const rawData = Buffer.alloc(size * scanlineLength);

  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.45;

  for (let y = 0; y < size; y++) {
    const rowOffset = y * scanlineLength;
    rawData.writeUInt8(0, rowOffset); // filter = 0

    for (let x = 0; x < size; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      // Rounded card background
      const cornerR = size * 0.22;
      const dx = Math.abs(x - cx);
      const dy = Math.abs(y - cy);
      const halfSize = size * 0.44;

      let inCard = false;
      if (dx <= halfSize - cornerR && dy <= halfSize) inCard = true;
      else if (dy <= halfSize - cornerR && dx <= halfSize) inCard = true;
      else {
        const cdx = dx - (halfSize - cornerR);
        const cdy = dy - (halfSize - cornerR);
        if (cdx * cdx + cdy * cdy <= cornerR * cornerR) {
          inCard = true;
        }
      }

      if (!inCard) {
        // Transparent
        rawData.writeUInt8(0, pixelOffset);
        rawData.writeUInt8(0, pixelOffset + 1);
        rawData.writeUInt8(0, pixelOffset + 2);
        rawData.writeUInt8(0, pixelOffset + 3);
        continue;
      }

      // Default background: Indigo/Slate gradient
      const t = (x + y) / (size * 2);
      const bgR = Math.round(15 * (1 - t) + 79 * t);
      const bgG = Math.round(23 * (1 - t) + 70 * t);
      const bgB = Math.round(42 * (1 - t) + 229 * t);

      // Draw checkmark / check glyph:
      // Path from (0.3*size, 0.52*size) to (0.45*size, 0.68*size) to (0.72*size, 0.36*size)
      const p1 = { x: 0.28 * size, y: 0.52 * size };
      const p2 = { x: 0.44 * size, y: 0.68 * size };
      const p3 = { x: 0.72 * size, y: 0.36 * size };

      const strokeW = Math.max(3, size * 0.08);

      function distToSegment(px, py, v, w) {
        const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
        if (l2 === 0) return Math.hypot(px - v.x, py - v.y);
        let t = ((px - v.x) * (w.x - v.x) + (py - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        return Math.hypot(px - (v.x + t * (w.x - v.x)), py - (v.y + t * (w.y - v.y)));
      }

      const d1 = distToSegment(x, y, p1, p2);
      const d2 = distToSegment(x, y, p2, p3);
      const minD = Math.min(d1, d2);

      if (minD <= strokeW / 2) {
        // Emerald / Mint stroke (#34d399)
        rawData.writeUInt8(52, pixelOffset);
        rawData.writeUInt8(211, pixelOffset + 1);
        rawData.writeUInt8(153, pixelOffset + 2);
        rawData.writeUInt8(255, pixelOffset + 3);
      } else if (minD <= strokeW / 2 + 1) {
        // Antialiasing border
        const alpha = Math.max(0, Math.min(1, (strokeW / 2 + 1 - minD)));
        rawData.writeUInt8(Math.round(52 * alpha + bgR * (1 - alpha)), pixelOffset);
        rawData.writeUInt8(Math.round(211 * alpha + bgG * (1 - alpha)), pixelOffset + 1);
        rawData.writeUInt8(Math.round(153 * alpha + bgB * (1 - alpha)), pixelOffset + 2);
        rawData.writeUInt8(255, pixelOffset + 3);
      } else {
        rawData.writeUInt8(bgR, pixelOffset);
        rawData.writeUInt8(bgG, pixelOffset + 1);
        rawData.writeUInt8(bgB, pixelOffset + 2);
        rawData.writeUInt8(255, pixelOffset + 3);
      }
    }
  }

  const idatData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk("IDAT", idatData);
  const iendChunk = makeChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createIco(png32Buffer) {
  // ICO header: 6 bytes
  // Reserved (2 bytes = 0), Type (2 bytes = 1 for icon), Count (2 bytes = 1)
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);

  // Directory entry: 16 bytes
  const entry = Buffer.alloc(16);
  entry.writeUInt8(32, 0); // width
  entry.writeUInt8(32, 1); // height
  entry.writeUInt8(0, 2);  // color palette (0 = no palette)
  entry.writeUInt8(0, 3);  // reserved
  entry.writeUInt16LE(1, 4); // color planes
  entry.writeUInt16LE(32, 6); // bpp
  entry.writeUInt32LE(png32Buffer.length, 8); // image size
  entry.writeUInt32LE(6 + 16, 12); // image offset

  return Buffer.concat([header, entry, png32Buffer]);
}

const publicDir = path.resolve("public");
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

console.log("Generating 192x192 PNG...");
const png192 = createFixFlowPng(192);
fs.writeFileSync(path.join(publicDir, "icon-192.png"), png192);

console.log("Generating 512x512 PNG...");
const png512 = createFixFlowPng(512);
fs.writeFileSync(path.join(publicDir, "icon-512.png"), png512);

console.log("Generating 32x32 PNG for favicon.ico...");
const png32 = createFixFlowPng(32);
const ico = createIco(png32);
fs.writeFileSync(path.join(publicDir, "favicon.ico"), ico);

console.log("Done generating icons!");
