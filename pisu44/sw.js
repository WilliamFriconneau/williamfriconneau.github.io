// PISU 44 hors ligne : télécharge tout le site (liste et empreintes dans manifest.json), le sert sans réseau,
// et se met à jour quand le réseau est là. Une nouvelle version n'est activée qu'une fois tous ses fichiers
// téléchargés et vérifiés (SHA-256) ; les fichiers inchangés sont repris de la version en place.
const PREFIXE = "pisu44-", ETAT = "pisu44-etat";
const url = p => new URL(p, self.registration.scope).href;
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");

async function actif() {
  const r = await (await caches.open(ETAT)).match("actif");
  return r ? r.text() : null;
}
let enCours = null;
function verifier() { return enCours || (enCours = majSite().finally(() => { enCours = null; })); }
async function majSite() {
  const m = await (await fetch(url("manifest.json"), { cache: "no-store" })).json();
  const nom = PREFIXE + m.version, avant = await actif();
  if (avant === nom) return { version: m.version, nouveau: false };
  const ancien = avant ? await caches.open(avant) : null;
  const anciensSha = {};
  if (ancien) { const am = await ancien.match(url("manifest.json")); if (am) (await am.json()).files.forEach(f => (anciensSha[f.path] = f.sha256)); }
  await caches.delete(nom);
  const neuf = await caches.open(nom);
  let fait = 0;
  const file = [...m.files];
  async function un() {
    for (let f; (f = file.shift());) {
      let rep = ancien && anciensSha[f.path] === f.sha256 ? await ancien.match(url(f.path)) : null;
      if (!rep) {
        const r = await fetch(url(f.path), { cache: "no-store" });
        if (!r.ok) throw new Error(`${f.path} : ${r.status}`);
        const b = await r.arrayBuffer();
        if (hex(await crypto.subtle.digest("SHA-256", b)) !== f.sha256) throw new Error(`${f.path} : empreinte différente`);
        rep = new Response(b, { headers: { "Content-Type": r.headers.get("Content-Type") || "application/octet-stream" } });
      }
      await neuf.put(url(f.path), rep);
      fait++;
      if (fait % 8 === 0) diffuser({ type: "progres", fait, total: m.files.length });
    }
  }
  await Promise.all([un(), un(), un(), un()]);
  await neuf.put(url("manifest.json"), new Response(JSON.stringify(m), { headers: { "Content-Type": "application/json" } }));
  await (await caches.open(ETAT)).put("actif", new Response(nom));
  for (const k of await caches.keys()) if (k.startsWith(PREFIXE) && k !== nom && k !== ETAT) await caches.delete(k);
  return { version: m.version, nouveau: !!avant };
}
async function diffuser(msg) { for (const c of await self.clients.matchAll({ includeUncontrolled: true })) c.postMessage(msg); }

self.addEventListener("install", e => { e.waitUntil(verifier().then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(self.clients.claim()); });
self.addEventListener("message", e => {
  if (e.data === "verifier") e.waitUntil(verifier().then(r => diffuser({ type: "etat", ...r }), err => diffuser({ type: "erreur", message: String(err.message || err) })));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || !req.url.startsWith(self.registration.scope)) return;
  e.respondWith((async () => {
    const nom = await actif();
    if (nom) {
      const c = await caches.open(nom);
      let u = req.url.split("#")[0].split("?")[0];
      if (req.mode === "navigate" || u === self.registration.scope) u = url("index.html");
      const r = await c.match(u);
      if (r) return r;
    }
    return fetch(req);
  })());
});
