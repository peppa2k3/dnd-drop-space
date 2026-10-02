import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '../schemas/auth.schema';
import { useAuth } from '../context/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import AuthLayout from '../components/layout/AuthLayout';

export default function Login() {
  const [serverError, setServerError] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values) => {
    setServerError(null);
    try {
      await login(values.email, values.password);
      navigate(location.state?.from || '/app', { replace: true });
    } catch (err) {
      setServerError(err?.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    }
  };

  return (
    <AuthLayout
      title="Chào mừng trở lại"
      subtitle="Đăng nhập để tiếp tục quản lý kho dữ liệu cá nhân của bạn."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="Email" type="email" placeholder="ban@example.com" autoFocus {...register('email')} error={errors.email?.message} />
        <Input label="Mật khẩu" type="password" placeholder="••••••••" {...register('password')} error={errors.password?.message} />

        {serverError && <p className="rounded-card bg-brick-soft px-3 py-2 text-sm text-brick">{serverError}</p>}

        <Button type="submit" size="lg" loading={isSubmitting} className="mt-1 w-full">
          Đăng nhập
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="font-medium text-gold-deep hover:underline">
          Tạo tài khoản mới
        </Link>
      </p>
    </AuthLayout>
  );
}
