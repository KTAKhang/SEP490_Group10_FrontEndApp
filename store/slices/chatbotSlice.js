// features/chatbot/chatbotSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { sendMessageToBotApi, sendMessageToBotApiRest } from '../../services/chatbotService';

// Async thunk to send message to bot with retry logic
export const sendMessageToBot = createAsyncThunk(
    'chatBot/sendMessageToBot',
    async (message, { rejectWithValue }) => {
        try {
            // Try SDK first, fallback to REST API if needed
            let response;
            try {
                response = await sendMessageToBotApi(message);
            } catch (sdkError) {
                console.log('SDK failed, trying REST API:', sdkError.message);
                response = await sendMessageToBotApiRest(message);
            }

            return response;
        } catch (error) {
            console.error('Both API methods failed:', error);
            return rejectWithValue(error.message);
        }
    }
);

const initialState = {
    messages: [
        {
            text: "Xin chào! Tôi là Gemini AI. Tôi có thể giúp gì cho bạn?",
            role: 'assistant',
            timestamp: new Date().toISOString()
        }
    ],
    isLoading: false,
    error: null,
    retryCount: 0,
};

const chatbotSlice = createSlice({
    name: 'chatBot',
    initialState,
    reducers: {
        addUserMessage: (state, action) => {
            state.messages.push({
                text: action.payload,
                role: 'user',
                timestamp: new Date().toISOString()
            });
            state.error = null; // Clear any previous errors
        },
        clearChat: (state) => {
            state.messages = [
                {
                    text: "Xin chào! Tôi là Gemini AI. Tôi có thể giúp gì cho bạn?",
                    role: 'assistant',
                    timestamp: new Date().toISOString()
                }
            ];
            state.isLoading = false;
            state.error = null;
            state.retryCount = 0;
        },
        clearError: (state) => {
            state.error = null;
        },
        incrementRetryCount: (state) => {
            state.retryCount += 1;
        },
        resetRetryCount: (state) => {
            state.retryCount = 0;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(sendMessageToBot.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(sendMessageToBot.fulfilled, (state, action) => {
                state.isLoading = false;
                state.error = null;
                state.retryCount = 0;

                if (action.payload && action.payload.text) {
                    state.messages.push({
                        text: action.payload.text,
                        role: 'assistant',
                        timestamp: action.payload.timestamp || new Date().toISOString()
                    });
                } else {
                    // Fallback message if response is malformed
                    state.messages.push({
                        text: "Xin lỗi, tôi không thể tạo phản hồi phù hợp. Vui lòng thử lại.",
                        role: 'assistant',
                        timestamp: new Date().toISOString()
                    });
                }
            })
            .addCase(sendMessageToBot.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload || 'Đã xảy ra lỗi không xác định';

                // Add error message to chat
                state.messages.push({
                    text: `❌ Lỗi: ${action.payload || 'Không thể kết nối với AI'}`,
                    role: 'system',
                    timestamp: new Date().toISOString(),
                    isError: true
                });
            });
    },
});

export const {
    addUserMessage,
    clearChat,
    clearError,
    incrementRetryCount,
    resetRetryCount
} = chatbotSlice.actions;

export default chatbotSlice.reducer;