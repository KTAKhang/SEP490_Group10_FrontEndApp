import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

async function getAuthToken() {
  const token = await AsyncStorage.getItem('token');
  if (!token) {
    throw new Error('Vui lòng đăng nhập để sử dụng chức năng liên hệ.');
  }
  return token;
}

// Nếu BE có endpoint /contacts/categories thì dùng, nếu không FE có thể hard-code danh sách category
export async function getContactCategoriesApi() {
  try {
    const token = await getAuthToken();
    const response = await axios.get(`${API_BASE_URL}/contacts/categories`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const result = response.data || {};
    if (result.status && result.status !== 'OK') {
      throw new Error(result.message || 'Không thể tải danh mục liên hệ');
    }

    const categories = result.data || result.categories || [];
    return categories;
  } catch (error) {
    // Fallback: nếu BE không có endpoint categories, FE vẫn có thể tự define các category
    const msg =
      error.response?.data?.message ||
      error.message ||
      'Không thể tải danh mục liên hệ';
    throw new Error(msg);
  }
}

// Upload 1 file đính kèm cho contact, dùng đúng endpoint BE: POST /contacts/:id/attachments với field "file"
export async function uploadContactAttachmentApi(contactId, file) {
  if (!contactId) {
    throw new Error('Thiếu mã liên hệ để upload file.');
  }
  if (!file || !file.uri) {
    throw new Error('File không hợp lệ.');
  }

  const token = await getAuthToken();

  const formData = new FormData();
  formData.append('file', {
    uri: file.uri,
    name: file.name || file.fileName || 'attachment',
    type: file.type || 'application/octet-stream',
  });

  const response = await axios.post(
    `${API_BASE_URL}/contacts/${contactId}/attachments`,
    formData,
    {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  const result = response.data || {};
  if (result.status && result.status !== 'OK') {
    throw new Error(result.message || 'Không thể upload file đính kèm');
  }
  return result;
}

// Tạo contact mới, sau đó nếu có file thì gọi API upload attachments riêng cho từng file
export async function createContactApi({ subject, category, message, files = [] }) {
  try {
    const token = await getAuthToken();

    const response = await axios.post(
      `${API_BASE_URL}/contacts`,
      {
        subject: (subject || '').trim(),
        message: (message || '').trim(),
        category,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const result = response.data || {};
    if (result.status && result.status !== 'OK') {
      throw new Error(result.message || 'Không thể gửi liên hệ');
    }

    const created = result.data || result.contact || result;
    const contactId =
      created._id || created.id || created.contact_id || created.contactId;

    const hasFiles = Array.isArray(files) && files.length > 0 && contactId;
    if (hasFiles) {
      // Upload lần lượt từng file, nếu 1 file lỗi thì ném lỗi (FE sẽ hiển thị message BE trả về)
      for (const file of files) {
        await uploadContactAttachmentApi(contactId, file);
      }
    }

    return result;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        'Không thể gửi liên hệ. Vui lòng thử lại.',
    );
  }
}

// GET /contacts - BE sẽ tự filter theo user hiện tại (user thường) hoặc trả toàn bộ (admin)
export async function getMyContactsApi({ page, limit, status, category } = {}) {
  try {
    const token = await getAuthToken();

    const params = new URLSearchParams();
    if (page != null) params.append('page', String(page));
    if (limit != null) params.append('limit', String(limit));
    if (status) params.append('status', String(status));
    if (category) params.append('category', String(category));

    const query = params.toString();
    const url = query
      ? `${API_BASE_URL}/contacts?${query}`
      : `${API_BASE_URL}/contacts`;

    const response = await axios.get(url, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const result = response.data || {};
    if (result.status && result.status !== 'OK') {
      throw new Error(result.message || 'Không thể tải lịch sử liên hệ');
    }

    const contacts = result.data || result.contacts || [];
    return contacts;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        'Không thể tải lịch sử liên hệ',
    );
  }
}

// GET /contacts/:id - BE trả data gồm contact, replies, attachments, canReply, waitingForAdminReply
export async function getContactDetailApi(contactId) {
  try {
    if (!contactId) throw new Error('Thiếu mã liên hệ');

    const token = await getAuthToken();
    const response = await axios.get(`${API_BASE_URL}/contacts/${contactId}`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const result = response.data || {};
    if (result.status && result.status !== 'OK') {
      throw new Error(result.message || 'Không thể tải chi tiết liên hệ');
    }

    const raw = result.data || result.contact || result;
    const contact = raw.contact || raw;
    const replies = raw.replies || raw.messages || [];
    const attachments = raw.attachments || [];
    const canReply = raw.canReply;
    const waitingForAdminReply = raw.waitingForAdminReply;

    return { contact, replies, attachments, canReply, waitingForAdminReply };
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        'Không thể tải chi tiết liên hệ',
    );
  }
}

// POST /contacts/:id/replies
export async function sendContactReplyApi(contactId, replyMessage) {
  try {
    if (!contactId) throw new Error('Thiếu mã liên hệ');

    const token = await getAuthToken();
    const response = await axios.post(
      `${API_BASE_URL}/contacts/${contactId}/replies`,
      {
        message: (replyMessage || '').trim(),
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const result = response.data || {};
    if (result.status && result.status !== 'OK') {
      throw new Error(result.message || 'Không thể gửi phản hồi');
    }
    return result;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        'Không thể gửi phản hồi. Vui lòng thử lại.',
    );
  }
}

