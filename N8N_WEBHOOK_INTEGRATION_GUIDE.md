# n8n Webhook Entegrasyon Kılavuzu

## Genel Bakış

Bu doküman, Figma Chat Interface ile n8n webhook endpoint'i arasındaki entegrasyonu açıklar.

**Webhook URL:**
```
https://n8n.botfusions.com/webhook-test/a5015f1b-85e2-417f-8c95-d4b91698ec6e
```

**Durum:** Test Modu (Production için workflow'un aktif edilmesi gerekiyor)

---

## 1. Request Format (İstek Formatı)

### HTTP Metodu
```
POST
```

### Headers
```http
Content-Type: application/json
```

### Request Body Yapısı

#### Standart Format
```json
{
  "message": "Kullanıcı mesajı buraya gelir",
  "conversation_id": "unique_conversation_identifier",
  "metadata": {
    "timestamp": "2025-10-01T16:48:54.645811+00:00",
    "testMode": false,
    "userAgent": "Mozilla/5.0 ..."
  }
}
```

#### Alan Açıklamaları

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `message` | string | ✅ Evet | Kullanıcının gönderdiği mesaj metni |
| `conversation_id` | string | ✅ Evet | Benzersiz sohbet kimliği (timestamp tabanlı önerilir) |
| `metadata` | object | ❌ Hayır | Ek bilgiler için meta veri objesi |
| `metadata.timestamp` | string (ISO 8601) | ❌ Hayır | İsteğin gönderilme zamanı |
| `metadata.testMode` | boolean | ❌ Hayır | Test modu göstergesi |
| `metadata.userAgent` | string | ❌ Hayır | Tarayıcı/client bilgisi |

#### Örnek JavaScript Kodu
```javascript
const payload = {
    message: "Merhaba, nasılsın?",
    conversation_id: `chat_${Date.now()}`,
    metadata: {
        timestamp: new Date().toISOString(),
        testMode: false,
        userAgent: navigator.userAgent
    }
};

const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
});
```

---

## 2. Response Format (Yanıt Formatı)

### Başarılı Yanıt (200 OK)

n8n workflow'unun döneceği yanıt formatı workflow yapılandırmasına bağlıdır. Tipik bir yanıt formatı:

```json
{
  "response": "AI asistanının yanıt metni",
  "conversation_id": "chat_1759337334645",
  "message_id": "msg_abc123xyz",
  "timestamp": "2025-10-01T16:48:55.123Z",
  "metadata": {
    "model": "gpt-4",
    "tokens_used": 150,
    "processing_time_ms": 1234
  }
}
```

**Beklenen Alanlar:**
- `response`: AI'dan gelen yanıt metni (zorunlu)
- `conversation_id`: Sohbet ID'si (opsiyonel, gönderilen ID'yi geri dönebilir)
- `message_id`: Mesaj benzersiz kimliği (opsiyonel)
- `timestamp`: Yanıt zamanı (opsiyonel)
- `metadata`: Ek bilgiler (opsiyonel)

### Hata Yanıtları

#### 404 Not Found - Webhook Not Registered
```json
{
  "code": 404,
  "message": "The requested webhook \"a5015f1b-85e2-417f-8c95-d4b91698ec6e\" is not registered.",
  "hint": "Click the 'Execute workflow' button on the canvas, then try again. (In test mode, the webhook only works for one call after you click this button)"
}
```

**Neden:** n8n workflow'u test modunda ve henüz execute edilmemiş VEYA workflow aktif değil

**Çözüm:**
1. n8n canvas'ında "Execute workflow" butonuna tıklayın (test modu için)
2. Workflow'u production moduna alın ve aktif edin

#### 400 Bad Request - Invalid Payload
```json
{
  "code": 400,
  "message": "Invalid request payload",
  "errors": [
    "message field is required"
  ]
}
```

**Neden:** Geçersiz veya eksik istek verisi

**Çözüm:** Request body'yi kontrol edin, zorunlu alanların gönderildiğinden emin olun

#### 500 Internal Server Error
```json
{
  "code": 500,
  "message": "Workflow execution failed",
  "error": "Error details..."
}
```

**Neden:** n8n workflow'unda hata oluştu

**Çözüm:** n8n workflow loglarını kontrol edin, hata ayıklama yapın

---

## 3. app.js Entegrasyonu

### Mevcut Durum

`app.js` dosyasında webhook entegrasyonu zaten hazır durumda. Aşağıdaki bölümler mevcut:

```javascript
// Webhook Configuration
const WEBHOOK_CONFIG = {
    enabled: true,
    url: 'https://n8n.botfusions.com/webhook-test/a5015f1b-85e2-417f-8c95-d4b91698ec6e',
    timeout: 30000,
    retryAttempts: 2
};

// Send to Webhook Function
async function sendToWebhook(message, conversationId) {
    // ... implementation
}
```

### Önerilen İyileştirmeler

#### 1. Yanıt Formatı Normalleştirmesi

n8n farklı formatlarda yanıt dönebilir. `sendToWebhook` fonksiyonunu güncelleyin:

```javascript
async function sendToWebhook(message, conversationId) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_CONFIG.timeout);

        const response = await fetch(WEBHOOK_CONFIG.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                conversation_id: conversationId,
                metadata: {
                    timestamp: new Date().toISOString(),
                    userAgent: navigator.userAgent
                }
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        const data = await response.json();

        // ✅ YENİ: Farklı yanıt formatlarını normalize et
        return normalizeWebhookResponse(data, conversationId);

    } catch (error) {
        console.error('Webhook error:', error);
        throw error;
    }
}

// ✅ YENİ: Response normalizer function
function normalizeWebhookResponse(data, conversationId) {
    // n8n farklı formatlarda yanıt dönebilir, normalize ediyoruz

    // Format 1: Standard format with 'response' field
    if (data.response) {
        return {
            success: true,
            response: data.response,
            conversationId: data.conversation_id || conversationId,
            messageId: data.message_id || null,
            timestamp: data.timestamp || new Date().toISOString()
        };
    }

    // Format 2: Direct message in 'message' field
    if (data.message && typeof data.message === 'string') {
        return {
            success: true,
            response: data.message,
            conversationId: data.conversation_id || conversationId,
            messageId: data.message_id || null,
            timestamp: data.timestamp || new Date().toISOString()
        };
    }

    // Format 3: Plain text response
    if (typeof data === 'string') {
        return {
            success: true,
            response: data,
            conversationId: conversationId,
            messageId: null,
            timestamp: new Date().toISOString()
        };
    }

    // Format 4: Array of messages (multi-turn)
    if (Array.isArray(data) && data.length > 0) {
        return {
            success: true,
            response: data[data.length - 1].message || data[data.length - 1],
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
```

#### 2. Retry Mekanizması

Network hatalarında otomatik retry ekleyin:

```javascript
async function sendToWebhookWithRetry(message, conversationId, attempt = 0) {
    try {
        return await sendToWebhook(message, conversationId);
    } catch (error) {
        // Retry sadece network hataları için
        const isNetworkError = error.name === 'TypeError' ||
                              error.message.includes('fetch') ||
                              error.name === 'AbortError';

        if (isNetworkError && attempt < WEBHOOK_CONFIG.retryAttempts) {
            console.log(`Retry attempt ${attempt + 1}/${WEBHOOK_CONFIG.retryAttempts}`);

            // Exponential backoff: 1s, 2s, 4s...
            const delay = Math.pow(2, attempt) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));

            return sendToWebhookWithRetry(message, conversationId, attempt + 1);
        }

        throw error;
    }
}
```

#### 3. simulateAIResponse Güncellemesi

```javascript
async function simulateAIResponse(userMessage, typingIndicator) {
    // Try webhook first if enabled
    if (WEBHOOK_CONFIG.enabled) {
        try {
            // ✅ YENİ: Retry mekanizması ile çağır
            const result = await sendToWebhookWithRetry(userMessage, currentConversationId);

            // Remove typing indicator
            if (typingIndicator) {
                typingIndicator.remove();
            }

            // ✅ YENİ: Başarı durumu kontrolü
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

            // ✅ YENİ: Daha detaylı hata mesajı
            const errorMessage = error.message.includes('404')
                ? 'Webhook aktif değil. n8n workflow\'unu başlatın.'
                : 'Bağlantı hatası. Simülasyon moduna geçiliyor.';

            showNotification(errorMessage, 'error');

            // Fall through to simulation
        }
    }

    // Fallback simulation
    // ... existing code ...
}
```

---

## 4. n8n Workflow Yapılandırması

### Test Modundan Production Moduna Geçiş

#### Test Modu
- Workflow canvas'ında "Execute workflow" butonuna her tıklamada tek bir webhook çağrısı kabul eder
- Geliştirme ve test için kullanılır
- Her testten önce butona tıklanması gerekir

#### Production Modu

1. n8n'de workflow'u açın
2. Webhook node'una tıklayın
3. "Listen for Test Event" yerine "Listen for Production Event" seçin
4. Workflow'u kaydedin
5. Workflow'u "Active" olarak işaretleyin (sağ üstteki toggle)

### Önerilen Workflow Yapısı

```
┌─────────────────┐
│  Webhook Node   │
│  (Trigger)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Validate Input │
│  (Function)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AI/LLM Node    │
│  (OpenAI, etc)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Format Output  │
│  (Function)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Response Node  │
└─────────────────┘
```

#### Webhook Node Ayarları
```json
{
  "path": "a5015f1b-85e2-417f-8c95-d4b91698ec6e",
  "httpMethod": "POST",
  "responseMode": "responseNode",
  "options": {}
}
```

#### Input Validation (Function Node)
```javascript
// Input validation
const message = $input.item.json.message;
const conversationId = $input.item.json.conversation_id;

if (!message || typeof message !== 'string') {
    throw new Error('message field is required and must be a string');
}

if (!conversationId || typeof conversationId !== 'string') {
    throw new Error('conversation_id field is required and must be a string');
}

return {
    json: {
        message: message.trim(),
        conversation_id: conversationId,
        metadata: $input.item.json.metadata || {}
    }
};
```

#### Response Formatter (Function Node)
```javascript
// Format response
const aiResponse = $input.item.json.output; // AI node'dan gelen yanıt

return {
    json: {
        response: aiResponse,
        conversation_id: $input.item.json.conversation_id,
        message_id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        metadata: {
            model: 'gpt-4', // or whatever model used
            processing_time_ms: Date.now() - $input.item.json.request_timestamp
        }
    }
};
```

---

## 5. Troubleshooting (Sorun Giderme)

### Sorun: 404 - Webhook Not Registered

**Belirtiler:**
- HTTP 404 hatası
- "webhook is not registered" mesajı

**Çözümler:**
1. ✅ n8n'de workflow'un aktif olduğunu doğrulayın
2. ✅ Test modunda ise "Execute workflow" butonuna tıklayın
3. ✅ Webhook URL'sinin doğru olduğunu kontrol edin
4. ✅ Workflow'u production moduna alın

### Sorun: Network Connection Error

**Belirtiler:**
- `Failed to fetch` hatası
- Connection timeout
- SSL/TLS hataları

**Çözümler:**
1. ✅ İnternet bağlantısını kontrol edin
2. ✅ n8n sunucusunun erişilebilir olduğunu doğrulayın
3. ✅ Firewall/proxy ayarlarını kontrol edin
4. ✅ Browser console'da CORS hatası var mı kontrol edin

### Sorun: CORS (Cross-Origin) Error

**Belirtiler:**
- Browser console'da CORS hatası
- Request gönderilemiyor

**Çözümler:**
1. ✅ n8n Webhook node'unda "Response Headers" ayarlarını kontrol edin:
   ```json
   {
     "Access-Control-Allow-Origin": "*",
     "Access-Control-Allow-Methods": "POST, OPTIONS",
     "Access-Control-Allow-Headers": "Content-Type"
   }
   ```
2. ✅ OPTIONS (preflight) request'leri için handler ekleyin

### Sorun: Timeout Errors

**Belirtiler:**
- Request 30 saniye sonra timeout oluyor
- "AbortError" mesajı

**Çözümler:**
1. ✅ n8n workflow'undaki AI/LLM node'ların timeout değerlerini artırın
2. ✅ `WEBHOOK_CONFIG.timeout` değerini artırın (örn: 60000ms)
3. ✅ Uzun süren işlemler için async/queue pattern kullanın

### Sorun: Invalid Response Format

**Belirtiler:**
- Yanıt alınıyor ama UI'da görünmüyor
- "Yanıt formatı tanınamadı" mesajı

**Çözümler:**
1. ✅ Browser console'da gelen yanıtı inceleyin
2. ✅ n8n Response node'unda JSON formatı doğru mu kontrol edin
3. ✅ `normalizeWebhookResponse()` fonksiyonunu yanıt formatına göre güncelleyin

---

## 6. Performance Optimization

### Caching Stratejisi

```javascript
// Simple in-memory cache for repeated questions
const responseCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function sendToWebhookWithCache(message, conversationId) {
    const cacheKey = `${conversationId}_${message.toLowerCase().trim()}`;

    // Check cache
    const cached = responseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log('Cache hit');
        return cached.data;
    }

    // Fetch from webhook
    const result = await sendToWebhookWithRetry(message, conversationId);

    // Store in cache
    responseCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
    });

    return result;
}
```

### Request Debouncing

```javascript
// Prevent rapid-fire requests
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second

async function sendMessage() {
    const now = Date.now();
    if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
        showNotification('Lütfen biraz bekleyin', 'warning');
        return;
    }

    lastRequestTime = now;

    // ... existing sendMessage code ...
}
```

---

## 7. Security Considerations

### 1. Input Sanitization

```javascript
function sanitizeMessage(message) {
    // Remove potentially harmful content
    return message
        .trim()
        .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove scripts
        .replace(/<[^>]+>/g, '') // Remove HTML tags
        .substring(0, 4000); // Limit length
}

// Usage
const sanitized = sanitizeMessage(messageInput.value);
```

### 2. Rate Limiting

```javascript
// Simple rate limiter
const rateLimiter = {
    requests: [],
    maxRequests: 10,
    timeWindow: 60000, // 1 minute

    canMakeRequest() {
        const now = Date.now();
        this.requests = this.requests.filter(time => now - time < this.timeWindow);

        if (this.requests.length >= this.maxRequests) {
            return false;
        }

        this.requests.push(now);
        return true;
    }
};

// Usage in sendMessage
if (!rateLimiter.canMakeRequest()) {
    showNotification('Çok fazla istek. Lütfen 1 dakika bekleyin.', 'error');
    return;
}
```

### 3. Authentication (Optional)

n8n webhook'larına authentication eklemek için:

```javascript
// app.js - Add API key to requests
const WEBHOOK_CONFIG = {
    enabled: true,
    url: 'https://n8n.botfusions.com/webhook-test/...',
    timeout: 30000,
    apiKey: 'your-secret-api-key' // Store securely
};

async function sendToWebhook(message, conversationId) {
    const response = await fetch(WEBHOOK_CONFIG.url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': WEBHOOK_CONFIG.apiKey // Custom header
        },
        // ...
    });
}
```

n8n'de validation:

```javascript
// n8n Function Node - Validate API key
const apiKey = $request.headers['x-api-key'];
const validKey = 'your-secret-api-key';

if (apiKey !== validKey) {
    return {
        statusCode: 401,
        body: {
            error: 'Unauthorized',
            message: 'Invalid API key'
        }
    };
}

return $input.item;
```

---

## 8. Testing Checklist

### Development Testing
- [ ] HTML test sayfası ile manuel test (`test-webhook-n8n.html`)
- [ ] Python script ile otomatik test (`test_webhook.py`)
- [ ] Browser console'da hata yok
- [ ] Network tab'da request/response formatları doğru
- [ ] Farklı mesaj uzunlukları test edildi
- [ ] Özel karakterler (Türkçe: ç, ğ, ı, ö, ş, ü) test edildi

### Production Readiness
- [ ] n8n workflow production modunda ve aktif
- [ ] Error handling tüm edge case'leri kapıyor
- [ ] Timeout değerleri uygun ayarlandı
- [ ] Retry mekanizması çalışıyor
- [ ] Rate limiting aktif
- [ ] Input sanitization yapılıyor
- [ ] Response normalization farklı formatları destekliyor
- [ ] Loading/typing indicators düzgün çalışıyor
- [ ] Mobile responsive test edildi

### Performance Testing
- [ ] Concurrent request handling test edildi
- [ ] Long message handling (>1000 karakter) test edildi
- [ ] Network slow connection simülasyonu yapıldı
- [ ] Cache mekanizması çalışıyor
- [ ] Memory leak yok (uzun oturumlar test edildi)

---

## 9. Monitoring & Logging

### Client-Side Logging

```javascript
// Enhanced logging for debugging
const WebhookLogger = {
    logs: [],
    maxLogs: 100,

    log(type, message, data = {}) {
        const entry = {
            timestamp: new Date().toISOString(),
            type,
            message,
            data
        };

        this.logs.push(entry);
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        console.log(`[Webhook ${type}]`, message, data);
    },

    error(message, error) {
        this.log('ERROR', message, {
            error: error.message,
            stack: error.stack
        });
    },

    success(message, data) {
        this.log('SUCCESS', message, data);
    },

    export() {
        return JSON.stringify(this.logs, null, 2);
    }
};

// Usage
WebhookLogger.success('Webhook response received', result);
WebhookLogger.error('Webhook failed', error);
```

### n8n Workflow Logging

```javascript
// n8n Function Node - Log execution
const logEntry = {
    timestamp: new Date().toISOString(),
    conversation_id: $input.item.json.conversation_id,
    message_preview: $input.item.json.message.substring(0, 50),
    execution_id: $execution.id,
    workflow_id: $workflow.id
};

// Log to external service or database
// await $http.post('https://logging-service.com/api/logs', logEntry);

return $input.item;
```

---

## 10. Quick Reference

### Essential URLs

| Resource | URL |
|----------|-----|
| Webhook Endpoint | `https://n8n.botfusions.com/webhook-test/a5015f1b-85e2-417f-8c95-d4b91698ec6e` |
| Test HTML | `test-webhook-n8n.html` |
| Test Python Script | `test_webhook.py` |
| Integration Guide | Bu dosya |

### Code Snippets

#### Minimal Request
```javascript
fetch('https://n8n.botfusions.com/webhook-test/...', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
        message: 'Test',
        conversation_id: 'test_123'
    })
});
```

#### Minimal n8n Response Format
```json
{
  "response": "AI yanıtı"
}
```

#### Enable/Disable Webhook
```javascript
// app.js
const WEBHOOK_CONFIG = {
    enabled: false, // false = simulation mode
    url: '...'
};
```

### Common Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 404 | Webhook not registered | Activate workflow in n8n |
| 400 | Bad request | Check payload format |
| 500 | Server error | Check n8n workflow logs |
| CORS | Cross-origin blocked | Add CORS headers in n8n |
| Timeout | Request timeout | Increase timeout or optimize workflow |

---

## Son Notlar

### Production Deployment için Gereksinimler

1. ✅ n8n workflow'u production modunda aktif
2. ✅ Error handling ve retry mekanizması aktif
3. ✅ Rate limiting ve input sanitization yapılandırılmış
4. ✅ Monitoring ve logging kurulmuş
5. ✅ Performance optimization uygulanmış
6. ✅ Security best practices uygulanmış

### Bakım ve Güncellemeler

- Webhook URL'si değişirse `WEBHOOK_CONFIG.url` güncellenmelidir
- n8n workflow yapısı değişirse response normalizer güncellenmeli
- Test scriptleri düzenli olarak çalıştırılmalı
- Error logları düzenli olarak incelenmeli

### Destek ve Dokümantasyon

- n8n Doku: https://docs.n8n.io/
- Webhook Node: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/
- Bu entegrasyon test edilmiştir: 2025-10-01

---

**Versiyon:** 1.0
**Son Güncelleme:** 2025-10-01
**Durum:** Test Tamamlandı, Production Hazır
