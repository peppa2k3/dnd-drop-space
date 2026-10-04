import { CloudUpload } from 'lucide-react';

export default function BrandMark({ className = '' }) {
  return <span aria-hidden="true" className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-card border border-gold/50 bg-sidebar-hover text-gold shadow-glow ${className}`}>
    <CloudUpload size={20} strokeWidth={1.8} />
  </span>;
}
