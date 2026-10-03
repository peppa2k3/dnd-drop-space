import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu as MenuIcon, Search, Plus, FileText, Link2, UploadCloud, LogOut, User as UserIcon } from 'lucide-react';
import Button from '../common/Button';
import IconButton from '../common/IconButton';
import Menu from '../common/Menu';
import UploadModal from '../upload/UploadModal';
import CreateUrlModal from '../upload/CreateUrlModal';
import { useAuth } from '../../context/AuthContext';
import { useCreateNote } from '../../hooks/useItems';
import { useToast } from '../../context/ToastContext';
import { useDashboardStats } from '../../hooks/useDashboard';

export default function Topbar({ onOpenMobileSidebar }) {
  const [search, setSearch] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [urlModalOpen, setUrlModalOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { data: stats } = useDashboardStats();
  const createNote = useCreateNote();
  const { addToast } = useToast();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/app/search?q=${encodeURIComponent(search.trim())}`);
  };

  const handleNewNote = () => {
    createNote.mutate(
      { title: 'Ghi chú chưa có tiêu đề', content: '' },
      {
        onSuccess: (note) => navigate(`/app/notes/${note._id}`),
        onError: () => addToast('Không thể tạo ghi chú mới', 'error'),
      }
    );
  };

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-paper/95 px-4 py-3 backdrop-blur">
      <IconButton icon={MenuIcon} label="Mở menu" className="lg:hidden" onClick={onOpenMobileSidebar} />

      <form onSubmit={handleSearchSubmit} className="relative max-w-md grow">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-light" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tiêu đề, thẻ, thư mục, nội dung..."
          className="w-full rounded-card border border-line bg-paper-card py-2 pl-9 pr-3 text-sm text-ink placeholder:text-slate-light focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold"
        />
      </form>

      <div className="ml-auto flex items-center gap-2">
        <Menu
          trigger={
            <Button variant="gold" size="md" disabled={!stats || stats.storageLimitBytes <= 0} title={stats?.storageLimitBytes === 0 ? 'Chưa được cấp dung lượng' : 'Tạo mới'}>
              <Plus size={15} /> Mới
            </Button>
          }
          items={[
            { label: 'Ghi chú mới', icon: FileText, onClick: handleNewNote },
            { label: 'Lưu liên kết (URL)', icon: Link2, onClick: () => setUrlModalOpen(true) },
            { label: 'Tải tệp lên', icon: UploadCloud, onClick: () => setUploadOpen(true) },
          ]}
        />

        <Menu
          trigger={
            <button type="button" className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-paper">
              <UserIcon size={16} />
            </button>
          }
          items={[
            { label: user?.name || user?.email || 'Tài khoản', icon: UserIcon, onClick: () => navigate('/app/settings') },
            { divider: true },
            { label: 'Đăng xuất', icon: LogOut, danger: true, onClick: logout },
          ]}
        />
      </div>

      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
      <CreateUrlModal open={urlModalOpen} onClose={() => setUrlModalOpen(false)} />
    </header>
  );
}
