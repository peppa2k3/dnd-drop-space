import { apiErrorMessage } from '../utils/apiErrorMessage';
import { systemRoleLabel } from '../i18n/labels';
import i18n from '../i18n/config';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useUsers, useUserFiles, useUserAudit, useAdminMutation } from '../hooks/useUsers';
import { userApi } from '../api/user.api';
import { mediaUrl } from '../utils/mediaUrl';
import { formatBytes, formatDateTime, formatNumber } from '../utils/format';
import Button from '../components/common/Button';

function Pager({ page, total = 0, setPage }) {
  useTranslation();
  return <div className="flex items-center gap-3 text-sm">
    <Button size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>{i18n.t('admin:before')}</Button>
    <span>{i18n.t('common:pagination', { count: total, page: formatNumber(page), pages: formatNumber(Math.max(1, Math.ceil(total / 20))), total: formatNumber(total) })}</span>
    <Button size="sm" disabled={page * 20 >= total} onClick={() => setPage(page + 1)}>{i18n.t('admin:after')}</Button>
  </div>;
}

function UserEditor({ target, onClose, onSaved }) {
  useTranslation();
  const { user: actor, setUser } = useAuth();
  const { addToast } = useToast();
  const [form, setForm] = useState({
    name: target.name, email: target.email, username: target.username, bio: target.bio,
    role: target.role, status: target.status, quotaMB: target.storageLimitBytes / 1024 ** 2,
  });
  const [page, setPage] = useState(1);
  const [auditPage, setAuditPage] = useState(1);
  const files = useUserFiles(target.id, page);
  const audit = useUserAudit(target.id, auditPage);
  const update = useAdminMutation((payload) => userApi.updateUser(target.id, payload));
  const fileMutation = useAdminMutation(({ item, permanent }) => permanent
    ? userApi.deleteFile(target.id, item._id)
    : userApi.fileAction(target.id, item._id, !item.isTrashed));
  const errorToast = (error) => addToast(apiErrorMessage(error, i18n.t('admin:operationFailed')), 'error');
  const save = (e) => {
    e.preventDefault();
    const { quotaMB, ...body } = form;
    body.storageLimitBytes = Math.round(Number(quotaMB) * 1024 ** 2);
    update.mutate(body, { onSuccess: ({ user }) => {
      if (user.id === actor.id) setUser(user);
      onSaved(user);
      addToast(form.email !== target.email
        ? i18n.t('admin:emailChangedUserNeedsToAuthenticateNewEmailOldSessionsHaveBeenRevoked')
        : i18n.t('admin:accountUpdated'), 'success');
    }, onError: errorToast });
  };
  const changeFile = (item, permanent = false) => {
    if (permanent && !window.confirm(i18n.t('admin:permanentlyDeleteTitleCannotRestore', { title: item.title }))) return;
    fileMutation.mutate({ item, permanent }, { onError: errorToast });
  };
  return <section className="catalog-card flex flex-col gap-4 p-5">
    <div className="flex justify-between gap-3"><h2 className="text-lg font-semibold">{target.name}</h2><Button variant="ghost" onClick={onClose}>{i18n.t('common:close')}</Button></div>
    <p className="break-all text-xs text-text-secondary">{i18n.t('common:id')} {target.id}</p>
    <p className="text-xs text-text-secondary">{i18n.t('admin:email')} {target.emailVerified ? i18n.t('admin:authenticated') : i18n.t('admin:waitForConfirmation')}{i18n.t('admin:changingTheEmailWillRevokeTheOldSessionUseTheEmailVerificationPageToSendTheCodeToTheNewAddress')}</p>
    {target.avatarUrl && <img src={mediaUrl(target.avatarUrl)} referrerPolicy="no-referrer" alt={i18n.t('admin:userAvatar')} className="h-16 w-16 rounded-full" />}
    <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
      {['name', 'email', 'username'].map((field) => <label key={field} className="text-sm">{({ name: i18n.t('common:fullName'), email: 'Email', username: 'Username' })[field]}
        <input required type={field === 'email' ? 'email' : 'text'} maxLength={field === 'username' ? 32 : 100} value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} className="mt-1 block w-full rounded-card border border-border p-2" />
      </label>)}
      <label className="text-sm">{i18n.t('admin:limitMb')}<input type="number" required min="0" max="1073741824" step="1" value={form.quotaMB} onChange={(e) => setForm({ ...form, quotaMB: e.target.value })} className="mt-1 block w-full rounded-card border border-border p-2" /></label>
      <label className="text-sm">{i18n.t('admin:role')}<select value={form.role} disabled={target.id === actor.id} onChange={(e) => setForm({ ...form, role: e.target.value })} className="mt-1 block w-full rounded-card border border-border p-2"><option value="user">{i18n.t('common:user')}</option><option value="admin">{i18n.t('common:administrator')}</option></select></label>
      <label className="text-sm">{i18n.t('admin:status')}<select value={form.status} disabled={target.id === actor.id} onChange={(e) => setForm({ ...form, status: e.target.value })} className="mt-1 block w-full rounded-card border border-border p-2"><option value="active">{i18n.t('admin:activities')}</option><option value="disabled">{i18n.t('admin:lock')}</option></select></label>
      <label className="text-sm sm:col-span-2">{i18n.t('common:introduction')}<textarea maxLength={500} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="mt-1 block w-full rounded-card border border-border p-2" /></label>
      <p className="text-xs text-text-secondary sm:col-span-2">{i18n.t('admin:set0MbToRevokeStoragePermissionLimitReductionWithoutDeletingDataFilesInTheTrashStillTakeUpSpace')}</p>
      <Button type="submit" loading={update.isPending}>{i18n.t('common:saveChanges')}</Button>
    </form>
    <h3 className="font-semibold">{i18n.t('admin:userFiles')}</h3>
    {files.isLoading && <p>{i18n.t('admin:loadingFilePlaceholder')}</p>}
    {files.isError && <p role="alert" className="text-danger">{i18n.t('admin:unableToLoadFileList')}</p>}
    {files.data?.items.length === 0 && <p className="text-sm text-text-secondary">{i18n.t('admin:noFilesYet')}</p>}
    {files.data?.items.map((item) => <div key={item._id} className="flex flex-wrap items-center gap-2 border-b border-border py-2 text-sm">
      <span className="min-w-0 grow break-all">{item.title} · {formatBytes(item.fileMeta?.size)} {item.isTrashed && i18n.t('admin:trash')}</span>
      <a className="text-primary-hover underline" href={mediaUrl(`/api/admin/users/${target.id}/files/${item._id}/download`)} rel="noreferrer">{i18n.t('common:download')}</a>
      <Button size="sm" disabled={fileMutation.isPending} onClick={() => changeFile(item)}>{item.isTrashed ? i18n.t('common:restore') : i18n.t('admin:goToTrash')}</Button>
      {item.isTrashed && <Button size="sm" variant="danger" disabled={fileMutation.isPending} onClick={() => changeFile(item, true)}>{i18n.t('common:deletePermanently')}</Button>}
    </div>)}
    <Pager page={page} setPage={setPage} total={files.data?.total} />
    <h3 className="font-semibold">{i18n.t('admin:administrationHistory')}</h3>
    {audit.isError && <p role="alert">{i18n.t('admin:unableToLoadHistory')}</p>}
    {audit.data?.events.map((event) => <details key={event._id} className="text-xs">
      <summary>{formatDateTime(event.createdAt)} · {event.actor?.name || i18n.t('common:administrator')} · {event.action}</summary>
      <pre className="overflow-auto whitespace-pre-wrap">{JSON.stringify(event.changes, null, 2)}</pre>
    </details>)}
    <Pager page={auditPage} setPage={setAuditPage} total={audit.data?.total} />
  </section>;
}

export default function AdminUsers() {
  useTranslation();
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(null);
  const users = useUsers(page, q, user?.role === 'admin');
  if (user?.role !== 'admin') return <Navigate to="/app" replace />;
  return <div className="flex flex-col gap-5">
    <h1 className="font-display text-2xl font-semibold">{i18n.t('common:userAdministration')}</h1>
    <input aria-label={i18n.t('common:findUsers')} placeholder={i18n.t('admin:findNameEmailOrUsername')} value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className="rounded-card border border-border p-3" />
    {users.isLoading && <p>{i18n.t('common:loading')}</p>}
    {users.isError && <p role="alert" className="text-danger">{i18n.t('admin:cannotAccessAdminCheckPermissionsOrLogInAgain')}</p>}
    <div className="grid gap-3 md:grid-cols-2">
      {users.data?.users.map((row) => <button key={row.id} onClick={() => setSelected(row)} className="catalog-card p-4 text-left">
        <p className="font-semibold">{row.name} · {systemRoleLabel(row.role)}</p>
        <p className="break-all text-sm">{row.email} · {row.status === 'active' ? i18n.t('admin:activities') : i18n.t('admin:locked')} · {row.emailVerified ? i18n.t('admin:verifiedEmail') : i18n.t('admin:waitForConfirmation')}</p>
        <p className="mt-2 text-xs text-text-secondary">{formatBytes(row.usedStorageBytes)} / {formatBytes(row.storageLimitBytes)}</p>
      </button>)}
    </div>
    <Pager page={page} setPage={setPage} total={users.data?.total} />
    {selected && <UserEditor key={selected.id} target={selected} onClose={() => setSelected(null)} onSaved={(updated) => setSelected({ ...selected, ...updated })} />}
  </div>;
}
