import i18n from '../i18n/config';

const codeKeys = {
  FILE_NOT_FOUND: 'errors:notFound',
  PERMISSION_DENIED: 'errors:permissionDenied',
  UNAUTHORIZED: 'errors:authRequired',
  VALIDATION_ERROR: 'errors:validationFailed',
};

const statusKeys = {
  401: 'errors:authRequired', 403: 'errors:permissionDenied',
  404: 'errors:notFound', 409: 'errors:conflict',
  413: 'errors:fileTooLarge', 429: 'errors:tooManyRequests',
  503: 'errors:serviceUnavailable',
};

export function apiErrorMessage(error, fallback) {
  const response = error?.response;
  const key = codeKeys[response?.data?.code] || statusKeys[response?.status];
  if (key) return i18n.t(key);
  return response ? fallback : i18n.t('errors:network');
}
