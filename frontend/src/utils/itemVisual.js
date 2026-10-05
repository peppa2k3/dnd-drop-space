import { FileText, Link2, Image, Video, FileArchive, FileSpreadsheet, File, FileType2 } from 'lucide-react';
import i18n from '../i18n/config';

/** Returns { Icon, label } for the small type-tab shown on every catalog card. */
export function getItemVisual(item) {
  if (item.type === 'note') return { Icon: FileText, label: i18n.t('files:typeNote') };
  if (item.type === 'url') return { Icon: Link2, label: i18n.t('files:typeUrl') };

  switch (item.fileMeta?.category) {
    case 'image':
      return { Icon: Image, label: i18n.t('files:typeImage') };
    case 'video':
      return { Icon: Video, label: i18n.t('files:typeVideo') };
    case 'pdf':
      return { Icon: FileType2, label: i18n.t('files:typePdf') };
    case 'word':
      return { Icon: FileText, label: i18n.t('files:typeWord') };
    case 'excel':
      return { Icon: FileSpreadsheet, label: i18n.t('files:typeExcel') };
    case 'archive':
      return { Icon: FileArchive, label: i18n.t('files:typeArchive') };
    default:
      return { Icon: File, label: i18n.t('files:typeFile') };
  }
}
