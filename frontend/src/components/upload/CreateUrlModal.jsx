import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import Textarea from '../common/Textarea';
import TagChip from '../common/TagChip';
import { urlSchema } from '../../schemas/item.schema';
import { useCreateUrl } from '../../hooks/useItems';
import { useFolders } from '../../hooks/useFolders';
import { useToast } from '../../context/ToastContext';
import { buildFolderTree, flattenForSelect } from '../../utils/folderTree';

export default function CreateUrlModal({ open, onClose, defaultFolder = null }) {
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(urlSchema), defaultValues: { url: '', title: '', description: '', folder: defaultFolder || '' } });

  const { data: folders = [] } = useFolders();
  const folderOptions = flattenForSelect(buildFolderTree(folders));
  const createUrl = useCreateUrl();
  const { addToast } = useToast();

  const handleClose = () => {
    if (createUrl.isPending) return;
    reset();
    setTags([]);
    setTagInput('');
    onClose();
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput('');
  };

  const onSubmit = (values) => {
    createUrl.mutate(
      { ...values, folder: values.folder || null, tags },
      {
        onSuccess: () => {
          addToast('Đã lưu liên kết');
          handleClose();
        },
        onError: (err) => addToast(err?.response?.data?.message || 'Lưu liên kết thất bại', 'error'),
      }
    );
  };

  return (
    <Modal open={open} onClose={handleClose} title="Lưu liên kết (URL)" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="Đường dẫn (URL)" placeholder="https://..." autoFocus {...register('url')} error={errors.url?.message} />
        <Input label="Tiêu đề (tùy chọn)" placeholder="Để trống để tự lấy từ trang web" {...register('title')} error={errors.title?.message} />
        <Textarea label="Mô tả (tùy chọn)" rows={2} {...register('description')} error={errors.description?.message} />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink">Thư mục</label>
          <select {...register('folder')} className="w-full rounded-card border border-line bg-paper-card px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold">
            <option value="">— Không có thư mục (gốc) —</option>
            {folderOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink">Thẻ</label>
          <div className="flex flex-wrap items-center gap-1.5 rounded-card border border-line bg-paper-card px-2.5 py-2">
            {tags.map((t) => (
              <TagChip key={t} name={t} onRemove={() => setTags(tags.filter((x) => x !== t))} />
            ))}
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
              className="min-w-[80px] grow bg-transparent text-xs focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Hủy
          </Button>
          <Button type="submit" loading={createUrl.isPending}>
            Lưu liên kết
          </Button>
        </div>
      </form>
    </Modal>
  );
}
