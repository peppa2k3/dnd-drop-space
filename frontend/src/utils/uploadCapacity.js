import { formatBytes } from './format.js';

export function getUploadIssue(files, stats) {
  if (!stats) return 'Không thể kiểm tra dung lượng lưu trữ. Vui lòng thử lại.';

  const remaining = Math.max(0, stats.storageLimitBytes - stats.usedStorageBytes);
  if (remaining === 0) return 'Bộ lưu trữ đã đầy. Hãy xóa vĩnh viễn tệp không cần thiết trước khi tải lên.';
  if (files.length > stats.maxFilesPerUpload) {
    return `Chỉ được tải tối đa ${stats.maxFilesPerUpload} tệp mỗi lần.`;
  }

  const oversized = files.find((file) => file.size > stats.maxFileSizeBytes);
  if (oversized) {
    return `Tệp "${oversized.name}" vượt giới hạn ${formatBytes(stats.maxFileSizeBytes)} mỗi tệp.`;
  }

  const selectedBytes = files.reduce((total, file) => total + file.size, 0);
  if (selectedBytes > remaining) {
    return `Các tệp đã chọn chiếm ${formatBytes(selectedBytes)}, nhưng chỉ còn ${formatBytes(remaining)}. Hãy bớt tệp hoặc giải phóng dung lượng.`;
  }
  return null;
}
