import { apiErrorMessage } from '../utils/apiErrorMessage';
import i18n from '../i18n/config';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useItem } from '../hooks/useItems';
import { useFriends, useGroups, useReceivedShares, useOutgoingShares, useItemShares, useCollaborationAction } from '../hooks/useCollaboration';
import { shareApi } from '../api/collaboration.api';
import { mediaUrl } from '../utils/mediaUrl';
import { formatBytes, formatDateTime, formatNumber } from '../utils/format';
import Button from '../components/common/Button';

function ShareForm({ itemId, source, sourcePassword, onDone }) {
  useTranslation();
  const { addToast } = useToast();
  const friends = useFriends();
  const groups = useGroups();
  const [kind, setKind] = useState('user');
  const [targets, setTargets] = useState('');
  const [rights, setRights] = useState({ canView: source ? source.canView : true,
    canDownload: source ? source.canDownload : true, canReshare: false });
  const [password, setPassword] = useState('');
  const [expires, setExpires] = useState('');
  const [pending, setPending] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    const ids = [...new Set(targets.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean))];
    if (!ids.length || ids.length > 20) {
      addToast(i18n.t('shared:selectShareRecipients'), 'error'); return;
    }
    setPending(true);
    let done = 0;
    for (const targetId of ids) {
      try {
        await shareApi.create({
          itemId, targetType: kind, targetId, ...rights,
          ...(source ? { sourceShareId: source.id, sourcePassword } : {}),
          ...(!source && password ? { password } : {}),
          ...(expires ? { expiresAt: new Date(expires).toISOString() } : {}),
        });
        done++;
      } catch (error) {
        addToast(i18n.t('shared:shareTargetFailed', { targetId, reason: apiErrorMessage(error, i18n.t('shared:networkError')) }), 'error');
      }
    }
    setPending(false);
    if (done) { addToast(i18n.t('shared:sharedTargets', { count: done, formattedCount: formatNumber(done) }), 'success'); setTargets(''); onDone?.(); }
  };
  return <form onSubmit={submit} className="catalog-card flex flex-col gap-3 p-4">
    <h3 className="font-semibold">{source ? i18n.t('shared:subsequentSharingPermissionsAreGranted') : i18n.t('shared:shareMyFiles')}</h3>
    <label className="text-sm">{i18n.t('shared:shareFor')}
      <select value={kind} onChange={(e) => { setKind(e.target.value); setTargets(''); }} className="ml-2 rounded-card border border-border p-2">
        <option value="user">{i18n.t('shared:userFriend')}</option><option value="group">{i18n.t('shared:group')}</option>
      </select>
    </label>
    <input aria-label={kind === 'user' ? i18n.t('shared:userIdSeparatedByCommas') : i18n.t('shared:groupId')} value={targets}
      onChange={(e) => setTargets(e.target.value)} placeholder={kind === 'user' ? i18n.t('shared:userIdsPlaceholder') : i18n.t('shared:groupId')}
      className="rounded-card border border-border p-2" required />
    {kind === 'user' && <select aria-label={i18n.t('shared:chooseFriends')} value="" onChange={(e) => setTargets((previous) => [previous, e.target.value].filter(Boolean).join(', '))} className="rounded-card border border-border p-2">
      <option value="">{i18n.t('shared:chooseFromYourFriendsList')}</option>{friends.data?.friends.map((friend) => <option key={friend.id} value={friend.id}>{friend.name} · @{friend.username}</option>)}
    </select>}
    {kind === 'group' && <select aria-label={i18n.t('shared:selectGroup')} value="" onChange={(e) => setTargets(e.target.value)} className="rounded-card border border-border p-2">
      <option value="">{i18n.t('shared:selectTheGroupYouJoined')}</option>{groups.data?.groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
    </select>}
    <div className="flex flex-wrap gap-4 text-sm">
      {['canView', 'canDownload', 'canReshare'].map((key) =>
        <label key={key} className="flex items-center gap-1"><input type="checkbox" checked={rights[key]}
          disabled={Boolean(source && !source[key])}
          onChange={(e) => setRights({ ...rights, [key]: e.target.checked })} />
          {({ canView: i18n.t('shared:viewed'), canDownload: i18n.t('shared:loaded'), canReshare: i18n.t('shared:sharedFurther') })[key]}
        </label>)}
    </div>
    {!source && <label className="text-sm">{i18n.t('shared:optionalPasswordAtLeast6Characters')}
      <input type="password" minLength={6} maxLength={128} autoComplete="new-password" value={password}
        onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full rounded-card border border-border p-2" />
    </label>}
    <label className="text-sm">{i18n.t('shared:optionsExpiration')}
      <input type="datetime-local" value={expires} onChange={(e) => setExpires(e.target.value)}
        className="mt-1 block w-full rounded-card border border-border p-2" />
    </label>
    <Button type="submit" disabled={pending}>{pending ? i18n.t('shared:sharingPlaceholder') : i18n.t('shared:createShares')}</Button>
  </form>;
}
function ReceiverCard({ share, proof, onUnlock, onReshare }) {
  useTranslation();
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const { addToast } = useToast();
  const media = (kind) => mediaUrl(`/api/shares/${share.id}/${kind}${proof?.token ? `?unlock=${encodeURIComponent(proof.token)}` : ''}`);
  const unlock = async (event) => {
    event.preventDefault();
    try {
      const result = await shareApi.unlock(share.id, password);
      onUnlock(share.id, { token: result.unlockToken, password });
      addToast(i18n.t('shared:shareUnlocked'), 'success');
    } catch (error) { addToast(apiErrorMessage(error, i18n.t('shared:passwordIsIncorrect')), 'error'); }
  };
  const ready = !share.passwordProtected || Boolean(proof);
  const category = share.item?.category;
  return <div className="catalog-card flex flex-col gap-3 p-4">
    <div><p className="font-semibold">{share.item?.title || i18n.t('shared:theFileNoLongerExists')}</p>
      <p className="text-xs text-text-secondary">{formatBytes(share.item?.size)} · {share.owner?.name} · {share.targetType === 'group' ? i18n.t('shared:throughTheGroup') : i18n.t('shared:shareDirectly')}</p>
      {share.expiresAt && <p className="text-xs text-text-secondary">{i18n.t('shared:expiration')} {formatDateTime(share.expiresAt)}</p>}
    </div>
    {!ready && <form className="flex gap-2" onSubmit={unlock}>
      <input aria-label={i18n.t('shared:sharedFilePassword')} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={i18n.t('shared:passwordShare')} className="min-w-0 grow rounded-card border border-border p-2" />
      <Button type="submit" size="sm">{i18n.t('shared:unlock')}</Button>
    </form>}
    {ready && <div className="flex flex-wrap gap-2">
      {share.canView && ['image', 'video', 'pdf'].includes(category) && <Button size="sm" variant="secondary" onClick={() => setShow(!show)}>{show ? i18n.t('shared:hidePreview') : i18n.t('common:preview')}</Button>}
      {share.canDownload && <Button as="a" size="sm" variant="secondary" href={media('download')}>{i18n.t('common:download')}</Button>}
      {share.canReshare && <Button size="sm" variant="secondary" onClick={() => onReshare(share, proof?.password)}>{i18n.t('shared:continueSharing')}</Button>}
    </div>}
    {ready && show && share.canView && category === 'image' && <img src={media('view')} alt={share.item?.title} className="max-h-96 object-contain" />}
    {ready && show && share.canView && category === 'video' && <video src={media('view')} controls className="max-h-96" />}
    {ready && show && share.canView && category === 'pdf' && <iframe src={media('view')} title={share.item?.title} className="h-[60vh] w-full" />}
  </div>;
}
export default function SharedFiles() {
  useTranslation();
  const [params] = useSearchParams();
  const itemId = params.get('itemId');
  const { user } = useAuth();
  const item = useItem(itemId);
  const itemShares = useItemShares(itemId);
  const outgoing = useOutgoingShares();
  const [cursor, setCursor] = useState(null);
  const received = useReceivedShares(cursor);
  const [proofs, setProofs] = useState({});
  const [reshare, setReshare] = useState(null);
  const [editing, setEditing] = useState(null);
  const [rights, setRights] = useState({});
  const [newPassword, setNewPassword] = useState('');
  const [removePassword, setRemovePassword] = useState(false);
  const { addToast } = useToast();
  const mutation = useCollaborationAction(async ([method, ...args]) => shareApi[method](...args));
  const revoke = (share) => {
    if (window.confirm(i18n.t('shared:confirmRevokeShareTitleAndSharesCreatedFromIt', { title: share.item?.title }))) {
      mutation.mutate(['revoke', share.id], { onError: (e) => addToast(apiErrorMessage(e, i18n.t('shared:cannotBeRevoked')), 'error') });
    }
  };
  const edit = (share) => { setEditing(share.id); setNewPassword(''); setRemovePassword(false); setRights({ canView: share.canView, canDownload: share.canDownload, canReshare: share.canReshare, expiresAt: share.expiresAt?.slice(0, 16) || '' }); };
  const save = () => {
    const body = { canView: rights.canView, canDownload: rights.canDownload, canReshare: rights.canReshare,
      expiresAt: rights.expiresAt ? new Date(rights.expiresAt).toISOString() : null };
    if (removePassword) body.password = null;
    else if (newPassword) body.password = newPassword;
    mutation.mutate(['update', editing, body], {
      onSuccess: () => { addToast(i18n.t('shared:rightsChanged'), 'success'); setEditing(null); },
      onError: (e) => addToast(apiErrorMessage(e, i18n.t('shared:rightsCannotBeChanged')), 'error'),
    });
  };
  return <div className="flex flex-col gap-6">
    <h1 className="font-display text-2xl font-semibold">{i18n.t('common:filesAreShared')}</h1>
    {itemId && item.data?.type === 'file' && <section>
      <h2 className="mb-2 font-semibold">{i18n.t('shared:share')} {item.data.title}</h2>
      <ShareForm itemId={itemId} onDone={() => itemShares.refetch()} />
      <p className="mt-2 text-sm text-text-secondary">{i18n.t('shared:shareCount', { count: itemShares.data?.shares.length || 0, formattedCount: formatNumber(itemShares.data?.shares.length || 0) })}</p>
    </section>}
    {itemId && item.isError && <p role="alert" className="text-danger">{i18n.t('shared:yourFileWasNotFound')}</p>}
    {reshare && user?.storageLimitBytes > 0 && <section>
      <ShareForm key={reshare.share.id} itemId={reshare.share.itemId} source={reshare.share} sourcePassword={reshare.password}
        onDone={() => { setReshare(null); outgoing.refetch(); }} />
      <Button variant="ghost" onClick={() => setReshare(null)}>{i18n.t('common:close')}</Button>
    </section>}
    <section><h2 className="mb-3 font-semibold">{i18n.t('shared:sharedWithMe')}</h2>
      {received.isError && <p role="alert" className="text-danger">{i18n.t('shared:unableToLoadSharedList')}</p>}
      {received.data?.shares.length === 0 && <p className="text-sm text-text-secondary">{i18n.t('shared:thereAreNoFilesSharedYet')}</p>}
      <div className="grid gap-3 md:grid-cols-2">{received.data?.shares.map((share) => <ReceiverCard key={share.id} share={share} proof={proofs[share.id]}
        onUnlock={(id, proof) => setProofs({ ...proofs, [id]: proof })}
        onReshare={(row, password) => setReshare({ share: row, password })} />)}</div>
      {received.data?.nextCursor && <Button variant="secondary" className="mt-3" onClick={() => setCursor(received.data.nextCursor)}>{i18n.t('shared:downloadMore')}</Button>}
      {cursor && <Button variant="ghost" className="mt-3" onClick={() => setCursor(null)}>{i18n.t('shared:backToTop')}</Button>}
    </section>
    <section><h2 className="mb-3 font-semibold">{i18n.t('shared:iHaveShared')}</h2>
      {outgoing.isError && <p role="alert" className="text-danger">{i18n.t('shared:unableToDownloadYourShare')}</p>}
      {outgoing.data?.shares.length === 0 && <p className="text-sm text-text-secondary">{i18n.t('shared:noFilesHaveBeenSharedYet')}</p>}
      {outgoing.data?.shares.map((share) => <div key={share.id} className="catalog-card mb-2 flex flex-col gap-2 p-3 text-sm">
        <p className="font-medium">{share.item?.title || i18n.t('common:deletedFile')} · {share.targetType === 'group' ? i18n.t('shared:group') : i18n.t('common:user')} {share.targetId}</p>
        <p className="text-xs text-text-secondary">{i18n.t('shared:see')} {share.canView ? i18n.t('common:yes') : i18n.t('common:no')} {i18n.t('common:downloadWithBullet')} {share.canDownload ? i18n.t('common:yes') : i18n.t('common:no')} {i18n.t('common:continueSharing')} {share.canReshare ? i18n.t('common:yes') : i18n.t('common:no')} {i18n.t('shared:password')} {share.passwordProtected ? i18n.t('common:yes') : i18n.t('common:no')}</p>
        <div className="flex gap-2"><Button size="sm" variant="secondary" onClick={() => edit(share)}>{i18n.t('shared:changePermissions')}</Button><Button size="sm" variant="danger" onClick={() => revoke(share)}>{i18n.t('common:withdrawal')}</Button></div>
        {editing === share.id && <div className="flex flex-col gap-2 border-t border-border pt-2">
          {['canView', 'canDownload', 'canReshare'].map((key) => <label key={key} className="text-sm"><input type="checkbox" checked={rights[key]} onChange={(e) => setRights({ ...rights, [key]: e.target.checked })} /> {({ canView: i18n.t('shared:allowView'), canDownload: i18n.t('shared:forLoading'), canReshare: i18n.t('shared:pleaseContinueToShare') })[key]}</label>)}
          <label className="text-sm">{i18n.t('shared:expired')}<input type="datetime-local" value={rights.expiresAt} onChange={(e) => setRights({ ...rights, expiresAt: e.target.value })} className="ml-2 rounded-card border border-border p-1" /></label>
          {!share.parentShare && <><label className="text-sm">{i18n.t('shared:newPasswordLeaveBlankIfKeepingTheSame')}<input type="password" minLength={6} maxLength={128} value={newPassword} disabled={removePassword} onChange={(e) => setNewPassword(e.target.value)} className="ml-2 rounded-card border border-border p-1" /></label>
            <label className="text-sm"><input type="checkbox" checked={removePassword} onChange={(e) => setRemovePassword(e.target.checked)} /> {i18n.t('shared:removePassword')}</label></>}
          <Button size="sm" onClick={save}>{i18n.t('shared:saveRights')}</Button>
        </div>}
      </div>)}
    </section>
  </div>;
}
