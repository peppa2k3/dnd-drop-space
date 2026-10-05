import { apiErrorMessage } from '../utils/apiErrorMessage';
import i18n from '../i18n/config';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api/auth.api';
import AuthLayout from '../components/layout/AuthLayout';
import Button from '../components/common/Button';

export default function ResetPassword() {
  useTranslation();
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
        setMessage(i18n.t('auth:ifTheAccountIsValidTheCodeHasBeenSentToTheEmail'));
      } else if (step === 'verify') {
        const result = await authApi.verifyResetOtp(email, code);
        setResetToken(result.resetToken); setStep('reset');
      } else {
        if (password !== confirm) { setError(i18n.t('auth:theReEnteredPasswordDoesNotMatch')); return; }
        await authApi.resetPassword(email, resetToken, password);
        setResetToken(''); setStep('done');
      }
    } catch (err) { setError(apiErrorMessage(err, i18n.t('auth:cannotCompletePleaseTryAgain'))); }
    finally { setBusy(false); }
  };
  return <AuthLayout title={i18n.t('auth:resetPassword')} subtitle={i18n.t('auth:verifyYourEmailWithAOneTimeCodeBeforeCreatingANewPassword')}>
    {step === 'done' ? <p role="status" className="text-sm">{i18n.t('auth:passwordChangedOldSessionsHaveBeenRevoked')}</p> :
      <form onSubmit={submit} className="flex flex-col gap-4">
        {step === 'request' && <label className="text-sm">{i18n.t('common:email')}<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-card border border-border p-2" /></label>}
        {step === 'verify' && <><p className="text-sm">{i18n.t('auth:ifTheAccountIsValidTheCodeHasBeenSent')} {email}.</p>
          <label className="text-sm">{i18n.t('auth:authenticationCode')}<input inputMode="numeric" autoComplete="one-time-code" required minLength={6} maxLength={8} value={code} onChange={(e) => setCode(e.target.value)} className="mt-1 w-full rounded-card border border-border p-2" /></label>
          <Button type="button" variant="secondary" disabled={busy} onClick={async () => {
            try { await authApi.forgotPassword(email); setMessage(i18n.t('auth:requestedToResendTheCode')); setError(''); }
            catch (err) { setError(apiErrorMessage(err, i18n.t('auth:canTResendCodeYet'))); }
          }}>{i18n.t('auth:resendCode')}</Button></>}
        {step === 'reset' && <><label className="text-sm">{i18n.t('auth:newPassword')}<input type="password" required minLength={8} maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-card border border-border p-2" /></label>
          <label className="text-sm">{i18n.t('auth:reEnterThePassword')}<input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className="mt-1 w-full rounded-card border border-border p-2" /></label></>}
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        {message && <p role="status" className="text-sm text-success">{message}</p>}
        <Button type="submit" loading={busy}>{step === 'request' ? i18n.t('auth:sendCode') : step === 'verify' ? i18n.t('auth:codeValidation') : i18n.t('auth:changePassword')}</Button>
      </form>}
    <p className="mt-5 text-center text-sm"><Link to="/login" className="text-primary-hover hover:underline">{i18n.t('auth:returnToLogin')}</Link></p>
  </AuthLayout>;
}
