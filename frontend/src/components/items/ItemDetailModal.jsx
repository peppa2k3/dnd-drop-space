import { useEffect, useState } from 'react';
import { X, Star, Download, Trash2, ExternalLink, Plus, File as FileIcon } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import Textarea from '../common/Textarea';
import TagChip from '../common/TagChip';
import IconButton from '../common/IconButton';
import { getItemVisual } from '../../utils/itemVisual';
import { formatBytes } from '../../utils/format';
import { mediaUrl } from '../../utils/mediaUrl';
import { useNavigate } from 'react-router-dom';

const PREVIEWABLE = ['image', 'video', 'pdf'];

export default function ItemDetailModal({ item, onClose, onUpdate, onToggleFavorite, onDelete, saving }) {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (item) {
      setTitle(item.title || '');
      setDescription(item.description || '');
      setTags((item.tags || []).map((t) => t.name));
      setTagInput('');
    }
  }, [item]);

  if (!item) return null;

  const { Icon, label } = getItemVisual(item);
  const category = item.fileMeta?.category;

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput('');
  };

  const hasChanges =
    title !== item.title || description !== (item.description || '') || JSON.stringify(tags) !== JSON.stringify((item.tags || []).map((t) => t.name));

  const handleSave = () => {
    onUpdate(item._id, { title, description, tags });
  };

  const renderPreview = () => {
    if (item.type === 'url') {
      const thumb = item.urls?.thumbnail ? mediaUrl(item.urls.thumbnail) : null;
      return (
        <div className="overflow-hidden rounded-card border border-line bg-paper-dim">
          {thumb ? (
            <img src={thumb} alt="" className="max-h-72 w-full object-cover" />
          ) : (
            <div className="flex h-40 items-center justify-center text-slate-light">
              <ExternalLink size={32} strokeWidth={1.5} />
            </div>
          )}
          <div className="flex items-center justify-between gap-3 p-3">
            <div className="min-w-0">
              <p className="truncate font-mono text-xs text-slate">{item.urlMeta?.siteName || item.urlMeta?.url}</p>
              <p className="truncate text-sm text-ink">{item.urlMeta?.url}</p>
            </div>
            <Button as="a" href={item.urlMeta?.url} target="_blank" rel="noreferrer" variant="secondary" size="sm">
              Mở liên kết <ExternalLink size={13} className="ml-1" />
            </Button>
          </div>
        </div>
      );
    }

    if (item.type === 'file' && category === 'image') {
      return (
        <img
          src={mediaUrl(item.urls.stream || item.urls.thumbnail)}
          alt={item.title}
          className="max-h-[60vh] w-full rounded-card border border-line object-contain bg-paper-dim"
        />
      );
    }

    if (item.type === 'file' && category === 'video') {
      return (
        // Uploaded videos may not have a separate caption track.
        <video controls className="max-h-[60vh] w-full rounded-card border border-line bg-black" src={mediaUrl(item.urls.stream)} />
      );
    }

    if (item.type === 'file' && category === 'pdf') {
      return <iframe title={item.title} src={mediaUrl(item.urls.stream)} className="h-[65vh] w-full rounded-card border border-line" />;
    }

    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-line bg-paper-dim py-14">
        <FileIcon size={40} className="text-slate-light" strokeWidth={1.5} />
        <div className="text-center">
          <p className="text-sm font-medium text-ink">{item.fileMeta?.originalName}</p>
          <p className="font-mono text-xs text-slate-light">{formatBytes(item.fileMeta?.size)}</p>
        </div>
        {item.type === 'file' && (
          <Button as="a" href={mediaUrl(item.urls.download)} variant="secondary" size="sm">
            <Download size={14} className="mr-1.5" /> Tải xuống
          </Button>
        )}
      </div>
    );
  };

  return (
    <Modal
      open={Boolean(item)}
      onClose={onClose}
      size={PREVIEWABLE.includes(category) || item.type === 'url' ? 'xl' : 'md'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Đóng
          </Button>
          {hasChanges && (
            <Button onClick={handleSave} loading={saving}>
              Lưu thay đổi
            </Button>
          )}
        </>
      }
    >
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-slate-light">
          <Icon size={13} /> {label}
        </div>
        <div className="flex items-center gap-1">
          {item.type === 'file' && !item.isTrashed && <Button size="sm" variant="secondary" onClick={() => { onClose(); navigate(`/app/shared?itemId=${item._id}`); }}>Chia sẻ</Button>}
          <IconButton
            icon={Star}
            label="Yêu thích"
            variant={item.favorite ? 'gold' : 'default'}
            onClick={() => onToggleFavorite(item._id)}
          />
          <IconButton icon={Trash2} label="Chuyển vào Thùng rác" variant="danger" onClick={() => onDelete(item._id)} />
          <IconButton icon={X} label="Đóng" onClick={onClose} />
        </div>
      </div>

      <div className="flex flex-col gap-4 pt-4">
        {renderPreview()}

        <Input label="Tiêu đề" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Textarea label="Mô tả" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Thêm mô tả..." />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink">Thẻ</label>
          <div className="flex flex-wrap items-center gap-1.5">
            {tags.map((t) => (
              <TagChip key={t} name={t} onRemove={() => setTags(tags.filter((x) => x !== t))} size="md" />
            ))}
            <div className="flex items-center gap-1">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Thêm thẻ..."
                className="w-24 rounded-card border border-line bg-paper-card px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold"
              />
              <IconButton icon={Plus} label="Thêm thẻ" onClick={addTag} />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
