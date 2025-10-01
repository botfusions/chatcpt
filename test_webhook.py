#!/usr/bin/env python3
"""
Webhook Test Script - SSL Bypass için Python kullanımı
"""

import requests
import json
import sys
from datetime import datetime

# Webhook configuration
WEBHOOK_URL = "https://n8n.botfusions.com/webhook/a5015f1b-85e2-417f-8c95-d4b91698ec6e"

def test_webhook(message="Test mesajı"):
    """Test the webhook with a sample message"""

    payload = {
        "message": message,
        "conversation_id": f"test_{int(datetime.now().timestamp())}",
        "metadata": {
            "timestamp": datetime.now().isoformat(),
            "testMode": True
        }
    }

    print("=" * 60)
    print("🚀 WEBHOOK TEST BAŞLIYOR")
    print("=" * 60)
    print(f"\n📡 URL: {WEBHOOK_URL}")
    print(f"📤 Method: POST")
    print(f"\n📦 Payload:")
    print(json.dumps(payload, indent=2, ensure_ascii=False))
    print()

    try:
        # Disable SSL verification for Avast issue
        response = requests.post(
            WEBHOOK_URL,
            json=payload,
            headers={'Content-Type': 'application/json'},
            timeout=30,
            verify=False  # SSL verification bypass
        )

        print("=" * 60)
        print("✅ YANIT ALINDI")
        print("=" * 60)
        print(f"\n📊 HTTP Status: {response.status_code}")
        print(f"⏱️ Yanıt Süresi: {response.elapsed.total_seconds():.2f}s")
        print(f"\n📥 Response Headers:")
        for key, value in response.headers.items():
            print(f"   {key}: {value}")

        print(f"\n📥 Response Body:")
        try:
            response_json = response.json()
            print(json.dumps(response_json, indent=2, ensure_ascii=False))

            # Check for expected fields
            print(f"\n🔍 Beklenen Alan Kontrolü:")
            if 'output' in response_json:
                print(f"   ✅ output: {response_json['output'][:100]}...")
            else:
                print(f"   ❌ output: Bulunamadı")

        except json.JSONDecodeError:
            print(response.text)

        print("\n" + "=" * 60)
        if response.ok:
            print("✅ TEST BAŞARILI")
        else:
            print("⚠️ HTTP HATA KODU")
        print("=" * 60)

        return response.ok

    except requests.exceptions.SSLError as e:
        print("\n" + "=" * 60)
        print("❌ SSL HATASI")
        print("=" * 60)
        print(f"\n🚨 Hata: {str(e)[:200]}")
        print("\n💡 Çözüm: Avast Antivirus SSL taramasını devre dışı bırakın")
        print("   veya Python verify=False ile çalıştırın (bu script zaten yapıyor)")
        return False

    except requests.exceptions.Timeout:
        print("\n" + "=" * 60)
        print("❌ TIMEOUT")
        print("=" * 60)
        print("\n⏱️ İstek 30 saniye içinde yanıt vermedi")
        return False

    except requests.exceptions.ConnectionError as e:
        print("\n" + "=" * 60)
        print("❌ BAĞLANTI HATASI")
        print("=" * 60)
        print(f"\n🚨 Hata: {str(e)[:200]}")
        print("\n💡 Olası Nedenler:")
        print("   • Webhook URL yanlış")
        print("   • n8n sunucusu down")
        print("   • Network bağlantısı yok")
        return False

    except Exception as e:
        print("\n" + "=" * 60)
        print("❌ BİLİNMEYEN HATA")
        print("=" * 60)
        print(f"\n🚨 Hata Tipi: {type(e).__name__}")
        print(f"🚨 Hata Mesajı: {str(e)}")
        return False

if __name__ == "__main__":
    # Disable SSL warnings when using verify=False
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

    # Get message from command line or use default
    message = sys.argv[1] if len(sys.argv) > 1 else "Merhaba! Bu bir Python test mesajıdır."

    success = test_webhook(message)
    sys.exit(0 if success else 1)
