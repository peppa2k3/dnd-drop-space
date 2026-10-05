import i18n from '../i18n/config';
import { formatBytes } from './format.js';

export function getUploadIssue(files, stats) {
  if (!stats) return i18n.t('common:unableToCheckStorageCapacityPleaseTryAgain');
  if (stats.storageLimitBytes <= 0) return i18n.t('upload:capacityHasNotBeenGrantedPleaseContactTheAdministratorToUploadTheFile');

  const remaining = Math.max(0, stats.storageLimitBytes - stats.usedStorageBytes);
  if (remaining === 0) return i18n.t('upload:storageIsFullPermanentlyDeleteUnnecessaryFilesBeforeUploading');
  if (files.length > stats.maxFilesPerUpload) {
    return i18n.t('upload:onlyAMaximumOfMaxfilesperuploadFilesCanBeLoadedAtATime', { maxFilesPerUpload: stats.maxFilesPerUpload });
  }

  const oversized = files.find((file) => file.size > stats.maxFileSizeBytes);
  if (oversized) {
    return i18n.t('upload:fileNameExceedsTheValue2PerFileLimit', { name: oversized.name, value2: formatBytes(stats.maxFileSizeBytes) });
  }

  const selectedBytes = files.reduce((total, file) => total + file.size, 0);
  if (selectedBytes > remaining) {
    return i18n.t('upload:theSelectedFilesOccupyValue1ButOnlyValue2RemainsReduceFilesOrFreeUpSpace', { value1: formatBytes(selectedBytes), value2: formatBytes(remaining) });
  }
  return null;
}
