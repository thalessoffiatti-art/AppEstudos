/* Guarda o app inteiro no primeiro acesso. Depois disso ele abre sem internet.
   Para publicar uma versão nova do material, troque o número do CACHE. */
const CACHE = 'autos-do-estudo-v11';
const ARQUIVOS = ['./', './index.html', './manifest.json', './icone-180.png', './icone-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ns => Promise.all(ns.filter(n => n !== CACHE).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(function(guardado){
      if (guardado) return guardado;
      return fetch(e.request).then(function(resp){
        /* As fontes vêm do Google e são guardadas na primeira vez que carregam,
           para que o app mantenha a tipografia offline. */
        if (resp && resp.status === 200 && (resp.type === 'basic' || resp.type === 'cors')) {
          const copia = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, copia));
        }
        return resp;
      }).catch(function(){ return caches.match('./index.html'); });
    })
  );
});
