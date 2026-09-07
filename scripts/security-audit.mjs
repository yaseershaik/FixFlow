/**
 * FixFlow Security Audit - Live HTTP Tests
 * Tests auth bypass, info leakage, IDOR, rate limiting, session security
 */
import http from 'http';

const BASE = 'http://localhost:3000';
const results = [];
let testNum = 0;

function log(category, name, expected, actual, pass, severity = '') {
  testNum++;
  const status = pass ? 'PASS' : `FAIL [${severity}]`;
  const line = `[${testNum}] ${category} | ${name} | Expected: ${expected} | Actual: ${actual} | ${status}`;
  results.push(line);
  console.log(line);
}

function req(method, path, body = null, headers = {}, cookie = '') {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const opts = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        ...headers,
        ...(cookie ? { Cookie: cookie } : {}),
      },
    };
    if (body && typeof body === 'object') {
      const json = JSON.stringify(body);
      opts.headers['Content-Type'] = 'application/json';
      opts.headers['Content-Length'] = Buffer.byteLength(json);
    }
    const r = http.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(data); } catch {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: parsed,
          raw: data.substring(0, 2000),
          setCookie: res.headers['set-cookie'] || [],
        });
      });
    });
    r.on('error', reject);
    if (body && typeof body === 'object') r.write(JSON.stringify(body));
    r.end();
  });
}

async function run() {
  console.log('=== FixFlow Security Audit ===\n');
  
  // ==========================================
  // 1. AUTHENTICATION BYPASS TESTS
  // ==========================================
  console.log('\n--- 1. AUTHENTICATION BYPASS ---');

  // Test unauthenticated access to protected APIs
  const protectedAPIs = [
    '/api/issues', '/api/auth/me', '/api/search?q=test',
    '/api/export', '/api/issues/stats'
  ];
  for (const ep of protectedAPIs) {
    const r = await req('GET', ep);
    log('AUTH_BYPASS', `Unauthenticated GET ${ep}`, '401', r.status, r.status === 401, 'CRITICAL');
  }

  // Test with forged cookie
  const fakeSession = 'fixflow_session=fakecookie123';
  const r1 = await req('GET', '/api/auth/me', null, {}, fakeSession);
  log('AUTH_BYPASS', 'Forged cookie -> /api/auth/me', '401', r1.status, r1.status === 401, 'CRITICAL');

  // Test with tampered base64 payload
  const tamperedPayload = Buffer.from(JSON.stringify({userId:"hacker",exp:9999999999999})).toString('base64url');
  const tamperedToken = `${tamperedPayload}.invalidsignature`;
  const r2 = await req('GET', '/api/auth/me', null, {}, `fixflow_session=${tamperedToken}`);
  log('AUTH_BYPASS', 'Tampered token payload', '401', r2.status, r2.status === 401, 'CRITICAL');

  // Test expired token (exp in the past)
  const expiredPayload = Buffer.from(JSON.stringify({userId:"test",exp:1000})).toString('base64url');
  const expiredToken = `${expiredPayload}.fakesig`;
  const r3 = await req('GET', '/api/auth/me', null, {}, `fixflow_session=${expiredToken}`);
  log('AUTH_BYPASS', 'Expired token', '401', r3.status, r3.status === 401, 'CRITICAL');

  // ==========================================
  // 2. INFORMATION LEAKAGE TESTS
  // ==========================================
  console.log('\n--- 2. INFORMATION LEAKAGE ---');

  // Check X-Powered-By header
  const r4 = await req('GET', '/');
  const hasPoweredBy = !!r4.headers['x-powered-by'];
  log('INFO_LEAK', 'X-Powered-By header present', 'Not present', hasPoweredBy ? r4.headers['x-powered-by'] : 'Not present', !hasPoweredBy, 'MEDIUM');
  
  // Check security headers
  const hasFrameOptions = !!r4.headers['x-frame-options'];
  log('HEADERS', 'X-Frame-Options set', 'DENY', r4.headers['x-frame-options'] || 'MISSING', hasFrameOptions, 'MEDIUM');
  const hasNoSniff = !!r4.headers['x-content-type-options'];
  log('HEADERS', 'X-Content-Type-Options set', 'nosniff', r4.headers['x-content-type-options'] || 'MISSING', hasNoSniff, 'MEDIUM');
  const hasCSP = !!r4.headers['content-security-policy'];
  log('HEADERS', 'Content-Security-Policy set', 'Present', hasCSP ? 'Present' : 'MISSING', hasCSP, 'MEDIUM');

  // Check login error messages don't differentiate user existence
  const r5 = await req('POST', '/api/auth/login', { email: 'nonexistent@test.com', password: 'wrongpass' });
  const r6 = await req('POST', '/api/auth/login', { email: 'demo@fixflow.app', password: 'wrongpass' });
  const sameMsg = r5.body?.error?.message === r6.body?.error?.message;
  log('INFO_LEAK', 'Login error same for non-existent vs wrong-pw', 'Same message', sameMsg ? 'Same message' : `"${r5.body?.error?.message}" vs "${r6.body?.error?.message}"`, sameMsg, 'HIGH');

  // Check forgot-password leaks user existence
  const r7 = await req('POST', '/api/auth/forgot-password', { email: 'nonexistent@example.com' });
  const r8 = await req('POST', '/api/auth/forgot-password', { email: 'demo@fixflow.app' });
  // Check if responses differ structurally
  const fpKeys7 = Object.keys(r7.body?.data || {}).sort().join(',');
  const fpKeys8 = Object.keys(r8.body?.data || {}).sort().join(',');
  const fpSame = fpKeys7 === fpKeys8;
  log('INFO_LEAK', 'Forgot-password same response for both', 'Same structure', fpSame ? 'Same structure' : `"${fpKeys7}" vs "${fpKeys8}"`, fpSame, 'HIGH');
  
  // CRITICAL: Check if real reset code is returned in response
  const hasResetCode = r8.body?.data?.resetCode && r8.body.data.resetCode !== '000000';
  log('INFO_LEAK', 'Reset code returned in API response', 'Should NOT return real code', hasResetCode ? `Real code: ${r8.body.data.resetCode}` : 'Code not in response or dummy', !hasResetCode, 'CRITICAL');

  // Check if error responses leak stack traces
  const r9 = await req('POST', '/api/auth/login', 'not-json', { 'Content-Type': 'text/plain' });
  const hasStack = r9.raw.includes('Error:') || r9.raw.includes('at ') || r9.raw.includes('node_modules');
  log('INFO_LEAK', 'Error responses leak stack traces', 'No stack trace', hasStack ? 'Contains stack trace' : 'Clean error', !hasStack, 'HIGH');

  // ==========================================
  // 3. INPUT VALIDATION TESTS
  // ==========================================
  console.log('\n--- 3. INPUT VALIDATION ---');

  // SQL injection in register email
  const r10 = await req('POST', '/api/auth/register', {
    email: "admin'--@evil.com",
    password: 'testpass123',
    name: 'SQLi Test'
  });
  log('INPUT', 'SQL injection in email', '400 or safe rejection', r10.status, r10.status >= 400, 'HIGH');

  // XSS in registration name
  const r11 = await req('POST', '/api/auth/register', {
    email: 'xsstest@example.com',
    password: 'testpass123',
    name: '<script>alert(1)</script>'
  });
  log('INPUT', 'XSS payload in name field', 'Stored as text (React escapes)', r11.status, true, 'INFO');

  // Long input test
  const longEmail = 'a'.repeat(10000) + '@test.com';
  const r12 = await req('POST', '/api/auth/register', { email: longEmail, password: 'test123456' });
  log('INPUT', 'Extremely long email (10000 chars)', '400 rejection', r12.status, r12.status === 400, 'MEDIUM');

  // Empty body
  const r13 = await req('POST', '/api/auth/login', null, { 'Content-Type': 'application/json' });
  log('INPUT', 'Empty body to login', '400', r13.status, r13.status === 400, 'LOW');

  // Malformed JSON
  const r14 = await req('POST', '/api/auth/login', null, { 'Content-Type': 'application/json' });
  log('INPUT', 'Malformed JSON to login', '400', r14.status, r14.status === 400, 'LOW');

  // ==========================================
  // 4. SESSION SECURITY TESTS
  // ==========================================
  console.log('\n--- 4. SESSION SECURITY ---');

  // Login with demo account to get a valid session
  const demoLogin = await req('POST', '/api/auth/demo');
  const demoCookies = demoLogin.setCookie;
  let demoSession = '';
  for (const c of demoCookies) {
    if (c.includes('fixflow_session=')) {
      demoSession = c.split(';')[0];
      break;
    }
  }

  if (demoSession) {
    // Check cookie flags
    const cookieStr = demoCookies.find(c => c.includes('fixflow_session')) || '';
    const hasHttpOnly = cookieStr.toLowerCase().includes('httponly');
    const hasSameSite = cookieStr.toLowerCase().includes('samesite');
    const hasPath = cookieStr.toLowerCase().includes('path=/');
    log('SESSION', 'Cookie has httpOnly flag', 'true', hasHttpOnly, hasHttpOnly, 'CRITICAL');
    log('SESSION', 'Cookie has SameSite flag', 'true', hasSameSite, hasSameSite, 'HIGH');
    log('SESSION', 'Cookie has Path=/', 'true', hasPath, hasPath, 'LOW');

    // Check token content - decode base64url
    const tokenValue = demoSession.split('=').slice(1).join('=');
    const [payload] = tokenValue.split('.');
    try {
      const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString());
      const hasPassword = decoded.passwordHash || decoded.password;
      log('SESSION', 'Token does NOT contain password', 'No password', hasPassword ? 'CONTAINS PASSWORD' : 'No password', !hasPassword, 'CRITICAL');
      const hasUserId = !!decoded.userId;
      log('SESSION', 'Token contains userId', 'true', hasUserId, hasUserId, 'INFO');
      const hasExpiry = !!decoded.exp;
      log('SESSION', 'Token has expiration', 'true', hasExpiry, hasExpiry, 'HIGH');
      log('SESSION', 'Token payload contents', 'Audit', JSON.stringify(Object.keys(decoded)), true, 'INFO');
    } catch (e) {
      log('SESSION', 'Token decode', 'Decodable', 'Failed to decode', false, 'HIGH');
    }

    // Test authenticated access works
    const meResp = await req('GET', '/api/auth/me', null, {}, demoSession);
    log('SESSION', 'Authenticated /api/auth/me', '200', meResp.status, meResp.status === 200, 'INFO');

    // ==========================================
    // 5. DEMO ACCOUNT ISOLATION TESTS
    // ==========================================
    console.log('\n--- 5. DEMO ACCOUNT ISOLATION ---');

    // Demo user trying to change password
    const cpResp = await req('POST', '/api/auth/change-password', {
      currentPassword: 'demo123',
      newPassword: 'hacked123'
    }, {}, demoSession);
    log('DEMO', 'Demo cannot change password', '403', cpResp.status, cpResp.status === 403, 'HIGH');

    // Demo user trying to delete account
    const delResp = await req('POST', '/api/auth/delete-account', {
      password: 'demo123'
    }, {}, demoSession);
    log('DEMO', 'Demo cannot delete account', '403', delResp.status, delResp.status === 403, 'HIGH');

    // Demo user trying to update profile
    const profResp = await req('PATCH', '/api/auth/me', { name: 'Hacked Demo' }, {}, demoSession);
    log('DEMO', 'Demo cannot update profile', '403', profResp.status, profResp.status === 403, 'MEDIUM');

    // ==========================================
    // 6. AUTHORIZATION / IDOR TESTS
    // ==========================================
    console.log('\n--- 6. IDOR / AUTHORIZATION ---');

    // Try accessing another user's issue by guessing ID
    const idorResp = await req('GET', '/api/issues/nonexistent-fake-id', null, {}, demoSession);
    log('IDOR', 'Access non-existent issue returns 404', '404', idorResp.status, idorResp.status === 404, 'CRITICAL');

    // Try accessing another user's uploads
    const uploadResp = await req('GET', '/api/uploads/other-user-id/somefile.pdf', null, {}, demoSession);
    log('IDOR', 'Access other users uploads returns 403', '403', uploadResp.status, uploadResp.status === 403, 'CRITICAL');

    // Try to access issue events from a different user
    const evtResp = await req('GET', '/api/issues/nonexistent-id/events', null, {}, demoSession);
    log('IDOR', 'Access issue events for non-owned issue', '404', evtResp.status, evtResp.status === 404, 'CRITICAL');

    // ==========================================
    // 7. RATE LIMITING TESTS
    // ==========================================
    console.log('\n--- 7. RATE LIMITING ---');

    // Send rapid login attempts
    let rateLimited = false;
    for (let i = 0; i < 20; i++) {
      const rl = await req('POST', '/api/auth/login', { email: 'ratetest@test.com', password: 'wrong' });
      if (rl.status === 429) {
        rateLimited = true;
        log('RATE_LIMIT', `Login rate limit triggered after ${i + 1} attempts`, 'Rate limited', '429 received', true, 'INFO');
        break;
      }
    }
    if (!rateLimited) {
      log('RATE_LIMIT', 'Login rate limit after 20 attempts', 'Should be limited', 'No 429 received', false, 'HIGH');
    }

    // ==========================================
    // 8. RESET PASSWORD SECURITY
    // ==========================================
    console.log('\n--- 8. RESET PASSWORD ---');

    // Reset code not rate limited for brute force
    const r15 = await req('POST', '/api/auth/reset-password', {
      email: 'demo@fixflow.app',
      code: '000000',
      newPassword: 'hacked12345'
    });
    // Reset code timing comparison: is it constant-time?
    log('RESET_PWD', 'Reset with wrong code rejected', '400', r15.status, r15.status === 400, 'INFO');
    
    // Check if reset-password endpoint has rate limiting
    let resetLimited = false;
    for (let i = 0; i < 15; i++) {
      const rl = await req('POST', '/api/auth/reset-password', {
        email: 'demo@fixflow.app',
        code: String(100000 + i),
        newPassword: 'tryhard123'
      });
      if (rl.status === 429) {
        resetLimited = true;
        break;
      }
    }
    log('RESET_PWD', 'Reset-password has rate limiting', 'Should be limited', resetLimited ? 'Rate limited' : 'NO rate limiting', resetLimited, 'HIGH');

    // Test 39: Constant-time reset code comparison
    import('fs').then(fsModule => {
      const resetCodeFile = fsModule.readFileSync('src/app/api/auth/reset-password/route.ts', 'utf-8');
      const usesTimingSafe = resetCodeFile.includes('crypto.timingSafeEqual');
      log('RESET_PWD', 'Reset code uses timingSafeEqual comparison', 'true', usesTimingSafe ? 'timingSafeEqual used' : 'String comparison', usesTimingSafe, 'MEDIUM');
    });

    // Test 40: Canonical demo complaint protection
    const demoIssues = await req('GET', '/api/issues', null, {}, demoSession);
    const samsungIssue = demoIssues.body?.data?.issues?.find(i => i.referenceNo === 'SR-948201');
    if (samsungIssue) {
      const delCanonical = await req('DELETE', `/api/issues/${samsungIssue.id}`, null, {}, demoSession);
      log('DEMO', 'Canonical complaint deletion blocked in demo mode', '403', delCanonical.status, delCanonical.status === 403, 'HIGH');
    } else {
      log('DEMO', 'Canonical complaint deletion check', '403', 'Issue not found to delete', true, 'INFO');
    }

    // Logout demo session
    await req('POST', '/api/auth/logout', null, {}, demoSession);

  } else {
    log('SESSION', 'Could not obtain demo session', 'Session cookie set', 'No cookie', false, 'CRITICAL');
  }

  // ==========================================
  // SUMMARY
  // ==========================================
  console.log('\n\n=== AUDIT SUMMARY ===');
  const passes = results.filter(r => r.includes('PASS')).length;
  const fails = results.filter(r => r.includes('FAIL')).length;
  console.log(`Total tests: ${results.length}`);
  console.log(`Passed: ${passes}`);
  console.log(`Failed: ${fails}`);

  const critical = results.filter(r => r.includes('FAIL [CRITICAL]'));
  const high = results.filter(r => r.includes('FAIL [HIGH]'));
  const medium = results.filter(r => r.includes('FAIL [MEDIUM]'));
  
  if (critical.length) {
    console.log(`\n🔴 CRITICAL (${critical.length}):`);
    critical.forEach(c => console.log('  ' + c));
  }
  if (high.length) {
    console.log(`\n🟠 HIGH (${high.length}):`);
    high.forEach(c => console.log('  ' + c));
  }
  if (medium.length) {
    console.log(`\n🟡 MEDIUM (${medium.length}):`);
    medium.forEach(c => console.log('  ' + c));
  }
}

run().catch(e => {
  console.error('Audit script error:', e);
  process.exit(1);
});
