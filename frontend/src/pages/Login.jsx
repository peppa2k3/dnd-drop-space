import { apiErrorMessage } from '../utils/apiErrorMessage';
import i18n from '../i18n/config';
import { useTranslation } from 'react-i18next';
import { useCallback, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '../schemas/auth.schema';
import { useAuth } from '../context/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import AuthLayout from '../components/layout/AuthLayout';
import GoogleSignInButton from '../components/auth/GoogleSignInButton';
import { authApi } from '../api/auth.api';

export default function Login() {
  useTranslation();
  const [serverError, setServerError] = useState(null);
  const [info, setInfo] = useState('');
  const [mode, setMode] = useState('password');
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpBusy, setOtpBusy] = useState(false);
  const [googleLinkPending, setGoogleLinkPending] = useState(null);
  const [googleLinkCode, setGoogleLinkCode] = useState('');
  const [linking, setLinking] = useState(false);
  const { login, loginWithOtp, googleLogin, googleLink } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema()) });

  const onSubmit = async (values) => {
    setServerError(null);
    try {
      await login(values.email, values.password);
      navigate(location.state?.from || '/app', { replace: true });
    } catch (err) {
      setServerError(apiErrorMessage(err, i18n.t('auth:loginFailedPleaseTryAgain')));
    }
  };

  const onGoogleCredential = useCallback(async (credential) => {
    setServerError(null);
    try {
      const result = await googleLogin(credential);
      if (result.linkRequired) { setGoogleLinkPending(result); return; }
      navigate(location.state?.from || '/app', { replace: true });
    } catch (err) { setServerError(apiErrorMessage(err, i18n.t('auth:googleLoginFailed'))); }
  }, [googleLogin, navigate, location.state]);

  const onOtp = async (event) => {
    event.preventDefault(); setServerError(null); setInfo(''); setOtpBusy(true);
    try {
      if (!otpSent) {
        await authApi.requestLoginOtp(otpEmail); setOtpSent(true);
        setInfo(i18n.t('auth:ifTheAccountIsValidTheCodeHasBeenSentToTheEmail'));
      } else {
        await loginWithOtp(otpEmail, otpCode);
        navigate(location.state?.from || '/app', { replace: true });
      }
    } catch (err) { setServerError(apiErrorMessage(err, i18n.t('auth:cannotLogInWithCode'))); }
    finally { setOtpBusy(false); }
  };

  return (
    <AuthLayout
      title={i18n.t('auth:welcomeBack')}
      subtitle={i18n.t('auth:signInToContinueManagingYourPersonalDataWarehouse')}
    >
      {mode === 'password' ? <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label={i18n.t('common:email')} type="email" placeholder="ban@example.com" autoFocus {...register('email')} error={errors.email?.message} />
        <Input label={i18n.t('auth:password')} type="password" placeholder="••••••••" {...register('password')} error={errors.password?.message} />

        {serverError && <p className="rounded-card bg-danger/10 px-3 py-2 text-sm text-danger">{serverError}</p>}

        <Button type="submit" size="lg" loading={isSubmitting} className="mt-1 w-full">
          {i18n.t('auth:signIn')}
        </Button>
      </form> : <form onSubmit={onOtp} className="flex flex-col gap-4">
        <label className="text-sm">{i18n.t('common:email')}<input type="email" required value={otpEmail} onChange={(e) => setOtpEmail(e.target.value)} disabled={otpSent} className="mt-1 w-full rounded-card border border-border p-2" /></label>
        {otpSent && <><p className="text-sm text-text-secondary">{i18n.t('auth:ifTheAccountIsValidTheLoginCodeHasBeenSentToTheEmail')}</p>
          <label className="text-sm">{i18n.t('auth:otpCode')}<input inputMode="numeric" autoComplete="one-time-code" required minLength={6} maxLength={8} value={otpCode} onChange={(e) => setOtpCode(e.target.value)} className="mt-1 w-full rounded-card border border-border p-2" /></label></>}
        {serverError && <p role="alert" className="text-sm text-danger">{serverError}</p>}
        {info && <p role="status" className="text-sm text-success">{info}</p>}
        <Button type="submit" loading={otpBusy}>{otpSent ? i18n.t('auth:loginWithCode') : i18n.t('auth:sendLoginCode')}</Button>
        {otpSent && <Button type="button" variant="secondary" disabled={otpBusy} onClick={async () => {
          try { await authApi.requestLoginOtp(otpEmail); setInfo(i18n.t('auth:requestedToResendTheCode')); setServerError(null); }
          catch (err) { setServerError(apiErrorMessage(err, i18n.t('auth:canTResendCodeYet'))); }
        }}>{i18n.t('auth:resendCode')}</Button>}
      </form>}

      <div className="mt-4 flex flex-wrap justify-between gap-2 text-sm">
        <button type="button" className="text-primary-hover hover:underline" onClick={() => { setMode(mode === 'password' ? 'otp' : 'password'); setServerError(null); }}>
          {mode === 'password' ? i18n.t('auth:loginWithEmailCode') : i18n.t('auth:loginWithPassword')}
        </button>
        <Link to="/reset-password" className="text-primary-hover hover:underline">{i18n.t('auth:forgotPasswordPrompt')}</Link>
      </div>
      <div className="mt-6 border-t border-border pt-5"><GoogleSignInButton onCredential={onGoogleCredential} /></div>
      {googleLinkPending && <form className="mt-4 flex flex-col gap-3" onSubmit={async (event) => {
        event.preventDefault(); setServerError(null); setLinking(true);
        try {
          await googleLink(googleLinkPending.linkToken, googleLinkCode);
          navigate(location.state?.from || '/app', { replace: true });
        } catch (err) { setServerError(apiErrorMessage(err, i18n.t('auth:cannotLinkGoogle'))); }
        finally { setLinking(false); }
      }}>
        <p className="text-sm">{i18n.t('auth:enterTheCodeSent')} {googleLinkPending.email} {i18n.t('auth:toLinkAnExistingAccount')}</p>
        <input aria-label={i18n.t('auth:googleAffiliateCode')} inputMode="numeric" autoComplete="one-time-code" required minLength={6} maxLength={8} value={googleLinkCode} onChange={(e) => setGoogleLinkCode(e.target.value)} className="rounded-card border border-border p-2" />
        <Button type="submit" loading={linking}>{i18n.t('auth:linkAndLogin')}</Button>
      </form>}
      <p className="mt-3 text-center text-sm"><Link to="/verify-email" className="text-primary-hover hover:underline">{i18n.t('auth:havenTVerifiedEmailYetEnterCodeHere')}</Link></p>

      <p className="mt-6 text-center text-sm text-text-secondary">
        {i18n.t('auth:noAccountPrompt')}{' '}
        <Link to="/register" className="font-medium text-primary-hover hover:underline">
          {i18n.t('auth:createANewAccount')}
        </Link>
      </p>
    </AuthLayout>
  );
}
