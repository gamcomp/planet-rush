# Proje notları (Claude Code için)

Bu klasör, cep telefonu için yapılmış uzay temalı bir top zinciri bulmaca oyununun tamamıdır.
Oyunun görünen adı şu an **Planet Rush**. Klasörün adı "zumzuma" olsa da oyunun adı olarak
"ZumZuma" kullanılmadı: "ZUMA" Electronic Arts'ın tescilli markası (ABD Reg. No. 3509317) ve aynı
türde bir oyun; isim seçerken "Zuma" içermeyen bir ad önerilmeli.

Kullanıcı Türkçe konuşur; cevaplar Türkçe olmalı. GitHub'a yalnızca kullanıcı isterse gönder.

## Dosyalar
- `index.html` — oyunun tamamı tek dosyada (HTML + CSS + JS, görseller, sesler ve 15 gemi 3D modeli base64
  olarak gömülü, ~17,6 MB). Doğrudan bu dosya düzenlenir; tarayıcıda çift tıklayınca çalışır.
  Dosya çok büyük: düzenlerken `Edit` ile benzersiz metin parçaları kullan; Node ile toplu değişiklikte
  `String.replace` yerine `split/join` kullan (`$'`, `` $` `` gibi kalıplar gömülü kodu bozar).
- `art/` — oyundaki görsellerin kaynak .webp dosyaları (gemiler, arka planlar, simgeler).
- `sounds/` — ElevenLabs ile üretilmiş ses efektleri, İngilizce spiker anonsları (`a_v_*.mp3`), müzik.
- `icons/`, `manifest.webmanifest`, `sw.js` — PWA (ana ekrana ekleme, çevrimdışı çalışma).
- `app/` — Capacitor ile Android/iOS kabuğu (`co.gam.planetrush`). `npm install`, sonra
  `npm run android` / `npm run ios` / `npm run apk`. `npm run www` index.html'i `app/www/` içine kopyalar
  ve Google Fonts bağlantısını `app/fonts/` içindeki yerel yazı tiplerine çevirir.
- `README.md` — oyunun özellikleri ve kurulum adımları.
- `art/tarzlar/` — Higgsfield (GPT Image 2.5) ile üretilmiş 10 tarzın ana ekran görselleri (PNG, 1520×2688).
- `models/<gemi-id>.glb` — 15 geminin Higgsfield (Tripo H3.1, `art/ship*.webp` görsellerinden) ham 3D modelleri,
  her biri 9–15 MB (toplam ~195 MB; git'e konacaksa LFS gerekir). `models/web/` — sıkıştırılmış hâlleri
  (gltf-transform: webp 1024 doku, sadeleştirme 0.3, quantize; ~0,5 MB) — index.html'e gömülen bunlardır.
- `tools3d/` — 3D katmanın kaynakları: `g3.js` (index.html'deki `G3` modülünün kaynağı), `apply3d.js` +
  `extra-edits.js` (3D öncesi index.html'e tüm değişiklikleri uygulayıp modelleri gömen betik), `entry.js`
  (esbuild ile three.js paketi: `T3` global), `index-3d-oncesi.html` (3D'den önceki yedek).
  Not: G3 kodu artık index.html içinde; küçük değişiklikler doğrudan orada yapılabilir.
- `deneme/hangar-3d.html` — three.js hangar denemesi (CDN'den yükler); `deneme/kalibre.html` — gemi modellerinin
  yön kalibrasyon tablosu. İkisi de `models/web/` dosyalarını yerel sunucu üzerinden okur.

## index.html içindeki önemli bölümler
- Ana oyun kodu `<script type="text/plain" id="mainCode">` içinde; küçük bir başlatıcı betik onu,
  gam.co açılış ekranı çizildikten sonra çalıştırır.
- `const ASSETS = {...}` görseller, `const SOUNDS = {...}` sesler (data URI).
- Çeviri: `const I18N` (Türkçe metin → 14 dil, sıra: en de fr es it pt ru ar ja ko zh hi id pl) ve
  `const I18P` (desenler, `{0}` yer tutucuları). `tr(s)` çevirir; MutationObserver ekrandaki metni
  otomatik çevirir. Yeni bir Türkçe metin eklenirse bu sözlüklere 14 dildeki karşılığı da eklenmeli.
  Arapçada `dir=rtl`.
- 1500 bölüm: 10 galaksi × 10 dünya × 15 bölüm (`LEVELS`, `THEMES`, `WORLDS`, `GALAXY_NAMES`).
- 15 gemi (`SHIPS`), 6 özel atış (`SPECIALS`), güçlendirmeler (`BOOSTS`), günlük görev (günde 1 hak).
- Oyundaki gemi: `drawShooter()` / `drawShipBody()` (sabit ışık, kenar parlaması, gölge, yatma).
- **3D oyun alanı (`G3`)**: `<script id="t3lib">` three.js r170 paketi (global `T3`), `<script id="ship3dData">`
  `window.SHIP3D` (gemi id → GLB data URI) ve `SHIP3D_ROT`. Oyun mantığı 2D kalır; `G3.frame()` 2D dünyayı
  (yol, kara delik, efektler) eğik (32°) bir zemin dokusuna boyar, gezegenleri (oyunun kendi gezegen
  dokularıyla), atışları ve gemi modelini gerçek 3D çizer. `#game` (arka plan) → `#game3d` (WebGL) →
  `#gameTop` (güç işaretleri, bölüm yazısı, toz, vinyet) üst üste durur. Nişan: `toWorld()` → `G3.screenToWorld()`
  (ışın, y=R düzlemi). Modeller "dik" üretildiği için `normaliseShip()` yatırır ve 180° çevirir (kalibrasyonla
  doğrulandı). Ayarlar'da "3D görünüm" anahtarı (`yorunge-3d`); WebGL yoksa 2D çizim aynen çalışır.
  Test kancası: `__yz.g3` (`debugBall(i)`, `debugScene()`, `screenToWorld`, `shipReady()`).
  Bölüm sahnesi (`rebuildLevel()`, yol değişince kendiliğinden): yolun iki kenarına metal 3D duvar + mavi ışık
  şeridi, rayın gölgesini aşağıdaki uzaya düşüren görünmez taban (y=-60'ta ikinci gölge düzlemi), kara deliğin
  altında dönen huni (çekim kuyusu), köşelerde 3D dev gezegen (tek bölümlerde halkalı) ve ay — top renkleriyle
  karışmasın diye soluk ve ton kaydırılmış — ve derin yıldız katmanları; kamera yavaşça salınır (paralaks).
  3D'de 2D `farLayer` çizilmez. Top dokuları `IMG.tex0..5` görsellerinden, koyulaştırılıp doygunlaştırılarak
  (`gradedPlanetCanvas`) üretilir; görseller geç yüklenirse kendiliğinden yenilenir.
- Hangar: gerçek model varsa `G3.hangarSet/hangarDraw` (`#scGL3`), yoksa eski `hgBuild()` / `hgDraw()`
  (görselden hacim üretir); WebGL yoksa `build3dShipLayers()` katmanlı görünüm.
- Ses: `audioBus('sfx'|'voice'|'music')` → master → limiter (DynamicsCompressor) → hoparlör; spiker konuşurken
  `duck()` müziği ve efektleri kısar; kayıtlı müzik `loopPoints()` ile MP3 baş/son sessizliği atlanarak döngülenir.
  Kaynak sesler düşük kaliteli (efektler 64 kbps mono, müzik 80 kbps ve yalnızca 22 sn). Higgsfield'in müzik
  (sonilo) ve efekt (mirelo) modelleri yalnızca kendi oyun hattında kullanılabiliyor; yeni ses için ElevenLabs
  (Sound Effects / Music, yüksek bit hızı) ya da CC0 kütüphaneler gerekir.
- Yerel uygulama köprüsü: `NATIVE` (Capacitor App, Haptics, StatusBar), `goBack()` Android geri tuşu.
- `window.__yz` test kancaları (ör. `__yz.setLang('en')`, `__yz.back()`).
- localStorage anahtarları `yorunge-` ile başlar (ilerleme, cüzdan, gemiler, dil, test modu...).

## Bekleyen konular
- Ana ekran tasarımı için 16 tarz önerildi (Karton Kapak, İsviçre Afişi, Riso Fanzin, 16-Bit Arcade,
  Kâğıt Diorama, Defter Çizimi, Uzay Çağı Afişi, Vektör Ekran, Kozmik Dalga, Görev Planı, Hamur Stüdyo,
  Linol Baskı, Art Deco Yolculuk, Çizgi Roman, Nakış Arması, Resimli Kitap); kullanıcı henüz seçmedi.
- 2 Kasım 2026: 10 yeni görsel tarz daha ana ekran maketi olarak sunuldu (Neon Tüp, Buzlu Cam, Origami,
  Radar Ekranı, Şeker Hamuru, Bauhaus, Gök Atlası, Ukiyo-e Dalga, Yörünge Minimal, Sulu Boya Masalı);
  tasarım tuvali: https://claude.ai/artifact/3jAbitnvx9cYiiQRijZuz4. Kullanıcı henüz seçmedi.
- Oyunun yeni adı henüz seçilmedi (şimdilik "Planet Rush" kalacak).
