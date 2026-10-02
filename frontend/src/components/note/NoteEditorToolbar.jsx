import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Bold, Italic, Heading2, List, ListOrdered, CheckSquare, Code, Link2, Image as ImageIcon, Loader2 } from 'lucide-react';
import IconButton from '../common/IconButton';
import { markdownActions } from '../../utils/markdownEditor';
import { itemApi } from '../../api/item.api';
import { mediaUrl } from '../../utils/mediaUrl';
import { useToast } from '../../context/ToastContext';
import { useDashboardStats } from '../../hooks/useDashboard';
import { getUploadIssue } from '../../utils/uploadCapacity';

const BUTTONS = [
  { key: 'bold', icon: Bold, label: 'In đậm' },
  { key: 'italic', icon: Italic, label: 'In nghiêng' },
  { key: 'heading', icon: Heading2, label: 'Tiêu đề' },
  { key: 'bulletList', icon: List, label: 'Danh sách' },
  { key: 'numberedList', icon: ListOrdered, label: 'Danh sách số' },
  { key: 'checklist', icon: CheckSquare, label: 'Việc cần làm' },
  { key: 'code', icon: Code, label: 'Mã code' },
  { key: 'link', icon: Link2, label: 'Liên kết' },
];

export default function NoteEditorToolbar({ textareaRef, value, onChange, folderId }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const { data: stats, refetch } = useDashboardStats();
  const storageFull = stats && stats.usedStorageBytes >= stats.storageLimitBytes;

  const runAction = (key) => {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart, selectionEnd } = el;
    const result = markdownActions[key](value, selectionStart, selectionEnd);
    onChange(result.value);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(result.start, result.end);
    });
  };

  const handleFileChosen = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploading(true);
    try {
      const capacity = await refetch();
      if (capacity.error || !capacity.data) {
        addToast('Không thể kiểm tra dung lượng lưu trữ. Vui lòng thử lại.', 'error');
        return;
      }
      const issue = getUploadIssue([file], capacity.data);
      if (issue) {
        addToast(issue, 'error');
        return;
      }
      const formData = new FormData();
      formData.append('files', file);
      if (folderId) formData.append('folder', folderId);
      const [created] = await itemApi.upload(formData);
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });

      const el = textareaRef.current;
      const isImage = created.fileMeta?.category === 'image';
      const url = mediaUrl(isImage ? created.urls.thumbnail || created.urls.stream : created.urls.download);
      const markdown = isImage ? `![${created.title}](${url})` : `[${created.title}](${url})`;

      const { selectionStart, selectionEnd } = el;
      const result = markdownActions.insertAtCursor(value, selectionStart, selectionEnd, markdown);
      onChange(result.value);
    } catch (err) {
      addToast(err?.response?.status === 413
        ? 'Không đủ dung lượng lưu trữ hoặc tệp vượt giới hạn.'
        : err?.response?.data?.message || 'Không thể tải tệp lên', 'error');
      refetch();
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-line bg-paper-dim px-2 py-1.5">
      {BUTTONS.map((btn) => (
        <IconButton key={btn.key} icon={btn.icon} label={btn.label} onClick={() => runAction(btn.key)} />
      ))}
      <div className="mx-1 h-4 w-px bg-line" />
      <IconButton
        icon={uploading ? Loader2 : ImageIcon}
        label={storageFull ? 'Bộ lưu trữ đã đầy' : 'Chèn ảnh/tệp'}
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading || storageFull}
        className={uploading ? 'animate-spin' : ''}
      />
      <input ref={fileInputRef} type="file" hidden disabled={uploading || storageFull} onChange={handleFileChosen} />
    </div>
  );
}
