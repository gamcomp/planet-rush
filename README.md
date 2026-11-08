# Planet Rush

Uzay temalı, mobil dokunmatik kontrollü küre zinciri nişancılık oyunu. Tek dosya (`index.html`), bağımlılık yok.

**Çalıştırma:** `index.html` dosyasını tarayıcıda aç (telefonda da çalışır).

## Oynanış
- **Nişan:** Ekrana dokun ve sürükle (masaüstünde fare ile hedefle).
- **Ateş:** Parmağını kaldır / tıkla.
- **Değiştir:** Gemiye dokun (masaüstünde Boşluk tuşu) — mevcut ve sıradaki gezegen yer değiştirir.
- Aynı renkten 3+ gezegen yan yana gelince patlar. Boşluğun iki ucu aynı renkse zincir geri çekilir ve kombo zinciri oluşur.
- Zincir kara deliğe ulaşırsa bir can gider (3 can).
- **Atış hakkı:** Her bölümde sınırlı atışın var (ekranın sol üstünde). Hak biterse zincir kara deliğe çekilir ve bir can gider. Kalan her atış bölüm sonunda 50 puan bonus verir.

## Güçlendirmeler
- **Zaman Bükücü** (camgöbeği halka): zinciri 6 sn yavaşlatır.
- **Geri İtici** (yeşil halka): zinciri kısa süre geri sürer.
- **Süpernova** (turuncu halka): çevresindeki tüm gezegenleri yok eder.

Gezegenler: lav dünyası (kızıl), altın gaz devi, zümrüt orman (yeşil), okyanus (mavi), ametist fırtına (mor) ve kar topu (beyaz). Görseller Higgsfield ile üretildi; kaynak dosyalar `art/` klasöründe.

## Dünyalar ve bölümler
**Dünyalar ekranı:** her dünya kartında bölüm ilerlemesi, toplanan yıldızlar (x/45) ve 1–5 zorluk göstergesi var. Bir dünyaya girince kısa tanıtım, gemi ödülü ve kıvrılan bir yol üzerinde 15 bölümlük harita açılır. Bir bölüme dokununca yol şeklinin minyatürü, gezegen/atış/renk sayısı, hız, en iyi skor ve yıldızlarla önizleme kartı gelir.

**Ara ödüller:** her dünyanın 5. ve 10. bölümü ile finali ilk geçişte 25 / 40 / 60 kristal verir; haritada hediye kutusuyla gösterilir.

**Yıldızlar:** bölüm sonunda kalan atış oranına göre 1–3 yıldız (≥%30: 3, ≥%12: 2). En iyi yıldız ve bölüm skoru saklanır.

10 galaksi × 10 dünya × 15 bölüm = **1500 bölüm**. Galaksiler: Samanyolu, Andromeda, Üçgen, Macellan, Girdap, Sombrero, Fırıldak, Kartal, Kuzgun, Sonsuzluk. Her galaksi 10 dünya temasını kendi renk tonuyla yeniden kullanır (ör. "Orion Kapısı II"). İlk galaksi elle tasarlanmış yolları kullanır; sonraki galaksilerde yollar (sarmal, sıra, sütun ve aynalanmış hâlleri) otomatik üretilir ve her biri üst üste binmediği doğrulanmadan kullanılmaz. Her dünyanın kendi arka planı var; bölümler o dünyanın yol şeklini ve komşu şekilleri (aynalanmış hâlleriyle) dönüşümlü kullanır. 15. bölüm dünyanın finalidir.

1. Orion Kapısı · 2. Yılan Nebulası · 3. Andromeda Girdabı · 4. Kuyruklu Yıldız Kanyonu · 5. Asteroit Kuşağı · 6. Pulsar Çiçeği · 7. Kuasar Halkası · 8. Karanlık Bulutsu · 9. Olay Ufku · 10. Galaksi Çekirdeği

Zorluk 1500 bölüm boyunca yumuşakça artar: renk sayısı 4 → 6, gezegen sayısı 36 → 150, hız 34 → 63; atış hakkı gezegen sayısının %125'inden ~%67'sine iner, güçlendirmeler seyrekleşir. İlerleme tarayıcıda saklanır.

## Ana ekran
Alt dock: **Dünyalar · Hangar · OYNA · Günlük · Skorlar**; üst çubuk: yardım, en iyi skor, ayarlar. Simgeler Higgsfield ile üretildi; Hangar simgesi seçili gemiyi gösterir, Günlük simgesinde seri rozeti ve bekleyen görev noktası var.

- **Canlı arka plan:** Higgsfield ile kapak görselinden üretilmiş, kesintisiz dönen video (hareket azaltma açıkken sabit görsel).
- **Günün görevi:** günde **tek hak**; her gün tarihten üretilen yeni bir harita, rastgele tema ve galaksi tonu. Tek canla oynanır, baştan başlatma yoktur; kaybedince o günün hakkı biter. Art arda bitirilen günlerde seri sayacı artar.
- **Gemi rozeti:** seçili gemi sağ üstte, dokununca Hangar açılır.
- **İstatistikler:** patlatılan gezegen, en iyi kombo, bitirilen bölüm, atış, en iyi skor, günlük seri.
- **Müzik:** tarayıcıda canlı üretilen ortam müziği (Ayarlar'dan kapatılabilir).
- **Devam et kartı:** kaldığın dünya ve bölümü, atış hakkını gösterir; tek dokunuşla başlatır.
- **Dünyalar:** 10 dünya kartı (arka plan görselleri, ilerleme, kilit). Bir dünyaya girince 15 bölümlük ızgara açılır.
- **Hangar:** 6 gemi; her birinin kendi görünümü ve avantajı var, dünyaları bitirdikçe açılır.
- **Nasıl oynanır:** kurallar ve güçlendirmeler.
- **Ayarlar:** dil, ses, titreşim, ilerlemeyi sıfırlama (onaylı). Grafikler her zaman tam kalitede çalışır.

## Gemiler
15 gemi; her galaksinin başında yeni bir gemi açılır, kristalle erken de alınabilir.

| Gemi | Avantaj | Açılış |
|---|---|---|
| Öncü | Dengeli | Baştan |
| Kartal | Atışlar %30 hızlı | Bölüm 15 |
| Gölge | +4 atış | Bölüm 30 |
| Titan | Süpernova %40 geniş | Bölüm 60 |
| Nova | Yavaşlatma 2× | Bölüm 90 |
| Avcı | Kombo +%50 | Bölüm 120 |
| Yıldırım | Özel atış %50 hızlı dolar | Bölüm 150 |
| Kuzgun | +6 atış | Bölüm 300 |
| Volkan | Patlamalar %70 geniş | Bölüm 450 |
| Buzul | Yavaşlatma/dondurma 2,5× | Bölüm 600 |
| Zümrüt | Kombo +%80 | Bölüm 750 |
| Fırtına | Hızlı atış + hızlı dolum | Bölüm 900 |
| Hayalet | +8 atış | Bölüm 1050 |
| Güneş | Özel atış 2× hızlı dolar | Bölüm 1200 |
| Sonsuz | +5 atış, hızlı dolum, kombo | Bölüm 1350 |

## Özel atışlar
Her geminin kendine ait **iki** özel atışı var (6 atışın 15 olası ikilisi, gemi başına bir). Gezegen patlattıkça sol alttaki iki gösterge ayrı ayrı dolar (24 gezegen). Dolan düğmeye dokun (masaüstünde 1 / 2 tuşları): sonraki atış özel olur ve atış hakkından düşmez.

| Atış | Etki |
|---|---|
| Gökkuşağı | Çarptığı gezegenin rengini alır |
| Bomba | Çarptığı yerde patlar |
| Lazer | Hattaki ilk 6 gezegeni deler |
| Dondurucu | Zinciri 5 sn durdurur |
| Şok Dalgası | Zinciri geri iter |
| Mini Kara Delik | Çevresini yutar |

## Kristaller ve güçlendiriciler
- **Günlük görev ödülü:** 150 kristal, seri her gün +50 (en fazla 450) ve bir güçlendirici (+5 Atış ya da Yavaş Başlangıç).
- **Bölüm ödülü:** yıldız başına 4 kristal.
- **Güçlendiriciler:** OYNA'ya ya da haritadaki bir bölüme basınca açılan kartta seçilir. Elde yoksa kristalle alınır (+5 Atış: 60, Yavaş Başlangıç: 80).
- **Gemiler:** kilitli gemiler dünya bitirmeden kristalle de alınabilir (Kartal 500, Gölge 800, Titan 1200, Nova 1600, Avcı 2000).

## Sesler
Ses efektleri (atış, çarpma, patlama, kombo, güçlendirme, bomba, lazer, dondurma, şok, kara delik, bölüm sonu, kayıp, tehlike, değiştirme, hazır) ve İngilizce spiker anonsları ("Combo!", "Super combo!", "Awesome!", "Legendary!", "Danger!", "Stage clear!", "Mega blast!", "On fire!", "Supernova!", "Special shot ready!") ElevenLabs ile üretildi ve oyuna gömüldü; kaynak dosyalar `sounds/` klasöründe. Spiker Ayarlar'dan ayrıca kapatılabilir. Spiker, oyun hangi dilde olursa olsun İngilizce konuşur. Müzik: ElevenLabs ile üretilmiş iki döngüsel parça; menülerde ritimli ana tema, oyunda yumuşak ambiyans, aralarında geçiş yapılır (yüklenemezse tarayıcıda üretilen müzik çalar).

## Test modu
Ayarlar → Test modu: tüm 1500 bölüm, 15 gemi ve 6 özel atış açılır; 99.999 kristal ve 99'ar güçlendirici verilir, özel atış her bölümde dolu başlar, günlük görev sınırsızdır. Kapatınca önceki ilerleme olduğu gibi geri yüklenir. Bu sürümde ilk açılışta bir kez otomatik açılır.

## Diller
Oyun 15 dilde oynanır: Türkçe, English, Deutsch, Français, Español, Italiano, Português, Русский, العربية, 日本語, 한국어, 中文, हिन्दी, Bahasa Indonesia, Polski. İlk açılışta cihaz dili seçilir (desteklenmiyorsa İngilizce); Ayarlar > Dil'den değiştirilebilir. Menüler, oyun içi yazılar, kombo/bölüm bildirimleri, açıklamalar ve erişilebilirlik etiketleri çevrilir; gemi, dünya, galaksi ve özel atış isimleri de her dile çevrilir (yalnızca oyunun adı Planet Rush aynı kalır). Arapçada arayüz sağdan sola akar.

## Telefonda oynamak (Android ve iOS)
Oyun iki yoldan telefona kurulabilir.

### 1. Web uygulaması olarak (kurulumsuz)
`index.html` bir PWA'dır: `manifest.webmanifest`, `icons/` ve çevrimdışı önbellek için `sw.js` ile gelir. Klasör HTTPS üzerinden yayınlandığında:
- **Android (Chrome):** menü › *Ana ekrana ekle* / *Uygulamayı yükle*.
- **iOS (Safari):** Paylaş › *Ana Ekrana Ekle*.

Ana ekrandan açılınca tam ekran ve dikey çalışır; bir kez açıldıktan sonra internetsiz de oynanır.

### 2. Mağaza uygulaması olarak (Capacitor)
`app/` klasörü oyunu yerel Android ve iOS uygulamasına saran Capacitor projesidir (paket kimliği `co.gam.planetrush`).

Yerel uygulamada ek olarak:
- Android geri tuşu sırayla açık pencereyi kapatır, oyunu duraklatır, bir önceki ekrana döner; ana ekrandayken uygulamadan çıkar.
- Titreşim iOS'ta da çalışır (Haptics eklentisi).
- Uygulama arka plana geçince oyun duraklar, ses ve müzik susar; geri dönünce kaldığı yerden devam eder.
- Durum çubuğu gizlenir, ekran dikey kilitlidir, yazı tipleri pakete gömülüdür (internet gerekmez).

Gereken araçlar: Node.js 20+, Android için Android Studio (JDK 21), iOS için macOS + Xcode 16+.

```bash
cd games/planet-rush/app
npm install
npm run android   # oyunu kopyalar, senkronlar ve Android Studio'yu açar
npm run ios       # aynısı Xcode için (yalnızca macOS)
npm run apk       # test için hata ayıklama APK'sı: android/app/build/outputs/apk/debug/
```

`index.html` her değiştiğinde `npm run sync` uygulamaları günceller. Uygulama simgeleri ve açılış ekranı `app/assets/` içindeki görsellerden üretilir (`npx @capacitor/assets generate`).

Mağazaya göndermeden önce:
- **Google Play:** Android Studio › *Build › Generate Signed App Bundle* ile kendi imza anahtarınla `.aab` üret.
- **App Store:** Xcode'da *Signing & Capabilities* altında Apple geliştirici hesabını seç, *Product › Archive* ile yükle.
