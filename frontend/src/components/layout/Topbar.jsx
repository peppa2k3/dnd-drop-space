import i18n from '../../i18n/config';
import { useTranslation } from 'react-i18next';
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
import ThemeQuickSwitch from '../theme/ThemeQuickSwitch';

export default function Topbar({ mobileSidebarOpen, onOpenMobileSidebar }) {
  useTranslation();
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
      { title: i18n.t('navigation:untitledNote'), content: '' },
      {
        onSuccess: (note) => navigate(`/app/notes/${note._id}`),
        onError: () => addToast(i18n.t('navigation:cannotCreateNewNote'), 'error'),
      }
    );
  };

  return (
    <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-xl sm:flex-nowrap">
      <IconButton icon={MenuIcon} label={i18n.t('navigation:openTheMenu')} className="md:hidden" aria-controls="app-sidebar" aria-expanded={mobileSidebarOpen} onClick={onOpenMobileSidebar} />

      <form onSubmit={handleSearchSubmit} className="relative order-2 w-full min-w-0 sm:order-none sm:max-w-md sm:grow">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={i18n.t('navigation:searchByTitleTagsFoldersContentPlaceholder')}
          className="w-full rounded-card border border-border bg-surface py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
        />
      </form>

      <div className="order-1 ml-auto flex items-center gap-2 sm:order-none">
        <ThemeQuickSwitch />
        <Menu
          trigger={
            <Button variant="primary" size="md" disabled={!stats || stats.storageLimitBytes <= 0} title={stats?.storageLimitBytes === 0 ? i18n.t('navigation:capacityHasNotBeenGranted') : i18n.t('navigation:createNew')}>
              <Plus size={15} /> {i18n.t('navigation:new')}
            </Button>
          }
          items={[
            { label: i18n.t('navigation:newNote'), icon: FileText, onClick: handleNewNote },
            { label: i18n.t('common:saveLinkUrl'), icon: Link2, onClick: () => setUrlModalOpen(true) },
            { label: i18n.t('common:uploadFiles'), icon: UploadCloud, onClick: () => setUploadOpen(true) },
          ]}
        />

        <Menu
          trigger={
            <button type="button" className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-contrast transition-all duration-200 hover:shadow-glow">
              <UserIcon size={16} />
            </button>
          }
          items={[
            { label: user?.name || user?.email || i18n.t('navigation:account'), icon: UserIcon, onClick: () => navigate('/app/settings') },
            { divider: true },
            { label: i18n.t('common:signOut'), icon: LogOut, danger: true, onClick: logout },
          ]}
        />
      </div>

      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
      <CreateUrlModal open={urlModalOpen} onClose={() => setUrlModalOpen(false)} />
    </header>
  );
}
