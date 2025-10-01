# 🧪 Site Test Rehberi

## 📋 Test Edilen Sayfalar

Tarayıcınızda şu dosyalar açıldı:

1. **index.html** - Ana chat uygulaması
2. **quick-test.html** - Webhook POST test aracı (otomatik çalışır)

---

## ✅ Test Kontrol Listesi

### 1️⃣ Webhook Bağlantısı Testi

**quick-test.html sayfasında kontrol edin:**

✅ **Başarılı ise göreceksiniz:**
- ✅ HTTP Status: 200 OK
- ✅ JSON Parse Başarılı
- ✅ response field var
- ✅ conversation_id field var

❌ **Hata durumları:**
- ❌ HTTP 404: Webhook kayıtlı değil (n8n workflow'u aktif değil)
- ❌ Failed to fetch: CORS hatası veya network problemi
- ❌ Timeout: n8n çok yavaş yanıt veriyor

---

### 2️⃣ Ana Chat Uygulaması Testi

**index.html sayfasında test edin:**

#### A) Görsel Kontroller
- [ ] Sidebar görünüyor mu? (sol tarafta)
- [ ] "Yeni Sohbet" butonu çalışıyor mu?
- [ ] Mesaj input alanı alt tarafta mı?
- [ ] Dark theme düzgün görünüyor mu?

#### B) Fonksiyonel Testler

**Test 1: İlk Mesaj**
1. "Merhaba" yazın ve Enter basın
2. **Beklenen:**
   - ✅ Mesajınız sağda görünmeli (mavi)
   - ✅ "Typing..." göstergesi görünmeli
   - ✅ Webhook yanıtı solda görünmeli (gri)
   - ✅ Sidebar'da yeni konuşma oluşmalı

**Test 2: Webhook Çalışıyor mu?**
1. Browser Console'u açın (F12)
2. Mesaj gönderin
3. **Başarılı ise:**
   ```
   📤 Gönderilen payload: {...}
   📥 HTTP Status: 200
   ```
4. **Hata ise:**
   ```
   ❌ Webhook failed, falling back to simulation
   ```

**Test 3: Simülasyon Modu (Webhook Kapalı)**
1. Eğer webhook hata veriyorsa otomatik simülasyona geçer
2. Rastgele yanıtlar görürsünüz:
   - "Bu çok ilginç bir soru..."
   - "Anladım. Bu konuda..."

**Test 4: Konuşma Geçmişi**
1. Birkaç mesaj gönderin
2. Sidebar'dan yeni sohbet açın
3. Eski sohbete tekrar tıklayın
4. **Beklenen:** Tüm mesajlar yüklensin

**Test 5: Mobil Responsive**
1. Browser penceresini daraltın (<768px)
2. **Beklenen:**
   - ☰ Menü ikonu görünmeli
   - Sidebar gizlenmeli
   - Menü ikonuna tıklayınca sidebar açılmalı

---

### 3️⃣ Browser Console Kontrolleri

**F12 tuşuna basın → Console sekmesi**

#### Webhook Aktif ve Çalışıyor:
```javascript
📤 Gönderilen payload: {message: "test", conversation_id: "..."}
📥 HTTP Status: 200
✅ Webhook response: {...}
```

#### Webhook Aktif Ama Hata Veriyor:
```javascript
❌ Webhook error: Error: HTTP 404
⚠️ Webhook failed, falling back to simulation
```

#### Webhook Kapalı (WEBHOOK_CONFIG.enabled = false):
```javascript
ℹ️ Webhook disabled, using simulation mode
```

---

## 🔧 Webhook Durumuna Göre Beklentiler

### Senaryo 1: n8n Workflow Aktif ✅
- Webhook çalışıyor
- Gerçek AI yanıtları alıyorsunuz
- Console'da başarılı log'lar görüyorsunuz

### Senaryo 2: n8n Workflow Aktif Değil ❌
- HTTP 404 hatası alırsınız
- Otomatik simülasyon moduna geçer
- Rastgele canned yanıtlar görürsünüz
- Üstte kırmızı bildirim: "Webhook aktif değil"

### Senaryo 3: Network/CORS Hatası ❌
- "Failed to fetch" hatası
- Simülasyon moduna geçer
- CORS ayarlarını kontrol edin

---

## 🐛 Sorun Giderme

### Problem: Mesajlar görünmüyor
**Kontrol:**
- Browser console'da JavaScript hatası var mı?
- LocalStorage temiz mi? (`localStorage.clear()` deneyin)

### Problem: Webhook çalışmıyor
**Kontrol:**
1. `app.js` satır 211: URL doğru mu?
   ```javascript
   url: 'https://n8n.botfusions.com/webhook/a5015f1b-85e2-417f-8c95-d4b91698ec6e'
   ```
2. `app.js` satır 210: `enabled: true` mu?
3. n8n workflow'u aktif mi?
4. `quick-test.html` ile webhook'u manuel test edin

### Problem: Her zaman simülasyon modu
**Neden:**
- `WEBHOOK_CONFIG.enabled = false` olabilir
- Webhook URL yanlış
- n8n down

**Çözüm:**
1. `app.js` dosyasını kontrol et
2. `quick-test.html` ile webhook'u test et
3. n8n admin panelinde workflow'u kontrol et

---

## 📊 Beklenen Test Sonuçları

### ✅ Tam Başarılı Senaryo
1. ✅ Sayfa düzgün yüklendi
2. ✅ quick-test.html → HTTP 200, JSON response
3. ✅ index.html → Mesaj gönderildi
4. ✅ Webhook'tan gerçek yanıt alındı
5. ✅ Yanıt ekranda gösterildi
6. ✅ Konuşma sidebar'a eklendi
7. ✅ LocalStorage'a kaydedildi

### ⚠️ Webhook Kapalı Ama UI Çalışıyor
1. ✅ Sayfa düzgün yüklendi
2. ❌ quick-test.html → HTTP 404 veya error
3. ✅ index.html → Mesaj gönderildi
4. ⚠️ Simülasyon yanıtı gösterildi
5. ✅ UI tamamen çalışıyor

### ❌ Tamamen Başarısız
1. ❌ Sayfa yüklenmiyor
2. ❌ JavaScript hataları
3. ❌ Mesaj gönderilemedi
4. ❌ Console'da fatal errors

---

## 🎯 Test Sonuçlarını Raporlama

### Manuel Test Formu

```
WEBHOOK TEST:
[ ] HTTP Status: ___
[ ] Response Type: JSON / Plain Text / Error
[ ] Response Time: ___ms

UI TEST:
[ ] Sayfa görünümü: OK / Problem
[ ] Mesaj gönderebildim: Evet / Hayır
[ ] Yanıt aldım: Webhook / Simülasyon / Hiç
[ ] Sidebar çalışıyor: Evet / Hayır
[ ] Mobil responsive: Evet / Hayır

CONSOLE:
[ ] JavaScript hatası var mı: Evet / Hayır
[ ] Webhook log'ları görünüyor: Evet / Hayır

GENEL NOTLAR:
___________________________
```

---

## 🚀 Sonraki Adımlar

### Webhook Çalışıyorsa:
1. ✅ n8n workflow'unda AI entegrasyonu ekleyin
2. ✅ Response formatını kontrol edin
3. ✅ Production'a alın

### Webhook Çalışmıyorsa:
1. ⚠️ n8n workflow'unu aktif edin
2. ⚠️ CORS headers ekleyin
3. ⚠️ Response formatını düzeltin
4. ⚠️ Geçici olarak simülasyon modu kullanın

---

## 📞 Debug Komutları

**Browser Console'da çalıştırın:**

```javascript
// Webhook test et
fetch('https://n8n.botfusions.com/webhook/a5015f1b-85e2-417f-8c95-d4b91698ec6e', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
        message: 'Test',
        conversation_id: 'test_' + Date.now()
    })
}).then(r => r.json()).then(console.log).catch(console.error);

// LocalStorage temizle
localStorage.clear();
location.reload();

// Webhook durumunu kontrol et
console.log(WEBHOOK_CONFIG);

// Son konuşmaları göster
console.log(JSON.parse(localStorage.getItem('chatConversations')));
```

---

**Son Güncelleme:** 2025-10-01
**Webhook URL:** `https://n8n.botfusions.com/webhook/a5015f1b-85e2-417f-8c95-d4b91698ec6e`
