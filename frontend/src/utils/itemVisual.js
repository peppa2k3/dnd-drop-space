import { FileText, Link2, Image, Video, FileArchive, FileSpreadsheet, File, FileType2 } from 'lucide-react';

/** Returns { Icon, label } for the small type-tab shown on every catalog card. */
export function getItemVisual(item) {
  if (item.type === 'note') return { Icon: FileText, label: 'Ghi chú' };
  if (item.type === 'url') return { Icon: Link2, label: 'Liên kết' };

  switch (item.fileMeta?.category) {
    case 'image':
      return { Icon: Image, label: 'Ảnh' };
    case 'video':
      return { Icon: Video, label: 'Video' };
    case 'pdf':
      return { Icon: FileType2, label: 'PDF' };
    case 'word':
      return { Icon: FileText, label: 'Word' };
    case 'excel':
      return { Icon: FileSpreadsheet, label: 'Excel' };
    case 'archive':
      return { Icon: FileArchive, label: 'Nén' };
    default:
      return { Icon: File, label: 'Tệp' };
  }
}
