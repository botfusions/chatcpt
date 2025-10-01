# 🚀 Hızlı Başlangıç Kılavuzu

ChatGPT-style webhook entegrasyonunu 5 dakikada çalıştırın!

## ⚡ Hızlı Kurulum (Windows)

### Otomatik Başlatma

```cmd
start.bat
```

Bu script:
1. ✅ Bağımlılıkları yükler (ilk çalıştırmada)
2. ✅ Webhook sunucusunu başlatır
3. ✅ Sağlık kontrolü yapar

### Manuel Kurulum

```bash
# 1. Bağımlılıkları yükleyin
npm install

# 2. Sunucuyu başlatın
npm start
```

## 🌐 Frontend'i Açın

1. **index.html** dosyasını tarayıcıda açın
2. Veya basit bir HTTP sunucusu kullanın:

```bash
# Python ile
python -m http.server 8080

# Node.js ile
npx http-server -p 8080
```

Tarayıcıda `http://localhost:8080` adresini açın.

## ✅ Doğrulama

### 1. Sunucu Sağlık Kontrolü

Tarayıcıda: `http://localhost:3000/health`

Beklenen yanıt:
```json
{
  "status": "healthy",
  "uptime": 123.456,
  "conversationsCount": 0
}
```

### 2. Test Suite Çalıştırma

```bash
npm test
```

Tüm testler ✅ geçmeli.

### 3. İlk Mesajı Gönderme

1. Frontend arayüzünde input alanına mesaj yazın
2. Enter tuşuna basın
3. AI yanıtını görün!

## 📁 Dosya Yapısı

```
C:\Users\user\Downloads\Project Claude\Figma\Figma\
│
├── 🖥️  Backend
│   ├── webhook-server.js      # Express webhook sunucusu
│   ├── package.json            # NPM dependencies
│   └── test-webhook.js         # Test suite
│
├── 🌐 Frontend
│   ├── index.html              # Chat arayüzü
│   ├── app.js                  # JavaScript (webhook entegrasyonlu)
│   └── styles.css              # CSS stilleri
│
├── 📚 Dokümantasyon
│   ├── README-WEBHOOK.md       # Tam dokümantasyon
│   ├── QUICK-START.md          # Bu dosya
│   └── .env.example            # Environment değişkenleri
│
└── 🔧 Utility
    ├── start.bat               # Windows başlatma scripti
    └── .gitignore              # Git ignore kuralları
```

## 🎯 Ana Endpoint'ler

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| `POST` | `/webhook` | Mesaj gönder |
| `GET` | `/health` | Sağlık kontrolü |
| `GET` | `/webhook/conversations` | Konuşmaları listele |
| `GET` | `/webhook/conversation/:id` | Konuşma detayı |
| `DELETE` | `/webhook/conversation/:id` | Konuşmayı sil |

## 💡 Örnek Kullanım

### cURL ile Test

```bash
# Health check
curl http://localhost:3000/health

# Mesaj gönder
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"message": "Merhaba!"}'

# Konuşmaları listele
curl http://localhost:3000/webhook/conversations
```

### JavaScript ile Test

```javascript
// Mesaj gönder
const response = await fetch('http://localhost:3000/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        message: 'Merhaba!',
        conversation_id: null  // Yeni konuşma
    })
});

const data = await response.json();
console.log(data.response);
console.log(data.conversation_id);
```

## ⚙️ Konfigürasyon

### Port Değiştirme

```bash
# Windows
set PORT=3001 && npm start

# Linux/Mac
PORT=3001 npm start
```

### Webhook Devre Dışı Bırakma

`app.js` içinde:

```javascript
const WEBHOOK_CONFIG = {
    enabled: false,  // Simülasyon modu
    // ...
};
```

## 🐛 Sorun Giderme

### "Cannot find module" Hatası

```bash
npm install
```

### "Port already in use" Hatası

Farklı bir port kullanın:

```bash
PORT=3001 npm start
```

Veya portunu kullanan işlemi kapatın:

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Frontend Bağlantı Hatası

1. ✅ Backend sunucusunun çalıştığından emin olun
2. ✅ Browser console'da hata mesajlarını kontrol edin
3. ✅ `app.js` içindeki `WEBHOOK_CONFIG.url` adresini kontrol edin

## 📊 Özellikler

### Mevcut Özellikler

- ✅ Real-time mesajlaşma
- ✅ Konuşma geçmişi (localStorage)
- ✅ Rate limiting (30 req/min)
- ✅ Input validation
- ✅ Error handling
- ✅ CORS desteği
- ✅ Health check endpoint
- ✅ Matematik işlemleri
- ✅ Pattern-based yanıtlar

### Geliştirilebilir Özellikler

- 🔄 LLM API entegrasyonu (OpenAI, Anthropic, vb.)
- 🔄 Database persistence (MongoDB, PostgreSQL)
- 🔄 User authentication
- 🔄 File upload desteği
- 🔄 Multi-language support
- 🔄 Message editing/deletion
- 🔄 Typing indicator improvement
- 🔄 Voice input/output

## 🔐 Güvenlik Notları

⚠️ **Development ortamı için tasarlanmıştır**

Production'da:
1. ✅ CORS origin'i kısıtlayın
2. ✅ HTTPS kullanın
3. ✅ Authentication ekleyin
4. ✅ Rate limiting'i sıkılaştırın
5. ✅ Input validation'ı güçlendirin
6. ✅ Database kullanın (in-memory storage yerine)

## 📖 Daha Fazla Bilgi

Detaylı dokümantasyon için: **[README-WEBHOOK.md](README-WEBHOOK.md)**

## 🎓 Öğrenme Kaynakları

- [Express.js Tutorial](https://expressjs.com/en/starter/installing.html)
- [Fetch API Guide](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [CORS Explained](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [REST API Best Practices](https://restfulapi.net/)

## 🤝 Katkıda Bulunma

Bu bir starter template'dir. Kendi ihtiyaçlarınıza göre özelleştirin!

---

**Happy Coding! 🚀**

Sorularınız mı var? **README-WEBHOOK.md** dosyasına bakın.
