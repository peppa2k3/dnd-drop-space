export const LIBRARY_PRESETS = {
  all: { titleKey: 'navigation:library', filter: {} },
  notes: { titleKey: 'navigation:notes', filter: { type: 'note' } },
  images: { titleKey: 'navigation:images', filter: { type: 'file', category: 'image' } },
  videos: { titleKey: 'navigation:videos', filter: { type: 'file', category: 'video' } },
  files: { titleKey: 'navigation:files', filter: { type: 'file' } },
  urls: { titleKey: 'navigation:urls', filter: { type: 'url' } },
  favorites: { titleKey: 'navigation:favorites', filter: { favorite: 'true' } },
};
