import { LayoutDashboard, LayoutGrid, FileText, Image, Video, FolderOpen, Link2, Star, Trash2 } from 'lucide-react';

export const NAV_ITEMS = [
  { path: '/app', label: 'Bảng điều khiển', icon: LayoutDashboard, end: true },
  { path: '/app/library', label: 'Tất cả dữ liệu', icon: LayoutGrid },
  { path: '/app/notes', label: 'Ghi chú', icon: FileText },
  { path: '/app/images', label: 'Ảnh', icon: Image },
  { path: '/app/videos', label: 'Video', icon: Video },
  { path: '/app/files', label: 'Tệp tin', icon: FolderOpen },
  { path: '/app/urls', label: 'Liên kết đã lưu', icon: Link2 },
  { path: '/app/favorites', label: 'Yêu thích', icon: Star },
];

export const TRASH_NAV_ITEM = { path: '/app/trash', label: 'Thùng rác', icon: Trash2 };
