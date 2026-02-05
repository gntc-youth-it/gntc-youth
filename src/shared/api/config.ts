export const API_BASE_URL =
  process.env.NODE_ENV === 'development' ||
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
    ? ''
    : 'https://api.gntc-youth.com'
