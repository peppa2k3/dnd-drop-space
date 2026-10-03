// Integration checks against disposable users/files in the local MongoDB 4.0 + MinIO stack.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const mongoose = require('mongoose');
const sharp = require('sharp');
const User = require('../src/models/User');
const Item = require('../src/models/Item');
const Friendship = require('../src/models/Friendship');
const UserBlock = require('../src/models/UserBlock');
const UserGroup = require('../src/models/UserGroup');
const GroupInvitation = require('../src/models/GroupInvitation');
const FileShare = require('../src/models/FileShare');
const AdminAudit = require('../src/models/AdminAudit');
const RefreshToken = require('../src/models/RefreshToken');
const tokenService = require('../src/services/token.service');
const { minioClient } = require('../src/config/minio');
const env = require('../src/config/env');
const runId = crypto.randomUUID();
const ids = [];
let checks = 0;
let a, b, c, d, admin;
async function makeUser(label, quota = 1024 ** 2, role = 'user') {
  const user = await User.create({ name: label, username: `collab_${label.toLowerCase()}_${runId.slice(0, 8)}`,
    email: `collab-${label.toLowerCase()}-${runId}@example.invalid`,
    passwordHash: await User.hashPassword(crypto.randomUUID()), storageLimitBytes: quota, role });
  ids.push(user._id);
  const { accessToken } = await tokenService.issueTokenPair(user, 'collaboration-smoke');
  return { id: String(user._id), token: accessToken, username: user.username };
}
async function request(path, { actor, method = 'GET', body, status = 200, headers = {} } = {}) {
  const options = { method, headers: { ...headers }, signal: AbortSignal.timeout(20000) };
  if (actor) options.headers.Authorization = `Bearer ${actor.token}`;
  if (body instanceof FormData) options.body = body;
  else if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }
  const response = await fetch(`http://nginx/api${path}`, options);
  if (response.status !== status) {
    const error = await response.clone().json().catch(() => ({}));
    assert.fail(`${method} ${path.split('?')[0]} after ${checks} checks: got HTTP ${response.status}, expected ${status}; ${error.message || 'unknown'}`);
  }
  checks++;
  return response;
}
async function data(path, options) { return (await (await request(path, options)).json()).data; }
const id = (value) => String(value);
async function uploadImage(actor) {
  const png = await sharp({ create: { width: 20, height: 20, channels: 3, background: '#184477' } }).png().toBuffer();
  const form = new FormData();
  form.append('files', new Blob([png], { type: 'image/png' }), 'share-smoke.png');
  const item = (await data('/items/upload', { actor, method: 'POST', body: form, status: 201 })).items[0];
  return { item, png };
}
async function main() {
  await mongoose.connect(env.mongoUri);
  assert.match((await mongoose.connection.db.admin().serverInfo()).version, /^4\.0\./);
  a = await makeUser('A');
  b = await makeUser('B', 0);
  c = await makeUser('C');
  d = await makeUser('D');
  admin = await makeUser('Admin', 0, 'admin');
  assert.equal((await data(`/social/users?q=${a.username}`, { actor: b })).users[0].id, a.id);
  assert.equal((await data(`/social/users?q=${a.id}`, { actor: b })).users[0].id, a.id);
  const friend = await data('/social/friends/requests', { actor: a, method: 'POST', body: { userId: b.id }, status: 201 });
  await request('/social/friends/requests', { actor: a, method: 'POST', body: { userId: b.id }, status: 409 });
  assert.equal((await data('/social/requests', { actor: b })).requests[0].direction, 'incoming');
  await request(`/social/friends/requests/${friend.id}`, { actor: b, method: 'PATCH', body: { action: 'accept' } });
  assert.equal((await data('/social/friends', { actor: a })).friends[0].id, b.id);
  await request('/groups', { actor: b, method: 'POST', body: { name: 'Blocked group' }, status: 403 });
  const group = (await data('/groups', { actor: a, method: 'POST', body: { name: 'Collaboration smoke', description: 'test', discoverable: true }, status: 201 })).group;
  const gid = id(group.id);
  assert.equal((await data(`/groups/search?q=${gid}`, { actor: c })).groups[0].id, gid);
  await request(`/groups/${gid}`, { actor: c, status: 404 });
  await request(`/groups/${gid}/invitations`, { actor: c, method: 'POST', body: { userId: d.id }, status: 403 });
  let invitation = await data(`/groups/${gid}/invitations`, { actor: a, method: 'POST', body: { userId: b.id }, status: 201 });
  await request(`/groups/invitations/${invitation.id}`, { actor: b, method: 'PATCH', body: { action: 'reject' } });
  invitation = await data(`/groups/${gid}/invitations`, { actor: a, method: 'POST', body: { userId: b.id }, status: 201 });
  assert.equal((await data('/groups/invitations', { actor: b })).invitations[0].id, invitation.id);
  await request(`/groups/invitations/${invitation.id}`, { actor: b, method: 'PATCH', body: { action: 'accept' } });
  assert.equal((await data(`/groups/${gid}`, { actor: b })).group.role, 'MEMBER');
  await request(`/groups/${gid}/members/${b.id}`, { actor: a, method: 'PATCH', body: { role: 'ADMIN' } });
  await request(`/groups/${gid}/members/${a.id}`, { actor: b, method: 'DELETE', status: 403 });
  invitation = await data(`/groups/${gid}/invitations`, { actor: b, method: 'POST', body: { userId: c.id }, status: 201 });
  await request(`/groups/invitations/${invitation.id}`, { actor: c, method: 'PATCH', body: { action: 'accept' } });
  await request(`/groups/${gid}/members/${c.id}`, { actor: b, method: 'DELETE' });
  await request(`/groups/${gid}`, { actor: a, method: 'PATCH', body: { discoverable: false } });
  assert.equal((await data(`/groups/search?q=${gid}`, { actor: d })).groups.length, 0);
  await request(`/groups/${gid}`, { actor: a, method: 'PATCH', body: { discoverable: true } });
  const { item, png } = await uploadImage(a);
  await request(`/items/${item._id}`, { actor: b, status: 404 });
  const usedBefore = (await data('/dashboard/stats', { actor: a })).usedStorageBytes;
  const groupShare = (await data('/shares', { actor: a, method: 'POST', status: 201,
    body: { itemId: item._id, targetType: 'group', targetId: gid, canView: true, canDownload: false, canReshare: true } })).share;
  await request('/shares', { actor: a, method: 'POST',
    body: { itemId: item._id, targetType: 'group', targetId: gid }, status: 409 });
  assert.equal((await data('/shares/received', { actor: b })).shares[0].id, groupShare.id);
  await request(`/shares/${groupShare.id}/view`, { actor: b });
  await request(`/shares/${groupShare.id}/thumbnail`, { actor: b });
  await request(`/shares/${groupShare.id}/download`, { actor: b, status: 403 });
  await request(`/shares/${groupShare.id}/view`, { actor: c, status: 403 });
  const direct = (await data('/shares', { actor: a, method: 'POST', status: 201,
    body: { itemId: item._id, targetType: 'user', targetId: c.id, canView: false, canDownload: true, canReshare: false } })).share;
  await request(`/shares/${direct.id}/view`, { actor: c, status: 403 });
  assert.equal((await (await request(`/shares/${direct.id}/download`, { actor: c })).arrayBuffer()).byteLength, png.length);
  await request('/shares', { actor: c, method: 'POST', status: 403,
    body: { itemId: item._id, sourceShareId: direct.id, targetType: 'user', targetId: d.id,
      canView: false, canDownload: true } });
  await request(`/shares/${direct.id}`, { actor: a, method: 'PATCH', body: { canReshare: true } });
  const child = (await data('/shares', { actor: c, method: 'POST', status: 201,
    body: { itemId: item._id, sourceShareId: direct.id, targetType: 'user', targetId: d.id,
      canView: false, canDownload: true, canReshare: false } })).share;
  await request(`/shares/${child.id}/download`, { actor: d });
  await request(`/shares/${direct.id}`, { actor: a, method: 'PATCH', body: { canDownload: false } });
  await request(`/shares/${child.id}/download`, { actor: d, status: 403 });
  await request(`/shares/${direct.id}`, { actor: a, method: 'PATCH', body: { canDownload: true } });
  await request(`/shares/${direct.id}`, { actor: a, method: 'DELETE' });
  await request(`/shares/${child.id}/download`, { actor: d, status: 404 });
  await User.updateOne({ _id: b.id }, { $set: { storageLimitBytes: 1024 ** 2 } });
  const sub = (await data('/shares', { actor: b, method: 'POST', status: 201,
    body: { itemId: item._id, sourceShareId: groupShare.id, targetType: 'user', targetId: d.id,
      canView: true, canDownload: false, canReshare: true } })).share;
  await request(`/shares/${sub.id}/view`, { actor: d });
  await request(`/shares/${sub.id}/download`, { actor: d, status: 403 });
  const nested = (await data('/shares', { actor: d, method: 'POST', status: 201,
    body: { itemId: item._id, sourceShareId: sub.id, targetType: 'user', targetId: c.id,
      canView: true, canDownload: false, canReshare: false } })).share;
  await request(`/shares/${nested.id}/view`, { actor: c });
  await request(`/social/blocks/${d.id}`, { actor: b, method: 'POST' });
  await request(`/shares/${nested.id}/view`, { actor: c, status: 403 });
  await request(`/social/blocks/${d.id}`, { actor: b, method: 'DELETE' });
  await request(`/shares/${nested.id}/view`, { actor: c });
  const protectedShare = (await data('/shares', { actor: a, method: 'POST', status: 201,
    body: { itemId: item._id, targetType: 'user', targetId: b.id, canView: true,
      canDownload: true, password: 'secret-alpha', expiresAt: new Date(Date.now() + 3600000).toISOString() } })).share;
  assert.equal((await data('/shares/received', { actor: b })).shares
    .find((row) => row.id === protectedShare.id).passwordProtected, true);
  await request(`/shares/${protectedShare.id}/view`, { actor: b, status: 403 });
  await request(`/shares/${protectedShare.id}/unlock`, { actor: b, method: 'POST', body: { password: 'wrong' }, status: 403 });
  let proof = (await data(`/shares/${protectedShare.id}/unlock`, { actor: b, method: 'POST', body: { password: 'secret-alpha' } })).unlockToken;
  await request(`/shares/${protectedShare.id}/view?unlock=${encodeURIComponent(proof)}`, { actor: b });
  await request(`/shares/${protectedShare.id}/download?unlock=${encodeURIComponent(proof)}`, { actor: b });
  await request(`/shares/${protectedShare.id}`, { actor: a, method: 'PATCH',
    body: { canDownload: false, password: 'secret-beta' } });
  await request(`/shares/${protectedShare.id}/view?unlock=${encodeURIComponent(proof)}`, { actor: b, status: 403 });
  proof = (await data(`/shares/${protectedShare.id}/unlock`, { actor: b, method: 'POST', body: { password: 'secret-beta' } })).unlockToken;
  await request(`/shares/${protectedShare.id}/download?unlock=${encodeURIComponent(proof)}`, { actor: b, status: 403 });
  await request('/admin/collaboration/friends', { actor: b, status: 403 });
  assert.ok((await data('/admin/collaboration/groups', { actor: admin })).total >= 1);
  assert.ok((await data('/admin/collaboration/shares', { actor: admin })).total >= 2);
  await request(`/social/blocks/${b.id}`, { actor: a, method: 'POST' });
  assert.equal((await data(`/social/users?q=${a.username}`, { actor: b })).users.length, 0);
  assert.equal((await data('/social/friends', { actor: b })).friends.length, 0);
  await request('/social/friends/requests', { actor: b, method: 'POST', body: { userId: a.id }, status: 404 });
  await request(`/shares/${groupShare.id}/view`, { actor: b, status: 404 });
  await request(`/shares/${sub.id}/view`, { actor: d, status: 403 });
  await request(`/shares/${protectedShare.id}/view?unlock=${encodeURIComponent(proof)}`, { actor: b, status: 404 });
  assert.equal((await data('/shares/received', { actor: b })).shares.length, 0);
  await request(`/social/blocks/${b.id}`, { actor: a, method: 'DELETE' });
  await request(`/shares/${groupShare.id}/view`, { actor: b });
  await request(`/groups/${gid}/members/${b.id}`, { actor: b, method: 'DELETE' });
  await request(`/shares/${groupShare.id}/view`, { actor: b, status: 403 });
  await request(`/shares/${sub.id}/view`, { actor: d, status: 403 });
  assert.equal((await data('/shares/received', { actor: b })).shares.length, 0);
  const expiring = (await data('/shares', { actor: a, method: 'POST', status: 201,
    body: { itemId: item._id, targetType: 'user', targetId: d.id,
      canView: true, canDownload: false, expiresAt: new Date(Date.now() + 3600000).toISOString() } })).share;
  await FileShare.updateOne({ _id: expiring.id }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
  await request(`/shares/${expiring.id}/view`, { actor: d, status: 403 });
  await request(`/admin/collaboration/shares/${groupShare.id}`, { actor: admin, method: 'DELETE' });
  await request(`/shares/${groupShare.id}/view`, { actor: a, status: 404 });
  invitation = await data(`/groups/${gid}/invitations`, { actor: a, method: 'POST', body: { userId: c.id }, status: 201 });
  await request(`/groups/invitations/${invitation.id}`, { actor: c, method: 'PATCH', body: { action: 'accept' } });
  await request(`/groups/${gid}/owner`, { actor: b, method: 'PATCH', body: { userId: c.id }, status: 403 });
  await request(`/groups/${gid}/owner`, { actor: a, method: 'PATCH', body: { userId: c.id } });
  assert.equal((await data(`/groups/${gid}`, { actor: c })).group.role, 'OWNER');
  await request(`/groups/${gid}/members/${a.id}`, { actor: a, method: 'DELETE' });
  await request(`/groups/${gid}`, { actor: c, method: 'DELETE' });
  assert.equal(await Item.countDocuments({ _id: item._id }), 1, 'Sharing must not duplicate the item');
  assert.equal((await data('/dashboard/stats', { actor: a })).usedStorageBytes, usedBefore);
  const stream = minioClient.listObjectsV2(env.minio.bucket, `${a.id}/files/`, true);
  let fileObjects = 0;
  for await (const object of stream) if (object.name) fileObjects++;
  assert.equal(fileObjects, 1, 'Sharing must not copy the physical file');
  await request(`/items/${item._id}/download`, { actor: a });
  await request(`/items/${item._id}`, { actor: a, method: 'DELETE' });
  await request(`/shares/${expiring.id}/view`, { actor: d, status: 404 });
  await request('/trash', { actor: a, method: 'DELETE' });
  assert.equal(await FileShare.countDocuments({ item: item._id }), 0, 'Trash purge must remove shares');
  assert.equal(await Item.countDocuments({ _id: item._id }), 0);
  console.log(`Collaboration OK: ${checks} HTTP checks; friends, blocks, groups, inherited shares, password, expiry, admin, one physical file`);
}
async function cleanup() {
  if (mongoose.connection.readyState !== 1) return;
  try {
    for (const uid of ids) {
      for await (const object of minioClient.listObjectsV2(env.minio.bucket, `${uid}/`, true)) {
        await minioClient.removeObject(env.minio.bucket, object.name);
      }
    }
    await FileShare.deleteMany({ owner: { $in: ids } });
    const groups = await UserGroup.find({ owner: { $in: ids } }).select('_id');
    await GroupInvitation.deleteMany({ group: { $in: groups.map((g) => g._id) } });
    await UserGroup.deleteMany({ owner: { $in: ids } });
    await Friendship.deleteMany({ users: { $in: ids } });
    await UserBlock.deleteMany({ $or: [{ blocker: { $in: ids } }, { blocked: { $in: ids } }] });
    await Item.deleteMany({ user: { $in: ids } });
    await RefreshToken.deleteMany({ user: { $in: ids } });
    await AdminAudit.deleteMany({ $or: [{ actor: { $in: ids } }, { target: { $in: ids } }] });
    await User.deleteMany({ _id: { $in: ids } });
    console.log('Collaboration fixtures cleaned');
  } finally { await mongoose.disconnect(); }
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(cleanup)
  .catch((error) => { console.error(`Cleanup failed: ${error.message}`); process.exitCode = 1; });
