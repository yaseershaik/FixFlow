import https from "https";

const KEY = "4f8c9b2e7a1d3f5e6b8a9c0d1e2f3a4b";
const HOST = "getfixflow.vercel.app";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

const URLS = [
  `https://${HOST}/`,
  `https://${HOST}/blog`,
  `https://${HOST}/blog/how-to-file-consumer-complaint-online-india`,
  `https://${HOST}/blog/ecommerce-refund-delay-amazon-flipkart-consumer-rights`,
  `https://${HOST}/blog/broadband-telecom-outage-airtel-jio-consumer-rights`,
  `https://${HOST}/blog/warranty-claim-rejected-service-center-remedies`,
  `https://${HOST}/blog/legal-notice-format-drafting-guide-service-deficiency`,
  `https://${HOST}/consumer-rights`,
  `https://${HOST}/help`,
  `https://${HOST}/about`,
];

const payload = JSON.stringify({
  host: HOST,
  key: KEY,
  keyLocation: KEY_LOCATION,
  urlList: URLS,
});

const options = {
  hostname: "api.indexnow.org",
  port: 443,
  path: "/indexnow",
  method: "POST",
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
  },
};

console.log(`Submitting ${URLS.length} URLs to IndexNow engine (Bing, Yandex, Seznam, Naver)...`);

const req = https.request(options, (res) => {
  console.log(`IndexNow response: ${res.statusCode} ${res.statusMessage}`);
  res.on("data", (d) => process.stdout.write(d));
});

req.on("error", (e) => {
  console.error("IndexNow submission error:", e.message);
});

req.write(payload);
req.end();
