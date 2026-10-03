import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useGroups, useGroupInvitations, useGroupSearch, useFriends, useCollaborationAction } from '../hooks/useCollaboration';
import { groupApi } from '../api/collaboration.api';
import Button from '../components/common/Button';

export default function Groups() {
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
      addToast('Đã cập nhật nhóm', 'success');
      if (method === 'create') {
        setNewGroupName(''); setNewGroupDescription(''); setNewDiscoverable(true);
        setSelectedId(value.group.id);
      }
    },
    onError: (error) => addToast(error.response?.data?.message || 'Không thể thực hiện', 'error'),
  });
  const remove = () => {
    if (window.confirm(`Xóa nhóm "${group.name}"? Những share tới nhóm sẽ bị thu hồi.`)) {
      act('remove', group.id);
      setSelectedId(null);
    }
  };
  return <div className="flex flex-col gap-6">
    <h1 className="font-display text-2xl font-semibold">Nhóm</h1>
    {user?.storageLimitBytes > 0 && <form className="catalog-card flex flex-wrap gap-2 p-4" onSubmit={(e) => {
      e.preventDefault(); act('create', { name: newGroupName, description: newGroupDescription, discoverable: newDiscoverable });
    }}>
      <input aria-label="Tên nhóm mới" required minLength={2} maxLength={100} value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="Tên nhóm" className="min-w-0 grow rounded-card border border-line p-2" />
      <input aria-label="Mô tả nhóm mới" value={newGroupDescription} onChange={(e) => setNewGroupDescription(e.target.value)} placeholder="Mô tả" className="min-w-0 grow rounded-card border border-line p-2" />
      <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={newDiscoverable} onChange={(e) => setNewDiscoverable(e.target.checked)} /> Cho tìm kiếm</label>
      <Button type="submit" disabled={mutation.isPending}>Tạo nhóm</Button>
    </form>}
    {user?.storageLimitBytes <= 0 && <p className="text-sm text-slate">Cần được cấp dung lượng để tạo nhóm. Bạn vẫn có thể nhận lời mời vào nhóm.</p>}
    <section><h2 className="mb-2 font-semibold">Lời mời vào nhóm</h2>
      {invitations.data?.invitations.length === 0 && <p className="text-sm text-slate">Chưa có lời mời.</p>}
      {invitations.data?.invitations.map((invite) => <div key={invite.id} className="catalog-card mb-2 flex flex-wrap items-center gap-2 p-3">
        <span className="grow">{invite.groupName}</span>
        <Button size="sm" onClick={() => act('decide', invite.id, 'accept')}>Tham gia</Button>
        <Button size="sm" variant="secondary" onClick={() => act('decide', invite.id, 'reject')}>Từ chối</Button>
      </div>)}
    </section>
    <section><h2 className="mb-2 font-semibold">Nhóm của tôi</h2>
      {groups.isError && <p role="alert" className="text-brick">Không thể tải nhóm.</p>}
      {groups.data?.groups.length === 0 && <p className="text-sm text-slate">Chưa tham gia nhóm nào.</p>}
      <div className="grid gap-2 sm:grid-cols-2">{groups.data?.groups.map((row) => <button key={row.id} onClick={() => setSelectedId(row.id)} className="catalog-card p-3 text-left">
        <p className="font-semibold">{row.name}</p><p className="text-xs text-slate">{row.role} · {row.memberCount} thành viên · ID {row.id}</p>
      </button>)}</div>
    </section>
    {group && <section className="catalog-card flex flex-col gap-4 p-4">
      <h2 className="font-semibold">{group.name} · {group.role}</h2><p className="text-sm">{group.description}</p>
      {group.role === 'OWNER' && <form onSubmit={(e) => {
        e.preventDefault(); act('update', group.id, { name: groupName, description: groupDescription, discoverable });
      }} className="flex flex-col gap-2">
        <input aria-label="Đổi tên nhóm" minLength={2} maxLength={100} value={groupName} onChange={(e) => setGroupName(e.target.value)} className="rounded-card border border-line p-2" />
        <textarea aria-label="Mô tả nhóm" maxLength={500} value={groupDescription} onChange={(e) => setGroupDescription(e.target.value)} className="rounded-card border border-line p-2" />
        <label className="text-sm"><input type="checkbox" checked={discoverable} onChange={(e) => setDiscoverable(e.target.checked)} /> Cho tìm kiếm</label>
        <Button type="submit" disabled={mutation.isPending}>Lưu nhóm</Button>
      </form>}
      {['OWNER', 'ADMIN'].includes(group.role) && <div className="flex flex-wrap gap-2">
        <input aria-label="ID người được mời" value={inviteId} onChange={(e) => setInviteId(e.target.value)} placeholder="ID người dùng" className="min-w-0 grow rounded-card border border-line p-2" />
        <select aria-label="Chọn bạn bè để mời" value="" onChange={(e) => setInviteId(e.target.value)} className="rounded-card border border-line p-2">
          <option value="">Chọn từ bạn bè</option>{friends.data?.friends.map((friend) => <option key={friend.id} value={friend.id}>{friend.name}</option>)}
        </select>
        <Button disabled={!inviteId || mutation.isPending} onClick={() => { act('invite', group.id, inviteId.trim()); setInviteId(''); }}>Mời</Button>
      </div>}
      <h3 className="font-semibold">Thành viên</h3>
      {group.members?.map((member) => <div key={member.id} className="flex flex-wrap items-center gap-2 border-b border-line py-2 text-sm">
        <span className="min-w-0 grow">{member.name} · @{member.username} · {member.role}</span>
        {group.role === 'OWNER' && member.role !== 'OWNER' && <Button size="sm" variant="secondary" onClick={() => act('member', group.id, member.id, member.role === 'ADMIN' ? 'MEMBER' : 'ADMIN')}>{member.role === 'ADMIN' ? 'Gỡ admin' : 'Gán admin'}</Button>}
        {group.role === 'OWNER' && member.role !== 'OWNER' && <Button size="sm" variant="secondary" onClick={() => {
          if (window.confirm(`Chuyển quyền sở hữu nhóm cho ${member.name}?`)) act('transferOwner', group.id, member.id);
        }}>Chuyển chủ nhóm</Button>}
        {member.role !== 'OWNER' && (member.id === user.id || group.role === 'OWNER' || (group.role === 'ADMIN' && member.role === 'MEMBER')) &&
          <Button size="sm" variant="danger" onClick={() => { act('member', group.id, member.id, null); if (member.id === user.id) setSelectedId(null); }}>{member.id === user.id ? 'Rời nhóm' : 'Xóa thành viên'}</Button>}
      </div>)}
      {group.role === 'OWNER' && <Button variant="danger" onClick={remove}>Xóa nhóm</Button>}
    </section>}
    <section><h2 className="mb-2 font-semibold">Tìm nhóm công khai</h2>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); setQ(input.trim()); }}>
        <input aria-label="Tìm nhóm" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Tên hoặc ID nhóm" className="min-w-0 grow rounded-card border border-line p-2" />
        <Button type="submit">Tìm</Button>
      </form>
      {q && found.data?.groups.length === 0 && <p className="mt-2 text-sm text-slate">Không tìm thấy nhóm công khai.</p>}
      {found.data?.groups.map((row) => <div key={row.id} className="catalog-card mt-2 p-3 text-sm">{row.name} · {row.memberCount} thành viên · ID {row.id}</div>)}
    </section>
  </div>;
}
