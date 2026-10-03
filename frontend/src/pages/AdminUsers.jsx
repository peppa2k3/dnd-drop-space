import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useUsers, useUserFiles, useUserAudit, useAdminMutation } from '../hooks/useUsers';
import { userApi } from '../api/user.api';
import { mediaUrl } from '../utils/mediaUrl';
import { formatBytes } from '../utils/format';
import Button from '../components/common/Button';

function Pager({ page, total = 0, setPage }) {
  return <div className="flex items-center gap-3 text-sm">
    <Button size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Trước</Button>
    <span>Trang {page} · {total} kết quả</span>
    <Button size="sm" disabled={page * 20 >= total} onClick={() => setPage(page + 1)}>Sau</Button>
  </div>;
}

function UserEditor({ target, onClose, onSaved }) {
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
  const errorToast = (error) => addToast(error.response?.data?.errors?.[0]?.message || error.response?.data?.message || 'Thao tác thất bại', 'error');
  const save = (e) => {
    e.preventDefault();
    const { quotaMB, ...body } = form;
    body.storageLimitBytes = Math.round(Number(quotaMB) * 1024 ** 2);
    update.mutate(body, { onSuccess: ({ user }) => {
      if (user.id === actor.id) setUser(user);
      onSaved(user);
      addToast('Đã cập nhật tài khoản', 'success');
    }, onError: errorToast });
  };
  const changeFile = (item, permanent = false) => {
    if (permanent && !window.confirm(`Xóa vĩnh viễn "${item.title}"? Không thể khôi phục.`)) return;
    fileMutation.mutate({ item, permanent }, { onError: errorToast });
  };
  return <section className="catalog-card flex flex-col gap-4 p-5">
    <div className="flex justify-between gap-3"><h2 className="text-lg font-semibold">{target.name}</h2><Button variant="ghost" onClick={onClose}>Đóng</Button></div>
    <p className="break-all text-xs text-slate">ID: {target.id}</p>
    {target.avatarUrl && <img src={mediaUrl(target.avatarUrl)} referrerPolicy="no-referrer" alt="Ảnh đại diện người dùng" className="h-16 w-16 rounded-full" />}
    <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
      {['name', 'email', 'username'].map((field) => <label key={field} className="text-sm">{({ name: 'Họ tên', email: 'Email', username: 'Username' })[field]}
        <input required type={field === 'email' ? 'email' : 'text'} maxLength={field === 'username' ? 32 : 100} value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} className="mt-1 block w-full rounded-card border border-line p-2" />
      </label>)}
      <label className="text-sm">Hạn mức (MB)<input type="number" required min="0" max="1073741824" step="1" value={form.quotaMB} onChange={(e) => setForm({ ...form, quotaMB: e.target.value })} className="mt-1 block w-full rounded-card border border-line p-2" /></label>
      <label className="text-sm">Vai trò<select value={form.role} disabled={target.id === actor.id} onChange={(e) => setForm({ ...form, role: e.target.value })} className="mt-1 block w-full rounded-card border border-line p-2"><option value="user">Người dùng</option><option value="admin">Quản trị viên</option></select></label>
      <label className="text-sm">Trạng thái<select value={form.status} disabled={target.id === actor.id} onChange={(e) => setForm({ ...form, status: e.target.value })} className="mt-1 block w-full rounded-card border border-line p-2"><option value="active">Hoạt động</option><option value="disabled">Khóa</option></select></label>
      <label className="text-sm sm:col-span-2">Giới thiệu<textarea maxLength={500} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="mt-1 block w-full rounded-card border border-line p-2" /></label>
      <p className="text-xs text-slate sm:col-span-2">Đặt 0 MB để thu hồi quyền lưu trữ. Giảm hạn mức không xóa dữ liệu; tệp trong Thùng rác vẫn chiếm dung lượng.</p>
      <Button type="submit" loading={update.isPending}>Lưu thay đổi</Button>
    </form>
    <h3 className="font-semibold">Tệp của người dùng</h3>
    {files.isLoading && <p>Đang tải tệp...</p>}
    {files.isError && <p role="alert" className="text-brick">Không thể tải danh sách tệp.</p>}
    {files.data?.items.length === 0 && <p className="text-sm text-slate">Chưa có tệp.</p>}
    {files.data?.items.map((item) => <div key={item._id} className="flex flex-wrap items-center gap-2 border-b border-line py-2 text-sm">
      <span className="min-w-0 grow break-all">{item.title} · {formatBytes(item.fileMeta?.size)} {item.isTrashed && '· Thùng rác'}</span>
      <a className="text-gold-deep underline" href={mediaUrl(`/api/admin/users/${target.id}/files/${item._id}/download`)} rel="noreferrer">Tải xuống</a>
      <Button size="sm" disabled={fileMutation.isPending} onClick={() => changeFile(item)}>{item.isTrashed ? 'Khôi phục' : 'Vào Thùng rác'}</Button>
      {item.isTrashed && <Button size="sm" variant="danger" disabled={fileMutation.isPending} onClick={() => changeFile(item, true)}>Xóa vĩnh viễn</Button>}
    </div>)}
    <Pager page={page} setPage={setPage} total={files.data?.total} />
    <h3 className="font-semibold">Lịch sử quản trị</h3>
    {audit.isError && <p role="alert">Không thể tải lịch sử.</p>}
    {audit.data?.events.map((event) => <details key={event._id} className="text-xs">
      <summary>{new Date(event.createdAt).toLocaleString()} · {event.actor?.name || 'Quản trị viên'} · {event.action}</summary>
      <pre className="overflow-auto whitespace-pre-wrap">{JSON.stringify(event.changes, null, 2)}</pre>
    </details>)}
    <Pager page={auditPage} setPage={setAuditPage} total={audit.data?.total} />
  </section>;
}

export default function AdminUsers() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(null);
  const users = useUsers(page, q, user?.role === 'admin');
  if (user?.role !== 'admin') return <Navigate to="/app" replace />;
  return <div className="flex flex-col gap-5">
    <h1 className="font-display text-2xl font-semibold">Quản trị người dùng</h1>
    <input aria-label="Tìm người dùng" placeholder="Tìm tên, email hoặc username" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className="rounded-card border border-line p-3" />
    {users.isLoading && <p>Đang tải...</p>}
    {users.isError && <p role="alert" className="text-brick">Không thể truy cập quản trị. Kiểm tra quyền hoặc đăng nhập lại.</p>}
    <div className="grid gap-3 md:grid-cols-2">
      {users.data?.users.map((row) => <button key={row.id} onClick={() => setSelected(row)} className="catalog-card p-4 text-left">
        <p className="font-semibold">{row.name} · {row.role}</p>
        <p className="break-all text-sm">{row.email} · {row.status === 'active' ? 'Hoạt động' : 'Đã khóa'}</p>
        <p className="mt-2 text-xs text-slate">{formatBytes(row.usedStorageBytes)} / {formatBytes(row.storageLimitBytes)}</p>
      </button>)}
    </div>
    <Pager page={page} setPage={setPage} total={users.data?.total} />
    {selected && <UserEditor key={selected.id} target={selected} onClose={() => setSelected(null)} onSaved={(updated) => setSelected({ ...selected, ...updated })} />}
  </div>;
}
