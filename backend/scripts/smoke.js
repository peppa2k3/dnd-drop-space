// Run inside the backend container. Only this run's random users/data are removed.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const mongoose = require('mongoose');
const env = require('../src/config/env');
const { minioClient } = require('../src/config/minio');
const User = require('../src/models/User');
const Item = require('../src/models/Item');
const Folder = require('../src/models/Folder');
const Tag = require('../src/models/Tag');
const RefreshToken = require('../src/models/RefreshToken');

const base = 'http://nginx';
const runId = crypto.randomUUID();
const email = `smoke-${runId}@example.invalid`;
const password = crypto.randomBytes(24).toString('hex');
let token;
let cookie;

async function request(path, { method = 'GET', body, status = 200, auth = true } = {}) {
  const headers = {};
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  if (cookie) headers.Cookie = cookie;
  if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const response = await fetch(`${base}${path}`, {
    method, headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(20000),
  });
  if (response.status !== status) {
    const error = await response.json().catch(() => ({}));
    assert.fail(`${method} ${path}: HTTP ${response.status}, expected ${status}; ${error.message || 'unexpected response'}`);
  }
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) cookie = setCookie.split(';')[0];
  return response;
}

async function main() {
  await mongoose.connect(env.mongoUri);
  const { version } = await mongoose.connection.db.admin().serverInfo();
  assert.match(version, /^4\.0\./, 'Smoke must run against MongoDB 4.0');
  const html = await (await request('/', { auth: false })).text();
  assert.match(html, /id="root"/);
  await request('/api/health', { auth: false });
  await request('/api/items', { auth: false, status: 401 });

  // The dedicated auth test covers email verification. This fixture starts verified.
  const fixture = await User.create({ name: 'Smoke Test', email,
    passwordHash: await User.hashPassword(password) });
  const registered = await (await request('/api/auth/login', {
    method: 'POST', body: { email, password },
  })).json();
  token = registered.data.accessToken;
  assert.equal(registered.data.user.storageLimitBytes, 0);
  await request('/api/admin/users', { status: 403 });
  await request('/api/items/upload', { method: 'POST', status: 403 });
  // Explicit grant to this disposable test fixture; new real users stay at zero.
  await User.updateOne({ _id: fixture._id }, { $set: { storageLimitBytes: 2 * 1024 ** 3 } });
  assert.ok(cookie, 'Login must set a refresh cookie');
  const oldCookie = cookie;
  const refreshed = await (await request('/api/auth/refresh', { method: 'POST' })).json();
  token = refreshed.data.accessToken;
  assert.notEqual(cookie, oldCookie, 'Refresh must rotate the cookie');
  await request('/api/auth/me');

  const folder = (await (await request('/api/folders', {
    method: 'POST', status: 201, body: { name: `folder-${runId}` },
  })).json()).data.folder;
  const tagName = `tag-${runId}`;
  const note = (await (await request('/api/items/note', {
    method: 'POST', status: 201,
    body: { title: `note-${runId}`, content: 'smoke markdown', folder: folder._id, tags: [tagName] },
  })).json()).data.item;
  await request(`/api/items/${note._id}/note`, { method: 'PATCH', body: { content: 'updated content' } });
  for (const query of [`note-${runId}`, tagName, `folder-${runId}`]) {
    const result = await (await request(`/api/search?q=${encodeURIComponent(query)}`)).json();
    assert.ok(result.data.items.some((item) => item._id === note._id), 'Search should find the note');
  }

  const payload = `PKH smoke ${runId}`;
  const fileName = 'tiếng trung chương 1.pdf';
  const form = new FormData();
  form.append('files', new Blob([payload], { type: 'application/pdf' }), fileName);
  const uploaded = (await (await request('/api/items/upload', {
    method: 'POST', status: 201, body: form,
  })).json()).data.items[0];
  assert.equal(uploaded.title, fileName);
  assert.equal(uploaded.fileMeta.originalName, fileName);
  const download = await request(`/api/items/${uploaded._id}/download`);
  assert.match(download.headers.get('content-disposition'), /filename\*=UTF-8''ti%E1%BA%BFng/);
  assert.equal(await download.text(), payload);
  const usage = (await (await request('/api/dashboard/stats')).json()).data;
  assert.equal(usage.totalFiles, 1);
  assert.equal(usage.usedStorageBytes, Buffer.byteLength(payload));
  assert.equal(usage.storageLimitBytes, 2 * 1024 ** 3);
  assert.equal(usage.maxFileSizeBytes, 1024 * 1024 ** 2);
  assert.equal(usage.maxFilesPerUpload, 20);

  // A tiny upload is rejected when metadata for this test user fills the quota.
  const quotaFixture = await Item.create({
    user: registered.data.user.id,
    type: 'file',
    title: 'quota-fixture',
    fileMeta: { category: 'other', size: usage.storageLimitBytes - usage.usedStorageBytes - 1 },
  });
  try {
    const extra = new FormData();
    extra.append('files', new Blob(['extra'], { type: 'text/plain' }), 'extra.txt');
    await request('/api/items/upload', { method: 'POST', body: extra, status: 413 });
  } finally {
    await Item.deleteOne({ _id: quotaFixture._id, user: registered.data.user.id });
  }

  const concurrentFixture = await Item.create({
    user: registered.data.user.id,
    type: 'file',
    title: 'concurrent-quota-fixture',
    fileMeta: { category: 'other', size: usage.storageLimitBytes - usage.usedStorageBytes - 5 },
  });
  try {
    const send = () => {
      const body = new FormData();
      body.append('files', new Blob(['12345'], { type: 'text/plain' }), 'small.txt');
      return fetch(`${base}/api/items/upload`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body,
        signal: AbortSignal.timeout(20000),
      });
    };
    const responses = await Promise.all([send(), send()]);
    assert.deepEqual(responses.map((response) => response.status).sort(), [201, 413]);
    const accepted = responses.find((response) => response.status === 201);
    const small = (await accepted.json()).data.items[0];
    await request(`/api/items/${small._id}/permanent`, { method: 'DELETE' });
  } finally {
    await Item.deleteOne({ _id: concurrentFixture._id, user: registered.data.user.id });
  }
  await request(`/api/items/${note._id}`, { method: 'DELETE' });
  const trashed = (await (await request(`/api/items/${note._id}`)).json()).data.item;
  assert.equal(trashed.isTrashed, true);
  await request(`/api/items/${note._id}/restore`, { method: 'POST' });
  const restored = (await (await request(`/api/items/${note._id}`)).json()).data.item;
  assert.equal(restored.isTrashed, false);
  await request(`/api/items/${uploaded._id}`, { method: 'DELETE' });
  assert.equal((await (await request('/api/dashboard/stats')).json()).data.usedStorageBytes, Buffer.byteLength(payload));
  await request(`/api/items/${uploaded._id}/permanent`, { method: 'DELETE' });
  assert.equal((await (await request('/api/dashboard/stats')).json()).data.usedStorageBytes, 0);
  await request(`/api/items/${note._id}`, { method: 'DELETE' });
  await request(`/api/items/${note._id}/permanent`, { method: 'DELETE' });
  await request(`/api/items/${note._id}`, { status: 404 });
  await request(`/api/items/${uploaded._id}`, { status: 404 });
  await request('/api/auth/logout', { method: 'POST' });
  await request('/api/auth/refresh', { method: 'POST', status: 401 });
  const login = await (await request('/api/auth/login', { method: 'POST', body: { email, password } })).json();
  assert.ok(login.data.accessToken);
  console.log(`Smoke OK: MongoDB ${version}; web/auth/refresh/note/folder/tag/search/upload/download/trash`);
}

async function cleanup() {
  try {
    if (mongoose.connection.readyState !== 1) return;
    const user = await User.findOne({ email });
    if (!user) return;
    // Remove even an orphaned upload if the API failed after writing the object.
    const stream = minioClient.listObjectsV2(env.minio.bucket, `${user._id}/`, true);
    for await (const object of stream) await minioClient.removeObject(env.minio.bucket, object.name);
    for (const model of [Item, Folder, Tag, RefreshToken]) await model.deleteMany({ user: user._id });
    await User.deleteOne({ _id: user._id, email });
    console.log('Smoke fixtures cleaned');
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
}).finally(cleanup).catch((error) => {
  console.error(`Cleanup failed: ${error.message}`);
  process.exitCode = 1;
});
