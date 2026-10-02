import { useCallback, useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import clsx from 'clsx';

export default function UploadDropzone({ onFilesSelected }) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const handleFiles = useCallback(
    (fileList) => {
      const files = Array.from(fileList || []);
      if (files.length > 0) onFilesSelected(files);
    },
    [onFilesSelected]
  );

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const onPaste = (e) => {
    const files = Array.from(e.clipboardData?.files || []);
    if (files.length > 0) handleFiles(files);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      onPaste={onPaste}
      className={clsx(
        'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed px-6 py-10 text-center transition-colors',
        isDragging ? 'border-gold bg-gold-soft/40' : 'border-line bg-paper-dim hover:border-slate-light'
      )}
    >
      <UploadCloud size={28} className="text-slate-light" strokeWidth={1.5} />
      <p className="text-sm font-medium text-ink">Kéo & thả tệp vào đây, dán (Ctrl+V), hoặc bấm để chọn</p>
      <p className="font-mono text-xs text-slate-light">Hỗ trợ mọi định dạng tệp</p>
      <input ref={inputRef} type="file" multiple hidden onChange={(e) => handleFiles(e.target.files)} />
    </div>
  );
}
