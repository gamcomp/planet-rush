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
- 15 gemi (`SHIPS`) — her gemide tam **iki özellik** (shot/ammo/charge/combo/slow/nova; hangarda `perkLines()` iki etiket, I18P kalıpları)
  ve kendine özgü **atış efekti** (`SHOT_FX`: renkler + parçacık şekli dot/shard/star/ring/ghost/ember/bolt/rainbow; namlu, iz, isabet
  `shipImpact()`; `shotFx()` — `shipFx` adı G3'te yatma animasyonu için kullanılıyor), 6 özel atış (`SPECIALS`; her gemiye `SHIP_SPECS` ile sabit **iki** özel atış — 15 olası ikili, gemi başına bir; oyunda sol altta iki düğme `#specBtn`/`#specBtn2`, ayrı dolum `charges[2]`, `armSlot`; bölüm kilidi ve seçim yok, hangarda odaktaki geminin ikisi görünür), güçlendirmeler (`BOOSTS`), günlük görev (günde 1 hak).
- Oyundaki gemi: `drawShooter()` / `drawShipBody()` (sabit ışık, kenar parlaması, gölge, yatma).
- **3D oyun alanı (`G3`)**: `<script id="t3lib">` three.js r170 paketi (global `T3`), `<script id="ship3dData">`
  `window.SHIP3D` (gemi id → GLB data URI) ve `SHIP3D_ROT`. Oyun mantığı 2D kalır; `G3.frame()` 2D dünyayı
  (yol, kara delik, efektler) eğik (32°) bir zemin dokusuna boyar, gezegenleri (oyunun kendi gezegen
  dokularıyla), atışları ve gemi modelini gerçek 3D çizer. `#game` (arka plan) → `#game3d` (WebGL) →
  `#gameTop` (güç işaretleri, bölüm yazısı, toz, vinyet) üst üste durur. Nişan: `toWorld()` → `G3.screenToWorld()`
  (ışın, y=R düzlemi). Modeller "dik" üretildiği için `normaliseShip()` yatırır ve 180° çevirir (kalibrasyonla
  doğrulandı). **3D tek görünüm (7 Kasım 2026, kullanıcı isteği):** Ayarlar'da 3D anahtarı yok, `want3d()` hep true,
  eski `yorunge-3d` kaydı yok sayılır/silinir. 2D çizim yalnızca cihazda WebGL yoksa yedek olarak çalışır; kapatma seçeneği geri eklenmesin.
  Test kancası: `__yz.g3` (`debugBall(i)`, `debugScene()`, `screenToWorld`, `shipReady()`).
  Bölüm sahnesi (`rebuildLevel()`, yol değişince kendiliğinden): yolun iki kenarına metal 3D duvar + mavi ışık
  şeridi, rayın gölgesini aşağıdaki uzaya düşüren görünmez taban (y=-60'ta ikinci gölge düzlemi), kara deliğin
  altında soluk bir huni (çekim kuyusu) ve **gerçek 3D kara delik** (`buildBlackHole()`, 8 Kasım 2026): siyah olay ufku küresi,
  kameraya göre neredeyse yandan görülen dönen yığılma diski (shader: sıcaklık renkleri, akan gaz, Doppler parlaması, `danger` ile
  kızarır), kameraya dönük kartta foton halkası + üstten bükülen disk yayı (merceklenme), turuncu nokta ışık. 3D'de 2D `drawHole()`
  yalnızca zemine sıcak bir parıltı boyar, köşelerde 3D dev gezegen (tek bölümlerde halkalı) ve ay — gerçek yüzey haritaları
  `pl0`–`pl4`, `moon2` (Higgsfield, `art/gezegen-dokulari`), fresnel atmosfer kabuğu, kutup kameraya bakmasın diye eğik
  (`tiltedBody`) — ve derin yıldız katmanları. Kamera sabit (kullanıcı isteği); yalnızca patlama sarsıntısı oynatır.
  3D'de 2D `farLayer` çizilmez. Top dokuları `IMG.tex0..5` görsellerinden, koyulaştırılıp doygunlaştırılarak
  (`gradedPlanetCanvas`) üretilir; görseller geç yüklenirse kendiliğinden yenilenir.
- Performans (6 Kasım 2026): `t3lib` ve `ship3dData` artık `type="text/plain"`; sondaki başlatıcı betik gam.co açılışının
  hareketi bitince (~1,9 sn) önce three.js'i çalıştırır, `window.SHIP3D`'yi metinden tembel okuyan bir Proxy yapar, sonra
  mainCode'u çalıştırır. 3D zemin iki katman (8 Kasım 2026): ray `trackFloor`/`trackTex` (bölüm başına bir kez, mipmap +
  anizotropik, `makeTrackLayer` 3D'de ×1,25 keskin) ve her karede yalnızca efektler çizilen `wtex` (mipmap yok, wk ≤1,2).
  Uyarlanabilir çözünürlük: `frame()` FPS'i izler, ~2,5 sn'de bir `G3.tune(fps)` piksel oranını `PR_STEPS` [1…2] arasında
  ayarlar (<47 FPS düşür, >57 FPS iki kez yükselt). Çok ağır durumda (<30 FPS, en düşük adımda) `lowQ` açılır. Gölge 1024 PCF.
  Sesler `fetch(dataURI)` + `decodeAudioData` ile çözülür. Açılış animasyonları yalnızca transform/opacity kullanmalı.
- Hangar: gerçek model varsa `G3.hangarSet/hangarDraw` (`#scGL3`), yoksa eski `hgBuild()` / `hgDraw()`
  (görselden hacim üretir); WebGL yoksa `build3dShipLayers()` katmanlı görünüm.
- Ses: `audioBus('sfx'|'voice'|'music')` → master → yumuşak limiter (DynamicsCompressor) → hoparlör; efekt kanalı
  .58 ses + 4,8 kHz low-pass ile yumuşatıldı, her kayıtlı efekt 8 ms yumuşak girişle başlar, sentez yedeklerinde
  kare/testere dalga yok. **Spiker kullanıcı isteğiyle kaldırıldı** (6 Kasım 2026): `say()` boş, `v_*` sesleri
  SOUNDS'tan silindi, Ayarlar'daki "Spiker sesi" satırı yok — geri eklenmesin.
  Kayıtlı müzik `loopPoints()` ile MP3 baş/son sessizliği atlanarak döngülenir.
  Kaynak sesler düşük kaliteli (efektler 64 kbps mono, müzik 80 kbps ve yalnızca 22 sn). Higgsfield'in müzik
  (sonilo) ve efekt (mirelo) modelleri yalnızca kendi oyun hattında kullanılabiliyor; yeni ses için ElevenLabs
  (Sound Effects / Music, yüksek bit hızı) ya da CC0 kütüphaneler gerekir.
- **Can sistemi + reklam (8 Kasım 2026):** kalıcı canlar `life` (`yorunge-life`, en fazla 5, 20 dk'da 1 dolar; `lifeTick/spendLife/gainLife`).
  `startLevel(sayı)` can ister (yoksa `openLifeSheet`), zincir deliğe ulaşınca `spendLife()`; duraklatmadan "Baştan başla" ve "Ana menü" de 1 can harcar (`#pzCost` uyarısı); günlük görev ve test modu can harcamaz.
  Reklam: `ADS` modülü — uygulamada `@capacitor-community/admob` (`AD_IDS`: şu an Google **TEST** kimlikleri; AndroidManifest
  `APPLICATION_ID` ve iOS `GADApplicationIdentifier` da test), web'de 5 sn'lik "Test reklamı" yer tutucusu. Ödüllü reklam: can bitti
  penceresi (+1 can), oyun bitti ekranı (+1 can, hemen devam), günlük görev bitişi (kristal ve can ödülü 2 kat).
  Günlük görev ödülü +1 bonus can da verir (`lastLoot.lives`, `gainLife(k, true)` üst sınırı aşabilir; dolum yalnızca 5'in altında işler). Alt banner `#adBanner`
  (`body.hasAd` → oyun alanı/menüler 54 px yukarı); web'de yalnızca test modunda yer tutucu görünür. Yayından önce gerçek AdMob
  kimlikleri ve AB için onay (UMP) gerekli.
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
