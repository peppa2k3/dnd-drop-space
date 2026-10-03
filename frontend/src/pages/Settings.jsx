import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDashboardStats } from '../hooks/useDashboard';
import { useToast } from '../context/ToastContext';
import { userApi } from '../api/user.api';
import Button from '../components/common/Button';
import { formatBytes } from '../utils/format';
import { mediaUrl } from '../utils/mediaUrl';

export default function Settings() {
  const { user, setUser, logout } = useAuth();
  const { data: stats } = useDashboardStats();
  const { addToast } = useToast();
  const [form, setForm] = useState({ name: '', username: '', bio: '' });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (user) setForm({ name: user.name, username: user.username || '', bio: user.bio || '' });
  }, [user]);
  const run = async (action) => {
    setBusy(true);
    try {
      const result = await action();
      setUser(result.user);
      addToast('Đã cập nhật hồ sơ', 'success');
    } catch (error) {
      addToast(error.response?.data?.errors?.[0]?.message || error.response?.data?.message || 'Không thể lưu hồ sơ', 'error');
    } finally { setBusy(false); }
  };
  const chooseAvatar = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 2 * 1024 ** 2 || !file.type.startsWith('image/')) {
      addToast('Chọn ảnh tối đa 2 MB', 'error');
      return;
    }
    run(() => userApi.avatar(file));
  };
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5">
      <h1 className="font-display text-2xl font-semibold">Hồ sơ cá nhân</h1>
      <div className="catalog-card flex flex-col gap-3 p-5">
        {user?.avatarUrl && <img src={mediaUrl(user.avatarUrl)} referrerPolicy="no-referrer" alt="Ảnh đại diện" className="h-20 w-20 rounded-full object-cover" />}
        <label className="text-sm">Ảnh đại diện (tối đa 2 MB)
          <input aria-label="Ảnh đại diện" type="file" accept="image/*" disabled={busy} onChange={chooseAvatar} className="mt-2 block w-full" />
        </label>
        <p className="break-all text-xs text-slate">ID: {user?.id}</p>
        <p className="text-sm">{user?.email} · {user?.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}</p>
        <form onSubmit={(event) => { event.preventDefault(); run(() => userApi.update(form)); }} className="flex flex-col gap-3">
          <label className="text-sm">Họ tên<input required minLength={2} maxLength={100} value={form.name} disabled={busy} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 block w-full rounded-card border border-line p-2" /></label>
          <label className="text-sm">Username<input required pattern="[a-z0-9_]{3,32}" title="3–32 chữ thường, số hoặc dấu gạch dưới" value={form.username} disabled={busy} onChange={(e) => setForm({ ...form, username: e.target.value })} className="mt-1 block w-full rounded-card border border-line p-2" /></label>
          <label className="text-sm">Giới thiệu<textarea maxLength={500} value={form.bio} disabled={busy} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="mt-1 block w-full rounded-card border border-line p-2" /></label>
          <Button type="submit" loading={busy}>Lưu hồ sơ</Button>
        </form>
      </div>
      <p className="text-sm">{stats ? `Đã dùng ${formatBytes(stats.usedStorageBytes)} / ${formatBytes(stats.storageLimitBytes)}` : 'Đang tải dung lượng...'}</p>
      {stats?.storageLimitBytes === 0 && <p role="alert" className="text-brick">Chưa được cấp dung lượng. Liên hệ quản trị viên để sử dụng kho lưu trữ.</p>}
      <Button variant="danger" onClick={logout} disabled={busy}>Đăng xuất</Button>
    </div>
  );
}
