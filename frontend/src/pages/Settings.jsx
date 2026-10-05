import { apiErrorMessage } from '../utils/apiErrorMessage';
import i18n from '../i18n/config';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDashboardStats } from '../hooks/useDashboard';
import { useToast } from '../context/ToastContext';
import { userApi } from '../api/user.api';
import Button from '../components/common/Button';
import { formatBytes } from '../utils/format';
import { mediaUrl } from '../utils/mediaUrl';
import ThemeControls from '../components/theme/ThemeControls';
import LanguageSelector from '../components/settings/LanguageSelector';

export default function Settings() {
  useTranslation();
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
      addToast(i18n.t('profile:profileUpdated'), 'success');
    } catch (error) {
      addToast(apiErrorMessage(error, i18n.t('profile:unableToSaveProfile')), 'error');
    } finally { setBusy(false); }
  };
  const chooseAvatar = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 2 * 1024 ** 2 || !file.type.startsWith('image/')) {
      addToast(i18n.t('profile:choosePhotosUpTo2Mb'), 'error');
      return;
    }
    run(() => userApi.avatar(file));
  };
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5">
      <h1 className="font-display text-2xl font-semibold">{i18n.t('profile:personalProfile')}</h1>
      <ThemeControls />
      <LanguageSelector />
      <div className="catalog-card flex flex-col gap-3 p-5">
        {user?.avatarUrl && <img src={mediaUrl(user.avatarUrl)} referrerPolicy="no-referrer" alt={i18n.t('common:representativePhoto')} className="h-20 w-20 rounded-full object-cover" />}
        <label className="text-sm">{i18n.t('profile:profilePhotoMaximum2Mb')}
          <input aria-label={i18n.t('common:representativePhoto')} type="file" accept="image/*" disabled={busy} onChange={chooseAvatar} className="mt-2 block w-full" />
        </label>
        <p className="break-all text-xs text-text-secondary">{i18n.t('common:id')} {user?.id}</p>
        <p className="text-sm">{user?.email} · {user?.role === 'admin' ? i18n.t('common:administrator') : i18n.t('common:user')}</p>
        <form onSubmit={(event) => { event.preventDefault(); run(() => userApi.update(form)); }} className="flex flex-col gap-3">
          <label className="text-sm">{i18n.t('common:fullName')}<input required minLength={2} maxLength={100} value={form.name} disabled={busy} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 block w-full rounded-card border border-border p-2" /></label>
          <label className="text-sm">{i18n.t('common:username')}<input required pattern="[a-z0-9_]{3,32}" title={i18n.t('profile:usernameRequirements')} value={form.username} disabled={busy} onChange={(e) => setForm({ ...form, username: e.target.value })} className="mt-1 block w-full rounded-card border border-border p-2" /></label>
          <label className="text-sm">{i18n.t('common:introduction')}<textarea maxLength={500} value={form.bio} disabled={busy} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="mt-1 block w-full rounded-card border border-border p-2" /></label>
          <Button type="submit" loading={busy}>{i18n.t('profile:saveProfile')}</Button>
        </form>
      </div>
      <p className="text-sm">{stats ? i18n.t('profile:usedValue1Value2', { value1: formatBytes(stats.usedStorageBytes), value2: formatBytes(stats.storageLimitBytes) }) : i18n.t('common:loadingCapacityPlaceholder')}</p>
      {stats?.storageLimitBytes === 0 && <p role="alert" className="text-danger">{i18n.t('profile:capacityHasNotBeenGrantedContactTheAdministratorToUseTheRepository')}</p>}
      <Button variant="danger" onClick={logout} disabled={busy}>{i18n.t('common:signOut')}</Button>
    </div>
  );
}
