# ChatCPT - Modern Chat Interface

Modern, responsive chat arayüzü ile n8n webhook entegrasyonu.

## 🌟 Özellikler

- ✨ Modern ve responsive tasarım
- 💬 Gerçek zamanlı mesajlaşma
- 🔄 n8n webhook entegrasyonu
- 📱 Mobil uyumlu
- 💾 LocalStorage ile sohbet geçmişi
- 🔄 3 deneme + exponential backoff (Alafranga tarzı)
- 🎯 Typing indicator animasyonu
- 📊 Detaylı console logging

## 🚀 Hızlı Başlangıç

### 1. Dosyaları İndirin

```bash
git clone https://github.com/kullaniciadi/chatcpt.git
cd chatcpt
```

### 2. Webhook URL'sini Ayarlayın

`app.js` dosyasında webhook URL'nizi güncelleyin:

```javascript
const WEBHOOK_CONFIG = {
    enabled: true,
    url: 'https://n8n.botfusions.com/webhook/YOUR-WEBHOOK-ID',
    timeout: 30000,
    retryAttempts: 3
};
```

### 3. Uygulamayı Başlatın

Tarayıcınızda `index.html` dosyasını açın:

```bash
# Windows
start index.html

# Mac/Linux
open index.html
```

## 📦 Dosya Yapısı

```
chatcpt/
├── index.html          # Ana HTML dosyası
├── app.js             # JavaScript logic + webhook entegrasyonu
├── styles.css         # Stil dosyası
├── .gitignore         # Git ignore kuralları
└── README.md          # Bu dosya
```

## 🔧 n8n Webhook Yapılandırması

### Webhook Node Ayarları

```yaml
Method: POST
Path: /webhook/YOUR-WEBHOOK-ID
Response Mode: "Last Node"
```

### Request Body Format

```json
{
  "text": "kullanıcı mesajı",
  "message": "kullanıcı mesajı",
  "conversation_id": "conv_12345",
  "timestamp": "2025-10-01T12:00:00.000Z"
}
```

### Response Format (Desteklenen)

Aşağıdaki formatlardan herhangi birini döndürebilirsiniz:

```json
// Format 1: output field (önerilen)
{
  "output": "AI yanıtı burada"
}

// Format 2: response field
{
  "response": "AI yanıtı burada"
}

// Format 3: text field
{
  "text": "AI yanıtı burada"
}

// Format 4: message field
{
  "message": "AI yanıtı burada"
}
```

## 🎯 Özellik Detayları

### Retry Mekanizması

3 deneme + exponential backoff:
- 1. deneme başarısız → 1 saniye bekle
- 2. deneme başarısız → 2 saniye bekle
- 3. deneme başarısız → Simülasyon moduna geç

### Typing Indicator

- Minimum 2 saniye bekleme süresi
- Webhook hızlı yanıt verse bile kullanıcı doğal bir deneyim yaşar

### Console Logging

```javascript
[Webhook POST Request] - Gönderilen istek
[Webhook Attempt X/3] - Kaçıncı deneme
n8n'den gelen ham JSON yanıtı - Response preview
```

## 🧪 Test

### Webhook Test Butonu

Sol alt köşedeki "Webhook Test" butonuna tıklayarak bağlantınızı test edin.

### Manuel Test

Console'da (F12):

```javascript
sendToWebhookWithRetry("Test mesajı", "test_123")
```

## 🎨 Özelleştirme

### Webhook Timeout

```javascript
const WEBHOOK_CONFIG = {
    timeout: 30000, // 30 saniye (milisaniye cinsinden)
};
```

### Retry Sayısı

```javascript
const maxRetries = 3; // sendToWebhookWithRetry fonksiyonunda
```

### Typing Indicator Süresi

```javascript
const minimumDelay = new Promise(resolve => setTimeout(resolve, 2000)); // 2 saniye
```

## 🐛 Sorun Giderme

### Webhook 404 Hatası

```
❌ Webhook aktif değil (404). n8n workflow'unu başlatın.
```

**Çözüm**: n8n workflow'unuzu aktif edin ve kaydedin.

### CORS Hatası

```
❌ Bağlantı hatası. CORS veya ağ hatası.
```

**Çözüm**: n8n instance'ınızda CORS ayarlarını kontrol edin.

### 500 Internal Server Error

```
❌ Webhook yanıt vermedi. n8n workflow'unu kontrol edin.
```

**Çözüm**: n8n workflow'unuzdaki node'ları ve bağlantıları kontrol edin.

## 📝 Lisans

MIT License - İstediğiniz gibi kullanabilirsiniz!

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📧 İletişim

Sorularınız için issue açabilirsiniz.

---

**Alafranga tarzı stabil webhook entegrasyonu ile geliştirilmiştir** 🚀
