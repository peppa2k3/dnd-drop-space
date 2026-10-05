import { LayoutDashboard, LayoutGrid, FileText, Image, Video, FolderOpen, Link2, Star, Trash2, Users, UsersRound, Share2 } from 'lucide-react';

export const NAV_ITEMS = [
  { path: '/app', labelKey: 'navigation:dashboard', icon: LayoutDashboard, end: true },
  { path: '/app/library', labelKey: 'navigation:library', icon: LayoutGrid },
  { path: '/app/notes', labelKey: 'navigation:notes', icon: FileText },
  { path: '/app/images', labelKey: 'navigation:images', icon: Image },
  { path: '/app/videos', labelKey: 'navigation:videos', icon: Video },
  { path: '/app/files', labelKey: 'navigation:files', icon: FolderOpen },
  { path: '/app/urls', labelKey: 'navigation:urls', icon: Link2 },
  { path: '/app/favorites', labelKey: 'navigation:favorites', icon: Star },
  { path: '/app/friends', labelKey: 'navigation:friends', icon: Users },
  { path: '/app/groups', labelKey: 'navigation:groups', icon: UsersRound },
  { path: '/app/shared', labelKey: 'navigation:shared', icon: Share2 },
];

export const TRASH_NAV_ITEM = { path: '/app/trash', labelKey: 'navigation:trash', icon: Trash2 };
