import { getAccessToken } from '../api/axiosClient';

/**
 * <img>/<video>/<a download> tags can't send an Authorization header, so
 * protected media endpoints (thumbnail/stream/download) also accept the
 * access token as a query param (see backend auth.middleware.js). This
 * builds that URL from the current in-memory token.
 */
export function mediaUrl(path) {
  const token = getAccessToken();
  if (!token) return path;
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}token=${encodeURIComponent(token)}`;
}
