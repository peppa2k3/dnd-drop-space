// Integration tests run inside the backend container against the isolated fixture users.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const mongoose = require('mongoose');
const sharp = require('sharp');
const env = require('../src/config/env');
const User = require('../src/models/User');
const Item = require('../src/models/Item');
const Folder = require('../src/models/Folder');
const Tag = require('../src/models/Tag');
const RefreshToken = require('../src/models/RefreshToken');
const AdminAudit = require('../src/models/AdminAudit');
const { minioClient } = require('../src/config/minio');
const run = crypto.randomUUID();
const password = crypto.randomBytes(24).toString('hex');
const ids = [];
let checks = 0;
async function request(path, { token, method = 'GET', body, status = 200, cookie } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (cookie) headers.Cookie = cookie;
  if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const response = await fetch(`http://nginx/api${path}`, {
    method, headers, redirect: 'manual',
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(20000),
  });
  assert.equal(response.status, status, `${method} ${path}: unexpected status`);
  checks++;
  return response;
}
async function data(path, options) { return (await (await request(path, options)).json()).data; }
function fileBody(text = '12345') {
  const body = new FormData();
  body.append('files', new Blob([text], { type: 'text/plain' }), 'rbac-test.txt');
  return body;
}
async function main() {
  await mongoose.connect(env.mongoUri);
  assert.match((await mongoose.connection.db.admin().serverInfo()).version, /^4\.0\./);
  const admin = await User.create({ name: 'RBAC Admin', email: `rbac-admin-${run}@example.invalid`,
    passwordHash: await User.hashPassword(password), role: 'admin' });
  ids.push(admin._id);
  const adminAuth = await data('/auth/login', { method: 'POST', body: { email: admin.email, password } });
  const adminToken = adminAuth.accessToken;
  const registration = await request('/auth/register', { method: 'POST', status: 201,
    body: { name: 'RBAC User', email: `rbac-user-${run}@example.invalid`, password, role: 'admin', storageLimitBytes: 1024 } });
  const cookie = registration.headers.get('set-cookie').split(';')[0];
  const created = (await registration.json()).data;
  ids.push(created.user.id);
  const id = created.user.id;
  const token = created.accessToken;
  assert.equal(created.user.role, 'user');
  assert.equal(created.user.storageLimitBytes, 0);
  assert.ok(created.user.username);
  assert.equal(created.user.passwordHash, undefined);
  await request('/admin/users', { token, status: 403 });
  await request(`/admin/users/${id}`, { token, method: 'PATCH', body: { role: 'admin' }, status: 403 });
  await request('/users/me', { token, method: 'PATCH', body: { role: 'admin' }, status: 400 });
  await request('/users/me', { token, method: 'PATCH', body: { storageLimitBytes: 100 }, status: 400 });
  await request('/items/upload', { token, method: 'POST', body: fileBody(), status: 403 });
  await request('/items/note', { token, method: 'POST', body: { title: 'blocked' }, status: 403 });
  const updated = await data('/users/me', { token, method: 'PATCH', body: { name: 'Updated user', username: `u_${run.replaceAll('-', '').slice(0, 20)}`, bio: 'Profile' } });
  assert.equal(updated.user.bio, 'Profile');
  await request('/users/me', { token, method: 'PATCH', body: { username: admin.username }, status: 409 });
  await request('/users/me', { token, method: 'PATCH', body: { avatarObjectKey: 'other-user' }, status: 400 });
  const avatar = new FormData();
  avatar.append('avatar', new Blob([await sharp({ create: { width: 10, height: 10, channels: 3, background: '#aabbcc' } }).png().toBuffer()], { type: 'image/png' }), 'avatar.png');
  await request('/users/me/avatar', { token, method: 'POST', body: avatar });
  const picture = await request(`/users/${id}/avatar`, { token, status: 302 });
  const url = new URL(picture.headers.get('location'));
  assert.match(url.pathname, /\/avatars\//);
  // Node fetch rewrites Host. Use HTTP directly to preserve the signed browser host.
  const imageResponse = await new Promise((resolve, reject) => {
    require('node:http').get({ hostname: 'minio', port: 9000, path: url.pathname + url.search,
      headers: { Host: url.host } }, (response) => { response.resume(); resolve(response); }).on('error', reject);
  });
  assert.equal(imageResponse.statusCode, 200, 'Signed avatar URL should work');
  assert.equal(imageResponse.headers['content-type'], 'image/webp');
  const invalidImage = new FormData();
  invalidImage.append('avatar', new Blob(['not an image']), 'fake.png');
  await request('/users/me/avatar', { token, method: 'POST', body: invalidImage, status: 400 });
  const hugeAvatar = new FormData();
  hugeAvatar.append('avatar', new Blob([Buffer.alloc(2 * 1024 ** 2 + 1)]), 'large.png');
  await request('/users/me/avatar', { token, method: 'POST', body: hugeAvatar, status: 400 });
  await request(`/users/${admin._id}/avatar`, { token, status: 403 });
  for (const value of [-1, 1.5, 1024 ** 5 + 1]) {
    await request(`/admin/users/${id}`, { token: adminToken, method: 'PATCH', body: { storageLimitBytes: value }, status: 400 });
  }
  await request(`/admin/users/${admin._id}`, { token: adminToken, method: 'PATCH', body: { role: 'user' }, status: 400 });
  await request(`/admin/users/${id}`, { token: adminToken, method: 'PATCH', body: { storageLimitBytes: 10 } });
  assert.equal((await data('/dashboard/stats', { token })).storageLimitBytes, 10);
  const folder = await Folder.create({ user: admin._id, name: 'Private admin folder' });
  await request('/items/note', { token, method: 'POST', body: { title: 'cross-owner', folder: String(folder._id) }, status: 400 });
  const file = (await data('/items/upload', { token, method: 'POST', body: fileBody(), status: 201 })).items[0];
  await request('/items/upload', { token, method: 'POST', body: fileBody('123456'), status: 413 });
  const batch = fileBody('1234');
  batch.append('files', new Blob(['5678']), 'second.txt');
  await request('/items/upload', { token, method: 'POST', body: batch, status: 413 });
  assert.equal(await Item.countDocuments({ user: id, type: 'file' }), 1, 'Rejected batch must not persist partial files');
  const listing = await data(`/admin/users/${id}/files`, { token: adminToken });
  assert.equal(listing.items[0]._id, file._id);
  await request(`/items/${file._id}`, { token: adminToken, status: 404 });
  await request(`/admin/users/${admin._id}/files/${file._id}/download`, { token: adminToken, status: 404 });
  assert.equal(await (await request(`/admin/users/${id}/files/${file._id}/download`, { token: adminToken })).text(), '12345');
  await request(`/admin/users/${id}`, { token: adminToken, method: 'PATCH', body: { storageLimitBytes: 0 } });
  await request('/items/upload', { token, method: 'POST', body: fileBody(), status: 403 });
  assert.equal((await data('/dashboard/stats', { token })).usedStorageBytes, 5);
  await request(`/items/${file._id}/download`, { token });
  await request(`/admin/users/${id}/files/${file._id}`, { token: adminToken, method: 'DELETE', status: 404 });
  await request(`/admin/users/${id}/files/${file._id}`, { token: adminToken, method: 'PATCH', body: { isTrashed: true } });
  await request(`/admin/users/${id}/files/${file._id}`, { token: adminToken, method: 'PATCH', body: { isTrashed: false } });
  await request(`/admin/users/${id}/files/${file._id}`, { token: adminToken, method: 'PATCH', body: { isTrashed: true } });
  await request(`/admin/users/${id}/files/${file._id}`, { token: adminToken, method: 'DELETE' });
  assert.equal((await data('/dashboard/stats', { token })).usedStorageBytes, 0);
  await request(`/admin/users/${id}`, { token: adminToken, method: 'PATCH', body: { status: 'disabled' } });
  await request('/auth/me', { token, status: 403 });
  await request('/auth/refresh', { method: 'POST', cookie, status: 401 });
  await request('/auth/login', { method: 'POST', body: { email: created.user.email, password }, status: 403 });
  await request(`/admin/users/${id}`, { token: adminToken, method: 'PATCH', body: { status: 'active', role: 'admin' } });
  await request('/auth/me', { token, status: 401 });
  const newSession = await data('/auth/login', { method: 'POST', body: { email: created.user.email, password } });
  await request('/admin/users', { token: newSession.accessToken });
  await request(`/admin/users/${id}`, { token: adminToken, method: 'PATCH', body: { role: 'user' } });
  await request('/admin/users', { token: newSession.accessToken, status: 403 });
  const audit = await data(`/admin/users/${id}/audit`, { token: adminToken });
  assert.ok(audit.total >= 8);
  const users = await data(`/admin/users?q=${encodeURIComponent(created.user.email)}`, { token: adminToken });
  assert.equal(users.total, 1);
  require('node:child_process').execFileSync(process.execPath, ['scripts/set-admin.js', created.user.email]);
  await request('/admin/users', { token: newSession.accessToken });
  assert.equal((await data('/dashboard/stats', { token: newSession.accessToken })).storageLimitBytes, 0);
  console.log(`RBAC OK: ${checks} HTTP checks; quota, roles, profile, MinIO avatars, isolation, admin files, audit, session revocation`);
}
async function cleanup() {
  if (mongoose.connection.readyState !== 1) return;
  try {
    for (const id of ids) {
      for (const prefix of [`${id}/`, `avatars/${id}/`]) {
        for await (const object of minioClient.listObjectsV2(env.minio.bucket, prefix, true)) {
          await minioClient.removeObject(env.minio.bucket, object.name);
        }
      }
      for (const model of [Item, Folder, Tag, RefreshToken]) await model.deleteMany({ user: id });
      await AdminAudit.deleteMany({ $or: [{ actor: id }, { target: id }] });
      await User.deleteOne({ _id: id });
    }
    console.log('RBAC fixtures cleaned');
  } finally { await mongoose.disconnect(); }
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(cleanup);
