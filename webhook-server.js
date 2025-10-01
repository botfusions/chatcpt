/**
 * ChatGPT-Style Webhook Integration Server
 *
 * Bu sunucu chat arayüzü için webhook entegrasyonu sağlar.
 * Mesajları işler, konuşma geçmişini yönetir ve AI yanıtları üretir.
 */

const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================================
// Middleware Yapılandırması
// ============================================================================

// CORS - Tüm originlere izin (Production'da kısıtlayın)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// JSON body parsing - 10MB limit
app.use(express.json({ limit: '10mb' }));

// URL-encoded data parsing
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// Veri Yapıları (Production'da Redis/DB kullanın)
// ============================================================================

// Konuşma geçmişi storage
const conversations = new Map();

// Rate limiting için basit tracker
const rateLimits = new Map();

// ============================================================================
// Yardımcı Fonksiyonlar
// ============================================================================

/**
 * Konuşma geçmişini al veya yeni oluştur
 */
function getOrCreateConversation(conversationId) {
  if (!conversationId) {
    conversationId = uuidv4();
  }

  if (!conversations.has(conversationId)) {
    conversations.set(conversationId, {
      id: conversationId,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  return conversations.get(conversationId);
}

/**
 * AI yanıtı simüle et (Gerçek implementasyonda LLM API kullanın)
 */
async function generateAIResponse(message, conversationHistory) {
  // Basit pattern matching tabanlı yanıtlar
  const lowerMessage = message.toLowerCase();

  // Simüle edilmiş işlem süresi (100-500ms)
  await new Promise(resolve => setTimeout(resolve, Math.random() * 400 + 100));

  // Kontext-aware yanıtlar
  if (lowerMessage.includes('merhaba') || lowerMessage.includes('selam')) {
    return 'Merhaba! Size nasıl yardımcı olabilirim?';
  }

  if (lowerMessage.includes('nasılsın') || lowerMessage.includes('naber')) {
    return 'Ben bir AI asistanıyım, her zaman iyiyim! Size nasıl yardımcı olabilirim?';
  }

  if (lowerMessage.includes('hava durumu')) {
    return 'Hava durumu bilgisi için dış API entegrasyonu gerekiyor. Şu an bu özellik aktif değil.';
  }

  if (lowerMessage.includes('saat') || lowerMessage.includes('zaman')) {
    return `Şu anki zaman: ${new Date().toLocaleString('tr-TR')}`;
  }

  if (lowerMessage.includes('yardım') || lowerMessage.includes('help')) {
    return `Size şu konularda yardımcı olabilirim:
- Genel sorular
- Konuşma
- Bilgi alma
- Basit hesaplamalar

Ne yapmamı istersiniz?`;
  }

  // Matematik işlemleri
  const mathMatch = message.match(/(\d+)\s*([+\-*/])\s*(\d+)/);
  if (mathMatch) {
    const [, num1, operator, num2] = mathMatch;
    const a = parseFloat(num1);
    const b = parseFloat(num2);
    let result;

    switch(operator) {
      case '+': result = a + b; break;
      case '-': result = a - b; break;
      case '*': result = a * b; break;
      case '/': result = b !== 0 ? a / b : 'Sıfıra bölme hatası'; break;
    }

    return `${a} ${operator} ${b} = ${result}`;
  }

  // Varsayılan yanıt
  const defaultResponses = [
    `"${message}" hakkında düşünüyorum... Bu ilginç bir konu!`,
    `Anladım. "${message}" ile ilgili daha fazla bilgi verir misiniz?`,
    `Harika soru! "${message}" konusunda size yardımcı olmaya çalışayım.`,
    `"${message}" - Bu konuda daha spesifik bir soru sorabilir misiniz?`
  ];

  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

/**
 * Rate limiting kontrolü
 */
function checkRateLimit(identifier, maxRequests = 30, windowMs = 60000) {
  const now = Date.now();
  const userLimits = rateLimits.get(identifier) || { count: 0, resetTime: now + windowMs };

  if (now > userLimits.resetTime) {
    // Pencere sıfırlandı
    rateLimits.set(identifier, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (userLimits.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: Math.ceil((userLimits.resetTime - now) / 1000)
    };
  }

  userLimits.count++;
  rateLimits.set(identifier, userLimits);

  return { allowed: true, remaining: maxRequests - userLimits.count };
}

/**
 * Input validation
 */
function validateWebhookInput(data) {
  const errors = [];

  if (!data.message) {
    errors.push('message alanı zorunludur');
  } else if (typeof data.message !== 'string') {
    errors.push('message bir string olmalıdır');
  } else if (data.message.trim().length === 0) {
    errors.push('message boş olamaz');
  } else if (data.message.length > 5000) {
    errors.push('message 5000 karakterden uzun olamaz');
  }

  if (data.conversation_id && typeof data.conversation_id !== 'string') {
    errors.push('conversation_id bir string olmalıdır');
  }

  return errors;
}

// ============================================================================
// API Endpoints
// ============================================================================

/**
 * Sağlık kontrolü endpoint'i
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    conversationsCount: conversations.size,
    memoryUsage: process.memoryUsage()
  });
});

/**
 * Ana webhook endpoint - Chat mesajlarını işler
 *
 * Request Body:
 * {
 *   "message": "Kullanıcı mesajı",
 *   "conversation_id": "opsiyonel-konuşma-id",
 *   "metadata": { ... } // Opsiyonel metadata
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "response": "AI yanıtı",
 *   "conversation_id": "konuşma-id",
 *   "message_id": "mesaj-id",
 *   "timestamp": "ISO-8601-zaman"
 * }
 */
app.post('/webhook', async (req, res) => {
  try {
    const { message, conversation_id, metadata } = req.body;

    // Input validation
    const validationErrors = validateWebhookInput(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
    }

    // Rate limiting
    const clientIp = req.ip || req.connection.remoteAddress;
    const rateCheck = checkRateLimit(clientIp);

    if (!rateCheck.allowed) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        resetIn: rateCheck.resetIn
      });
    }

    // Konuşmayı al veya oluştur
    const conversation = getOrCreateConversation(conversation_id);

    // Kullanıcı mesajını kaydet
    const userMessage = {
      id: uuidv4(),
      role: 'user',
      content: message.trim(),
      timestamp: new Date().toISOString(),
      metadata: metadata || {}
    };

    conversation.messages.push(userMessage);

    // AI yanıtı üret
    const aiResponseText = await generateAIResponse(
      message,
      conversation.messages
    );

    // AI yanıtını kaydet
    const aiMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: aiResponseText,
      timestamp: new Date().toISOString()
    };

    conversation.messages.push(aiMessage);
    conversation.updatedAt = new Date().toISOString();

    // Başarılı yanıt
    res.json({
      success: true,
      response: aiResponseText,
      conversation_id: conversation.id,
      message_id: aiMessage.id,
      timestamp: aiMessage.timestamp,
      rateLimit: {
        remaining: rateCheck.remaining
      }
    });

    console.log(`✓ Mesaj işlendi: ${conversation.id} (${conversation.messages.length} mesaj)`);

  } catch (error) {
    console.error('Webhook hatası:', error);

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Bir hata oluştu'
    });
  }
});

/**
 * Belirli bir konuşmaya mesaj gönderme
 */
app.post('/webhook/conversation/:id', async (req, res) => {
  try {
    const conversationId = req.params.id;
    const { message, metadata } = req.body;

    // Konuşmanın var olup olmadığını kontrol et
    if (!conversations.has(conversationId)) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found',
        conversation_id: conversationId
      });
    }

    // Validation
    const validationErrors = validateWebhookInput({ message, conversation_id: conversationId });
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
    }

    // Rate limiting
    const clientIp = req.ip || req.connection.remoteAddress;
    const rateCheck = checkRateLimit(clientIp);

    if (!rateCheck.allowed) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        resetIn: rateCheck.resetIn
      });
    }

    const conversation = conversations.get(conversationId);

    // Kullanıcı mesajını ekle
    const userMessage = {
      id: uuidv4(),
      role: 'user',
      content: message.trim(),
      timestamp: new Date().toISOString(),
      metadata: metadata || {}
    };

    conversation.messages.push(userMessage);

    // AI yanıtı üret
    const aiResponseText = await generateAIResponse(message, conversation.messages);

    // AI mesajını ekle
    const aiMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: aiResponseText,
      timestamp: new Date().toISOString()
    };

    conversation.messages.push(aiMessage);
    conversation.updatedAt = new Date().toISOString();

    res.json({
      success: true,
      response: aiResponseText,
      conversation_id: conversation.id,
      message_id: aiMessage.id,
      timestamp: aiMessage.timestamp,
      message_count: conversation.messages.length,
      rateLimit: {
        remaining: rateCheck.remaining
      }
    });

  } catch (error) {
    console.error('Konuşma mesajı hatası:', error);

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Bir hata oluştu'
    });
  }
});

/**
 * Konuşma geçmişini getir
 */
app.get('/webhook/conversation/:id', (req, res) => {
  const conversationId = req.params.id;

  if (!conversations.has(conversationId)) {
    return res.status(404).json({
      success: false,
      error: 'Conversation not found'
    });
  }

  const conversation = conversations.get(conversationId);

  res.json({
    success: true,
    conversation: {
      id: conversation.id,
      messageCount: conversation.messages.length,
      messages: conversation.messages,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt
    }
  });
});

/**
 * Tüm konuşmaları listele (sadece metadata)
 */
app.get('/webhook/conversations', (req, res) => {
  const conversationList = Array.from(conversations.values()).map(conv => ({
    id: conv.id,
    messageCount: conv.messages.length,
    createdAt: conv.createdAt,
    updatedAt: conv.updatedAt,
    lastMessage: conv.messages[conv.messages.length - 1]?.content.substring(0, 100) || null
  }));

  res.json({
    success: true,
    count: conversationList.length,
    conversations: conversationList
  });
});

/**
 * Konuşmayı sil
 */
app.delete('/webhook/conversation/:id', (req, res) => {
  const conversationId = req.params.id;

  if (!conversations.has(conversationId)) {
    return res.status(404).json({
      success: false,
      error: 'Conversation not found'
    });
  }

  conversations.delete(conversationId);

  res.json({
    success: true,
    message: 'Conversation deleted',
    conversation_id: conversationId
  });
});

// ============================================================================
// Error Handling Middleware
// ============================================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    path: req.path
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  res.status(err.status || 500).json({
    success: false,
    error: 'Server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Bir hata oluştu'
  });
});

// ============================================================================
// Server Başlatma
// ============================================================================

const server = app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🚀 Webhook Server Başlatıldı');
  console.log('='.repeat(60));
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`📝 Endpoints:`);
  console.log(`   - POST   /webhook`);
  console.log(`   - POST   /webhook/conversation/:id`);
  console.log(`   - GET    /webhook/conversation/:id`);
  console.log(`   - GET    /webhook/conversations`);
  console.log(`   - DELETE /webhook/conversation/:id`);
  console.log(`   - GET    /health`);
  console.log('='.repeat(60));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM alındı, server kapatılıyor...');
  server.close(() => {
    console.log('Server kapatıldı');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT alındı, server kapatılıyor...');
  server.close(() => {
    console.log('Server kapatıldı');
    process.exit(0);
  });
});

module.exports = app;
