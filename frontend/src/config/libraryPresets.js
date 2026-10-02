export const LIBRARY_PRESETS = {
  all: { title: 'Tất cả dữ liệu', filter: {} },
  notes: { title: 'Ghi chú', filter: { type: 'note' } },
  images: { title: 'Ảnh', filter: { type: 'file', category: 'image' } },
  videos: { title: 'Video', filter: { type: 'file', category: 'video' } },
  files: { title: 'Tệp tin', filter: { type: 'file' } },
  urls: { title: 'Liên kết đã lưu', filter: { type: 'url' } },
  favorites: { title: 'Yêu thích', filter: { favorite: 'true' } },
};
