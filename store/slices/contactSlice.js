import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getContactCategoriesApi,
  createContactApi,
  getMyContactsApi,
  getContactDetailApi,
  sendContactReplyApi,
} from '../../services/contactService';

export const fetchContactCategories = createAsyncThunk(
  'contact/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const categories = await getContactCategoriesApi();
      return categories;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const createContact = createAsyncThunk(
  'contact/createContact',
  async ({ subject, category, message, files }, { rejectWithValue }) => {
    try {
      const response = await createContactApi({ subject, category, message, files });
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchMyContacts = createAsyncThunk(
  'contact/fetchMyContacts',
  async (_, { rejectWithValue }) => {
    try {
      const contacts = await getMyContactsApi();
      return contacts;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchContactDetail = createAsyncThunk(
  'contact/fetchContactDetail',
  async (contactId, { rejectWithValue }) => {
    try {
      const data = await getContactDetailApi(contactId);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const sendContactReply = createAsyncThunk(
  'contact/sendContactReply',
  async ({ contactId, message }, { rejectWithValue }) => {
    try {
      const data = await sendContactReplyApi(contactId, message);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

const initialState = {
  categories: [],
  categoriesLoading: false,
  categoriesError: null,

  createContactLoading: false,
  createContactSuccess: false,
  createContactMessage: null,
  createContactError: null,

  contacts: [],
  contactsLoading: false,
  contactsError: null,

  contactDetail: null,
  replies: [],
  repliesLoading: false,
  repliesError: null,

  attachments: [],
  canReply: true,
  waitingForAdminReply: false,

  sendReplyLoading: false,
  sendReplySuccess: false,
  sendReplyError: null,
};

const contactSlice = createSlice({
  name: 'contact',
  initialState,
  reducers: {
    contactClearMessages: (state) => {
      state.createContactMessage = null;
      state.createContactError = null;
      state.sendReplyError = null;
      state.sendReplySuccess = false;
    },
    contactResetDetail: (state) => {
      state.contactDetail = null;
      state.replies = [];
      state.repliesLoading = false;
      state.repliesError = null;
      state.attachments = [];
      state.canReply = true;
      state.waitingForAdminReply = false;
      state.sendReplyLoading = false;
      state.sendReplySuccess = false;
      state.sendReplyError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchContactCategories.pending, (state) => {
        state.categoriesLoading = true;
        state.categoriesError = null;
      })
      .addCase(fetchContactCategories.fulfilled, (state, action) => {
        state.categoriesLoading = false;
        state.categories = action.payload || [];
      })
      .addCase(fetchContactCategories.rejected, (state, action) => {
        state.categoriesLoading = false;
        state.categoriesError = action.payload || 'Không thể tải danh mục liên hệ';
      })

      .addCase(createContact.pending, (state) => {
        state.createContactLoading = true;
        state.createContactSuccess = false;
        state.createContactMessage = null;
        state.createContactError = null;
      })
      .addCase(createContact.fulfilled, (state, action) => {
        state.createContactLoading = false;
        state.createContactSuccess = true;
        const payload = action.payload || {};
        state.createContactMessage =
          payload.message || 'Gửi liên hệ thành công. Cảm ơn bạn đã liên hệ.';
      })
      .addCase(createContact.rejected, (state, action) => {
        state.createContactLoading = false;
        state.createContactSuccess = false;
        state.createContactError =
          action.payload || 'Không thể gửi liên hệ. Vui lòng thử lại.';
      })

      .addCase(fetchMyContacts.pending, (state) => {
        state.contactsLoading = true;
        state.contactsError = null;
      })
      .addCase(fetchMyContacts.fulfilled, (state, action) => {
        state.contactsLoading = false;
        state.contacts = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchMyContacts.rejected, (state, action) => {
        state.contactsLoading = false;
        state.contactsError =
          action.payload || 'Không thể tải lịch sử liên hệ của bạn.';
      })

      .addCase(fetchContactDetail.pending, (state) => {
        state.repliesLoading = true;
        state.repliesError = null;
      })
      .addCase(fetchContactDetail.fulfilled, (state, action) => {
        state.repliesLoading = false;
        const payload = action.payload || {};
        state.contactDetail = payload.contact || payload.contactDetail || payload;
        state.replies = Array.isArray(payload.replies) ? payload.replies : [];
         state.attachments = Array.isArray(payload.attachments) ? payload.attachments : [];
         state.canReply =
           typeof payload.canReply === 'boolean' ? payload.canReply : true;
         state.waitingForAdminReply = !!payload.waitingForAdminReply;
      })
      .addCase(fetchContactDetail.rejected, (state, action) => {
        state.repliesLoading = false;
        state.repliesError =
          action.payload || 'Không thể tải chi tiết liên hệ. Vui lòng thử lại.';
        state.contactDetail = null;
        state.replies = [];
      })

      .addCase(sendContactReply.pending, (state) => {
        state.sendReplyLoading = true;
        state.sendReplySuccess = false;
        state.sendReplyError = null;
      })
      .addCase(sendContactReply.fulfilled, (state, action) => {
        state.sendReplyLoading = false;
        state.sendReplySuccess = true;
      })
      .addCase(sendContactReply.rejected, (state, action) => {
        state.sendReplyLoading = false;
        state.sendReplySuccess = false;
        state.sendReplyError =
          action.payload || 'Không thể gửi phản hồi. Vui lòng thử lại.';
      });
  },
});

export const { contactClearMessages, contactResetDetail } = contactSlice.actions;

export default contactSlice.reducer;

