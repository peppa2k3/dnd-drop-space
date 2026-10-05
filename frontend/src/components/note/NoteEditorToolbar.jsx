import { apiErrorMessage } from '../../utils/apiErrorMessage';
import i18n from '../../i18n/config';
import { useTranslation } from 'react-i18next';
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
  { key: 'bold', icon: Bold, labelKey: 'files:formatBold' },
  { key: 'italic', icon: Italic, labelKey: 'files:formatItalic' },
  { key: 'heading', icon: Heading2, labelKey: 'files:formatHeading' },
  { key: 'bulletList', icon: List, labelKey: 'files:formatBulletList' },
  { key: 'numberedList', icon: ListOrdered, labelKey: 'files:formatNumberedList' },
  { key: 'checklist', icon: CheckSquare, labelKey: 'files:formatChecklist' },
  { key: 'code', icon: Code, labelKey: 'files:formatCode' },
  { key: 'link', icon: Link2, labelKey: 'files:formatLink' },
];

export default function NoteEditorToolbar({ textareaRef, value, onChange, folderId }) {
  useTranslation();
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
        addToast(i18n.t('common:unableToCheckStorageCapacityPleaseTryAgain'), 'error');
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
        ? i18n.t('files:notEnoughStorageSpaceOrFilesExceedTheLimit')
        : apiErrorMessage(err, i18n.t('files:unableToUploadFile')), 'error');
      refetch();
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-background-secondary px-2 py-1.5">
      {BUTTONS.map((btn) => (
        <IconButton key={btn.key} icon={btn.icon} label={i18n.t(btn.labelKey)} onClick={() => runAction(btn.key)} />
      ))}
      <div className="mx-1 h-4 w-px bg-border" />
      <IconButton
        icon={uploading ? Loader2 : ImageIcon}
        label={storageFull ? i18n.t('files:storageIsFull') : i18n.t('files:insertImageFile')}
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading || storageFull}
        className={uploading ? 'animate-spin' : ''}
      />
      <input ref={fileInputRef} type="file" hidden disabled={uploading || storageFull} onChange={handleFileChosen} />
    </div>
  );
}
