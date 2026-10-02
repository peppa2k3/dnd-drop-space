const path = require('path');

const EXTENSION_MAP = {
  word: ['.doc', '.docx', '.rtf', '.odt'],
  excel: ['.xls', '.xlsx', '.csv', '.ods'],
  archive: ['.zip', '.rar', '.7z', '.tar', '.gz'],
  pdf: ['.pdf'],
};

/**
 * Classifies a file into one of Item.FILE_CATEGORIES using its mime type
 * first, falling back to file extension for the office/archive formats
 * whose mime types are inconsistent across browsers/OSes.
 */
function detectFileCategory(mimeType = '', originalName = '') {
  const ext = path.extname(originalName).toLowerCase();

  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType === 'application/pdf' || ext === '.pdf') return 'pdf';

  for (const [category, extensions] of Object.entries(EXTENSION_MAP)) {
    if (extensions.includes(ext)) return category;
  }

  if (mimeType.includes('word')) return 'word';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'excel';
  if (mimeType.includes('zip') || mimeType.includes('compressed')) return 'archive';

  return 'other';
}

module.exports = { detectFileCategory };
