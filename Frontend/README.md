# 📚 LibRA - Kütüphane Yönetim Sistemi

LibRA, **TOBB ETÜ** öğrencileri için özel olarak tasarlanmış, web tabanlı bir kütüphane yönetim sistemi prototipidir. Kullanıcıların ilgi alanlarına göre kitap keşfetmelerini, ödünç alma süreçlerini yönetmelerini ve stok takibi yapmalarını sağlar.

## 🚀 Özellikler

* **Akıllı Filtreleme:** Kullanıcılar giriş yaptıktan sonra seçtikleri ilgi alanlarına (Yazılım, Roman, Felsefe vb.) göre kişiselleştirilmiş bir kitap listesiyle karşılaşır.
* **Dinamik Stok Yönetimi:** Kitap ödünç alındığında stoklar gerçek zamanlı güncellenir. Stokta olmayan kitaplar için "Sıraya Gir" özelliği mevcuttur.
* **Gelişmiş Profil Paneli:** Favori kitaplar, ödünç alınanlar ve bekleme listesi kullanıcı profilinden takip edilebilir.
* **Admin Yetkileri:** Admin rolüne sahip kullanıcılar sisteme yeni kitap ekleyebilir veya mevcut kitapları silebilir.
* **Güvenli Kayıt:** Sadece `@etu.edu.tr` uzantılı e-posta adresleri ile kayıt imkanı ve güçlü şifre politikası (Regex kontrolü).

## 🛠️ Teknik Altyapı

* **Frontend:** HTML5, CSS3 (Modern Grid/Flexbox yapısı)
* **Scripting:** Vanilla JavaScript (ES6+)
* **Veri Yönetimi:** Mock DB yapısı ile tarayıcı tabanlı veri simülasyonu.

## 📂 Dosya Yapısı

```text
Frontend/
├── assets/             # Görsel materyaller (Logolar, Kitap kapakları)
├── index.html          # Uygulama iskeleti ve görünüm katmanları
├── style.css           # Modern, responsive tasarım ve UI bileşenleri
└── script.js           # İş mantığı, auth yönetimi ve DOM manipülasyonu