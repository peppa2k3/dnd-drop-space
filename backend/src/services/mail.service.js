const nodemailer = require('nodemailer');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

let transporter;
function isConfigured() {
  return Boolean(env.email.host && env.email.from && env.email.user && env.email.password);
}
async function sendOtp(email, purpose, code) {
  if (!isConfigured()) {
    throw new ApiError(503, 'Email delivery is not configured');
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.email.host, port: env.email.port, secure: env.email.secure,
      requireTLS: !env.email.secure,
      auth: { user: env.email.user, pass: env.email.password },
    });
  }
  const subjects = {
    verify: 'Xác thực email Personal Knowledge Hub',
    login: 'Mã đăng nhập Personal Knowledge Hub',
    reset: 'Đặt lại mật khẩu Personal Knowledge Hub',
    google_link: 'Liên kết Google với Personal Knowledge Hub',
  };
  await transporter.sendMail({
    from: env.email.from, to: email, subject: subjects[purpose],
    text: `Mã xác thực của bạn: ${code}\nMã có hiệu lực ${env.otp.expiresMinutes} phút. Nếu bạn không yêu cầu, hãy bỏ qua email này.`,
  });
}

module.exports = { sendOtp, isConfigured };
