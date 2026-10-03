// Explicit operator action: never promote the first public registrant.
const mongoose = require('mongoose');
const User = require('../src/models/User');
const AdminAudit = require('../src/models/AdminAudit');
const env = require('../src/config/env');
async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) throw new Error('Usage: node scripts/set-admin.js <existing-email>');
  await mongoose.connect(env.mongoUri);
  const user = await User.findOneAndUpdate({ email }, { $set: { role: 'admin', status: 'active' } }, { new: true });
  if (!user) throw new Error('Account not found; register first');
  await AdminAudit.create({ actor: user._id, target: user._id, action: 'bootstrap-admin', changes: { source: 'operator-cli' } });
  console.log('Administrator role assigned. Storage quota is unchanged.');
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
