/* Cotizador · Grupo LEAN — modo sin conexión.
   Siempre pide la versión nueva a internet; solo si no hay conexión usa la última copia guardada. */
const VERSION = "lean-cot-v1";
const BASE = ["./", "index.html", "manifest.webmanifest", "marca-agua.png", "apple-touch-icon.png", "icon-192.png", "icon-512.png",
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
  "https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js",
  "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(BASE.map(u => fetch(u, {cache:"no-store"}).then(r => (r.ok || r.type==="opaque") && c.put(u, r)).catch(() => {})))));
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// clave de caché: sin «?t=…» para los archivos del portal (cada petición lleva una marca de tiempo distinta)
const clave = req => { const u = new URL(req.url); if(u.hostname.endsWith("github.io") && /\/data\//.test(u.pathname)) return u.origin + u.pathname;
  if(req.mode === "navigate") return new URL("index.html", self.registration.scope).href; return req.url; };
self.addEventListener("fetch", e => {
  const req = e.request; if(req.method !== "GET") return;          // emitir / guardar / cobrar siempre va directo a internet
  const u = new URL(req.url); if(!/^https?:$/.test(u.protocol)) return;
  e.respondWith((async () => {
    const k = clave(req);
    try{
      const r = await fetch(req);
      if(r.ok || r.type === "opaque"){ const copia = r.clone(); caches.open(VERSION).then(c => c.put(k, copia)).catch(() => {}); }
      return r;
    }catch(err){
      const c = await caches.match(k) || (req.mode === "navigate" ? await caches.match("./") : null);
      if(c) return c;
      throw err;
    }
  })());
});
