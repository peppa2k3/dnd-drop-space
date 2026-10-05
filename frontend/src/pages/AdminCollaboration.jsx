import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useAdminCollaboration, useCollaborationAction } from '../hooks/useCollaboration';
import { adminCollaborationApi } from '../api/collaboration.api';
import Button from '../components/common/Button';

const LABELS = { friends: 'Quan hệ bạn bè', groups: 'Nhóm', shares: 'Chia sẻ tệp' };
export default function AdminCollaboration() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [kind, setKind] = useState('friends');
  const [page, setPage] = useState(1);
  const data = useAdminCollaboration(kind, page, user?.role === 'admin');
  const mutation = useCollaborationAction(async ([method, ...args]) => adminCollaborationApi[method](...args));
  if (user?.role !== 'admin') return <Navigate to="/app" replace />;
  const perform = (method, ...args) => mutation.mutate([method, ...args], {
    onSuccess: () => addToast('Đã cập nhật', 'success'),
    onError: (error) => addToast(error.response?.data?.message || 'Thao tác thất bại', 'error'),
  });
  const remove = (id) => {
    if (window.confirm(`Thu hồi/xóa ${LABELS[kind].toLowerCase()} này? Thao tác sẽ được ghi lịch sử.`)) perform('remove', kind, id);
  };
  return <div className="flex flex-col gap-5">
    <h1 className="font-display text-2xl font-semibold">Quản trị cộng tác</h1>
    <div className="flex flex-wrap gap-2">{Object.entries(LABELS).map(([name, label]) =>
      <Button key={name} size="sm" variant={kind === name ? 'primary' : 'secondary'} onClick={() => { setKind(name); setPage(1); }}>{label}</Button>)}</div>
    {data.isLoading && <p>Đang tải...</p>}
    {data.isError && <p role="alert" className="text-danger">Không thể tải dữ liệu quản trị.</p>}
    {data.data?.rows.length === 0 && <p className="text-sm text-text-secondary">Không có dữ liệu.</p>}
    {data.data?.rows.map((row) => <article key={row._id || row.id} className="catalog-card flex flex-col gap-2 p-4 text-sm">
      {kind === 'friends' && <><p>{row.users?.join(' ↔ ')} · {row.status}</p><p className="text-xs text-text-secondary">Người mời: {row.requester}</p></>}
      {kind === 'groups' && <><p className="font-semibold">{row.name} · {row.members?.length} thành viên</p><p className="break-all text-xs text-text-secondary">Chủ nhóm: {row.owner} · ID: {row._id}</p>
        {row.members?.map((member) => <div key={member.user} className="flex flex-wrap items-center gap-2 border-t border-border py-1 text-xs">
          <span className="grow">{member.user} · {member.role}</span>
          {member.role !== 'OWNER' && <><Button size="sm" variant="secondary" onClick={() => perform('member', row._id, member.user, member.role === 'ADMIN' ? 'MEMBER' : 'ADMIN')}>{member.role === 'ADMIN' ? 'Gỡ admin' : 'Gán admin'}</Button>
            <Button size="sm" variant="danger" onClick={() => perform('member', row._id, member.user, null)}>Xóa thành viên</Button></>}
        </div>)}
        <Button size="sm" variant="secondary" onClick={() => perform('updateGroup', row._id, { discoverable: !row.discoverable })}>{row.discoverable ? 'Ẩn nhóm khỏi tìm kiếm' : 'Cho tìm kiếm nhóm'}</Button>
      </>}
      {kind === 'shares' && <><p>{row.item?.title || 'Tệp đã xóa'} · {row.targetType}: {row.targetId}</p>
        <p className="text-xs text-text-secondary">Chủ sở hữu: {row.owner} · Xem {row.canView ? 'có' : 'không'} · Tải {row.canDownload ? 'có' : 'không'} · Chia sẻ tiếp {row.canReshare ? 'có' : 'không'}</p></>}
      <Button size="sm" variant="danger" disabled={mutation.isPending} onClick={() => remove(row._id || row.id)}>{kind === 'groups' ? 'Xóa nhóm' : 'Thu hồi'}</Button>
    </article>)}
    <div className="flex items-center gap-3"><Button size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Trước</Button>
      <span className="text-sm">Trang {page} · {data.data?.total || 0} mục</span>
      <Button size="sm" disabled={page * 20 >= (data.data?.total || 0)} onClick={() => setPage(page + 1)}>Sau</Button></div>
  </div>;
}
