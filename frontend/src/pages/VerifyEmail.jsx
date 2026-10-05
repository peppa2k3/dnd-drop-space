import { apiErrorMessage } from '../utils/apiErrorMessage';
import i18n from '../i18n/config';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authApi } from '../api/auth.api';
import AuthLayout from '../components/layout/AuthLayout';
import Button from '../components/common/Button';

export default function VerifyEmail() {
  useTranslation();
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get('email') || '');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try { await authApi.verifyEmail(email, code); setStatus(i18n.t('auth:verifiedEmailYouCanLogIn')); }
    catch (err) { setError(apiErrorMessage(err, i18n.t('auth:invalidCode'))); }
    finally { setBusy(false); }
  };
  const resend = async () => {
    setBusy(true); setError('');
    try { await authApi.resendVerification(email); setStatus(i18n.t('auth:ifTheAccountNeedsAuthenticationANewCodeHasBeenSent')); }
    catch (err) { setError(apiErrorMessage(err, i18n.t('auth:canTResendCodeYet'))); }
    finally { setBusy(false); }
  };
  return <AuthLayout title={i18n.t('auth:emailAuthentication')} subtitle={i18n.t('auth:enterTheCodeSentToYourEmailToActivateYourAccount')}>
    <form onSubmit={submit} className="flex flex-col gap-4">
      <label className="text-sm">{i18n.t('common:email')}<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-card border border-border p-2" /></label>
      <label className="text-sm">{i18n.t('auth:authenticationCode')}<input inputMode="numeric" autoComplete="one-time-code" minLength={6} maxLength={8} required value={code} onChange={(e) => setCode(e.target.value)} className="mt-1 w-full rounded-card border border-border p-2" /></label>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      {status && <p role="status" className="text-sm text-success">{status}</p>}
      <Button type="submit" loading={busy}>{i18n.t('auth:authentication')}</Button>
      <Button type="button" variant="secondary" disabled={busy || !email} onClick={resend}>{i18n.t('auth:resendCode')}</Button>
    </form>
    <p className="mt-5 text-center text-sm"><Link to="/login" className="text-primary-hover hover:underline">{i18n.t('auth:goToTheLoginPage')}</Link></p>
  </AuthLayout>;
}
