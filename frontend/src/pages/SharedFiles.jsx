import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useItem } from '../hooks/useItems';
import { useFriends, useGroups, useReceivedShares, useOutgoingShares, useItemShares, useCollaborationAction } from '../hooks/useCollaboration';
import { shareApi } from '../api/collaboration.api';
import { mediaUrl } from '../utils/mediaUrl';
import { formatBytes } from '../utils/format';
import Button from '../components/common/Button';

function ShareForm({ itemId, source, sourcePassword, onDone }) {
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
      addToast('Chọn 1–20 người hoặc một nhóm', 'error'); return;
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
        addToast(`Không thể chia sẻ cho ${targetId}: ${error.response?.data?.message || 'lỗi mạng'}`, 'error');
      }
    }
    setPending(false);
    if (done) { addToast(`Đã chia sẻ cho ${done} đích`, 'success'); setTargets(''); onDone?.(); }
  };
  return <form onSubmit={submit} className="catalog-card flex flex-col gap-3 p-4">
    <h3 className="font-semibold">{source ? 'Chia sẻ tiếp theo quyền được cấp' : 'Chia sẻ tệp của tôi'}</h3>
    <label className="text-sm">Chia sẻ cho
      <select value={kind} onChange={(e) => { setKind(e.target.value); setTargets(''); }} className="ml-2 rounded-card border border-line p-2">
        <option value="user">Người dùng / bạn bè</option><option value="group">Nhóm</option>
      </select>
    </label>
    <input aria-label={kind === 'user' ? 'ID người dùng, cách nhau dấu phẩy' : 'ID nhóm'} value={targets}
      onChange={(e) => setTargets(e.target.value)} placeholder={kind === 'user' ? 'ID người dùng, nhiều ID cách nhau dấu phẩy' : 'ID nhóm'}
      className="rounded-card border border-line p-2" required />
    {kind === 'user' && <select aria-label="Chọn bạn bè" value="" onChange={(e) => setTargets((previous) => [previous, e.target.value].filter(Boolean).join(', '))} className="rounded-card border border-line p-2">
      <option value="">Chọn từ danh sách bạn bè</option>{friends.data?.friends.map((friend) => <option key={friend.id} value={friend.id}>{friend.name} · @{friend.username}</option>)}
    </select>}
    {kind === 'group' && <select aria-label="Chọn nhóm" value="" onChange={(e) => setTargets(e.target.value)} className="rounded-card border border-line p-2">
      <option value="">Chọn nhóm đã tham gia</option>{groups.data?.groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
    </select>}
    <div className="flex flex-wrap gap-4 text-sm">
      {['canView', 'canDownload', 'canReshare'].map((key) =>
        <label key={key} className="flex items-center gap-1"><input type="checkbox" checked={rights[key]}
          disabled={Boolean(source && !source[key])}
          onChange={(e) => setRights({ ...rights, [key]: e.target.checked })} />
          {({ canView: 'Được xem', canDownload: 'Được tải', canReshare: 'Được chia sẻ tiếp' })[key]}
        </label>)}
    </div>
    {!source && <label className="text-sm">Mật khẩu tùy chọn (ít nhất 6 ký tự)
      <input type="password" minLength={6} maxLength={128} autoComplete="new-password" value={password}
        onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full rounded-card border border-line p-2" />
    </label>}
    <label className="text-sm">Hết hạn tùy chọn
      <input type="datetime-local" value={expires} onChange={(e) => setExpires(e.target.value)}
        className="mt-1 block w-full rounded-card border border-line p-2" />
    </label>
    <Button type="submit" disabled={pending}>{pending ? 'Đang chia sẻ...' : 'Tạo share'}</Button>
  </form>;
}
function ReceiverCard({ share, proof, onUnlock, onReshare }) {
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const { addToast } = useToast();
  const media = (kind) => mediaUrl(`/api/shares/${share.id}/${kind}${proof?.token ? `?unlock=${encodeURIComponent(proof.token)}` : ''}`);
  const unlock = async (event) => {
    event.preventDefault();
    try {
      const result = await shareApi.unlock(share.id, password);
      onUnlock(share.id, { token: result.unlockToken, password });
      addToast('Đã mở khóa share', 'success');
    } catch (error) { addToast(error.response?.data?.message || 'Mật khẩu không đúng', 'error'); }
  };
  const ready = !share.passwordProtected || Boolean(proof);
  const category = share.item?.category;
  return <div className="catalog-card flex flex-col gap-3 p-4">
    <div><p className="font-semibold">{share.item?.title || 'Tệp không còn tồn tại'}</p>
      <p className="text-xs text-slate">{formatBytes(share.item?.size)} · {share.owner?.name} · {share.targetType === 'group' ? 'Qua nhóm' : 'Chia sẻ trực tiếp'}</p>
      {share.expiresAt && <p className="text-xs text-slate">Hết hạn: {new Date(share.expiresAt).toLocaleString()}</p>}
    </div>
    {!ready && <form className="flex gap-2" onSubmit={unlock}>
      <input aria-label="Mật khẩu tệp được chia sẻ" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mật khẩu share" className="min-w-0 grow rounded-card border border-line p-2" />
      <Button type="submit" size="sm">Mở khóa</Button>
    </form>}
    {ready && <div className="flex flex-wrap gap-2">
      {share.canView && ['image', 'video', 'pdf'].includes(category) && <Button size="sm" variant="secondary" onClick={() => setShow(!show)}>{show ? 'Ẩn xem trước' : 'Xem trước'}</Button>}
      {share.canDownload && <Button as="a" size="sm" variant="secondary" href={media('download')}>Tải xuống</Button>}
      {share.canReshare && <Button size="sm" variant="secondary" onClick={() => onReshare(share, proof?.password)}>Chia sẻ tiếp</Button>}
    </div>}
    {ready && show && share.canView && category === 'image' && <img src={media('view')} alt={share.item?.title} className="max-h-96 object-contain" />}
    {ready && show && share.canView && category === 'video' && <video src={media('view')} controls className="max-h-96" />}
    {ready && show && share.canView && category === 'pdf' && <iframe src={media('view')} title={share.item?.title} className="h-[60vh] w-full" />}
  </div>;
}
export default function SharedFiles() {
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
    if (window.confirm(`Thu hồi share "${share.item?.title}" và các share tạo từ nó?`)) {
      mutation.mutate(['revoke', share.id], { onError: (e) => addToast(e.response?.data?.message || 'Không thể thu hồi', 'error') });
    }
  };
  const edit = (share) => { setEditing(share.id); setNewPassword(''); setRemovePassword(false); setRights({ canView: share.canView, canDownload: share.canDownload, canReshare: share.canReshare, expiresAt: share.expiresAt?.slice(0, 16) || '' }); };
  const save = () => {
    const body = { canView: rights.canView, canDownload: rights.canDownload, canReshare: rights.canReshare,
      expiresAt: rights.expiresAt ? new Date(rights.expiresAt).toISOString() : null };
    if (removePassword) body.password = null;
    else if (newPassword) body.password = newPassword;
    mutation.mutate(['update', editing, body], {
      onSuccess: () => { addToast('Đã đổi quyền', 'success'); setEditing(null); },
      onError: (e) => addToast(e.response?.data?.message || 'Không thể đổi quyền', 'error'),
    });
  };
  return <div className="flex flex-col gap-6">
    <h1 className="font-display text-2xl font-semibold">Tệp được chia sẻ</h1>
    {itemId && item.data?.type === 'file' && <section>
      <h2 className="mb-2 font-semibold">Chia sẻ: {item.data.title}</h2>
      <ShareForm itemId={itemId} onDone={() => itemShares.refetch()} />
      <p className="mt-2 text-sm text-slate">Đã có {itemShares.data?.shares.length || 0} share cho tệp này.</p>
    </section>}
    {itemId && item.isError && <p role="alert" className="text-brick">Không tìm thấy tệp của bạn.</p>}
    {reshare && user?.storageLimitBytes > 0 && <section>
      <ShareForm key={reshare.share.id} itemId={reshare.share.itemId} source={reshare.share} sourcePassword={reshare.password}
        onDone={() => { setReshare(null); outgoing.refetch(); }} />
      <Button variant="ghost" onClick={() => setReshare(null)}>Đóng</Button>
    </section>}
    <section><h2 className="mb-3 font-semibold">Được chia sẻ với tôi</h2>
      {received.isError && <p role="alert" className="text-brick">Không thể tải danh sách được chia sẻ.</p>}
      {received.data?.shares.length === 0 && <p className="text-sm text-slate">Chưa có tệp được chia sẻ.</p>}
      <div className="grid gap-3 md:grid-cols-2">{received.data?.shares.map((share) => <ReceiverCard key={share.id} share={share} proof={proofs[share.id]}
        onUnlock={(id, proof) => setProofs({ ...proofs, [id]: proof })}
        onReshare={(row, password) => setReshare({ share: row, password })} />)}</div>
      {received.data?.nextCursor && <Button variant="secondary" className="mt-3" onClick={() => setCursor(received.data.nextCursor)}>Tải thêm</Button>}
      {cursor && <Button variant="ghost" className="mt-3" onClick={() => setCursor(null)}>Về đầu</Button>}
    </section>
    <section><h2 className="mb-3 font-semibold">Tôi đã chia sẻ</h2>
      {outgoing.isError && <p role="alert" className="text-brick">Không thể tải share của bạn.</p>}
      {outgoing.data?.shares.length === 0 && <p className="text-sm text-slate">Chưa chia sẻ tệp nào.</p>}
      {outgoing.data?.shares.map((share) => <div key={share.id} className="catalog-card mb-2 flex flex-col gap-2 p-3 text-sm">
        <p className="font-medium">{share.item?.title || 'Tệp đã xóa'} · {share.targetType === 'group' ? 'Nhóm' : 'Người dùng'} {share.targetId}</p>
        <p className="text-xs text-slate">Xem {share.canView ? 'có' : 'không'} · Tải {share.canDownload ? 'có' : 'không'} · Chia sẻ tiếp {share.canReshare ? 'có' : 'không'} · Mật khẩu {share.passwordProtected ? 'có' : 'không'}</p>
        <div className="flex gap-2"><Button size="sm" variant="secondary" onClick={() => edit(share)}>Đổi quyền</Button><Button size="sm" variant="danger" onClick={() => revoke(share)}>Thu hồi</Button></div>
        {editing === share.id && <div className="flex flex-col gap-2 border-t border-line pt-2">
          {['canView', 'canDownload', 'canReshare'].map((key) => <label key={key} className="text-sm"><input type="checkbox" checked={rights[key]} onChange={(e) => setRights({ ...rights, [key]: e.target.checked })} /> {({ canView: 'Cho xem', canDownload: 'Cho tải', canReshare: 'Cho chia sẻ tiếp' })[key]}</label>)}
          <label className="text-sm">Hết hạn<input type="datetime-local" value={rights.expiresAt} onChange={(e) => setRights({ ...rights, expiresAt: e.target.value })} className="ml-2 rounded-card border border-line p-1" /></label>
          {!share.parentShare && <><label className="text-sm">Mật khẩu mới (để trống nếu giữ nguyên)<input type="password" minLength={6} maxLength={128} value={newPassword} disabled={removePassword} onChange={(e) => setNewPassword(e.target.value)} className="ml-2 rounded-card border border-line p-1" /></label>
            <label className="text-sm"><input type="checkbox" checked={removePassword} onChange={(e) => setRemovePassword(e.target.checked)} /> Bỏ mật khẩu</label></>}
          <Button size="sm" onClick={save}>Lưu quyền</Button>
        </div>}
      </div>)}
    </section>
  </div>;
}
