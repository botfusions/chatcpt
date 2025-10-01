# n8n Webhook Entegrasyonu - Hızlı Sorun Giderme

## Hızlı Test

### 1. HTML Test Sayfası ile Test
```bash
# test-webhook-n8n.html dosyasını tarayıcıda açın
# Mesaj girin ve "Webhook'u Test Et" butonuna tıklayın
```

### 2. Browser Console ile Test
```javascript
// Browser console'da çalıştırın:
fetch('https://n8n.botfusions.com/webhook-test/a5015f1b-85e2-417f-8c95-d4b91698ec6e', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
        message: 'Test mesajı',
        conversation_id: 'test_' + Date.now()
    })
})
.then(r => r.json())
.then(d => console.log('Yanıt:', d))
.catch(e => console.error('Hata:', e));
```

---

## Yaygın Hatalar ve Çözümleri

### ❌ Hata: "webhook is not registered"

**HTTP Status:** 404

**Tam Hata Mesajı:**
```json
{
  "code": 404,
  "message": "The requested webhook \"...\" is not registered.",
  "hint": "Click the 'Execute workflow' button on the canvas..."
}
```

**Neden:**
- n8n workflow'u test modunda ve henüz execute edilmemiş
- Workflow aktif değil
- Workflow silinmiş veya değiştirilmiş

**Çözüm:**

**Test Modu için:**
1. n8n'de workflow'u açın
2. Canvas'ta "Execute workflow" butonuna tıklayın
3. 1 dakika içinde webhook'u test edin
4. Her testten önce butona tekrar tıklayın

**Production için:**
1. n8n'de workflow'u açın
2. Webhook node'una tıklayın
3. "Listen for Test Event" → "Listen for Production Event" değiştirin
4. Workflow'u kaydedin
5. Sağ üstteki toggle ile workflow'u "Active" yapın

**Hızlı Kontrol:**
```javascript
// app.js içinde WEBHOOK_CONFIG.enabled = false yapın
// Simülasyon modu ile uygulamanın çalıştığını doğrulayın
```

---

### ❌ Hata: "Failed to fetch" / Connection Error

**Console Hatası:**
```
TypeError: Failed to fetch
```

**Neden:**
- İnternet bağlantısı yok
- n8n sunucusu erişilebilir değil
- CORS hatası
- Firewall/Proxy engelliyor

**Çözüm:**

**1. Bağlantı Testi:**
```bash
# Terminal/CMD'de çalıştırın:
ping n8n.botfusions.com
```

**2. Browser'da Direkt Test:**
```
Tarayıcıda açın: https://n8n.botfusions.com
# Sayfa açılıyor mu kontrol edin
```

**3. CORS Kontrolü:**
- Browser console'da "CORS" kelimesi var mı bakın
- n8n Webhook node'unda Response Headers ekleyin:
  ```json
  {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  }
  ```

**4. Simülasyon Moduna Geç:**
```javascript
// app.js
const WEBHOOK_CONFIG = {
    enabled: false, // false = offline mod
    url: '...'
};
```

---

### ❌ Hata: Request Timeout (30 saniye)

**Console Hatası:**
```
Error: İstek zaman aşımına uğradı. Lütfen tekrar deneyin.
```

**Neden:**
- n8n workflow çok uzun sürüyor
- AI/LLM node yanıt veremiyor
- Network yavaş

**Çözüm:**

**1. Timeout Süresini Artırın:**
```javascript
// app.js
const WEBHOOK_CONFIG = {
    enabled: true,
    url: '...',
    timeout: 60000, // 30000 → 60000 (60 saniye)
    retryAttempts: 2
};
```

**2. n8n Workflow'u Optimize Edin:**
- AI node timeout ayarlarını kontrol edin
- Gereksiz node'ları kaldırın
- Cache mekanizması ekleyin

**3. Loading Indicator Süresi:**
```javascript
// Kullanıcıya daha uzun bekleme mesajı gösterin
// typing indicator yerine progress bar kullanın
```

---

### ❌ Hata: "Yanıt formatı tanınamadı"

**Console Uyarısı:**
```
Unknown webhook response format: {...}
```

**Neden:**
- n8n workflow beklenmedik formatta yanıt döndü
- Response node yanlış yapılandırılmış

**Çözüm:**

**1. Gelen Yanıtı İnceleyin:**
```javascript
// Browser console'da:
// Network tab → webhook isteği → Response tab
// Gelen JSON formatını kopyalayın
```

**2. n8n Response Node'unu Düzeltin:**

n8n'de Response node'unda şu formatlardan birini kullanın:

**Format A - Standart:**
```json
{
  "response": "AI yanıt metni buraya"
}
```

**Format B - Detaylı:**
```json
{
  "response": "AI yanıt metni",
  "conversation_id": "{{$json.conversation_id}}",
  "message_id": "msg_{{$now}}",
  "timestamp": "{{$now}}"
}
```

**3. normalizeWebhookResponse Fonksiyonunu Güncelleyin:**

Eğer özel bir format kullanıyorsanız, `app.js` içinde:

```javascript
function normalizeWebhookResponse(data, conversationId) {
    // ... mevcut kod ...

    // CUSTOM FORMAT - kendi formatınızı ekleyin:
    if (data.yourCustomField) {
        return {
            success: true,
            response: data.yourCustomField,
            conversationId: conversationId,
            messageId: null,
            timestamp: new Date().toISOString()
        };
    }

    // ... geri kalan kod ...
}
```

---

### ❌ Hata: Türkçe Karakterler Bozuk Görünüyor

**Semptom:**
- "ş" → "Å" gibi görünüyor
- Türkçe karakterler hatalı

**Çözüm:**

**1. n8n Response Headers:**
```json
{
  "Content-Type": "application/json; charset=utf-8"
}
```

**2. HTML Meta Tag Kontrolü:**
```html
<meta charset="UTF-8">
```

**3. JavaScript String Handling:**
```javascript
// app.js - escapeHtml fonksiyonunu kullanın
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
```

---

### ❌ Hata: Retry Çalışmıyor

**Semptom:**
- Network hatası oluyor ama retry yapılmıyor
- Hata mesajı hemen gösteriliyor

**Çözüm:**

**1. Retry Ayarlarını Kontrol Edin:**
```javascript
const WEBHOOK_CONFIG = {
    enabled: true,
    url: '...',
    timeout: 30000,
    retryAttempts: 2 // 0 ise retry yok
};
```

**2. sendToWebhookWithRetry Kullanıldığını Doğrulayın:**
```javascript
// simulateAIResponse içinde:
const result = await sendToWebhookWithRetry(userMessage, currentConversationId);
// ✅ DOĞRU

// Yanlış:
// const result = await sendToWebhook(userMessage, currentConversationId);
```

**3. Console Loglarını Kontrol Edin:**
```javascript
// Şu mesajı görüyor olmalısınız:
// "Retry attempt 1/2"
// "Retry attempt 2/2"
```

---

## Test Checklist

### Başlamadan Önce

- [ ] n8n sunucusu erişilebilir (https://n8n.botfusions.com)
- [ ] Workflow oluşturulmuş ve ID'si alınmış
- [ ] `WEBHOOK_CONFIG.url` doğru webhook URL'sini içeriyor
- [ ] Browser console açık (F12)

### Test Modunda Test

1. [ ] n8n'de "Execute workflow" butonuna tıkladım
2. [ ] 1 dakika içinde test mesajı gönderdim
3. [ ] Yanıt geldi mi kontrol ettim
4. [ ] Browser console'da hata yok
5. [ ] Network tab'da request/response kontrol ettim

### Production Modunda Test

1. [ ] Workflow "Production" moduna aldım
2. [ ] Workflow "Active" durumda
3. [ ] Test mesajı gönderebiliyorum
4. [ ] Retry mekanizması çalışıyor
5. [ ] Hata mesajları kullanıcı dostu

### Performans Testi

- [ ] Ardışık 5 mesaj gönderdim (sıra beklemek yok)
- [ ] Uzun mesaj (>500 karakter) test ettim
- [ ] Özel karakterler (ç, ğ, ı, ö, ş, ü) test ettim
- [ ] Network yavaş simülasyonu yaptım (Chrome DevTools)
- [ ] Timeout senaryosu test ettim

---

## Debug Modu Aktivasyonu

### app.js'e Debug Logger Ekleme

```javascript
// app.js en üste ekleyin:
const DEBUG = true; // true = debug modu açık

function debugLog(category, message, data = {}) {
    if (!DEBUG) return;

    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${category}]`, message, data);
}

// Kullanım:
debugLog('WEBHOOK', 'Sending request', {
    message: userMessage,
    conversationId: currentConversationId
});

debugLog('WEBHOOK', 'Response received', result);
```

### Console'da Manuel Debug

```javascript
// Browser console'da:

// 1. Config kontrolü
console.log('Webhook Config:', WEBHOOK_CONFIG);

// 2. Son conversation ID
console.log('Current Conversation:', currentConversationId);

// 3. Tüm conversations
console.log('All Conversations:', conversations);

// 4. Manuel webhook testi
sendToWebhook('Test', 'test_123')
    .then(r => console.log('Success:', r))
    .catch(e => console.error('Error:', e));
```

---

## Acil Durum: Simülasyon Moduna Geçiş

Webhook çalışmıyorsa ve hızlıca uygulamayı çalıştırmanız gerekiyorsa:

```javascript
// app.js - 210. satır civarı
const WEBHOOK_CONFIG = {
    enabled: false, // ✅ false yapın
    url: 'https://n8n.botfusions.com/webhook-test/a5015f1b-85e2-417f-8c95-d4b91698ec6e',
    timeout: 30000,
    retryAttempts: 2
};
```

Bu durumda:
- ✅ Uygulama offline çalışır
- ✅ Simülasyon yanıtları gösterir
- ✅ UI/UX test edilebilir
- ❌ Gerçek AI yanıtları alınmaz

---

## Yardım Alma

### Logları Toplama

```javascript
// Browser console'da çalıştırın:
const logs = {
    config: WEBHOOK_CONFIG,
    conversations: conversations,
    currentId: currentConversationId,
    consoleErrors: 'Console tab\'ı screenshot alın'
};

console.log('Debug Logs:', JSON.stringify(logs, null, 2));
// Çıktıyı kopyalayın ve destek ekibine gönderin
```

### Screenshot Alınacak Yerler

1. Browser Console (F12 → Console tab)
2. Network Tab (F12 → Network → webhook isteği)
3. n8n Workflow Canvas
4. n8n Execution Log (hatası varsa)

### Kontrol Edilecek Bilgiler

- Browser: Chrome/Firefox/Edge/Safari
- Browser Version: (chrome://version)
- İşletim Sistemi: Windows/Mac/Linux
- Webhook URL: (tam URL)
- n8n Workflow ID: (workflow'dan alın)
- Hata Mesajı: (tam metin)
- Console Log: (screenshot veya metin)

---

## Son Kontrol

İşte çalışan bir entegrasyon için kontrol listesi:

### Frontend (app.js)
- [x] `WEBHOOK_CONFIG.enabled = true`
- [x] `WEBHOOK_CONFIG.url` doğru
- [x] `sendToWebhookWithRetry()` kullanılıyor
- [x] `normalizeWebhookResponse()` mevcut
- [x] Error handling var

### Backend (n8n)
- [ ] Workflow oluşturulmuş
- [ ] Webhook node yapılandırılmış
- [ ] Production modunda veya Execute edilmiş
- [ ] Response node doğru format döndürüyor
- [ ] Workflow "Active" durumda

### Test
- [ ] HTML test sayfası çalışıyor
- [ ] Browser console'da hata yok
- [ ] Yanıt UI'da görünüyor
- [ ] Retry mekanizması çalışıyor
- [ ] Türkçe karakterler düzgün

**Hepsi tamam ise, webhook entegrasyonunuz çalışır durumda!** ✅

---

**Güncellenme:** 2025-10-01
**Versiyon:** 1.0
**İlgili Dosya:** N8N_WEBHOOK_INTEGRATION_GUIDE.md
