import { NavLink, useNavigate, useParams, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { X } from 'lucide-react';
import { NAV_ITEMS, TRASH_NAV_ITEM } from '../../config/navigation';
import FolderTree from '../folder/FolderTree';
import IconButton from '../common/IconButton';
import { useFolders } from '../../hooks/useFolders';
import { useDashboardStats } from '../../hooks/useDashboard';
import { formatBytes } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';
import BrandMark from '../common/BrandMark';

export default function Sidebar({ mobileOpen, onCloseMobile }) {
  const { user } = useAuth();
  const { data: folders = [] } = useFolders();
  const { data: stats } = useDashboardStats();
  const navigate = useNavigate();
  const { folderId } = useParams();
  const location = useLocation();

  const usedBytes = stats?.usedStorageBytes ?? 0;
  const storageLimitBytes = stats?.storageLimitBytes ?? 0;
  const usedPercent = storageLimitBytes > 0 ? Math.min((usedBytes / storageLimitBytes) * 100, 100) : 0;
  const activeFolderId = location.pathname.startsWith('/app/folder') ? folderId : null;

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-30 bg-overlay/70 lg:hidden" onClick={onCloseMobile} />}

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-line/40 bg-sidebar text-sidebar-text transition-transform duration-200 lg:static lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <BrandMark />
            <div className="leading-tight">
              <p className="font-display text-sm font-semibold text-sidebar-text">DND Drop Space</p>
              <p className="font-mono text-[10px] uppercase tracking-wider text-sidebar-muted">CLOUD WORKSPACE</p>
            </div>
          </div>
          <IconButton icon={X} label="Đóng menu" variant="onDark" className="lg:hidden" onClick={onCloseMobile} />
        </div>

        <nav className="flex flex-col gap-0.5 px-2 pb-2">
          {user?.role === 'admin' && <NavLink to="/app/admin/users" onClick={onCloseMobile} className="rounded-card px-2.5 py-2 text-sm text-gold">Quản trị người dùng</NavLink>}
          {user?.role === 'admin' && <NavLink to="/app/admin/collaboration" onClick={onCloseMobile} className="rounded-card px-2.5 py-2 text-sm text-gold">Quản trị cộng tác</NavLink>}
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-2.5 rounded-card px-2.5 py-2 text-sm transition-all duration-200 hover:translate-x-0.5',
                  isActive ? 'bg-sidebar-active text-sidebar-text shadow-glow' : 'text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-text'
                )
              }
            >
              <item.icon size={15} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mx-2 mb-2 border-t border-sidebar-muted/20" />

        <div className="min-h-0 grow overflow-y-auto px-2">
          <FolderTree
            folders={folders}
            activeFolderId={activeFolderId}
            onSelectFolder={(id) => {
              navigate(`/app/folder/${id}`);
              onCloseMobile?.();
            }}
          />
        </div>

        <div className="mx-2 border-t border-sidebar-muted/20" />

        <NavLink
          to={TRASH_NAV_ITEM.path}
          onClick={onCloseMobile}
          className={({ isActive }) =>
            clsx(
              'mx-2 my-2 flex items-center gap-2.5 rounded-card px-2.5 py-2 text-sm transition-all duration-200 hover:translate-x-0.5',
              isActive ? 'bg-sidebar-active text-sidebar-text shadow-glow' : 'text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-text'
            )
          }
        >
          <TRASH_NAV_ITEM.icon size={15} />
          {TRASH_NAV_ITEM.label}
        </NavLink>

        <div className="px-4 pb-4 pt-1">
          <div className="h-1 w-full overflow-hidden rounded-full bg-sidebar-muted/20">
            <div className="h-full rounded-full bg-gold" style={{ width: `${usedPercent}%` }} />
          </div>
          <p className="mt-1.5 font-mono text-[10px] text-sidebar-muted">
            {stats ? `${formatBytes(usedBytes)} / ${formatBytes(storageLimitBytes)} đã dùng` : 'Đang tải dung lượng...'}
          </p>
        </div>
      </aside>
    </>
  );
}
