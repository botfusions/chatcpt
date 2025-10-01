// DOM Elements
const sidebar = document.getElementById('sidebar');
const menuToggle = document.getElementById('menuToggle');
const newChatBtn = document.getElementById('newChatBtn');
const conversationList = document.getElementById('conversationList');
const chatContainer = document.getElementById('chatContainer');
const welcomeScreen = document.getElementById('welcomeScreen');
const messagesWrapper = document.getElementById('messagesWrapper');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');

// State
let conversations = [];
let currentConversationId = null;
let messageCounter = 0;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadConversationsFromStorage();
    setupEventListeners();
    autoResizeTextarea();
});

// Event Listeners
function setupEventListeners() {
    // Menu toggle for mobile
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleSidebar);
    }

    // New chat button
    newChatBtn.addEventListener('click', startNewChat);

    // Test webhook button
    const testWebhookBtn = document.getElementById('testWebhookBtn');
    if (testWebhookBtn) {
        testWebhookBtn.addEventListener('click', testWebhookConnection);
    }

    // Message input
    messageInput.addEventListener('input', () => {
        autoResizeTextarea();
        toggleSendButton();
    });

    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Send button
    sendButton.addEventListener('click', sendMessage);

    // Close sidebar on mobile when clicking outside
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && sidebar.classList.contains('active')) {
            if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        }
    });
}

// Toggle Sidebar (Mobile)
function toggleSidebar() {
    sidebar.classList.toggle('active');
}

// Auto-resize Textarea
function autoResizeTextarea() {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 200) + 'px';
}

// Toggle Send Button
function toggleSendButton() {
    sendButton.disabled = messageInput.value.trim() === '';
}

// Start New Chat
function startNewChat() {
    currentConversationId = Date.now().toString();
    const newConversation = {
        id: currentConversationId,
        title: 'Yeni Sohbet',
        messages: [],
        timestamp: new Date().toISOString()
    };

    conversations.unshift(newConversation);
    saveConversationsToStorage();
    renderConversationList();
    clearChat();
    hideWelcomeScreen();

    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
        sidebar.classList.remove('active');
    }
}

// Send Message
async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;

    // Create conversation if it doesn't exist
    if (!currentConversationId) {
        startNewChat();
    }

    // Add user message
    addMessage('user', text);
    messageInput.value = '';
    autoResizeTextarea();
    toggleSendButton();

    // Scroll to bottom
    scrollToBottom();

    // Show typing indicator
    const typingIndicator = showTypingIndicator();

    // Simulate AI response (replace with actual API call)
    await simulateAIResponse(text, typingIndicator);

    // Update conversation title if it's the first message
    const conversation = conversations.find(c => c.id === currentConversationId);
    if (conversation && conversation.messages.length === 2) {
        conversation.title = text.substring(0, 30) + (text.length > 30 ? '...' : '');
        renderConversationList();
        saveConversationsToStorage();
    }
}

// Add Message
function addMessage(role, content) {
    const conversation = conversations.find(c => c.id === currentConversationId);
    if (!conversation) return;

    const message = {
        id: ++messageCounter,
        role,
        content,
        timestamp: new Date().toISOString()
    };

    conversation.messages.push(message);
    renderMessage(message);
    saveConversationsToStorage();
}

// Render Message
function renderMessage(message) {
    hideWelcomeScreen();

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.role}`;
    messageDiv.innerHTML = `
        <div class="message-content-wrapper">
            <div class="message-avatar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    ${message.role === 'user'
                        ? '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>'
                        : '<circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line>'
                    }
                </svg>
            </div>
            <div class="message-text">${escapeHtml(message.content)}</div>
        </div>
    `;

    messagesWrapper.appendChild(messageDiv);
    scrollToBottom();
}

// Show Typing Indicator
function showTypingIndicator() {
    hideWelcomeScreen();

    const typingDiv = document.createElement('div');
    typingDiv.className = 'message assistant';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = `
        <div class="message-content-wrapper">
            <div class="message-avatar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                    <line x1="9" y1="9" x2="9.01" y2="9"></line>
                    <line x1="15" y1="9" x2="15.01" y2="9"></line>
                </svg>
            </div>
            <div class="message-text">
                <div class="typing-indicator">
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                </div>
            </div>
        </div>
    `;

    messagesWrapper.appendChild(typingDiv);
    scrollToBottom();
    return typingDiv;
}

// ============================================================================
// Webhook Integration Configuration
// ============================================================================

const WEBHOOK_CONFIG = {
    enabled: true, // Webhook kullanmak için true, simülasyon için false
    url: 'https://n8n.botfusions.com/webhook/a5015f1b-85e2-417f-8c95-d4b91698ec6e',
    timeout: 30000,
    retryAttempts: 2
};

// ============================================================================
// Webhook API Functions
// ============================================================================

/**
 * Send message to webhook server using POST method (with Botfusions.com stable error handling)
 */
async function sendToWebhook(message, conversationId) {
    try {
        console.log(`[Webhook POST Request] Message: "${message.substring(0, 50)}..."`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_CONFIG.timeout);

        const response = await fetch(WEBHOOK_CONFIG.url, {
            method: 'POST',
            mode: 'cors',
            credentials: 'omit',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: message,
                message: message,
                conversation_id: conversationId,
                timestamp: new Date().toISOString()
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Webhook yanıtı başarısız (Status: ${response.status} ${response.statusText || 'Bilinmiyor'})`);
        }

        const data = await response.json();
        console.log("n8n'den gelen ham JSON yanıtı:", data);

        return normalizeWebhookResponse(data, conversationId);

    } catch (error) {
        console.error('Webhook error:', error);

        if (error.name === 'AbortError') {
            throw new Error('İstek zaman aşımına uğradı. Lütfen tekrar deneyin.');
        } else if (error.message.includes('Failed to fetch')) {
            throw new Error('Webhook sunucusuna bağlanılamıyor. CORS veya ağ hatası.');
        } else {
            throw error;
        }
    }
}

/**
 * Normalize different webhook response formats (flexible and stable)
 */
function normalizeWebhookResponse(data, conversationId) {
    // Priority 1: 'output' field (recommended format)
    if (data.output) {
        return {
            success: true,
            response: data.output,
            conversationId: data.conversation_id || conversationId,
            messageId: data.message_id || null,
            timestamp: data.timestamp || new Date().toISOString()
        };
    }

    // Priority 2: 'response' field
    if (data.response) {
        return {
            success: true,
            response: data.response,
            conversationId: data.conversation_id || conversationId,
            messageId: data.message_id || null,
            timestamp: data.timestamp || new Date().toISOString()
        };
    }

    // Priority 3: 'text' field
    if (data.text) {
        return {
            success: true,
            response: data.text,
            conversationId: data.conversation_id || conversationId,
            messageId: data.message_id || null,
            timestamp: data.timestamp || new Date().toISOString()
        };
    }

    // Priority 4: Direct message in 'message' field
    if (data.message && typeof data.message === 'string') {
        return {
            success: true,
            response: data.message,
            conversationId: data.conversation_id || conversationId,
            messageId: data.message_id || null,
            timestamp: data.timestamp || new Date().toISOString()
        };
    }

    // Priority 5: Plain text response
    if (typeof data === 'string') {
        return {
            success: true,
            response: data,
            conversationId: conversationId,
            messageId: null,
            timestamp: new Date().toISOString()
        };
    }

    // Priority 6: Array of messages (multi-turn)
    if (Array.isArray(data) && data.length > 0) {
        const lastMessage = data[data.length - 1];
        return {
            success: true,
            response: lastMessage.output || lastMessage.message || lastMessage.response || lastMessage.text || String(lastMessage),
            conversationId: conversationId,
            messageId: null,
            timestamp: new Date().toISOString()
        };
    }

    // Fallback: Unknown format
    console.warn('Unknown webhook response format:', data);
    return {
        success: false,
        response: 'Yanıt formatı tanınamadı.',
        conversationId: conversationId,
        messageId: null,
        timestamp: new Date().toISOString()
    };
}

/**
 * Send message to webhook with retry mechanism (3 attempts with exponential backoff)
 */
async function sendToWebhookWithRetry(message, conversationId, attempt = 0) {
    const maxRetries = 3; // 3 stable retry attempts

    try {
        console.log(`[Webhook Attempt ${attempt + 1}/${maxRetries}]`);
        return await sendToWebhook(message, conversationId);
    } catch (error) {
        console.error(`API Bağlantı Hatası (Deneme ${attempt + 1}/${maxRetries}):`, error);

        // Retry only for network errors
        const isNetworkError = error.name === 'TypeError' ||
                              error.message.includes('fetch') ||
                              error.name === 'AbortError' ||
                              error.message.includes('Failed to fetch');

        if (isNetworkError && attempt < maxRetries - 1) {
            // Exponential backoff: 1s, 2s, 4s...
            const delay = Math.pow(2, attempt) * 1000;
            console.log(`Yeniden deneniyor... ${delay}ms sonra`);

            await new Promise(resolve => setTimeout(resolve, delay));

            return sendToWebhookWithRetry(message, conversationId, attempt + 1);
        }

        throw error;
    }
}

/**
 * Show notification message
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${type === 'error' ? '#fee2e2' : type === 'success' ? '#d1fae5' : '#dbeafe'};
        color: ${type === 'error' ? '#991b1b' : type === 'success' ? '#065f46' : '#1e40af'};
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        font-size: 14px;
        max-width: 300px;
        animation: slideInRight 0.3s ease-out;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Simulate AI Response (fallback when webhook is disabled)
async function simulateAIResponse(userMessage, typingIndicator) {
    // Try webhook first if enabled
    if (WEBHOOK_CONFIG.enabled) {
        try {
            // Minimum 2 saniye bekle (kullanıcı deneyimi için)
            const minimumDelay = new Promise(resolve => setTimeout(resolve, 2000));

            // Webhook isteğini paralel olarak gönder
            const webhookPromise = sendToWebhookWithRetry(userMessage, currentConversationId);

            // Her ikisi de tamamlanana kadar bekle
            const [_, result] = await Promise.all([minimumDelay, webhookPromise]);

            // Remove typing indicator
            if (typingIndicator) {
                typingIndicator.remove();
            }

            // Check response success
            if (!result.success) {
                throw new Error('Webhook yanıt formatı hatalı');
            }

            // Update conversation ID if provided by server
            if (result.conversationId && currentConversationId !== result.conversationId) {
                const conversation = conversations.find(c => c.id === currentConversationId);
                if (conversation) {
                    conversation.webhookId = result.conversationId;
                }
            }

            // Add AI response
            addMessage('assistant', result.response);

            return;

        } catch (error) {
            console.error('Webhook failed, falling back to simulation:', error);

            // More detailed error message
            const errorMessage = error.message.includes('404')
                ? 'Webhook aktif değil. n8n workflow\'unu başlatın.'
                : error.message.includes('not registered')
                ? 'n8n workflow\'u aktif değil veya test modunda.'
                : 'Bağlantı hatası. Simülasyon moduna geçiliyor.';

            showNotification(errorMessage, 'error');

            // Simülasyona geçmeden önce 1-2 saniye daha bekle
            await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
        }
    }

    // Fallback simulation
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));

    // Remove typing indicator
    if (typingIndicator) {
        typingIndicator.remove();
    }

    // Generate simple response
    const responses = [
        'Bu çok ilginç bir soru. Size yardımcı olmaktan mutluluk duyarım.',
        'Anladım. Bu konuda size şu bilgileri verebilirim...',
        'Elbette! Size bu konuda detaylı bilgi verebilirim.',
        'Harika bir soru. Hemen açıklayayım...',
        'Bunu düşünmek için biraz zamana ihtiyacım var, ama size yardımcı olabilirim.',
    ];

    const response = responses[Math.floor(Math.random() * responses.length)];
    addMessage('assistant', response);
}

// Render Conversation List
function renderConversationList() {
    conversationList.innerHTML = '';

    conversations.forEach(conversation => {
        const conversationItem = document.createElement('div');
        conversationItem.className = 'conversation-item';
        if (conversation.id === currentConversationId) {
            conversationItem.classList.add('active');
        }
        conversationItem.textContent = conversation.title;
        conversationItem.addEventListener('click', () => loadConversation(conversation.id));
        conversationList.appendChild(conversationItem);
    });
}

// Load Conversation
function loadConversation(id) {
    currentConversationId = id;
    const conversation = conversations.find(c => c.id === id);

    if (!conversation) return;

    clearChat();
    hideWelcomeScreen();

    conversation.messages.forEach(message => {
        renderMessage(message);
    });

    renderConversationList();

    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
        sidebar.classList.remove('active');
    }
}

// Clear Chat
function clearChat() {
    messagesWrapper.innerHTML = '';
}

// Hide Welcome Screen
function hideWelcomeScreen() {
    welcomeScreen.style.display = 'none';
    messagesWrapper.classList.add('active');
}

// Scroll to Bottom
function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Local Storage
function saveConversationsToStorage() {
    try {
        localStorage.setItem('chatConversations', JSON.stringify(conversations));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

function loadConversationsFromStorage() {
    try {
        const stored = localStorage.getItem('chatConversations');
        if (stored) {
            conversations = JSON.parse(stored);
            renderConversationList();
        }
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        conversations = [];
    }
}

// Utility Functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Test Webhook Connection (GET method)
async function testWebhookConnection() {
    const testBtn = document.getElementById('testWebhookBtn');
    const originalText = testBtn.innerHTML;

    testBtn.disabled = true;
    testBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;">
            <circle cx="12" cy="12" r="10"></circle>
        </svg>
        <span>Test Ediliyor...</span>
    `;

    try {
        const testMessage = "Webhook bağlantı testi - Merhaba!";
        const testConversationId = `test_${Date.now()}`;

        console.log('[Test] Webhook test başlatıldı...');
        const result = await sendToWebhookWithRetry(testMessage, testConversationId);

        const responsePreview = result.response.substring(0, 80) + (result.response.length > 80 ? '...' : '');
        showNotification(`✅ Webhook Başarılı!\n\nYanıt: "${responsePreview}"`, 'success');
        console.log('[Test] Tam yanıt:', result.response);

    } catch (error) {
        const errorMsg = error.message.includes('404')
            ? '❌ Webhook aktif değil (404). n8n workflow\'unu başlatın.'
            : error.message.includes('Failed to fetch')
            ? '❌ Bağlantı hatası. Webhook URL\'sini kontrol edin.'
            : error.message.includes('başarısız')
            ? '❌ Webhook yanıt vermedi. n8n workflow\'unu kontrol edin.'
            : `❌ Hata: ${error.message}`;

        showNotification(errorMsg, 'error');
        console.error('[Test] Webhook test hatası:', error);
    } finally {
        testBtn.disabled = false;
        testBtn.innerHTML = originalText;
    }
}

// Handle window resize
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (window.innerWidth > 768) {
            sidebar.classList.remove('active');
        }
    }, 250);
});

// Add spin animation for loading spinner
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);
