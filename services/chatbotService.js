import { GoogleGenerativeAI } from '@google/generative-ai';


const API_KEY = 'AIzaSyDUynqdtb7LPVxHUMewcIDBtTrPcKYgGwc';

const genAI = new GoogleGenerativeAI(API_KEY);

export async function sendMessageToBotApi(message) {
    if (!API_KEY || API_KEY === 'YOUR_ACTUAL_API_KEY_HERE') {
        throw new Error('API key is not configured properly');
    }

    if (!message || message.trim() === '') {
        throw new Error('Message cannot be empty');
    }

    try {

        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            },
        });

        const result = await model.generateContent({
            contents: [{
                role: 'user',
                parts: [{ text: message }]
            }]
        });

        const response = await result.response;

        if (!response) {
            throw new Error('No response received from Gemini');
        }

        const text = response.text();

        if (!text) {
            throw new Error('Empty response from Gemini');
        }


        return {
            text: text,
            role: 'assistant',
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error('Gemini API Error Details:', error);
        if (error.message.includes('403') || error.message.includes('PERMISSION_DENIED')) {
            throw new Error('API key không hợp lệ hoặc chưa được cấp quyền truy cập');
        } else if (error.message.includes('429')) {
            throw new Error('Đã vượt quá giới hạn request. Vui lòng thử lại sau');
        } else if (error.message.includes('500')) {
            throw new Error('Lỗi server từ Gemini. Vui lòng thử lại sau');
        } else if (error.message.includes('Network')) {
            throw new Error('Lỗi kết nối mạng. Kiểm tra internet của bạn');
        } else {
            throw new Error(`Lỗi Gemini API: ${error.message}`);
        }
    }
}

// Alternative function using REST API approach (if SDK doesn't work)
export async function sendMessageToBotApiRest(message) {
    if (!API_KEY || API_KEY === 'YOUR_ACTUAL_API_KEY_HERE') {
        throw new Error('API key is not configured properly');
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: message
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('API Error Response:', errorData);
            throw new Error(`HTTP ${response.status}: ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();

        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            throw new Error('Invalid response format from Gemini');
        }

        const text = data.candidates[0].content.parts[0].text;

        return {
            text: text,
            role: 'assistant',
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error('REST API Error:', error);
        throw error;
    }
}