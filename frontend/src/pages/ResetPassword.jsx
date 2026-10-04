import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api/auth.api';
import AuthLayout from '../components/layout/AuthLayout';
import Button from '../components/common/Button';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [step, setStep] = useState('request');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault(); setError(''); setMessage(''); setBusy(true);
    try {
      if (step === 'request') {
        await authApi.forgotPassword(email); setStep('verify');
        setMessage('Nếu tài khoản hợp lệ, mã đã được gửi đến email.');
      } else if (step === 'verify') {
        const result = await authApi.verifyResetOtp(email, code);
        setResetToken(result.resetToken); setStep('reset');
      } else {
        if (password !== confirm) { setError('Mật khẩu nhập lại không khớp.'); return; }
        await authApi.resetPassword(email, resetToken, password);
        setResetToken(''); setStep('done');
      }
    } catch (err) { setError(err.response?.data?.message || 'Không thể hoàn tất. Vui lòng thử lại.'); }
    finally { setBusy(false); }
  };
  return <AuthLayout title="Đặt lại mật khẩu" subtitle="Xác thực email bằng mã một lần trước khi tạo mật khẩu mới.">
    {step === 'done' ? <p role="status" className="text-sm">Mật khẩu đã đổi. Các phiên cũ đã bị thu hồi.</p> :
      <form onSubmit={submit} className="flex flex-col gap-4">
        {step === 'request' && <label className="text-sm">Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-card border border-line p-2" /></label>}
        {step === 'verify' && <><p className="text-sm">Nếu tài khoản hợp lệ, mã đã được gửi đến {email}.</p>
          <label className="text-sm">Mã xác thực<input inputMode="numeric" autoComplete="one-time-code" required minLength={6} maxLength={8} value={code} onChange={(e) => setCode(e.target.value)} className="mt-1 w-full rounded-card border border-line p-2" /></label>
          <Button type="button" variant="secondary" disabled={busy} onClick={async () => {
            try { await authApi.forgotPassword(email); setMessage('Đã yêu cầu gửi lại mã.'); setError(''); }
            catch (err) { setError(err.response?.data?.message || 'Chưa thể gửi lại mã.'); }
          }}>Gửi lại mã</Button></>}
        {step === 'reset' && <><label className="text-sm">Mật khẩu mới<input type="password" required minLength={8} maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-card border border-line p-2" /></label>
          <label className="text-sm">Nhập lại mật khẩu<input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className="mt-1 w-full rounded-card border border-line p-2" /></label></>}
        {error && <p role="alert" className="text-sm text-brick">{error}</p>}
        {message && <p role="status" className="text-sm text-success">{message}</p>}
        <Button type="submit" loading={busy}>{step === 'request' ? 'Gửi mã' : step === 'verify' ? 'Xác thực mã' : 'Đổi mật khẩu'}</Button>
      </form>}
    <p className="mt-5 text-center text-sm"><Link to="/login" className="text-gold-deep hover:underline">Quay lại đăng nhập</Link></p>
  </AuthLayout>;
}
