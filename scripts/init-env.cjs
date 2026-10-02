const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const target = path.join(__dirname, '../backend/.env');
if (fs.existsSync(target)) {
  console.log('Keeping existing backend/.env');
} else {
  const secret = () => crypto.randomBytes(32).toString('hex');
  const content = fs.readFileSync(`${target}.example`, 'utf8')
    .replace(/^JWT_ACCESS_SECRET=.*$/m, `JWT_ACCESS_SECRET=${secret()}`)
    .replace(/^JWT_REFRESH_SECRET=.*$/m, `JWT_REFRESH_SECRET=${secret()}`)
    .replace(/^MINIO_SECRET_KEY=.*$/m, `MINIO_SECRET_KEY=${secret()}`);
  fs.writeFileSync(target, content, { flag: 'wx', mode: 0o600 });
  console.log('Created backend/.env with random secrets');
}
