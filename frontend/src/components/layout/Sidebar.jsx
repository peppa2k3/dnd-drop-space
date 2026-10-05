import i18n from '../../i18n/config';
import { useTranslation } from 'react-i18next';
import { NavLink, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import clsx from 'clsx';
import { Shield, Users, X } from 'lucide-react';
import { NAV_ITEMS, TRASH_NAV_ITEM } from '../../config/navigation';
import FolderTree from '../folder/FolderTree';
import IconButton from '../common/IconButton';
import { useFolders } from '../../hooks/useFolders';
import { useDashboardStats } from '../../hooks/useDashboard';
import { formatBytes } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';
import BrandMark from '../common/BrandMark';

export default function Sidebar({ mobileOpen, onCloseMobile }) {
  useTranslation();
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

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onEscape = (event) => { if (event.key === 'Escape') onCloseMobile(); };
    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, [mobileOpen, onCloseMobile]);

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-30 bg-overlay/70 md:hidden" onClick={onCloseMobile} aria-hidden="true" />}

      <aside
        id="app-sidebar"
        className={clsx(
          'fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-border bg-background-secondary text-text-primary transition-transform duration-200 md:static md:w-[4.5rem] md:translate-x-0 lg:w-64',
          mobileOpen ? 'visible translate-x-0' : 'invisible -translate-x-full md:visible'
        )}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <BrandMark />
            <div className="leading-tight md:hidden lg:block">
              <p className="font-display text-sm font-semibold text-text-primary">DND Drop Space</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">{i18n.t('navigation:cloudWorkspace')}</p>
            </div>
          </div>
          <IconButton icon={X} label={i18n.t('navigation:closeTheMenu')} variant="onDark" className="md:hidden" onClick={onCloseMobile} />
        </div>

        <nav className="flex flex-col gap-0.5 px-2 pb-2">
          {user?.role === 'admin' && <NavLink to="/app/admin/users" title={i18n.t('common:userAdministration')} onClick={onCloseMobile} className="flex items-center gap-2.5 rounded-card px-2.5 py-2 text-sm text-primary-hover hover:bg-surface-hover"><Users size={16} /><span className="md:hidden lg:inline">{i18n.t('common:userAdministration')}</span></NavLink>}
          {user?.role === 'admin' && <NavLink to="/app/admin/collaboration" title={i18n.t('common:collaborativeGovernance')} onClick={onCloseMobile} className="flex items-center gap-2.5 rounded-card px-2.5 py-2 text-sm text-primary-hover hover:bg-surface-hover"><Shield size={16} /><span className="md:hidden lg:inline">{i18n.t('common:collaborativeGovernance')}</span></NavLink>}
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              title={i18n.t(item.labelKey)}
              aria-label={i18n.t(item.labelKey)}
              end={item.end}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-2.5 rounded-card px-2.5 py-2 text-sm transition-all duration-200 hover:translate-x-0.5',
                  isActive ? 'border-l-2 border-primary bg-primary/10 text-primary-hover shadow-glow' : 'border-l-2 border-transparent text-text-muted hover:bg-surface-hover hover:text-text-primary'
                )
              }
            >
              <item.icon size={15} />
              <span className="md:hidden lg:inline">{i18n.t(item.labelKey)}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mx-2 mb-2 border-t border-border" />

        <div className="min-h-0 grow overflow-y-auto px-2 md:invisible lg:visible">
          <FolderTree
            folders={folders}
            activeFolderId={activeFolderId}
            onSelectFolder={(id) => {
              navigate(`/app/folder/${id}`);
              onCloseMobile?.();
            }}
          />
        </div>

        <div className="mx-2 border-t border-border" />

        <NavLink
          to={TRASH_NAV_ITEM.path}
          title={i18n.t(TRASH_NAV_ITEM.labelKey)}
          aria-label={i18n.t(TRASH_NAV_ITEM.labelKey)}
          onClick={onCloseMobile}
          className={({ isActive }) =>
            clsx(
              'mx-2 my-2 flex items-center gap-2.5 rounded-card px-2.5 py-2 text-sm transition-all duration-200 hover:translate-x-0.5',
              isActive ? 'border-l-2 border-primary bg-primary/10 text-primary-hover shadow-glow' : 'border-l-2 border-transparent text-text-muted hover:bg-surface-hover hover:text-text-primary'
            )
          }
        >
          <TRASH_NAV_ITEM.icon size={15} />
          <span className="md:hidden lg:inline">{i18n.t(TRASH_NAV_ITEM.labelKey)}</span>
        </NavLink>

        <div className="px-4 pb-4 pt-1 md:px-2 lg:px-4">
          <div className="h-1 w-full overflow-hidden rounded-full bg-border/30">
            <div className="h-full rounded-full bg-primary" style={{ width: `${usedPercent}%` }} />
          </div>
          <p className="mt-1.5 font-mono text-[10px] text-text-muted md:hidden lg:block">
            {stats ? i18n.t('storage:usedOfLimit', { used: formatBytes(usedBytes), limit: formatBytes(storageLimitBytes) }) : i18n.t('common:loadingCapacityPlaceholder')}
          </p>
        </div>
      </aside>
    </>
  );
}
