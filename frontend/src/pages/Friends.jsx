import { useState } from 'react';
import { useBlocks, useFriends, useFriendRequests, useUserSearch, useCollaborationAction } from '../hooks/useCollaboration';
import { socialApi } from '../api/collaboration.api';
import { useToast } from '../context/ToastContext';
import Button from '../components/common/Button';

export default function Friends() {
  const [input, setInput] = useState('');
  const [q, setQ] = useState('');
  const friends = useFriends();
  const requests = useFriendRequests();
  const blocks = useBlocks();
  const results = useUserSearch(q);
  const { addToast } = useToast();
  const mutation = useCollaborationAction(async ([method, ...args]) => socialApi[method](...args));
  const act = (method, ...args) => mutation.mutate([method, ...args], {
    onSuccess: () => addToast('Đã cập nhật', 'success'),
    onError: (e) => addToast(e.response?.data?.message || 'Không thể thực hiện', 'error'),
  });
  const confirmBlock = (id) => {
    if (window.confirm('Chặn người dùng này? Quan hệ bạn bè và các share trực tiếp cho họ sẽ bị hủy.')) act('block', id);
  };
  return <div className="flex flex-col gap-6">
    <h1 className="font-display text-2xl font-semibold">Bạn bè</h1>
    <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); setQ(input.trim()); }}>
      <input aria-label="Tìm người dùng" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Username hoặc ID người dùng" className="min-w-0 grow rounded-card border border-border p-2" />
      <Button type="submit">Tìm</Button>
    </form>
    {results.isError && <p role="alert" className="text-danger">Không thể tìm người dùng.</p>}
    {q && <section><h2 className="mb-2 font-semibold">Kết quả tìm kiếm</h2>
      {results.data?.users.length === 0 && <p className="text-sm text-text-secondary">Không tìm thấy tài khoản phù hợp.</p>}
      {results.data?.users.map((user) => <div key={user.id} className="catalog-card mb-2 flex flex-wrap items-center gap-2 p-3">
        <div className="min-w-0 grow"><p className="font-medium">{user.name} · @{user.username}</p><p className="break-all text-xs text-text-secondary">{user.id}</p></div>
        <Button size="sm" disabled={mutation.isPending} onClick={() => act('request', user.id)}>Kết bạn</Button>
        <Button size="sm" variant="danger" disabled={mutation.isPending} onClick={() => confirmBlock(user.id)}>Chặn</Button>
      </div>)}
    </section>}
    <section><h2 className="mb-2 font-semibold">Lời mời kết bạn</h2>
      {requests.isError && <p role="alert" className="text-danger">Không thể tải lời mời.</p>}
      {requests.data?.requests.length === 0 && <p className="text-sm text-text-secondary">Chưa có lời mời.</p>}
      {requests.data?.requests.map((row) => <div key={row.id} className="catalog-card mb-2 flex flex-wrap items-center gap-2 p-3 text-sm">
        <span className="grow">{row.user.name} · @{row.user.username} · {row.direction === 'incoming' ? 'Đã gửi cho bạn' : 'Bạn đã gửi'}</span>
        {row.direction === 'incoming' && <><Button size="sm" onClick={() => act('decide', row.id, 'accept')}>Đồng ý</Button><Button size="sm" variant="secondary" onClick={() => act('decide', row.id, 'reject')}>Từ chối</Button></>}
        {row.direction === 'outgoing' && <Button size="sm" variant="secondary" onClick={() => act('decide', row.id, 'cancel')}>Hủy lời mời</Button>}
      </div>)}
    </section>
    <section><h2 className="mb-2 font-semibold">Danh sách bạn bè</h2>
      {friends.isError && <p role="alert" className="text-danger">Không thể tải bạn bè.</p>}
      {friends.data?.friends.length === 0 && <p className="text-sm text-text-secondary">Chưa có bạn bè.</p>}
      {friends.data?.friends.map((user) => <div key={user.id} className="catalog-card mb-2 flex flex-wrap items-center gap-2 p-3">
        <span className="grow">{user.name} · @{user.username}</span>
        <Button size="sm" variant="secondary" onClick={() => act('unfriend', user.id)}>Hủy kết bạn</Button>
        <Button size="sm" variant="danger" onClick={() => confirmBlock(user.id)}>Chặn</Button>
      </div>)}
    </section>
    <section><h2 className="mb-2 font-semibold">Đã chặn</h2>
      {blocks.data?.users.length === 0 && <p className="text-sm text-text-secondary">Không có người bị chặn.</p>}
      {blocks.data?.users.map((user) => <div key={user.id} className="catalog-card mb-2 flex items-center gap-2 p-3">
        <span className="grow">{user.name} · @{user.username}</span>
        <Button size="sm" variant="secondary" onClick={() => act('unblock', user.id)}>Bỏ chặn</Button>
      </div>)}
    </section>
  </div>;
}
