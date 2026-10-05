import { CloudUpload } from 'lucide-react';

export default function BrandMark({ className = '' }) {
  return <span aria-hidden="true" className={`brand-mark flex h-9 w-9 shrink-0 items-center justify-center rounded-card border border-primary/50 text-primary-hover shadow-glow ${className}`}>
    <CloudUpload size={20} strokeWidth={1.8} />
  </span>;
}
