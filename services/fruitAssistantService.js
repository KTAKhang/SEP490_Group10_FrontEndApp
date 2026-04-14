/**
 * Fruit AI — `/fruit-assistant/analyze`
 *
 * Gửi ảnh giống hệt pattern chat nhân viên (CustomerChat → api.post + FormData +
 * header multipart/form-data). Trên RN axios cần header này mới upload ổn định.
 */
import api from '../api';

/** Must match backend FRUIT_IMAGE_MAX_BYTES (5 MB). */
export const MAX_FRUIT_IMAGE_BYTES = 5 * 1024 * 1024;

function pickServerMessage(data) {
  if (!data) return null;
  if (typeof data === 'string' && data.trim()) return data.trim();
  if (typeof data?.message === 'string' && data.message.trim()) return data.message.trim();
  if (typeof data?.error === 'string' && data.error.trim()) return data.error.trim();
  return null;
}

/**
 * Chuẩn hóa uri/name/type giống CustomerChat (sendMessage).
 * @param {{ uri: string, name?: string, fileName?: string, type?: string, mime?: string, mimeType?: string }} file
 */
function buildImagePart(file) {
  const uri = file.uri;
  if (!uri) return null;

  const name =
    file.name ||
    file.fileName ||
    uri.split('/').pop() ||
    `fruit_${Date.now()}.jpg`;

  let type = file.type || file.mime || file.mimeType || 'image/jpeg';
  if (!type.includes('/')) {
    const ext = name.split('.').pop() || 'jpg';
    type = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
  }

  return { uri, name, type };
}

/**
 * @param {object} file - object có uri (và optional name/fileName/mimeType như Expo asset)
 */
export async function analyzeFruitImage(file) {
  const part = buildImagePart(file);
  if (!part) {
    throw new Error('No image URI');
  }

  const form = new FormData();
  form.append('image', part);

  // Giống CustomerChat: /chat/message
  const { data } = await api.post('/fruit-assistant/analyze', form, {
    timeout: 180000,
    headers: { 'Content-Type': 'multipart/form-data' },
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });

  return data;
}

export async function requestFruitTopic(body) {
  const { data } = await api.post('/fruit-assistant/topic', body, {
    timeout: 120000,
  });
  return data;
}

export function formatMb(bytes) {
  return (bytes / (1024 * 1024)).toFixed(1);
}

export function resolveAnalyzeError(err, fileSizeBytes, maxBytes) {
  const data = err.response?.data;
  const serverMsg = pickServerMessage(data);
  if (serverMsg) return serverMsg;

  const status = err.response?.status;
  if (status === 413) {
    return `Payload too large (HTTP 413). Try an image ≤ ${formatMb(maxBytes)} MB.`;
  }

  const code = err.code;
  const raw = String(err.message || '');
  const lower = raw.toLowerCase();
  const isTransportFailure =
    code === 'ECONNABORTED' ||
    code === 'ERR_NETWORK' ||
    code === 'ETIMEDOUT' ||
    lower.includes('network') ||
    lower.includes('timeout');

  if (isTransportFailure || !err.response) {
    if (fileSizeBytes > maxBytes) {
      return `Image is too large (${formatMb(fileSizeBytes)} MB). Maximum is ${formatMb(maxBytes)} MB.`;
    }
    return (
      `Could not upload the image. Check your network and that the backend is running (max ${formatMb(maxBytes)} MB).`
    );
  }

  return raw || 'Unknown error while analyzing the image.';
}
