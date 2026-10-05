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
  const [serverError, setServerError] = useState(null);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (values) => {
    setServerError(null);
    try {
      await registerUser(values.name, values.email, values.password);
      navigate(`/verify-email?email=${encodeURIComponent(values.email)}`, { replace: true });
    } catch (err) {
      setServerError(err?.response?.data?.message || 'Tạo tài khoản thất bại. Vui lòng thử lại.');
    }
  };

  return (
    <AuthLayout title="Tạo kho lưu trữ của riêng bạn" subtitle="Chỉ mất một phút để bắt đầu lưu trữ mọi dữ liệu cá nhân của bạn.">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="Họ và tên" placeholder="Nguyễn Văn A" autoFocus {...register('name')} error={errors.name?.message} />
        <Input label="Email" type="email" placeholder="ban@example.com" {...register('email')} error={errors.email?.message} />
        <Input label="Mật khẩu" type="password" placeholder="Tối thiểu 8 ký tự" {...register('password')} error={errors.password?.message} />
        <Input label="Nhập lại mật khẩu" type="password" {...register('confirmPassword')} error={errors.confirmPassword?.message} />

        {serverError && <p className="rounded-card bg-danger/10 px-3 py-2 text-sm text-danger">{serverError}</p>}

        <Button type="submit" size="lg" loading={isSubmitting} className="mt-1 w-full">
          Tạo tài khoản và gửi mã
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        Đã có tài khoản?{' '}
        <Link to="/login" className="font-medium text-primary-hover hover:underline">
          Đăng nhập
        </Link>
      </p>
    </AuthLayout>
  );
}
