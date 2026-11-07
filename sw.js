// Guarda o app no aparelho para abrir rápido e funcionar sem internet.
const CACHE = 'grade-v1';
const ARQUIVOS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // páginas: tenta a versão mais nova na internet; sem conexão, usa a guardada
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { const copia = r.clone(); caches.open(CACHE).then(c => c.put('./index.html', copia)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  // demais arquivos (ícones, fontes, leitor de PDF): usa o guardado e atualiza em segundo plano
  e.respondWith(caches.match(req).then(hit => {
    const rede = fetch(req).then(r => { if (r.ok || r.type === 'opaque') { const copia = r.clone(); caches.open(CACHE).then(c => c.put(req, copia)); } return r; }).catch(() => hit);
    return hit || rede;
  }));
});
