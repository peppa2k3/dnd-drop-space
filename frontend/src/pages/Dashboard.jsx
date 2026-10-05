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
import { formatBytes } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import { mediaUrl } from '../utils/mediaUrl';

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useDashboardStats();
  const navigate = useNavigate();
  const actions = useItemActions();

  const [detailItem, setDetailItem] = useState(null);
  const [renamingItem, setRenamingItem] = useState(null);
  const [movingItem, setMovingItem] = useState(null);

  if (isLoading || !stats) return <FullPageSpinner label="Đang tải bảng điều khiển" />;

  const cards = [
    { label: 'Ghi chú', value: stats.totalNotes, icon: FileText, onClick: () => navigate('/app/notes') },
    { label: 'Liên kết', value: stats.totalUrls, icon: Link2, onClick: () => navigate('/app/urls') },
    { label: 'Ảnh', value: stats.totalImages, icon: Image, onClick: () => navigate('/app/images') },
    { label: 'Video', value: stats.totalVideos, icon: Video, onClick: () => navigate('/app/videos') },
    { label: 'Tệp tin', value: stats.totalFiles, icon: FolderOpen, onClick: () => navigate('/app/files') },
    { label: 'Yêu thích', value: stats.totalFavorites, icon: Star, onClick: () => navigate('/app/favorites') },
  ];

  const handleOpen = (item) => {
    if (item.type === 'note') navigate(`/app/notes/${item._id}`);
    else setDetailItem(item);
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text-primary">Bảng điều khiển</h1>
        <p className="mt-1 text-sm text-text-secondary">Tổng quan kho lưu trữ dữ liệu cá nhân của bạn.</p>
      </div>

      <div className="catalog-card flex flex-wrap items-center gap-3 p-4">
        {user?.avatarUrl && <img src={mediaUrl(user.avatarUrl)} referrerPolicy="no-referrer" alt="Ảnh đại diện" className="h-12 w-12 rounded-full" />}
        <div className="min-w-0 grow"><p className="font-semibold">{user?.name}</p><p className="break-all text-sm text-text-secondary">{user?.username} · {user?.email}</p></div>
        <button className="text-sm text-primary-hover underline" onClick={() => navigate('/app/settings')}>Sửa hồ sơ</button>
        {user?.role === 'admin' && <button className="text-sm text-primary-hover underline" onClick={() => navigate('/app/admin/users')}>Quản trị người dùng</button>}
      </div>
      <div className="catalog-card flex flex-wrap gap-3 p-4 text-sm">
        <button className="text-primary-hover underline" onClick={() => navigate('/app/friends')}>Bạn bè và lời mời</button>
        <button className="text-primary-hover underline" onClick={() => navigate('/app/groups')}>Nhóm của tôi</button>
        <button className="text-primary-hover underline" onClick={() => navigate('/app/shared')}>Tệp được chia sẻ</button>
      </div>
      {stats.storageLimitBytes === 0 && <p role="alert" className="rounded-card bg-danger/10 p-3 text-sm text-danger">Chưa được cấp dung lượng. Liên hệ quản trị viên để tạo dữ liệu và tải tệp lên.</p>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((card) => (
          <button
            key={card.label}
            onClick={card.onClick}
            className="catalog-card flex flex-col items-start gap-2 p-4 text-left"
          >
            <card.icon size={18} className="text-primary-hover" />
            <span className="font-display text-2xl font-semibold text-text-primary">{card.value}</span>
            <span className="text-xs font-medium text-text-secondary">{card.label}</span>
          </button>
        ))}
      </div>

      <div className="catalog-card flex items-center gap-4 p-4 shadow-card">
        <HardDrive size={20} className="shrink-0 text-primary-hover" />
        <div className="min-w-0 grow">
          <p className="text-sm font-medium text-text-primary">Dung lượng đã sử dụng</p>
          <p className="font-mono text-xs text-text-muted">
            {formatBytes(stats.usedStorageBytes)} / {formatBytes(stats.storageLimitBytes)}
          </p>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-text-primary">Hoạt động gần đây</h2>
          <button onClick={() => navigate('/app/library')} className="text-sm text-primary-hover hover:underline">
            Xem tất cả
          </button>
        </div>

        {stats.recentItems.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="Chưa có dữ liệu nào"
            description="Bắt đầu bằng cách tạo ghi chú, lưu liên kết, hoặc tải tệp lên bằng nút “Mới” ở góc trên."
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
        title="Đổi tên"
        label="Tên"
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
