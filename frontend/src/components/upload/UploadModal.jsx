import { useEffect, useState } from 'react';
import { X, File as FileIcon, CheckCircle2 } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Textarea from '../common/Textarea';
import TagChip from '../common/TagChip';
import IconButton from '../common/IconButton';
import UploadDropzone from './UploadDropzone';
import { useFolders } from '../../hooks/useFolders';
import { useUploadFiles } from '../../hooks/useItems';
import { useDashboardStats } from '../../hooks/useDashboard';
import { useToast } from '../../context/ToastContext';
import { buildFolderTree, flattenForSelect } from '../../utils/folderTree';
import { formatBytes } from '../../utils/format';
import { getUploadIssue } from '../../utils/uploadCapacity';

export default function UploadModal({ open, onClose, defaultFolder = null }) {
  const [files, setFiles] = useState([]); // { file, progress, done }
  const [folder, setFolder] = useState(defaultFolder || '');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [checkingCapacity, setCheckingCapacity] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const { data: folders = [] } = useFolders();
  const folderOptions = flattenForSelect(buildFolderTree(folders));
  const uploadMutation = useUploadFiles();
  const { data: stats, refetch, isFetching, isError } = useDashboardStats();
  const { addToast } = useToast();
  const selectedFiles = files.map(({ file }) => file);
  const capacityIssue = stats ? getUploadIssue(selectedFiles, stats) : null;
  const capacityUnavailable = !stats || isError;
  const uploadDisabled = files.length === 0 || capacityUnavailable || Boolean(capacityIssue) ||
    isFetching || checkingCapacity || uploadMutation.isPending;

  useEffect(() => {
    if (open) refetch();
  }, [open, refetch]);

  const reset = () => {
    setFiles([]);
    setDescription('');
    setTags([]);
    setTagInput('');
    setUploadError('');
  };

  const handleClose = () => {
    if (uploadMutation.isPending || checkingCapacity) return;
    reset();
    onClose();
  };

  const addFiles = (newFiles) => {
    setUploadError('');
    const issue = stats && getUploadIssue([...selectedFiles, ...newFiles], stats);
    if (issue) addToast(issue, 'error');
    setFiles((prev) => [...prev, ...newFiles.map((file) => ({ file, progress: 0 }))]);
  };

  const removeFile = (index) => {
    setUploadError('');
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput('');
  };

  const handleUpload = async () => {
    if (files.length === 0 || uploadDisabled) return;

    setCheckingCapacity(true);
    try {
      const result = await refetch();
      if (result.error || !result.data) throw result.error || new Error('Unavailable');
      const issue = getUploadIssue(selectedFiles, result.data);
      if (issue) {
        setUploadError(issue);
        addToast(issue, 'error');
        return;
      }
      setUploadError('');
    } catch {
      const message = 'Không thể kiểm tra dung lượng lưu trữ. Vui lòng thử lại.';
      setUploadError(message);
      addToast(message, 'error');
      return;
    } finally {
      setCheckingCapacity(false);
    }

    const formData = new FormData();
    files.forEach(({ file }) => formData.append('files', file));
    if (folder) formData.append('folder', folder);
    if (description) formData.append('description', description);
    tags.forEach((t) => formData.append('tags', t));

    uploadMutation.mutate(
      {
        formData,
        onUploadProgress: (evt) => {
          const percent = Math.round((evt.loaded * 100) / (evt.total || 1));
          setFiles((prev) => prev.map((f) => ({ ...f, progress: percent })));
        },
      },
      {
        onSuccess: (items) => {
          addToast(`Đã tải lên ${items.length} tệp`, 'success');
          reset();
          onClose();
        },
        onError: (err) => {
          const message = err?.response?.status === 413
            ? 'Không đủ dung lượng lưu trữ hoặc tệp vượt giới hạn. Hãy kiểm tra lại các tệp đã chọn.'
            : err?.response?.data?.message || 'Tải lên thất bại';
          setUploadError(message);
          addToast(message, 'error');
          refetch();
        },
      }
    );
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Tải tệp lên"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={uploadMutation.isPending || checkingCapacity}>
            Hủy
          </Button>
          <Button onClick={handleUpload} loading={uploadMutation.isPending || checkingCapacity} disabled={uploadDisabled}>
            Tải lên {files.length > 0 && `(${files.length})`}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <UploadDropzone onFilesSelected={addFiles} disabled={uploadMutation.isPending || checkingCapacity ||
          (stats && stats.usedStorageBytes >= stats.storageLimitBytes)} />
        <p className="text-xs text-text-muted" aria-live="polite">
          {stats ? `${formatBytes(stats.usedStorageBytes)} / ${formatBytes(stats.storageLimitBytes)} đã dùng; còn ${formatBytes(Math.max(0, stats.storageLimitBytes - stats.usedStorageBytes))}` : 'Đang kiểm tra dung lượng...'}
        </p>
        {(capacityIssue || uploadError || isError) && (
          <p role="alert" className="rounded-card bg-danger/10 px-3 py-2 text-sm text-danger">
            {isError ? 'Không thể kiểm tra dung lượng lưu trữ. Vui lòng thử lại.' : capacityIssue || uploadError}
          </p>
        )}

        {files.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {files.map((f, i) => (
              <div key={`${f.file.name}-${i}`} className="flex items-center gap-2.5 rounded-card border border-border bg-background-secondary px-3 py-2">
                <FileIcon size={15} className="shrink-0 text-text-muted" />
                <div className="min-w-0 grow">
                  <p className="truncate text-sm text-text-primary">{f.file.name}</p>
                  <div className="flex items-center gap-2">
                    <div className="h-1 grow overflow-hidden rounded-full bg-border">
                      <div
                        className="h-full bg-primary transition-all duration-200"
                        style={{ width: `${uploadMutation.isPending ? f.progress : 0}%` }}
                      />
                    </div>
                    <span className="shrink-0 font-mono text-[10px] text-text-muted">{formatBytes(f.file.size)}</span>
                  </div>
                </div>
                {uploadMutation.isPending && f.progress >= 100 ? (
                  <CheckCircle2 size={15} className="shrink-0 text-primary-hover" />
                ) : (
                  !uploadMutation.isPending && (
                    <IconButton icon={X} label="Bỏ tệp" onClick={() => removeFile(i)} />
                  )
                )}
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Thư mục</label>
            <select
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              className="w-full rounded-card border border-border bg-surface px-3.5 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            >
              <option value="">— Không có thư mục (gốc) —</option>
              {folderOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Thẻ</label>
            <div className="flex flex-wrap items-center gap-1.5 rounded-card border border-border bg-surface px-2.5 py-2">
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
        </div>

        <Textarea
          label="Mô tả (áp dụng cho tất cả tệp)"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Không bắt buộc..."
        />
      </div>
    </Modal>
  );
}
