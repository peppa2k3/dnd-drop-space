import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authApi } from '../api/auth.api';
import AuthLayout from '../components/layout/AuthLayout';
import Button from '../components/common/Button';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get('email') || '');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try { await authApi.verifyEmail(email, code); setStatus('Email đã xác thực. Bạn có thể đăng nhập.'); }
    catch (err) { setError(err.response?.data?.message || 'Mã không hợp lệ.'); }
    finally { setBusy(false); }
  };
  const resend = async () => {
    setBusy(true); setError('');
    try { await authApi.resendVerification(email); setStatus('Nếu tài khoản cần xác thực, mã mới đã được gửi.'); }
    catch (err) { setError(err.response?.data?.message || 'Chưa thể gửi lại mã.'); }
    finally { setBusy(false); }
  };
  return <AuthLayout title="Xác thực email" subtitle="Nhập mã đã gửi đến email của bạn để kích hoạt tài khoản.">
    <form onSubmit={submit} className="flex flex-col gap-4">
      <label className="text-sm">Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-card border border-line p-2" /></label>
      <label className="text-sm">Mã xác thực<input inputMode="numeric" autoComplete="one-time-code" minLength={6} maxLength={8} required value={code} onChange={(e) => setCode(e.target.value)} className="mt-1 w-full rounded-card border border-line p-2" /></label>
      {error && <p role="alert" className="text-sm text-brick">{error}</p>}
      {status && <p role="status" className="text-sm text-emerald-700">{status}</p>}
      <Button type="submit" loading={busy}>Xác thực</Button>
      <Button type="button" variant="secondary" disabled={busy || !email} onClick={resend}>Gửi lại mã</Button>
    </form>
    <p className="mt-5 text-center text-sm"><Link to="/login" className="text-gold-deep hover:underline">Đến trang đăng nhập</Link></p>
  </AuthLayout>;
}
