import { apiErrorMessage } from '../utils/apiErrorMessage';
import i18n from '../i18n/config';
import { useTranslation } from 'react-i18next';
import { groupRoleLabel } from '../i18n/labels';
import { formatNumber } from '../utils/format';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useGroups, useGroupInvitations, useGroupSearch, useFriends, useCollaborationAction } from '../hooks/useCollaboration';
import { groupApi } from '../api/collaboration.api';
import Button from '../components/common/Button';

export default function Groups() {
  useTranslation();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [discoverable, setDiscoverable] = useState(true);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [newDiscoverable, setNewDiscoverable] = useState(true);
  const [input, setInput] = useState('');
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [inviteId, setInviteId] = useState('');
  const groups = useGroups();
  const invitations = useGroupInvitations();
  const found = useGroupSearch(q);
  const friends = useFriends();
  const group = groups.data?.groups.find((row) => row.id === selectedId);
  useEffect(() => {
    if (group) {
      setGroupName(group.name);
      setGroupDescription(group.description || '');
      setDiscoverable(group.discoverable);
    }
  }, [selectedId, group?.name, group?.description, group?.discoverable]);
  const mutation = useCollaborationAction(async ([method, ...args]) => groupApi[method](...args));
  const act = (method, ...args) => mutation.mutate([method, ...args], {
    onSuccess: (value) => {
      addToast(i18n.t('shared:groupUpdated'), 'success');
      if (method === 'create') {
        setNewGroupName(''); setNewGroupDescription(''); setNewDiscoverable(true);
        setSelectedId(value.group.id);
      }
    },
    onError: (error) => addToast(apiErrorMessage(error, i18n.t('shared:cannotBeDone')), 'error'),
  });
  const remove = () => {
    if (window.confirm(i18n.t('shared:deleteGroupNameSharesToTheGroupWillBeRevoked', { name: group.name }))) {
      act('remove', group.id);
      setSelectedId(null);
    }
  };
  return <div className="flex flex-col gap-6">
    <h1 className="font-display text-2xl font-semibold">{i18n.t('shared:group')}</h1>
    {user?.storageLimitBytes > 0 && <form className="catalog-card flex flex-wrap gap-2 p-4" onSubmit={(e) => {
      e.preventDefault(); act('create', { name: newGroupName, description: newGroupDescription, discoverable: newDiscoverable });
    }}>
      <input aria-label={i18n.t('shared:newGroupName')} required minLength={2} maxLength={100} value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder={i18n.t('shared:groupName')} className="min-w-0 grow rounded-card border border-border p-2" />
      <input aria-label={i18n.t('shared:newGroupDescription')} value={newGroupDescription} onChange={(e) => setNewGroupDescription(e.target.value)} placeholder={i18n.t('common:description')} className="min-w-0 grow rounded-card border border-border p-2" />
      <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={newDiscoverable} onChange={(e) => setNewDiscoverable(e.target.checked)} /> {i18n.t('shared:forSearch')}</label>
      <Button type="submit" disabled={mutation.isPending}>{i18n.t('shared:createGroups')}</Button>
    </form>}
    {user?.storageLimitBytes <= 0 && <p className="text-sm text-text-secondary">{i18n.t('shared:spaceIsRequiredToCreateAGroupYouCanStillReceiveGroupInvitations')}</p>}
    <section><h2 className="mb-2 font-semibold">{i18n.t('shared:invitationToJoinTheGroup')}</h2>
      {invitations.data?.invitations.length === 0 && <p className="text-sm text-text-secondary">{i18n.t('shared:noInvitationYet')}</p>}
      {invitations.data?.invitations.map((invite) => <div key={invite.id} className="catalog-card mb-2 flex flex-wrap items-center gap-2 p-3">
        <span className="grow">{invite.groupName}</span>
        <Button size="sm" onClick={() => act('decide', invite.id, 'accept')}>{i18n.t('shared:join')}</Button>
        <Button size="sm" variant="secondary" onClick={() => act('decide', invite.id, 'reject')}>{i18n.t('shared:refuse')}</Button>
      </div>)}
    </section>
    <section><h2 className="mb-2 font-semibold">{i18n.t('common:myGroup')}</h2>
      {groups.isError && <p role="alert" className="text-danger">{i18n.t('shared:unableToLoadGroup')}</p>}
      {groups.data?.groups.length === 0 && <p className="text-sm text-text-secondary">{i18n.t('shared:havenTJoinedAnyGroupsYet')}</p>}
      <div className="grid gap-2 sm:grid-cols-2">{groups.data?.groups.map((row) => <button key={row.id} onClick={() => setSelectedId(row.id)} className="catalog-card p-3 text-left">
        <p className="font-semibold">{row.name}</p><p className="text-xs text-text-secondary">{groupRoleLabel(row.role)} · {i18n.t('shared:memberCount', { count: row.memberCount, formattedCount: formatNumber(row.memberCount) })} · ID {row.id}</p>
      </button>)}</div>
    </section>
    {group && <section className="catalog-card flex flex-col gap-4 p-4">
      <h2 className="font-semibold">{group.name} · {groupRoleLabel(group.role)}</h2><p className="text-sm">{group.description}</p>
      {group.role === 'OWNER' && <form onSubmit={(e) => {
        e.preventDefault(); act('update', group.id, { name: groupName, description: groupDescription, discoverable });
      }} className="flex flex-col gap-2">
        <input aria-label={i18n.t('shared:renameTheGroup')} minLength={2} maxLength={100} value={groupName} onChange={(e) => setGroupName(e.target.value)} className="rounded-card border border-border p-2" />
        <textarea aria-label={i18n.t('shared:groupDescription')} maxLength={500} value={groupDescription} onChange={(e) => setGroupDescription(e.target.value)} className="rounded-card border border-border p-2" />
        <label className="text-sm"><input type="checkbox" checked={discoverable} onChange={(e) => setDiscoverable(e.target.checked)} /> {i18n.t('shared:forSearch')}</label>
        <Button type="submit" disabled={mutation.isPending}>{i18n.t('shared:saveGroup')}</Button>
      </form>}
      {['OWNER', 'ADMIN'].includes(group.role) && <div className="flex flex-wrap gap-2">
        <input aria-label={i18n.t('shared:inviteeId')} value={inviteId} onChange={(e) => setInviteId(e.target.value)} placeholder={i18n.t('shared:userId')} className="min-w-0 grow rounded-card border border-border p-2" />
        <select aria-label={i18n.t('shared:chooseFriendsToInvite')} value="" onChange={(e) => setInviteId(e.target.value)} className="rounded-card border border-border p-2">
          <option value="">{i18n.t('shared:chooseFromFriends')}</option>{friends.data?.friends.map((friend) => <option key={friend.id} value={friend.id}>{friend.name}</option>)}
        </select>
        <Button disabled={!inviteId || mutation.isPending} onClick={() => { act('invite', group.id, inviteId.trim()); setInviteId(''); }}>{i18n.t('shared:please')}</Button>
      </div>}
      <h3 className="font-semibold">{i18n.t('shared:member')}</h3>
      {group.members?.map((member) => <div key={member.id} className="flex flex-wrap items-center gap-2 border-b border-border py-2 text-sm">
        <span className="min-w-0 grow">{member.name} · @{member.username} · {groupRoleLabel(member.role)}</span>
        {group.role === 'OWNER' && member.role !== 'OWNER' && <Button size="sm" variant="secondary" onClick={() => act('member', group.id, member.id, member.role === 'ADMIN' ? 'MEMBER' : 'ADMIN')}>{member.role === 'ADMIN' ? i18n.t('common:removeAdmin') : i18n.t('common:assignAdmin')}</Button>}
        {group.role === 'OWNER' && member.role !== 'OWNER' && <Button size="sm" variant="secondary" onClick={() => {
          if (window.confirm(i18n.t('shared:confirmTransferGroupOwnershipToName', { name: member.name }))) act('transferOwner', group.id, member.id);
        }}>{i18n.t('shared:changeGroupOwner')}</Button>}
        {member.role !== 'OWNER' && (member.id === user.id || group.role === 'OWNER' || (group.role === 'ADMIN' && member.role === 'MEMBER')) &&
          <Button size="sm" variant="danger" onClick={() => { act('member', group.id, member.id, null); if (member.id === user.id) setSelectedId(null); }}>{member.id === user.id ? i18n.t('shared:leaveTheGroup') : i18n.t('common:deleteMembers')}</Button>}
      </div>)}
      {group.role === 'OWNER' && <Button variant="danger" onClick={remove}>{i18n.t('common:deleteGroup')}</Button>}
    </section>}
    <section><h2 className="mb-2 font-semibold">{i18n.t('shared:findPublicGroups')}</h2>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); setQ(input.trim()); }}>
        <input aria-label={i18n.t('shared:findGroups')} value={input} onChange={(e) => setInput(e.target.value)} placeholder={i18n.t('shared:groupNameOrId')} className="min-w-0 grow rounded-card border border-border p-2" />
        <Button type="submit">{i18n.t('shared:find')}</Button>
      </form>
      {q && found.data?.groups.length === 0 && <p className="mt-2 text-sm text-text-secondary">{i18n.t('shared:noPublicGroupsFound')}</p>}
      {found.data?.groups.map((row) => <div key={row.id} className="catalog-card mt-2 p-3 text-sm">{row.name} · {i18n.t('shared:memberCount', { count: row.memberCount, formattedCount: formatNumber(row.memberCount) })} · ID {row.id}</div>)}
    </section>
  </div>;
}
