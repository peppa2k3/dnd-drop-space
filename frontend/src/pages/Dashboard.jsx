import i18n from '../i18n/config';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Link2, Image, Video, FolderOpen, Star, HardDrive } from 'lucide-react';
import { useDashboardStats } from '../hooks/useDashboard';
import { useItemActions } from '../hooks/useItemActions';
import { FullPageSpinner } from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';
import ItemGrid from '../components/items/ItemGrid';
import ItemDetailModal from '../components/items/ItemDetailModal';
import FolderPickerModal from '../components/folder/FolderPickerModal';
import PromptModal from '../components/common/PromptModal';
import { formatBytes, formatNumber } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import { mediaUrl } from '../utils/mediaUrl';

export default function Dashboard() {
  useTranslation();
  const { user } = useAuth();
  const { data: stats, isLoading } = useDashboardStats();
  const navigate = useNavigate();
  const actions = useItemActions();

  const [detailItem, setDetailItem] = useState(null);
  const [renamingItem, setRenamingItem] = useState(null);
  const [movingItem, setMovingItem] = useState(null);

  if (isLoading || !stats) return <FullPageSpinner label={i18n.t('dashboard:loadingDashboard')} />;

  const cards = [
    { label: i18n.t('dashboard:notes'), value: stats.totalNotes, icon: FileText, onClick: () => navigate('/app/notes') },
    { label: i18n.t('dashboard:link'), value: stats.totalUrls, icon: Link2, onClick: () => navigate('/app/urls') },
    { label: i18n.t('dashboard:photo'), value: stats.totalImages, icon: Image, onClick: () => navigate('/app/images') },
    { label: i18n.t('navigation:videos'), value: stats.totalVideos, icon: Video, onClick: () => navigate('/app/videos') },
    { label: i18n.t('dashboard:file'), value: stats.totalFiles, icon: FolderOpen, onClick: () => navigate('/app/files') },
    { label: i18n.t('common:favorite'), value: stats.totalFavorites, icon: Star, onClick: () => navigate('/app/favorites') },
  ];

  const handleOpen = (item) => {
    if (item.type === 'note') navigate(`/app/notes/${item._id}`);
    else setDetailItem(item);
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text-primary">{i18n.t('dashboard:dashboard')}</h1>
        <p className="mt-1 text-sm text-text-secondary">{i18n.t('dashboard:overviewOfYourPersonalDataStorage')}</p>
      </div>

      <div className="catalog-card flex flex-wrap items-center gap-3 p-4">
        {user?.avatarUrl && <img src={mediaUrl(user.avatarUrl)} referrerPolicy="no-referrer" alt={i18n.t('common:representativePhoto')} className="h-12 w-12 rounded-full" />}
        <div className="min-w-0 grow"><p className="font-semibold">{user?.name}</p><p className="break-all text-sm text-text-secondary">{user?.username} · {user?.email}</p></div>
        <button className="text-sm text-primary-hover underline" onClick={() => navigate('/app/settings')}>{i18n.t('dashboard:editProfile')}</button>
        {user?.role === 'admin' && <button className="text-sm text-primary-hover underline" onClick={() => navigate('/app/admin/users')}>{i18n.t('common:userAdministration')}</button>}
      </div>
      <div className="catalog-card flex flex-wrap gap-3 p-4 text-sm">
        <button className="text-primary-hover underline" onClick={() => navigate('/app/friends')}>{i18n.t('dashboard:friendsAndInvitations')}</button>
        <button className="text-primary-hover underline" onClick={() => navigate('/app/groups')}>{i18n.t('common:myGroup')}</button>
        <button className="text-primary-hover underline" onClick={() => navigate('/app/shared')}>{i18n.t('common:filesAreShared')}</button>
      </div>
      {stats.storageLimitBytes === 0 && <p role="alert" className="rounded-card bg-danger/10 p-3 text-sm text-danger">{i18n.t('dashboard:capacityHasNotBeenGrantedContactTheAdministratorToCreateDataAndUploadFiles')}</p>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((card) => (
          <button
            key={card.label}
            onClick={card.onClick}
            className="catalog-card flex flex-col items-start gap-2 p-4 text-left"
          >
            <card.icon size={18} className="text-primary-hover" />
            <span className="font-display text-2xl font-semibold text-text-primary">{formatNumber(card.value)}</span>
            <span className="text-xs font-medium text-text-secondary">{card.label}</span>
          </button>
        ))}
      </div>

      <div className="catalog-card flex items-center gap-4 p-4 shadow-card">
        <HardDrive size={20} className="shrink-0 text-primary-hover" />
        <div className="min-w-0 grow">
          <p className="text-sm font-medium text-text-primary">{i18n.t('storage:used')}</p>
          <p className="font-mono text-xs text-text-muted">
            {formatBytes(stats.usedStorageBytes)} / {formatBytes(stats.storageLimitBytes)}
          </p>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-text-primary">{i18n.t('dashboard:recentActivity')}</h2>
          <button onClick={() => navigate('/app/library')} className="text-sm text-primary-hover hover:underline">
            {i18n.t('dashboard:seeAll')}
          </button>
        </div>

        {stats.recentItems.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title={i18n.t('dashboard:noDataYet')}
            description={i18n.t('dashboard:startByCreatingANoteSavingALinkOrUploadingAFileUsingTheNewButtonInTheUpperCorner')}
          />
        ) : (
          <ItemGrid
            items={stats.recentItems}
            viewMode="grid"
            onOpen={handleOpen}
            onToggleFavorite={actions.toggleFavorite}
            onRename={setRenamingItem}
            onMove={setMovingItem}
            onDelete={actions.moveToTrash}
          />
        )}
      </div>

      <ItemDetailModal
        item={detailItem}
        onClose={() => setDetailItem(null)}
        onUpdate={(id, payload) => actions.updateItem(id, payload, () => setDetailItem(null))}
        onToggleFavorite={actions.toggleFavorite}
        onDelete={(id) => {
          actions.moveToTrash(id);
          setDetailItem(null);
        }}
        saving={actions.isLoading}
      />

      <PromptModal
        open={Boolean(renamingItem)}
        onClose={() => setRenamingItem(null)}
        onSubmit={(title) => actions.rename(renamingItem._id, title, () => setRenamingItem(null))}
        title={i18n.t('common:rename')}
        label={i18n.t('common:name')}
        initialValue={renamingItem?.title}
      />

      <FolderPickerModal
        open={Boolean(movingItem)}
        onClose={() => setMovingItem(null)}
        currentFolderId={movingItem?.folder?._id}
        onConfirm={(folderId) => actions.moveToFolder(movingItem._id, folderId, () => setMovingItem(null))}
        loading={actions.isLoading}
      />
    </div>
  );
}
