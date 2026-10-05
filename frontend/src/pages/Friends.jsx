import { apiErrorMessage } from '../utils/apiErrorMessage';
import i18n from '../i18n/config';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useBlocks, useFriends, useFriendRequests, useUserSearch, useCollaborationAction } from '../hooks/useCollaboration';
import { socialApi } from '../api/collaboration.api';
import { useToast } from '../context/ToastContext';
import Button from '../components/common/Button';

export default function Friends() {
  useTranslation();
  const [input, setInput] = useState('');
  const [q, setQ] = useState('');
  const friends = useFriends();
  const requests = useFriendRequests();
  const blocks = useBlocks();
  const results = useUserSearch(q);
  const { addToast } = useToast();
  const mutation = useCollaborationAction(async ([method, ...args]) => socialApi[method](...args));
  const act = (method, ...args) => mutation.mutate([method, ...args], {
    onSuccess: () => addToast(i18n.t('common:updated'), 'success'),
    onError: (e) => addToast(apiErrorMessage(e, i18n.t('shared:cannotBeDone')), 'error'),
  });
  const confirmBlock = (id) => {
    if (window.confirm(i18n.t('shared:blockThisUserFriendshipsAndDirectSharesToThemWillBeCanceled'))) act('block', id);
  };
  return <div className="flex flex-col gap-6">
    <h1 className="font-display text-2xl font-semibold">{i18n.t('shared:friends')}</h1>
    <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); setQ(input.trim()); }}>
      <input aria-label={i18n.t('common:findUsers')} value={input} onChange={(e) => setInput(e.target.value)} placeholder={i18n.t('shared:usernameOrUserId')} className="min-w-0 grow rounded-card border border-border p-2" />
      <Button type="submit">{i18n.t('shared:find')}</Button>
    </form>
    {results.isError && <p role="alert" className="text-danger">{i18n.t('shared:unableToFindUser')}</p>}
    {q && <section><h2 className="mb-2 font-semibold">{i18n.t('common:searchResults')}</h2>
      {results.data?.users.length === 0 && <p className="text-sm text-text-secondary">{i18n.t('shared:noMatchingAccountFound')}</p>}
      {results.data?.users.map((user) => <div key={user.id} className="catalog-card mb-2 flex flex-wrap items-center gap-2 p-3">
        <div className="min-w-0 grow"><p className="font-medium">{user.name} · @{user.username}</p><p className="break-all text-xs text-text-secondary">{user.id}</p></div>
        <Button size="sm" disabled={mutation.isPending} onClick={() => act('request', user.id)}>{i18n.t('shared:makeFriends')}</Button>
        <Button size="sm" variant="danger" disabled={mutation.isPending} onClick={() => confirmBlock(user.id)}>{i18n.t('shared:block')}</Button>
      </div>)}
    </section>}
    <section><h2 className="mb-2 font-semibold">{i18n.t('shared:friendInvitation')}</h2>
      {requests.isError && <p role="alert" className="text-danger">{i18n.t('shared:unableToDownloadInvitation')}</p>}
      {requests.data?.requests.length === 0 && <p className="text-sm text-text-secondary">{i18n.t('shared:noInvitationYet')}</p>}
      {requests.data?.requests.map((row) => <div key={row.id} className="catalog-card mb-2 flex flex-wrap items-center gap-2 p-3 text-sm">
        <span className="grow">{row.user.name} · @{row.user.username} · {row.direction === 'incoming' ? i18n.t('shared:sentToYou') : i18n.t('shared:youHaveSent')}</span>
        {row.direction === 'incoming' && <><Button size="sm" onClick={() => act('decide', row.id, 'accept')}>{i18n.t('shared:agreed')}</Button><Button size="sm" variant="secondary" onClick={() => act('decide', row.id, 'reject')}>{i18n.t('shared:refuse')}</Button></>}
        {row.direction === 'outgoing' && <Button size="sm" variant="secondary" onClick={() => act('decide', row.id, 'cancel')}>{i18n.t('shared:cancelInvitation')}</Button>}
      </div>)}
    </section>
    <section><h2 className="mb-2 font-semibold">{i18n.t('shared:listOfFriends')}</h2>
      {friends.isError && <p role="alert" className="text-danger">{i18n.t('shared:cannotDownloadFriends')}</p>}
      {friends.data?.friends.length === 0 && <p className="text-sm text-text-secondary">{i18n.t('shared:noFriendsYet')}</p>}
      {friends.data?.friends.map((user) => <div key={user.id} className="catalog-card mb-2 flex flex-wrap items-center gap-2 p-3">
        <span className="grow">{user.name} · @{user.username}</span>
        <Button size="sm" variant="secondary" onClick={() => act('unfriend', user.id)}>{i18n.t('shared:unfriend')}</Button>
        <Button size="sm" variant="danger" onClick={() => confirmBlock(user.id)}>{i18n.t('shared:block')}</Button>
      </div>)}
    </section>
    <section><h2 className="mb-2 font-semibold">{i18n.t('shared:blocked')}</h2>
      {blocks.data?.users.length === 0 && <p className="text-sm text-text-secondary">{i18n.t('shared:noOneWasBlocked')}</p>}
      {blocks.data?.users.map((user) => <div key={user.id} className="catalog-card mb-2 flex items-center gap-2 p-3">
        <span className="grow">{user.name} · @{user.username}</span>
        <Button size="sm" variant="secondary" onClick={() => act('unblock', user.id)}>{i18n.t('shared:unblock')}</Button>
      </div>)}
    </section>
  </div>;
}
