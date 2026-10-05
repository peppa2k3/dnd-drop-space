import { useCallback, useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import clsx from 'clsx';

export default function UploadDropzone({ onFilesSelected, disabled = false }) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const handleFiles = useCallback(
    (fileList) => {
      const files = Array.from(fileList || []);
      if (!disabled && files.length > 0) onFilesSelected(files);
    },
    [onFilesSelected, disabled]
  );

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const onPaste = (e) => {
    if (disabled) return;
    const files = Array.from(e.clipboardData?.files || []);
    if (files.length > 0) handleFiles(files);
  };

  return (
    <div
      role="button"
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => !disabled && (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      onPaste={onPaste}
      className={clsx(
        'flex flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed px-6 py-10 text-center transition-all duration-200 focus-visible:border-primary',
        disabled ? 'cursor-not-allowed border-border bg-background-secondary opacity-50' : 'cursor-pointer',
        isDragging && !disabled ? 'border-primary bg-primary/10 shadow-glow' : 'border-border bg-background-secondary hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary/10'
      )}
    >
      <UploadCloud size={28} className="text-text-muted" strokeWidth={1.5} />
      <p className="text-sm font-medium text-text-primary">Kéo & thả tệp vào đây, dán (Ctrl+V), hoặc bấm để chọn</p>
      <p className="text-xs text-text-muted">Hỗ trợ mọi định dạng tệp</p>
      <input ref={inputRef} type="file" multiple hidden disabled={disabled} onChange={(e) => {
        handleFiles(e.target.files);
        e.target.value = '';
      }} />
    </div>
  );
}
