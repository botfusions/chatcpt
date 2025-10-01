# Webhook Integration System - Kurulum ve Kullanım Kılavuzu

ChatGPT-style chat arayüzü için webhook entegrasyon sistemi.

## 📋 İçindekiler

- [Sistem Gereksinimleri](#sistem-gereksinimleri)
- [Kurulum](#kurulum)
- [Kullanım](#kullanım)
- [API Referansı](#api-referansı)
- [Test](#test)
- [Konfigürasyon](#konfigürasyon)
- [Sorun Giderme](#sorun-giderme)

## 🔧 Sistem Gereksinimleri

- **Node.js**: v16.0.0 veya üzeri
- **npm**: v7.0.0 veya üzeri
- **Modern Web Browser**: Chrome, Firefox, Safari, Edge

## 📦 Kurulum

### 1. Bağımlılıkları Yükleyin

```bash
npm install
```

Bu komut şu paketleri yükleyecektir:
- `express`: Web sunucu framework
- `cors`: Cross-Origin Resource Sharing desteği
- `uuid`: Benzersiz ID üretimi

### 2. Dosya Yapısı

Kurulum sonrası dosya yapınız şöyle olmalıdır:

```
C:\Users\user\Downloads\Project Claude\Figma\Figma\
├── webhook-server.js      # Backend webhook sunucusu
├── index.html             # Frontend chat arayüzü
├── app.js                 # Frontend JavaScript (webhook entegrasyonlu)
├── styles.css             # CSS stilleri
├── package.json           # NPM konfigürasyonu
├── test-webhook.js        # Test scripti
└── README-WEBHOOK.md      # Bu dosya
```

## 🚀 Kullanım

### Backend Sunucuyu Başlatma

```bash
npm start
```

Sunucu başarıyla başladığında şu çıktıyı göreceksiniz:

```
============================================================
🚀 Webhook Server Başlatıldı
============================================================
📡 Port: 3000
🌐 URL: http://localhost:3000
📝 Endpoints:
   - POST   /webhook
   - POST   /webhook/conversation/:id
   - GET    /webhook/conversation/:id
   - GET    /webhook/conversations
   - DELETE /webhook/conversation/:id
   - GET    /health
============================================================
```

### Frontend Arayüzü Açma

1. **index.html** dosyasını bir web tarayıcısında açın
2. Veya basit bir HTTP sunucusu kullanın:

```bash
# Python 3 ile
python -m http.server 8080

# Node.js ile (npx http-server kurulu ise)
npx http-server -p 8080
```

Tarayıcınızda `http://localhost:8080` adresini açın.

### İlk Mesajınızı Gönderin

1. Chat input alanına bir mesaj yazın
2. Enter tuşuna basın veya "Gönder" butonuna tıklayın
3. Webhook sunucusu mesajınızı işleyecek ve AI yanıtı gönderecektir

## 📡 API Referansı

### POST /webhook

Ana webhook endpoint'i. Chat mesajları için kullanılır.

**Request Body:**
```json
{
  "message": "Kullanıcı mesajı",
  "conversation_id": "opsiyonel-konuşma-id",
  "metadata": {
    "timestamp": "2025-10-01T15:30:00.000Z",
    "userAgent": "Mozilla/5.0..."
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "response": "AI yanıtı",
  "conversation_id": "uuid-v4",
  "message_id": "uuid-v4",
  "timestamp": "2025-10-01T15:30:01.234Z",
  "rateLimit": {
    "remaining": 28
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": ["message alanı zorunludur"]
}
```

**Error Response (429 Too Many Requests):**
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "resetIn": 45
}
```

### GET /health

Sunucu sağlık kontrolü.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-01T15:30:00.000Z",
  "uptime": 12345.678,
  "conversationsCount": 5,
  "memoryUsage": {
    "rss": 50331648,
    "heapTotal": 20971520,
    "heapUsed": 15728640,
    "external": 1234567
  }
}
```

### GET /webhook/conversation/:id

Belirli bir konuşmanın geçmişini getir.

**Response:**
```json
{
  "success": true,
  "conversation": {
    "id": "conversation-uuid",
    "messageCount": 10,
    "messages": [
      {
        "id": "message-uuid",
        "role": "user",
        "content": "Merhaba",
        "timestamp": "2025-10-01T15:30:00.000Z",
        "metadata": {}
      },
      {
        "id": "message-uuid",
        "role": "assistant",
        "content": "Merhaba! Size nasıl yardımcı olabilirim?",
        "timestamp": "2025-10-01T15:30:01.000Z"
      }
    ],
    "createdAt": "2025-10-01T15:00:00.000Z",
    "updatedAt": "2025-10-01T15:30:01.000Z"
  }
}
```

### GET /webhook/conversations

Tüm konuşmaları listele (metadata).

**Response:**
```json
{
  "success": true,
  "count": 3,
  "conversations": [
    {
      "id": "conversation-uuid-1",
      "messageCount": 10,
      "createdAt": "2025-10-01T15:00:00.000Z",
      "updatedAt": "2025-10-01T15:30:00.000Z",
      "lastMessage": "Son mesajın ilk 100 karakteri..."
    }
  ]
}
```

### DELETE /webhook/conversation/:id

Konuşmayı sil.

**Response:**
```json
{
  "success": true,
  "message": "Conversation deleted",
  "conversation_id": "conversation-uuid"
}
```

## 🧪 Test

Webhook sunucusunu test etmek için:

```bash
npm test
```

Test scripti şunları kontrol eder:

1. ✅ Health check endpoint'i
2. ✅ Basit webhook isteği
3. ✅ Konuşma devamı
4. ✅ Input validasyonu
5. ✅ Konuşma getirme
6. ✅ Konuşma listeleme
7. ✅ Matematik işlemleri
8. ✅ Rate limiting

**Örnek Test Çıktısı:**

```
============================================================
🧪 WEBHOOK SERVER TEST SUITE
============================================================
Target: http://localhost:3000

📊 Test 1: Health Check
============================================================
✓ Status code 200
✓ Response has status field
✓ Response has uptime

📨 Test 2: Simple Webhook Request
============================================================
✓ Status code 200
✓ Response has success field
✓ Response has response field
✓ Response has conversation_id
✓ Response has message_id

...

============================================================
📊 TEST SUMMARY
============================================================
✓ Passed: 8
✗ Failed: 0
Total: 8
============================================================
```

## ⚙️ Konfigürasyon

### Backend Konfigürasyonu (webhook-server.js)

Sunucu portunu değiştirmek için environment variable kullanın:

```bash
PORT=3001 npm start
```

Veya kod içinde değiştirin:

```javascript
const PORT = process.env.PORT || 3000;
```

### Frontend Konfigürasyonu (app.js)

Webhook URL'sini değiştirmek için `WEBHOOK_CONFIG` objesini güncelleyin:

```javascript
const WEBHOOK_CONFIG = {
    enabled: true,              // Webhook aktif/pasif
    url: 'http://localhost:3000/webhook',  // Webhook URL
    timeout: 30000,             // İstek timeout (ms)
    retryAttempts: 2            // Yeniden deneme sayısı
};
```

### Rate Limiting Ayarları

`webhook-server.js` içinde rate limiting ayarları:

```javascript
function checkRateLimit(identifier, maxRequests = 30, windowMs = 60000) {
    // maxRequests: Dakikada maksimum istek sayısı
    // windowMs: Pencere süresi (milisaniye)
}
```

## 🔒 Güvenlik Özellikleri

1. **Input Validation**: Tüm girişler doğrulanır
2. **Rate Limiting**: IP bazlı rate limiting (30 istek/dakika)
3. **CORS Desteği**: Cross-origin istekler için yapılandırılabilir
4. **Error Handling**: Kapsamlı hata yönetimi
5. **Timeout Kontrolü**: İstek timeout koruması

## 🐛 Sorun Giderme

### Sunucu Bağlantı Hatası

**Sorun:** Frontend "Webhook sunucusuna bağlanılamıyor" hatası veriyor.

**Çözüm:**
1. Backend sunucusunun çalıştığından emin olun: `npm start`
2. Port çakışması olmadığını kontrol edin
3. CORS ayarlarını kontrol edin
4. Browser console'da detaylı hata mesajlarına bakın

### Rate Limit Hatası

**Sorun:** "Rate limit exceeded" hatası alıyorsunuz.

**Çözüm:**
1. 1 dakika bekleyin (rate limit window sıfırlanır)
2. Rate limit değerlerini artırın (development için)
3. Farklı bir IP/browser kullanın

### CORS Hatası

**Sorun:** Browser console'da CORS hatası görüyorsunuz.

**Çözüm:**

`webhook-server.js` içindeki CORS ayarlarını güncelleyin:

```javascript
app.use(cors({
  origin: 'http://localhost:8080', // Spesifik origin
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
```

### Webhook Devre Dışı Bırakma

Frontend'i webhook olmadan test etmek için:

```javascript
// app.js içinde
const WEBHOOK_CONFIG = {
    enabled: false,  // Webhook'u devre dışı bırak
    // ...
};
```

## 🚀 Production Deployment

### Environment Variables

```bash
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://yourdomain.com
```

### Production Ayarları

1. **CORS**: Sadece güvenilir originlere izin verin
2. **Rate Limiting**: Daha sıkı limitler uygulayın
3. **Logging**: Production logging servisi kullanın
4. **Persistence**: Konuşmaları database'e kaydedin
5. **Load Balancing**: Birden fazla instance çalıştırın

### Önerilen Yapı

```javascript
// Production için Redis/MongoDB kullanın
const conversations = new Map(); // Yerine:
// const redis = require('redis');
// const client = redis.createClient();
```

## 📚 Ek Kaynaklar

- **Express.js Docs**: https://expressjs.com/
- **CORS**: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
- **Fetch API**: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API

## 📝 Lisans

MIT License

## 👥 Destek

Sorularınız için:
1. `test-webhook.js` ile testleri çalıştırın
2. Browser console ve server logs'u kontrol edin
3. Bu README'yi tekrar okuyun

---

**Hazırlayan:** Claude Code
**Tarih:** 2025-10-01
**Versiyon:** 1.0.0
