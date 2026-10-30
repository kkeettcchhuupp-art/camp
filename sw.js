// アプリ本体をキャッシュし、電波がない場所でも開けるようにする。
// ファイルを更新したら CACHE の番号を上げる（index.html の APP_VERSION も合わせる）。
const CACHE = 'camp-gear-v14';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  // ブラウザのキャッシュに残った古いファイルではなく、サーバーから取り直す
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(u => new Request(u, {cache:'reload'})))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if(req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  // ページはネット優先（更新をすぐ反映）、つながらなければキャッシュ。
  // GitHub Pages は 10 分ほどブラウザにキャッシュさせるため、毎回サーバーに確認する
  if(req.mode === 'navigate'){
    e.respondWith(
      fetch(req.url, {cache:'no-cache', credentials:'same-origin'})
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }
  // それ以外（アイコン等）はキャッシュ優先
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
