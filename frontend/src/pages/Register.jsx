import { apiErrorMessage } from '../utils/apiErrorMessage';
import i18n from '../i18n/config';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema } from '../schemas/auth.schema';
import { useAuth } from '../context/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import AuthLayout from '../components/layout/AuthLayout';

export default function Register() {
  useTranslation();
  const [serverError, setServerError] = useState(null);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(registerSchema()) });

  const onSubmit = async (values) => {
    setServerError(null);
    try {
      await registerUser(values.name, values.email, values.password);
      navigate(`/verify-email?email=${encodeURIComponent(values.email)}`, { replace: true });
    } catch (err) {
      setServerError(apiErrorMessage(err, i18n.t('auth:accountCreationFailedPleaseTryAgain')));
    }
  };

  return (
    <AuthLayout title={i18n.t('auth:createYourOwnRepository')} subtitle={i18n.t('auth:itOnlyTakesAMinuteToStartStoringAllYourPersonalData')}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label={i18n.t('auth:fullName')} placeholder={i18n.t('auth:nameExample')} autoFocus {...register('name')} error={errors.name?.message} />
        <Input label={i18n.t('common:email')} type="email" placeholder="ban@example.com" {...register('email')} error={errors.email?.message} />
        <Input label={i18n.t('auth:password')} type="password" placeholder={i18n.t('auth:minimum8Characters')} {...register('password')} error={errors.password?.message} />
        <Input label={i18n.t('auth:reEnterThePassword')} type="password" {...register('confirmPassword')} error={errors.confirmPassword?.message} />

        {serverError && <p className="rounded-card bg-danger/10 px-3 py-2 text-sm text-danger">{serverError}</p>}

        <Button type="submit" size="lg" loading={isSubmitting} className="mt-1 w-full">
          {i18n.t('auth:createAnAccountAndSubmitTheCode')}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        {i18n.t('auth:alreadyHaveAccountPrompt')}{' '}
        <Link to="/login" className="font-medium text-primary-hover hover:underline">
          {i18n.t('auth:signIn')}
        </Link>
      </p>
    </AuthLayout>
  );
}
