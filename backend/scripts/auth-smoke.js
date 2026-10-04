// Runs against disposable MongoDB 4.0 users. SMTP and Google identity are stubbed
// at the transport boundary; no real email or external account is contacted.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const env = require('../src/config/env');
const User = require('../src/models/User');
const EmailOtp = require('../src/models/EmailOtp');
const RefreshToken = require('../src/models/RefreshToken');
const mail = require('../src/services/mail.service');
const google = require('../src/services/googleAuth.service');
const ApiError = require('../src/utils/ApiError');
const { authLimiter } = require('../src/middlewares/rateLimit.middleware');

const run = crypto.randomUUID();
const ids = [];
const codes = new Map();
const googleTokens = new Map();
let checks = 0;
let server;
let base;
mail.isConfigured = () => true;
mail.sendOtp = async (email, purpose, code) => { codes.set(`${email}:${purpose}`, code); };
google.verifyIdToken = async (token) => {
  if (!googleTokens.has(token)) throw ApiError.unauthorized('Invalid Google token');
  return googleTokens.get(token);
};
const app = require('../src/app');
function codeFor(email, purpose) {
  const code = codes.get(`${email}:${purpose}`);
  assert.ok(code, `Missing ${purpose} code for fixture`);
  return code;
}
function wrongCodeFor(email, purpose) {
  const nines = '9'.repeat(env.otp.length);
  return codeFor(email, purpose) === nines ? '8'.repeat(env.otp.length) : nines;
}
async function request(path, { method = 'GET', body, status = 200, token, cookie } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  if (cookie) headers.Cookie = cookie;
  const response = await fetch(`${base}${path}`, { method, headers,
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(15000) });
  if (response.status !== status) {
    const value = await response.clone().json().catch(() => ({}));
    assert.fail(`${method} ${path}: HTTP ${response.status}, expected ${status}; ${value.message || ''}`);
  }
  checks++;
  if (checks % 8 === 0) {
    authLimiter.resetKey('127.0.0.1');
    authLimiter.resetKey('::ffff:127.0.0.1');
  }
  return response;
}
async function data(path, options) { return (await (await request(path, options)).json()).data; }
const post = (path, body, status = 200) => data(path, { method: 'POST', body, status });
async function main() {
  await mongoose.connect(env.mongoUri);
  assert.match((await mongoose.connection.db.admin().serverInfo()).version, /^4\.0\./);
  await Promise.all([User.init(), EmailOtp.init()]);
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}/api`;

  const failedEmail = `auth-failed-${run}@example.invalid`;
  const originalSend = mail.sendOtp;
  mail.sendOtp = async () => { throw new Error('SMTP fixture unavailable'); };
  await request('/auth/register', { method: 'POST', status: 503,
    body: { name: 'Failed Mail', email: failedEmail, password: crypto.randomBytes(20).toString('hex') } });
  assert.equal(await User.countDocuments({ email: failedEmail }), 0);
  mail.sendOtp = originalSend;

  const email = `auth-${run}@example.invalid`;
  const password = crypto.randomBytes(20).toString('hex');
  const registered = await post('/auth/register', { name: 'Auth Fixture', email, password,
    role: 'admin', storageLimitBytes: 1234 }, 201);
  assert.equal(registered.verificationRequired, true);
  assert.equal(registered.accessToken, undefined);
  const user = await User.findOne({ email });
  ids.push(user._id);
  assert.equal(user.role, 'user');
  assert.equal(user.storageLimitBytes, 0);
  await request('/auth/login', { method: 'POST', body: { email, password }, status: 403 });
  await request('/auth/email/resend', { method: 'POST', body: { email }, status: 429 });
  const firstCode = codeFor(email, 'verify');
  for (let i = 0; i < env.otp.maxAttempts; i++) {
    await request('/auth/email/verify', { method: 'POST', body: { email, code: wrongCodeFor(email, 'verify') }, status: 400 });
  }
  await request('/auth/email/verify', { method: 'POST', body: { email, code: firstCode }, status: 400 });
  await EmailOtp.updateOne({ user: user._id, purpose: 'verify' }, { $set: { sentAt: new Date(0) } });
  await post('/auth/email/resend', { email });
  await post('/auth/email/verify', { email, code: codeFor(email, 'verify') });
  await request('/auth/email/verify', { method: 'POST', body: { email, code: codeFor(email, 'verify') }, status: 400 });
  await post('/auth/login/otp/request', { email: `unknown-${run}@example.invalid` });
  await post('/auth/password/forgot', { email: `unknown-${run}@example.invalid` });
  const loginResponse = await request('/auth/login', { method: 'POST', body: { email, password } });
  const login = (await loginResponse.json()).data;
  const oldCookie = loginResponse.headers.get('set-cookie').split(';')[0];
  assert.equal(login.user.emailVerified, true);
  await request('/auth/me', { token: login.accessToken });
  const appearance = { theme: 'deep-purple', mode: 'light' };
  const savedAppearance = await data('/users/me', { method: 'PATCH', token: login.accessToken,
    body: { appearance } });
  assert.deepEqual(savedAppearance.user.appearance, appearance);
  assert.deepEqual((await data('/auth/me', { token: login.accessToken })).user.appearance, appearance);
  await request('/users/me', { method: 'PATCH', token: login.accessToken, status: 400,
    body: { appearance: { theme: 'invalid', mode: 'dark' } } });
  const unlockProof = jwt.sign({ kind: 'share-unlock', sub: String(user._id) },
    env.jwt.accessSecret, { expiresIn: '5m' });
  await request('/auth/me', { token: unlockProof, status: 401 });

  await post('/auth/login/otp/request', { email });
  await request('/auth/login/otp/verify', { method: 'POST', body: { email, code: wrongCodeFor(email, 'login') }, status: 400 });
  const otpSession = await post('/auth/login/otp/verify', { email, code: codeFor(email, 'login') });
  assert.ok(otpSession.accessToken);
  await request('/auth/login/otp/verify', { method: 'POST', body: { email, code: codeFor(email, 'login') }, status: 400 });
  await post('/auth/password/forgot', { email });
  await EmailOtp.updateOne({ user: user._id, purpose: 'reset' }, { $set: { expiresAt: new Date(0), sentAt: new Date(0) } });
  await request('/auth/password/verify', { method: 'POST', body: { email, code: codeFor(email, 'reset') }, status: 400 });
  await post('/auth/password/forgot', { email });
  const reset = await post('/auth/password/verify', { email, code: codeFor(email, 'reset') });
  const newPassword = `${password}new`;
  await post('/auth/password/reset', { email, resetToken: reset.resetToken, password: newPassword });
  await request('/auth/password/reset', { method: 'POST', body: { email, resetToken: reset.resetToken, password: newPassword }, status: 400 });
  await request('/auth/me', { token: login.accessToken, status: 401 });
  await request('/auth/refresh', { method: 'POST', cookie: oldCookie, status: 401 });
  await request('/auth/login', { method: 'POST', body: { email, password }, status: 401 });
  await post('/auth/login', { email, password: newPassword });

  const tokenNew = 'n'.repeat(100);
  const googleEmail = `auth-google-${run}@gmail.com`;
  googleTokens.set(tokenNew, { sub: `google-new-${run}`, email: googleEmail,
    name: 'Google Fixture', picture: 'https://lh3.googleusercontent.com/test', authoritative: true });
  const googleUser = await post('/auth/google', { idToken: tokenNew });
  ids.push(googleUser.user.id);
  assert.equal(googleUser.user.emailVerified, true);
  assert.equal(googleUser.user.role, 'user');
  assert.equal(googleUser.user.avatarUrl, 'https://lh3.googleusercontent.com/test');
  await post('/auth/google', { idToken: tokenNew });
  assert.equal(await User.countDocuments({ email: googleEmail }), 1);

  const pendingEmail = `auth-pending-${run}@gmail.com`;
  await post('/auth/register', { name: 'Pending Gmail', email: pendingEmail, password }, 201);
  const pendingUser = await User.findOne({ email: pendingEmail });
  ids.push(pendingUser._id);
  const pendingGoogleToken = 'p'.repeat(100);
  googleTokens.set(pendingGoogleToken, { sub: `google-pending-${run}`, email: pendingEmail,
    name: 'Pending Gmail', authoritative: true });
  await post('/auth/google', { idToken: pendingGoogleToken });
  assert.equal((await User.findById(pendingUser._id).select('+passwordHash')).passwordHash, undefined);
  assert.equal(await User.countDocuments({ email: pendingEmail }), 1);
  await request('/auth/login', { method: 'POST', body: { email: pendingEmail, password }, status: 401 });

  const existingEmail = `auth-existing-${run}@gmail.com`;
  const existing = await User.create({ name: 'Existing', email: existingEmail,
    passwordHash: await User.hashPassword(password), role: 'admin' });
  ids.push(existing._id);
  const tokenExisting = 'e'.repeat(100);
  googleTokens.set(tokenExisting, { sub: `google-existing-${run}`, email: existingEmail,
    name: 'Existing Google', authoritative: true });
  const linked = await post('/auth/google', { idToken: tokenExisting });
  assert.equal(linked.user.id, String(existing._id));
  assert.equal(linked.user.role, 'admin');
  assert.equal(await User.countDocuments({ email: existingEmail }), 1);

  const externalEmail = `auth-link-${run}@example.org`;
  const external = await User.create({ name: 'External', email: externalEmail,
    passwordHash: await User.hashPassword(password) });
  ids.push(external._id);
  const tokenExternal = 'x'.repeat(100);
  googleTokens.set(tokenExternal, { sub: `google-external-${run}`, email: externalEmail,
    name: 'External Google', authoritative: false });
  const pending = await post('/auth/google', { idToken: tokenExternal }, 202);
  assert.equal(pending.linkRequired, true);
  assert.equal((await User.findById(external._id)).googleSub, undefined);
  await request('/auth/google/link', { method: 'POST', body: { linkToken: pending.linkToken, code: wrongCodeFor(externalEmail, 'google_link') }, status: 400 });
  const externalSession = await post('/auth/google/link', { linkToken: pending.linkToken,
    code: codeFor(externalEmail, 'google_link') });
  assert.equal(externalSession.user.id, String(external._id));
  assert.equal(await User.countDocuments({ email: externalEmail }), 1);
  await request('/auth/google/link', { method: 'POST', body: { linkToken: pending.linkToken,
    code: codeFor(externalEmail, 'google_link') }, status: 400 });

  const changedEmail = `auth-changed-${run}@example.org`;
  await request(`/admin/users/${external._id}`, { method: 'PATCH', token: linked.accessToken,
    body: { email: changedEmail } });
  await request('/auth/me', { token: externalSession.accessToken, status: 401 });
  await request('/auth/login', { method: 'POST', body: { email: changedEmail, password }, status: 403 });
  await post('/auth/email/resend', { email: changedEmail });
  await post('/auth/email/verify', { email: changedEmail, code: codeFor(changedEmail, 'verify') });
  await post('/auth/login', { email: changedEmail, password });

  const disabled = await User.create({ name: 'Disabled Google', email: `disabled-${run}@gmail.com`,
    passwordHash: await User.hashPassword(password), status: 'disabled' });
  ids.push(disabled._id);
  const tokenDisabled = 'd'.repeat(100);
  googleTokens.set(tokenDisabled, { sub: `google-disabled-${run}`, email: disabled.email,
    name: 'Disabled Google', authoritative: true });
  await request('/auth/google', { method: 'POST', body: { idToken: tokenDisabled }, status: 403 });
  await request('/auth/google', { method: 'POST', body: { idToken: 'z'.repeat(100) }, status: 401 });
  console.log(`Auth OK: ${checks} HTTP checks; email verify, OTP login/reset, Google linking, sessions, MongoDB 4.0`);
}
async function cleanup() {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (mongoose.connection.readyState !== 1) return;
  try {
    await EmailOtp.deleteMany({ user: { $in: ids } });
    await RefreshToken.deleteMany({ user: { $in: ids } });
    await User.deleteMany({ _id: { $in: ids } });
    console.log('Auth fixtures cleaned');
  } finally { await mongoose.disconnect(); }
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; })
  .finally(cleanup).catch((error) => { console.error(`Cleanup failed: ${error.message}`); process.exitCode = 1; });
