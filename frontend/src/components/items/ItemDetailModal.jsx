import i18n from '../../i18n/config';
import { useTranslation } from 'react-i18next';
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
  useTranslation();
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
        <div className="overflow-hidden rounded-card border border-border bg-background-secondary">
          {thumb ? (
            <img src={thumb} alt="" className="max-h-72 w-full object-cover" />
          ) : (
            <div className="flex h-40 items-center justify-center text-text-muted">
              <ExternalLink size={32} strokeWidth={1.5} />
            </div>
          )}
          <div className="flex items-center justify-between gap-3 p-3">
            <div className="min-w-0">
              <p className="truncate font-mono text-xs text-text-secondary">{item.urlMeta?.siteName || item.urlMeta?.url}</p>
              <p className="truncate text-sm text-text-primary">{item.urlMeta?.url}</p>
            </div>
            <Button as="a" href={item.urlMeta?.url} target="_blank" rel="noreferrer" variant="secondary" size="sm">
              {i18n.t('files:openTheLink')} <ExternalLink size={13} className="ml-1" />
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
          className="max-h-[60vh] w-full rounded-card border border-border object-contain bg-background-secondary"
        />
      );
    }

    if (item.type === 'file' && category === 'video') {
      return (
        // Uploaded videos may not have a separate caption track.
        <video controls className="max-h-[60vh] w-full rounded-card border border-border bg-background" src={mediaUrl(item.urls.stream)} />
      );
    }

    if (item.type === 'file' && category === 'pdf') {
      return <iframe title={item.title} src={mediaUrl(item.urls.stream)} className="h-[65vh] w-full rounded-card border border-border" />;
    }

    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-border bg-background-secondary py-14">
        <FileIcon size={40} className="text-text-muted" strokeWidth={1.5} />
        <div className="text-center">
          <p className="text-sm font-medium text-text-primary">{item.fileMeta?.originalName}</p>
          <p className="font-mono text-xs text-text-muted">{formatBytes(item.fileMeta?.size)}</p>
        </div>
        {item.type === 'file' && (
          <Button as="a" href={mediaUrl(item.urls.download)} variant="secondary" size="sm">
            <Download size={14} className="mr-1.5" /> {i18n.t('common:download')}
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
            {i18n.t('common:close')}
          </Button>
          {hasChanges && (
            <Button onClick={handleSave} loading={saving}>
              {i18n.t('common:saveChanges')}
            </Button>
          )}
        </>
      }
    >
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-text-muted">
          <Icon size={13} /> {label}
        </div>
        <div className="flex items-center gap-1">
          {item.type === 'file' && !item.isTrashed && <Button size="sm" variant="secondary" onClick={() => { onClose(); navigate(`/app/shared?itemId=${item._id}`); }}>{i18n.t('files:share')}</Button>}
          <IconButton
            icon={Star}
            label={i18n.t('common:favorite')}
            variant={item.favorite ? 'accent' : 'default'}
            onClick={() => onToggleFavorite(item._id)}
          />
          <IconButton icon={Trash2} label={i18n.t('files:moveToTrash')} variant="danger" onClick={() => onDelete(item._id)} />
          <IconButton icon={X} label={i18n.t('common:close')} onClick={onClose} />
        </div>
      </div>

      <div className="flex flex-col gap-4 pt-4">
        {renderPreview()}

        <Input label={i18n.t('files:title')} value={title} onChange={(e) => setTitle(e.target.value)} />
        <Textarea label={i18n.t('common:description')} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder={i18n.t('files:addDescriptionPlaceholder')} />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-primary">{i18n.t('common:tags')}</label>
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
                placeholder={i18n.t('common:addTagsPlaceholder')}
                className="w-24 rounded-card border border-border bg-surface px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
              <IconButton icon={Plus} label={i18n.t('files:addTag')} onClick={addTag} />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
