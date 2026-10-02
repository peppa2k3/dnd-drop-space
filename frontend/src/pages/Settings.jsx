import { LogOut, HardDrive, Mail, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDashboardStats } from '../hooks/useDashboard';
import Button from '../components/common/Button';
import { formatBytes } from '../utils/format';

export default function Settings() {
  const { user, logout } = useAuth();
  const { data: stats } = useDashboardStats();

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Cài đặt</h1>
        <p className="mt-1 text-sm text-slate">Thông tin tài khoản và kho lưu trữ của bạn.</p>
      </div>

      <div className="catalog-card flex flex-col gap-4 p-5 shadow-card">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink text-paper">
            <UserIcon size={20} />
          </div>
          <div>
            <p className="font-display text-base font-semibold text-ink">{user?.name}</p>
            <p className="flex items-center gap-1 text-sm text-slate">
              <Mail size={13} /> {user?.email}
            </p>
          </div>
        </div>
      </div>

      <div className="catalog-card flex items-center gap-4 p-5 shadow-card">
        <HardDrive size={20} className="shrink-0 text-gold-deep" />
        <div>
          <p className="text-sm font-medium text-ink">Dung lượng đã sử dụng</p>
          <p className="font-mono text-xs text-slate-light">{formatBytes(stats?.usedStorageBytes || 0)}</p>
        </div>
      </div>

      <Button variant="dangerSolid" onClick={logout} className="w-full justify-center">
        <LogOut size={15} className="mr-1.5" /> Đăng xuất
      </Button>
    </div>
  );
}
