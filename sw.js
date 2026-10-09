/* Guarda o app inteiro no primeiro acesso. Depois disso ele abre sem internet.
   Para publicar uma versão nova do material, troque o número do CACHE e, junto, a meta versao-app do
   index.html (as duas têm de ser iguais; o script versao.js faz e confere). Desde 09/10/2026, quando a versão
   nova assume o controle, a página mostra a faixa "Versão nova do aplicativo pronta". */
const CACHE = 'autos-do-estudo-v22';
const ARQUIVOS = ['./', './index.html', './manifest.json', './icone-180.png', './icone-512.png'];

self.addEventListener('install', e => {
  /* cache: 'reload' busca cada arquivo no servidor, sem usar o cache HTTP do navegador (o GitHub Pages manda
     max-age=600): a versão nova entra inteira, e não uma cópia de até 10 minutos atrás */
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
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
