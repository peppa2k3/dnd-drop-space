import { apiErrorMessage } from '../utils/apiErrorMessage';
import i18n from '../i18n/config';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useAdminCollaboration, useCollaborationAction } from '../hooks/useCollaboration';
import { adminCollaborationApi } from '../api/collaboration.api';
import Button from '../components/common/Button';
import { formatNumber } from '../utils/format';
import { friendshipStatusLabel, groupRoleLabel, shareTargetLabel } from '../i18n/labels';

const LABELS = { friends: 'admin:friendships', groups: 'admin:groups', shares: 'admin:fileShares' };
export default function AdminCollaboration() {
  useTranslation();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [kind, setKind] = useState('friends');
  const [page, setPage] = useState(1);
  const data = useAdminCollaboration(kind, page, user?.role === 'admin');
  const mutation = useCollaborationAction(async ([method, ...args]) => adminCollaborationApi[method](...args));
  if (user?.role !== 'admin') return <Navigate to="/app" replace />;
  const perform = (method, ...args) => mutation.mutate([method, ...args], {
    onSuccess: () => addToast(i18n.t('common:updated'), 'success'),
    onError: (error) => addToast(apiErrorMessage(error, i18n.t('admin:operationFailed')), 'error'),
  });
  const remove = (id) => {
    if (window.confirm(i18n.t('admin:revokeDeleteThisValue1TheOperationWillBeRecordedInHistory', { value1: i18n.t(LABELS[kind]).toLowerCase() }))) perform('remove', kind, id);
  };
  return <div className="flex flex-col gap-5">
    <h1 className="font-display text-2xl font-semibold">{i18n.t('common:collaborativeGovernance')}</h1>
    <div className="flex flex-wrap gap-2">{Object.entries(LABELS).map(([name, label]) =>
      <Button key={name} size="sm" variant={kind === name ? 'primary' : 'secondary'} onClick={() => { setKind(name); setPage(1); }}>{i18n.t(label)}</Button>)}</div>
    {data.isLoading && <p>{i18n.t('common:loading')}</p>}
    {data.isError && <p role="alert" className="text-danger">{i18n.t('admin:unableToLoadAdministrativeData')}</p>}
    {data.data?.rows.length === 0 && <p className="text-sm text-text-secondary">{i18n.t('admin:noDataAvailable')}</p>}
    {data.data?.rows.map((row) => <article key={row._id || row.id} className="catalog-card flex flex-col gap-2 p-4 text-sm">
      {kind === 'friends' && <><p>{row.users?.join(' ↔ ')} · {friendshipStatusLabel(row.status)}</p><p className="text-xs text-text-secondary">{i18n.t('admin:inviter')} {row.requester}</p></>}
      {kind === 'groups' && <><p className="font-semibold">{row.name} · {formatNumber(row.members?.length || 0)} {i18n.t('admin:member')}</p><p className="break-all text-xs text-text-secondary">{i18n.t('admin:groupOwner')} {row.owner} {i18n.t('admin:id')} {row._id}</p>
        {row.members?.map((member) => <div key={member.user} className="flex flex-wrap items-center gap-2 border-t border-border py-1 text-xs">
          <span className="grow">{member.user} · {groupRoleLabel(member.role)}</span>
          {member.role !== 'OWNER' && <><Button size="sm" variant="secondary" onClick={() => perform('member', row._id, member.user, member.role === 'ADMIN' ? 'MEMBER' : 'ADMIN')}>{member.role === 'ADMIN' ? i18n.t('common:removeAdmin') : i18n.t('common:assignAdmin')}</Button>
            <Button size="sm" variant="danger" onClick={() => perform('member', row._id, member.user, null)}>{i18n.t('common:deleteMembers')}</Button></>}
        </div>)}
        <Button size="sm" variant="secondary" onClick={() => perform('updateGroup', row._id, { discoverable: !row.discoverable })}>{row.discoverable ? i18n.t('admin:hideGroupsFromSearch') : i18n.t('admin:forGroupSearch')}</Button>
      </>}
      {kind === 'shares' && <><p>{row.item?.title || i18n.t('common:deletedFile')} · {shareTargetLabel(row.targetType)}: {row.targetId}</p>
        <p className="text-xs text-text-secondary">{i18n.t('admin:owner')} {row.owner} {i18n.t('admin:view')} {row.canView ? i18n.t('common:yes') : i18n.t('common:no')} {i18n.t('common:downloadWithBullet')} {row.canDownload ? i18n.t('common:yes') : i18n.t('common:no')} {i18n.t('common:continueSharing')} {row.canReshare ? i18n.t('common:yes') : i18n.t('common:no')}</p></>}
      <Button size="sm" variant="danger" disabled={mutation.isPending} onClick={() => remove(row._id || row.id)}>{kind === 'groups' ? i18n.t('common:deleteGroup') : i18n.t('common:withdrawal')}</Button>
    </article>)}
    <div className="flex items-center gap-3"><Button size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>{i18n.t('admin:before')}</Button>
      <span className="text-sm">{i18n.t('common:pagination', { count: data.data?.total || 0, page: formatNumber(page), pages: formatNumber(Math.max(1, Math.ceil((data.data?.total || 0) / 20))), total: formatNumber(data.data?.total || 0) })}</span>
      <Button size="sm" disabled={page * 20 >= (data.data?.total || 0)} onClick={() => setPage(page + 1)}>{i18n.t('admin:after')}</Button></div>
  </div>;
}
