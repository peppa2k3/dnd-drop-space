import { NavLink, useNavigate, useParams, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { X } from 'lucide-react';
import { NAV_ITEMS, TRASH_NAV_ITEM } from '../../config/navigation';
import FolderTree from '../folder/FolderTree';
import IconButton from '../common/IconButton';
import { useFolders } from '../../hooks/useFolders';
import { useDashboardStats } from '../../hooks/useDashboard';
import { formatBytes } from '../../utils/format';

export default function Sidebar({ mobileOpen, onCloseMobile }) {
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
      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={onCloseMobile} />}

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col bg-ink transition-transform lg:static lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <LogoMark />
            <div className="leading-tight">
              <p className="font-display text-sm font-semibold text-paper">Knowledge Hub</p>
              <p className="font-mono text-[10px] uppercase tracking-wider text-paper/40">Cá nhân</p>
            </div>
          </div>
          <IconButton icon={X} label="Đóng menu" variant="onDark" className="lg:hidden" onClick={onCloseMobile} />
        </div>

        <nav className="flex flex-col gap-0.5 px-2 pb-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-2.5 rounded-card px-2.5 py-2 text-sm transition-colors',
                  isActive ? 'bg-white/10 text-paper' : 'text-paper/75 hover:bg-white/5 hover:text-paper'
                )
              }
            >
              <item.icon size={15} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mx-2 mb-2 border-t border-white/10" />

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

        <div className="mx-2 border-t border-white/10" />

        <NavLink
          to={TRASH_NAV_ITEM.path}
          onClick={onCloseMobile}
          className={({ isActive }) =>
            clsx(
              'mx-2 my-2 flex items-center gap-2.5 rounded-card px-2.5 py-2 text-sm transition-colors',
              isActive ? 'bg-white/10 text-paper' : 'text-paper/75 hover:bg-white/5 hover:text-paper'
            )
          }
        >
          <TRASH_NAV_ITEM.icon size={15} />
          {TRASH_NAV_ITEM.label}
        </NavLink>

        <div className="px-4 pb-4 pt-1">
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gold" style={{ width: `${usedPercent}%` }} />
          </div>
          <p className="mt-1.5 font-mono text-[10px] text-paper/60">
            {stats ? `${formatBytes(usedBytes)} / ${formatBytes(storageLimitBytes)} đã dùng` : 'Đang tải dung lượng...'}
          </p>
        </div>
      </aside>
    </>
  );
}

function LogoMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="30" height="30" rx="7" fill="#233252" stroke="#C89B3C" strokeWidth="1.2" />
      <path d="M9 10.5H23M9 16H23M9 21.5H17" stroke="#FAF9F6" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="23.5" cy="21.5" r="2.2" stroke="#C89B3C" strokeWidth="1.4" />
    </svg>
  );
}
