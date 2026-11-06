# Proje notları (Claude Code için)

Bu klasör, cep telefonu için yapılmış uzay temalı bir top zinciri bulmaca oyununun tamamıdır.
Oyunun görünen adı şu an **Planet Rush**. Klasörün adı "zumzuma" olsa da oyunun adı olarak
"ZumZuma" kullanılmadı: "ZUMA" Electronic Arts'ın tescilli markası (ABD Reg. No. 3509317) ve aynı
türde bir oyun; isim seçerken "Zuma" içermeyen bir ad önerilmeli.

Kullanıcı Türkçe konuşur; cevaplar Türkçe olmalı. GitHub'a yalnızca kullanıcı isterse gönder.

## Dosyalar
- `index.html` — oyunun tamamı tek dosyada (HTML + CSS + JS, görseller, sesler ve 15 gemi 3D modeli base64
  olarak gömülü, ~7,6 MB; 3D modeller artık yok). Doğrudan bu dosya düzenlenir; tarayıcıda çift tıklayınca çalışır.
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
- **3D kaldırıldı (7 Kasım 2026, kullanıcı isteği):** oyun tamamen 2D çizilir. three.js paketi (`t3lib`) ve gemi GLB'leri
  (`ship3dData`) dosyadan silindi; `G3` artık her çağrıya "kapalı" yanıtı veren küçük bir saplama (`G3.on=false`),
  `want3d()` hep false, Ayarlar'daki "3D görünüm" anahtarı yok. Kullanıcı istemedikçe 3D'yi geri ekleme. Eski 3D kaynakları
  arşiv olarak `tools3d/`, `models/` ve git geçmişinde (fbb070f ve öncesi) duruyor. Galaksi yol dokuları (`RAIL_STYLES`)
  2D ray katmanında (`makeTrackLayer`) kullanılır; `wall`/`glow` alanları artık kullanılmıyor.
- Performans: sondaki başlatıcı betik mainCode'u gam.co açılışının hareketi bitince (~1,9 sn) çalıştırır; açılış animasyonları
  yalnızca transform/opacity kullanmalı. `frame()` FPS'i izler; oyun sırasında ort. <40 FPS olursa `lowQ` açılır
  (`yorunge-lowq` saklanır, dpr ≤1,5). Sesler `fetch(dataURI)` + `decodeAudioData` ile çözülür.
- Hangar: `hgBuild()` / `hgDraw()` (görselden hacim üretir); WebGL yoksa `build3dShipLayers()` katmanlı görünüm.
- Ses: `audioBus('sfx'|'voice'|'music')` → master → yumuşak limiter (DynamicsCompressor) → hoparlör; efekt kanalı
  .58 ses + 4,8 kHz low-pass ile yumuşatıldı, her kayıtlı efekt 8 ms yumuşak girişle başlar, sentez yedeklerinde
  kare/testere dalga yok. **Spiker kullanıcı isteğiyle kaldırıldı** (6 Kasım 2026): `say()` boş, `v_*` sesleri
  SOUNDS'tan silindi, Ayarlar'daki "Spiker sesi" satırı yok — geri eklenmesin.
  Kayıtlı müzik `loopPoints()` ile MP3 baş/son sessizliği atlanarak döngülenir.
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
- 6 Kasım 2026: gam.co açılış ekranı (`.brand` / `.brandMark`) için 10 hareketli seçenek sunuldu (Yörünge Noktası,
  Neon Tabela, 8-Bit Atari, Top Zinciri, Kara Delik, Görev Terminali, Kâğıt Çıkartma, Geometrik, Takımyıldız,
  Gezegen Tutulması); tuval: https://claude.ai/artifact/AiQQH1yN3iQkJZrmmxi9JZ. Tutulma'nın güneş/ay/taç görselleri
  Higgsfield ile üretildi (`art/gamco/`). Kullanıcı 8 (Geometrik/Bauhaus) tarzını beğendi; aynı tuvalde 6 çeşidi
  var (8a Harf Karoları, 8b Gece Yörüngesi, 8c Afiş, 8d Dönen Çeyrekler, 8e Düşen Bloklar, 8f Pergel ve Cetvel).
  Kullanıcı henüz son seçimi yapmadı.
- Oyun GitHub Pages'te yayında: https://gamcomp.github.io/planet-rush/ (depo gamcomp/planet-rush, herkese açık;
  `git push` yeterli, yayın 1–2 dk sürer).
- Logo (6 Kasım 2026): ana ekran/yükleme logosu 08i-9 (gemi + lazer + patlayan gezegenler); kaynak
  `art/logo-onerileri/08i-9.png` + Higgsfield arka plan maskesi, siyah→alfa ile birleştirildi → `art/logo.webp` → `ASSETS.logo`.
- Toplar/gemiler telefonda siyah görünüyordu: top dokusu gamma ~1.0, tüm toplarda emissiveMap; yansıma haritası
  (half-float) yoksa `scene.environment` kurulmaz, Hemisphere+Ambient ışık güçlenir; gemi malzemeleri metalness ≤0.55.
- Arka plan için 10 öneri `art/arkaplan-onerileri/01–10.png` (9:16); kullanıcı henüz seçmedi.
- Arka planlar: `bg10`–`bg19` (Higgsfield, `art/arkaplan-onerileri`); her galakside dünyalar `(t+gal)%2` ile eski/yeni arasında dönüşür.
- Yollar: `RAIL_STYLES` (galaksi başına ray dokusu `rail`, `rail1`–`rail9` + 3D duvar ve ışık rengi); `railStyle()`.
  Örnek görüntüler: https://claude.ai/artifact/8zKF79WQubL5zPMycurT4F
- Masaüstü tarayıcıda `index.html` başındaki betik `phone.html`'e yönlendirir (telefon çerçevesi, içinde `index.html?embed=1`);
  `?full=1` tam ekran. Telefon, yerel uygulama ve iframe içi etkilenmez.
- Ana ekran videosu (6 Kasım 2026): Higgsfield MiniMax H3 Max ile bg11'den (yörüngeden Dünya) başlangıç=bitiş kareli
  döngü; `art/home.webm`/`home.mp4` (576 px, sessiz) → `HOME_VIDEO`. `#homeVid` yukarı kaydırılıp büyütüldü (ufuk kartın üstünde);
  sabit kare `bg11`. Diğer 4 aday ve eski video `art/video-onerileri/`. ffmpeg: scratchpad'te `ffmpeg-static`.
- Ana ekran düzeni için 6 öneri (A Ufuk ve Gemi, B Dünya Şeridi, C Günün Görevi, D Gemi Vitrini, E Bölüm Haritası,
  F Sinematik Sade): https://claude.ai/artifact/C8nKD6fmSiUheBGCdD4KwY — **F uygulandı** (6 Kasım 2026): OYNA (`#startBtn`)
  `.homeHero` içinde logonun altında hap düğme, `#nextInfo` tek satır yazı, `.dock` 4 yuvarlak simge (etiketler gizli ama
  ekran okuyucuda var); stiller `#menuS` ile en sonda. Ana ekran artık video değil, sabit `bg11` (yükleme ekranıyla aynı kadraj: top -2%, height 107%); `HOME_VIDEO = undefined`.
  Üst çubuk tek cam kapsül (kupa | kristal, TEST etiketi satır içinde, yardım ve ayarlar sağda).
- Oyunun yeni adı henüz seçilmedi (şimdilik "Planet Rush" kalacak).
