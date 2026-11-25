/* Carnet PISU : navigation, déroulé des logigrammes, fiches médicaments et gestes. */
(() => {
  const P = window.PISU_PAGES || {}, M = window.PISU_MEDS || {}, ER = window.PISU_ERRATA || { corrections: [], incoherences: [] };
  const IMG = window.PISU_IMAGES || {}, PREP = window.PISU_PREP || {}, GESTES = window.PISU_GESTES || [], SC = window.PISU_SCENES;
  const NS = "http://www.w3.org/2000/svg";
  const app = document.getElementById("app");
  const $ = (s, r = document) => r.querySelector(s);
  const h = (tag, attrs = {}, html) => { const e = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); if (html !== undefined) e.innerHTML = html; return e; };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };

  const GROUPES = [
    ["Adulte et enfant ≥ 15 ans", "a"], ["Enfant < 15 ans", "e"], ["Actes de télémédecine", "at"], ["Soutien sanitaire opérationnel", "sso"],
  ];
  const classeCode = c => /SSO$/.test(c) ? "sso" : /AT$/.test(c) ? "at" : /E$/.test(c) ? "e" : /^M/.test(c) ? "med" : /A$/.test(c) ? "a" : "gen";

  // ------------------------------------------------------------- thème
  const themeBtn = $("#theme");
  const THEMES = ["auto", "light", "dark"], NOMS = { auto: "◐ Auto", light: "☀ Clair", dark: "☾ Sombre" };
  function appliquerTheme(t) {
    if (t === "auto") document.documentElement.removeAttribute("data-theme"); else document.documentElement.setAttribute("data-theme", t);
    themeBtn.textContent = NOMS[t]; store.set("pisu-theme", t);
    themeBtn.setAttribute("aria-label", `Thème : ${{ auto: "celui du système", light: "clair", dark: "sombre" }[t]}. Toucher pour changer.`);
  }
  appliquerTheme(store.get("pisu-theme") || "auto");
  const sonBtn = $("#son");
  const majSon = () => { const on = store.get("pisu-son") === "1"; sonBtn.textContent = on ? "♪ Son actif" : "♪ Son coupé"; sonBtn.setAttribute("aria-pressed", String(on)); };
  sonBtn.onclick = () => { store.set("pisu-son", store.get("pisu-son") === "1" ? "0" : "1"); majSon(); };
  majSon();
  themeBtn.onclick = () => appliquerTheme(THEMES[(THEMES.indexOf(store.get("pisu-theme") || "auto") + 1) % 3]);

  // ------------------------------------------------------------- outils
  function imageMed(code, petit) {
    const im = IMG[code];
    if (im) {
      const i = h("img", { src: im.fichier, alt: `${M[code]?.spe || code} : ${im.montre || "présentation"}`, loading: "lazy" });
      return i;
    }
    const d = PREP[code]?.dessin;
    if (d && SC) return SC.dessinProduit(d);
    return h("span", {}, "");
  }
  function figureMed(code) {
    const f = h("figure", { class: "photo" });
    f.appendChild(imageMed(code));
    const im = IMG[code];
    const cap = h("figcaption");
    if (im) cap.innerHTML = `Photo : ${esc(im.montre || "")}. Source : <a href="${esc(im.page_source)}">${esc(im.proprietaire || im.page_source)}</a>, consultée le ${esc(im.consulte_le || "")}.${im.licence ? ` Droits : ${esc(im.licence)}.` : ""}`;
    else cap.textContent = "Dessin de la présentation, pas une photo.";
    f.appendChild(cap);
    (im?.autres || []).forEach(a => {
      f.appendChild(h("img", { src: a.fichier, alt: a.montre, loading: "lazy", style: "margin-top:10px" }));
      f.appendChild(h("figcaption", {}, `Photo : ${esc(a.montre)}. Source : <a href="${esc(a.page_source)}">${esc(a.proprietaire)}</a>, consultée le ${esc(a.consulte_le)}. Droits : ${esc(a.licence)}.`));
    });
    return f;
  }
  function medChip(code) {
    const m = M[code]; if (!m) return h("span");
    const a = h("a", { class: "medchip", href: `#/med/${code}` });
    a.appendChild(imageMed(code, true));
    a.appendChild(h("div", {}, `<span class="c">${code}</span> ${esc(m.dci)} <small>${esc(m.spe)} · voir la préparation</small>`));
    return a;
  }
  function errataPour(code) {
    const inc = ER.incoherences.filter(r => r.codes.includes(code));
    const cor = ER.corrections.filter(r => r.codes.includes(code));
    return { inc, cor };
  }
  function blocConfirmer(code) {
    const { inc, cor } = errataPour(code);
    const d = h("div");
    if (cor.length) {
      const c = h("div", { class: "corrige", id: "ecarts" });
      c.innerHTML = `<h3>Écarts au PDF</h3><p style="margin:0 0 8px;font-size:14px">Le PDF du PISU 2024 fait foi. Ces passages sont corrigés dans le wiki de travail et marqués « écart au PDF » dans les textes.</p>
        <table><tr><th>N°</th><th>Où</th><th>Le PDF écrit</th><th>Le carnet écrit</th><th>Pourquoi</th></tr>${cor.map(r => `<tr><td>${r.n}</td><td>${r.ou}</td><td>${r.pdf}</td><td>${r.wiki}</td><td>${r.pourquoi}</td></tr>`).join("")}</table>`;
      d.appendChild(c);
    }
    if (inc.length) {
      const c = h("div", { class: "confirmer" });
      c.innerHTML = `<h3>À confirmer par le SSSM 44</h3><p style="margin:0 0 6px;font-size:14px">Incohérences relevées dans le PDF (relevé du ${ER.date}), montrées telles quelles.</p><ul>${inc.map(r => `<li><span class="grav ${r.grav}">${r.grav}</span><b>${r.ou}</b> : ${r.constat}</li>`).join("")}</ul>`;
      d.appendChild(c);
    }
    if (!cor.length && !inc.length) d.appendChild(h("p", { class: "vide" }, "Aucun écart ni point à confirmer relevé pour cette page."));
    return d;
  }
  function onglets(parent, liste, cle, surChoix) {
    const bar = h("div", { class: "tabs sous-tabs", role: "tablist" });
    const zone = h("div", { class: "proto" });
    parent.append(bar, zone);
    const choisir = id => {
      [...bar.children].forEach(b => b.setAttribute("aria-selected", b.dataset.id === id));
      zone.textContent = "";
      const it = liste.find(x => x.id === id) || liste[0];
      it.rendre(zone);
      if (cle) store.set(cle, id);
      if (surChoix) surChoix(it.id);
    };
    liste.forEach(it => { const b = h("button", { class: "tab", role: "tab", "data-id": it.id }, it.titre); b.onclick = () => choisir(it.id); bar.appendChild(b); });
    const m = cle ? store.get(cle) : null;
    choisir(liste.some(x => x.id === m) ? m : liste[0].id);
    return choisir;
  }
  function fiche(html) { const d = h("div", { class: "fiche" }, html); return d; }

  // ------------------------------------------------------------- navigation
  const NAV = [["#/", "Protocoles"], ["#/meds", "Médicaments"], ["#/gestes", "Gestes"], ["#/annexes", "Annexes"], ["#/formation", "Formation"]];
  const nav = $("#nav");
  NAV.forEach(([href, t]) => nav.appendChild(h("a", { class: "tab", href, role: "tab" }, t)));
  function majNav(route) {
    const sec = route.startsWith("#/formation") ? "#/formation" : route.startsWith("#/med") ? "#/meds" : route.startsWith("#/gestes") ? "#/gestes" : route.startsWith("#/annexes") || /#\/p\/(GEN|ANNEXE|BIBLIO|00)/.test(route) ? "#/annexes" : "#/";
    [...nav.children].forEach(a => a.setAttribute("aria-selected", a.getAttribute("href") === sec));
  }

  function route() {
    const r = location.hash || "#/";
    document.body.classList.remove("mode-interv");
    majNav(r);
    app.textContent = "";
    window.scrollTo(0, 0);
    let m;
    if ((m = r.match(/^#\/p\/(.+)$/)) && P[decodeURIComponent(m[1])]) pageProto(decodeURIComponent(m[1]));
    else if ((m = r.match(/^#\/med\/(M\d+)$/)) && M[m[1]]) pageMed(m[1]);
    else if (r === "#/meds") pageMeds();
    else if ((m = r.match(/^#\/gestes(?:\/(.+))?$/))) pageGestes(m[1]);
    else if (r === "#/annexes") pageAnnexes();
    else if (r === "#/formation" && window.PISU_FORMATION) window.PISU_FORMATION.page(app);
    else accueil();
  }
  window.addEventListener("hashchange", route);

  // ------------------------------------------------------------- accueil en tuiles (bento)
  const ICO = c => (window.PISU_ICONES ? window.PISU_ICONES(c) : "");
  const paire = c => { const m = /^([1-9])([AE])$/.exec(c); return m ? m[1] + (m[2] === "A" ? "E" : "A") : null; };
  function accueil() {
    const b = h("div", { class: "bento" });
    // recherche en grand
    let der = null; try { der = JSON.parse(localStorage.getItem("pisu-derniere") || "null"); } catch (e) {}
    if (der && !P[der.code]) der = null;
    const tr = h("section", { class: "tuile t-recherche" + (der ? "" : " pleine") }, `<div class="t-ico">${ICO("LOUPE")}</div><h2>Chercher</h2><p class="sub">Un protocole, un médicament, un geste ou un mot. Fautes et accents tolérés.</p>`);
    const champ = h("button", { class: "faux-champ", type: "button" }, "Rechercher…<kbd>/</kbd>");
    champ.onclick = () => ouvrirRecherche();
    tr.appendChild(champ);
    b.appendChild(tr);
    // reprendre la dernière intervention
    if (der) {
      const t = h("a", { class: "tuile t-reprendre", href: `#/p/${der.code}` }, `<div class="t-ico">${ICO("REPRENDRE")}</div><h3>Reprendre l'intervention</h3><p><span class="code ${classeCode(der.code)}">${der.code}</span>${esc(P[der.code].titre)} · étape ${der.pas.length}</p>`);
      t.onclick = () => { window.__pisuReprendre = der.code; };
      b.appendChild(t);
    }
    // protocoles adulte et enfant côte à côte
    const tp = h("section", { class: "tuile t-protos" }, `<h2>Protocoles</h2><div class="ae-tete"><span>Adulte et enfant ≥ 15 ans</span><span>Enfant &lt; 15 ans</span></div>`);
    const grilleAE = h("div", { class: "ae" });
    for (let i = 1; i <= 9; i++) {
      [`${i}A`, `${i}E`].forEach(c => {
        const p = P[c]; if (!p) return;
        const n = errataPour(c).inc.length;
        grilleAE.appendChild(h("a", { class: `pr ${classeCode(c)}`, href: `#/p/${c}` }, `<span class="pr-ico">${ICO(c)}</span><span class="pr-tx"><span class="code ${classeCode(c)}">${c}</span>${esc(p.titre.replace(/ de l'adulte et de l'enfant ≥ 15 ans| de l'enfant .*$|adulte et enfant ≥ 15 ans/gi, ""))}</span>${n ? `<span class="pr-n" title="${n} point(s) à confirmer">${n}</span>` : ""}`));
      });
    }
    tp.appendChild(grilleAE);
    b.appendChild(tp);
    // autres tuiles
    const mini = (cls, href, ico, titre, sous) => h("a", { class: `tuile ${cls}`, href }, `<div class="t-ico">${ICO(ico)}</div><h3>${titre}</h3><p>${sous}</p>`);
    const tat = h("section", { class: "tuile t-liste" }, `<h3>Télémédecine et SSO</h3>`);
    [...PROTO_AT, ...PROTO_SSO].forEach(c => P[c] && tat.appendChild(h("a", { class: "ligne", href: `#/p/${c}` }, `<span class="pr-ico">${ICO(c)}</span><span class="code ${classeCode(c)}">${c}</span>${esc(P[c].titre)}`)));
    b.append(mini("t-meds", "#/meds", "MED", "Médicaments", "M1 à M20 : fiches et préparations animées"),
      mini("t-gestes", "#/gestes", "GESTE", "Gestes", "Ampoule, purge, IV, IM, IO, aérosol, déchets"),
      mini("t-annexes", "#/annexes", "ANNEXE", "Annexes", "Marche générale, bilans, constantes, acronymes"),
      tat);
    app.appendChild(b);
  }
  const PROTO_AT = ["1AT", "2AT"], PROTO_SSO = ["1SSO", "2SSO", "3SSO", "4SSO", "5SSO"];

  // ------------------------------------------------------------- recherche floue
  const norm = s => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/œ/g, "oe").replace(/[^a-z0-9]+/g, " ").trim();
  const texteDe = html => { const d = document.createElement("div"); d.innerHTML = html || ""; return d.textContent; };
  let INDEX = null;
  function indexer() {
    INDEX = [];
    Object.values(P).forEach(p => INDEX.push({ t: `${p.code} ${p.titre}`, c: texteDe(p.fiche + " " + p.protocole) + " " + (p.logi ? p.logi.nodes.map(n => n.txt).join(" ") : ""), href: `#/p/${p.code}`, lab: `<span class="code ${classeCode(p.code)}">${/^(GEN|ANNEXE|BIBLIO|00)/.test(p.code) ? "Annexe" : p.code}</span>${esc(p.titre)}`, ico: p.code }));
    Object.values(M).forEach(m => INDEX.push({ t: `${m.code} ${m.dci} ${m.spe}`, c: texteDe(m.fiche), href: `#/med/${m.code}`, lab: `<span class="code med">${m.code}</span>${esc(m.dci)} <small>${esc(m.spe)}</small>`, ico: "MED" }));
    GESTES.forEach(g => INDEX.push({ t: `${g.titre} ${g.sous || ""}`, c: g.etapes.map(e => texteDe(e.t)).join(" "), href: `#/gestes/${g.id}`, lab: `<span class="code geste">Geste</span>${esc(g.titre)}`, ico: "GESTE" }));
    INDEX.forEach(x => { x.tn = norm(x.t); x.cn = norm(x.c); x.tw = x.tn.split(" "); x.cw = [...new Set(x.cn.split(" "))]; });
  }
  function dist(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      const cur = [i]; let best = i;
      for (let j = 1; j <= b.length; j++) { cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); best = Math.min(best, cur[j]); }
      if (best > max) return max + 1;
      prev = cur;
    }
    return prev[b.length];
  }
  function scoreMot(q, mots) {
    let s = 0;
    for (const w of mots) {
      if (w === q) return 3;
      if (w.startsWith(q)) s = Math.max(s, 2.5);
      else if (q.length >= 3 && w.includes(q)) s = Math.max(s, 1.6);
      else if (q.length >= 4) { const d = dist(q, w.slice(0, q.length + 1), 2); if (d <= (q.length >= 7 ? 2 : 1)) s = Math.max(s, 1.2); }
    }
    return s;
  }
  function chercher(q) {
    if (!INDEX) indexer();
    const mots = norm(q).split(" ").filter(Boolean);
    if (!mots.length) return [];
    return INDEX.map(x => {
      let tot = 0;
      for (const m of mots) { const st = scoreMot(m, x.tw) * 3, sc = scoreMot(m, x.cw); const s = Math.max(st, sc); if (!s) return null; tot += s; }
      let extrait = "";
      if (!mots.every(m => scoreMot(m, x.tw))) { const i = x.cn.indexOf(mots[0].slice(0, 4)); if (i >= 0) extrait = x.c ? norm(x.c).slice(Math.max(0, i - 30), i + 70) : ""; }
      return { x, tot, extrait };
    }).filter(Boolean).sort((a, b) => b.tot - a.tot).slice(0, 12);
  }
  const rech = $("#recherche"), rq = $("#q"), rres = $("#res");
  function ouvrirRecherche() { rech.classList.add("ouverte"); rq.focus(); afficherRes(); }
  function fermerRecherche() { rech.classList.remove("ouverte"); rres.textContent = ""; }
  function afficherRes() {
    const r = chercher(rq.value);
    rres.textContent = "";
    if (!rq.value.trim()) return;
    if (!r.length) { rres.appendChild(h("li", { class: "vide" }, "Rien trouvé.")); return; }
    r.forEach(({ x, extrait }) => {
      const li = h("li"); const a = h("a", { href: x.href }, `<span class="pr-ico">${ICO(x.ico)}</span><span>${x.lab}${extrait ? `<small class="ext">… ${esc(extrait)} …</small>` : ""}</span>`);
      a.onclick = () => fermerRecherche(); li.appendChild(a); rres.appendChild(li);
    });
  }
  rq.addEventListener("input", afficherRes);
  rq.addEventListener("focus", () => rech.classList.add("ouverte"));
  rq.addEventListener("keydown", e => {
    if (e.key === "Escape") { rq.blur(); fermerRecherche(); }
    if (e.key === "Enter") { const a = $("a", rres); if (a) { location.hash = a.getAttribute("href"); fermerRecherche(); rq.blur(); } }
    if (e.key === "ArrowDown") { const a = $("a", rres); if (a) { e.preventDefault(); a.focus(); } }
  });
  document.addEventListener("keydown", e => { if (e.key === "/" && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); ouvrirRecherche(); } });
  document.addEventListener("click", e => { if (!rech.contains(e.target) && !e.target.closest(".faux-champ")) fermerRecherche(); });

  function pageAnnexes() {
    app.appendChild(h("h2", {}, "Généralités et annexes"));
    const grille = h("div", { class: "grille" });
    Object.values(P).filter(p => p.groupe === "Généralités et annexes").forEach(p =>
      grille.appendChild(h("a", { class: "carte gen", href: `#/p/${p.code}` }, `<div class="pb">${p.logi ? "logigramme animé" : "texte"}</div><h3>${esc(p.titre)}</h3>`)));
    app.appendChild(grille);
    app.appendChild(h("div", { class: "confirmer" }, `<h3>Points à confirmer sans protocole précis</h3><ul>${ER.incoherences.filter(r => !r.codes.length).map(r => `<li><span class="grav ${r.grav}">${r.grav}</span><b>${r.ou}</b> : ${r.constat}</li>`).join("")}</ul>`));
  }

  // ------------------------------------------------------------- page protocole
  function pageProto(code) {
    const p = P[code], cl = classeCode(code);
    const gen = /^(GEN|ANNEXE|BIBLIO|00)/.test(code);
    const tete = h("div", { class: "proto-tete" }, `${gen ? "" : `<span class="pt-ico">${ICO(code)}</span>`}<div class="pt-tx"><h2>${gen ? "" : `<span class="code ${cl}">${code}</span>`}${esc(p.titre)}</h2>${p.ecartTitre ? `<p style="margin:2px 0 0">${ecartHtml(p.ecartTitre)}</p>` : ""}</div>`);
    const autre = paire(code);
    if (autre && P[autre]) {
      const bAE = h("a", { class: "b bascule-ae", href: `#/p/${autre}` }, `${/E$/.test(autre) ? "Enfant" : "Adulte"} <b>${autre}</b> ⇄`);
      bAE.setAttribute("aria-label", `Ouvrir le même protocole pour ${/E$/.test(autre) ? "l'enfant" : "l'adulte"} (${autre}), à la même étape si possible`);
      bAE.onclick = () => { if (deroule.saut) deroule.saut(autre); };
      tete.appendChild(bAE);
    }
    app.appendChild(tete);
    const { inc, cor } = errataPour(code);
    const liste = [];
    const logi = p.logi || (/AT$/.test(code) ? logiTexte(p) : null);
    if (logi) liste.push({ id: "deroule", titre: "Intervention", rendre: z => deroule(z, code, logi, !p.logi) });
    if (p.fiche) liste.push({ id: "fiche", titre: /AT$/.test(code) ? "Texte" : "Fiche", rendre: z => z.appendChild(fiche(p.fiche)) });
    if (p.protocole) liste.push({ id: "protocole", titre: "Protocole", rendre: z => z.appendChild(fiche(p.protocole)) });
    if (inc.length || cor.length) liste.push({ id: "confirmer", titre: `À confirmer <small>${inc.length} point${inc.length > 1 ? "s" : ""}${cor.length ? `, ${cor.length} écart${cor.length > 1 ? "s" : ""}` : ""}</small>`, rendre: z => z.appendChild(blocConfirmer(code)) });
    if (!liste.length) liste.push({ id: "vide", titre: "Page", rendre: z => z.appendChild(h("p", { class: "vide" }, "Page vide.")) });
    const choisir = onglets(app, liste, null, id => document.body.classList.toggle("mode-interv", id === "deroule"));
    app.addEventListener("click", e => { const a = e.target.closest('a[href="#ecarts"]'); if (a) { e.preventDefault(); choisir("confirmer"); } });
  }

  // 1AT et 2AT n'ont pas de logigramme : déroulé dans l'ordre du texte, sans branche.
  function logiTexte(p) {
    const d = h("div", {}, p.fiche);
    const nodes = [];
    let cur = null;
    [...d.children].forEach(el => {
      if (/^H[34]$/.test(el.tagName) && !/^(a|b|c)\./i.test(el.textContent.trim())) {
        const t = el.textContent.trim();
        cur = { id: "n" + nodes.length, k: /15/.test(t) && t.length < 6 ? "appel" : "action", html: `<div><b>${esc(t)}</b></div>`, txt: t, meds: [] };
        nodes.push(cur);
      } else if (cur) {
        if (el.classList.contains("callout") && cur.k === "appel") { cur = { id: "n" + nodes.length, k: "medicament", html: "", txt: "", meds: [] }; nodes.push(cur); }
        cur.html += el.outerHTML; cur.txt += " " + el.textContent;
      }
    });
    nodes.forEach(n => { n.meds = [...new Set([...n.html.matchAll(/#\/med\/(M\d+)/g)].map(x => x[1]))]; });
    const edges = nodes.slice(1).map((n, i) => ({ id: "e" + i, s: nodes[i].id, t: n.id, label: "" }));
    return { nodes, edges, start: nodes[0]?.id, notes: [], box: null };
  }

  // ------------------------------------------------------------- intervention : scène animée + logigramme HTML, sur la même page
  const KIND = {
    titre: ["Départ", "titre", "▶"], question: ["Décision", "question", "?"], medicament: ["Médicament", "medicament", "Rx"],
    action: ["Action", "action", "✚"], appel: ["Appel CRRA 15", "appel", "☎"], orientation: ["Orientation", "orientation", "➜"],
    renvoi: ["Renvoi", "renvoi", "↪"], fin: ["Fin du logigramme", "fin", "✓"],
  };
  const estQuinze = n => n.k === "appel" && /^\s*(☎\s*)?15\s*$/.test(n.txt);
  function texteNoeud(n) {
    if (estQuinze(n)) return "<div><b>☎ Appel CRRA 15</b></div>";
    let html = n.html;
    if (/PISU|PSSO|Appliquer/i.test(n.txt)) {
      const codes = [...new Set((n.txt.match(/\b([1-9][AE]|[12]AT|[1-5]SSO)\b/g) || []))].filter(c => P[c]);
      if (codes.length) html += `<div class="renvois">${codes.map(c => `<a class="b" href="#/p/${c}">Ouvrir le ${c}</a>`).join(" ")}</div>`;
    }
    return html;
  }
  function premiereLigne(n) { return estQuinze(n) ? "Appel CRRA 15" : (n.txt || "").split("\n")[0].trim().slice(0, 90); }
  function ecartHtml(e) { return ` <span class="ecart">écart au PDF ${esc(e[0])}</span><span class="ecart-txt"> (${esc(e[1])})</span>`; }

  // Mise en page du logigramme : suite verticale ; à chaque décision, les branches côte à côte
  // (empilées sur téléphone) jusqu'au point où elles se rejoignent.
  function structure(L) {
    const out = {};
    L.edges.forEach(e => (out[e.s] = out[e.s] || []).push(e));
    const R = {};
    const reach = id => { if (R[id]) return R[id]; const d = { [id]: 0 }, q = [id]; while (q.length) { const u = q.shift(); (out[u] || []).forEach(e => { if (!(e.t in d)) { d[e.t] = d[u] + 1; q.push(e.t); } }); } return (R[id] = d); };
    const fait = new Set();
    const jonction = es => {
      const rs = es.map(e => reach(e.t));
      const communs = Object.keys(rs[0]).filter(k => rs.every(r => k in r));
      if (!communs.length) return null;
      return communs.reduce((a, b) => Math.max(...rs.map(r => r[a])) <= Math.max(...rs.map(r => r[b])) ? a : b);
    };
    function suite(id, stops) {
      const items = [];
      while (id) {
        if (stops.has(id)) break;
        if ([...stops].some(s => id in reach(s)) || fait.has(id)) { items.push({ t: "goto", id }); break; }
        fait.add(id);
        items.push({ t: "n", id });
        const es = out[id] || [];
        if (!es.length) break;
        if (es.length === 1) { id = es[0].t; continue; }
        const m = jonction(es);
        const st2 = new Set(stops); if (m) st2.add(m);
        items.push({ t: "split", de: id, branches: es.map(e => ({ e, items: suite(e.t, st2) })) });
        id = m;
      }
      return items;
    }
    return suite(L.start, new Set());
  }

  function choisirVariante(medCode, code, n) {
    const pr = PREP[medCode]; if (!pr) return 0;
    const t = (n.txt || "") + " " + code;
    let best = 0, bs = -1;
    pr.variantes.forEach((v, i) => {
      const nom = v.nom; let s = 0;
      if (/PER OS|per os|\bPO\b|Lyoc/i.test(t) && /per os/i.test(nom)) s += 4;
      if (/INTRA MUSCULAIRE|\bIM\b/i.test(t) && /\bIM\b/.test(nom)) s += 4;
      if (/a[ée]rosol/i.test(t) && /a[ée]rosol/i.test(nom)) s += 4;
      if (/IV\b|IVL|IVD/.test(t) && /\bIV\b|IVD|IVL/.test(nom) && !/per os/i.test(nom)) s += 1;
      if (/E$/.test(code) && /enfant/i.test(nom) && !/^Adulte/.test(nom)) s += 2;
      if (/A$|AT$|SSO$/.test(code) && /adulte/i.test(nom)) s += 2;
      if (/^1[AE]$/.test(code) && /ACR/.test(nom)) s += 2;
      if (/^1[AE]$/.test(code) && /Dilution 1/.test(nom)) s += 1;
      if (s > bs) { bs = s; best = i; }
    });
    return best;
  }

  const r2 = v => Math.round(v * 100) / 100;
  const nb = v => String(r2(v)).replace(".", ",");
  const normTxt = s => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const SAED_SRC = { titre: "Saed : un guide pour faciliter la communication entre professionnels de santé", url: "https://www.has-sante.fr/jcms/c_1776178/fr/saed-un-guide-pour-faciliter-la-communication-entre-professionnels-de-sante", date: "octobre 2014" };
  let SAUT = null; // passage adulte ↔ enfant : on garde l'étape en cours

  // Pharmacodynamie et pharmacocinétique : extraits du RCP (base de données publique des médicaments), séparés du PISU.
  const vPh = x => (x && x.val) || "non précisé dans le RCP";
  function citeTitle(x) { return x && x.cite ? ` title="${esc(x.cite)}"` : ""; }
  function pharmaco(mc) {
    const r = (window.PISU_PHARMACO || {})[mc];
    const d = h("div", { class: "pharmaco" });
    if (!r) { d.appendChild(h("p", { class: "vide" }, "Pas d'extrait du RCP dans le carnet pour ce médicament.")); return d; }
    d.innerHTML = `<p class="ph-src"><span class="niv">réglementaire</span>RCP ${esc(r.specialite || "")}${r.cis ? ` (CIS ${esc(r.cis)})` : ""}, ${r.url ? `<a href="${esc(r.url)}">base de données publique des médicaments</a>` : "base de données publique des médicaments"}${r.date ? `, ${esc(r.date)}` : ""}. Ce n'est pas le PISU : en cas d'écart, le PISU fait foi pour la conduite à tenir.</p>
      <div class="ph-chiffres">${[["Délai d'action", r.delai], ["Pic", r.pic], ["Durée d'action", r.duree], ["Demi-vie", r.demivie]].map(([k, x]) => `<div class="stat"${citeTitle(x)}><b>${k}</b><span>${esc(vPh(x))}</span></div>`).join("")}</div>
      ${courbe(r)}
      <h3>Pharmacodynamie</h3>${r.mecanisme ? `<p>${esc(r.mecanisme.txt || "")}</p>${r.mecanisme.cite ? `<blockquote>« ${esc(r.mecanisme.cite)} »</blockquote>` : ""}` : "<p>non précisé dans le RCP</p>"}
      ${(r.effets || []).length ? `<h4>Effets utiles en urgence</h4><ul>${r.effets.map(e => `<li>${esc(e.txt || "")}${e.cite ? ` <small>« ${esc(e.cite)} »</small>` : ""}</li>`).join("")}</ul>` : ""}
      <h3>Pharmacocinétique</h3><p><b>Élimination :</b> ${esc(vPh(r.elimination))}${r.elimination && r.elimination.cite ? ` <small>« ${esc(r.elimination.cite)} »</small>` : ""}</p>
      ${(r.populations || []).length ? `<h4>Enfant, sujet âgé, insuffisance rénale ou hépatique</h4><ul>${r.populations.map(e => `<li>${esc(e.txt || "")}${e.cite ? ` <small>« ${esc(e.cite)} »</small>` : ""}</li>`).join("")}</ul>` : ""}
      ${(r.autres_sources || []).length ? `<details class="sources" open><summary>Autres sources</summary><ul>${r.autres_sources.map(x => `<li><span class="niv">${esc(x.niveau || "")}</span>${x.url ? `<a href="${esc(x.url)}">${esc(x.titre || x.url)}</a>` : esc(x.titre || "")}${x.date ? `, ${esc(x.date)}` : ""}${x.cite ? ` « ${esc(x.cite)} »` : ""}</li>`).join("")}</ul></details>` : ""}`;
    return d;
  }
  // schéma de principe délai / pic / durée (pas à l'échelle), seulement si le RCP donne au moins le délai et la durée
  function courbe(r) {
    if (!r.delai || !r.duree || /non précisé/.test(vPh(r.delai) + vPh(r.duree))) return "";
    return `<figure class="ph-courbe"><svg viewBox="0 0 320 120" role="img" aria-label="schéma de principe de l'effet dans le temps">
      <line x1="20" y1="100" x2="310" y2="100" stroke="currentColor" stroke-width="1.5"/><line x1="20" y1="100" x2="20" y2="10" stroke="currentColor" stroke-width="1.5"/>
      <path d="M20 100 C60 100 70 30 110 25 C170 20 220 40 300 98" fill="none" stroke="#a8191a" stroke-width="3"/>
      <line x1="60" y1="100" x2="60" y2="70" stroke="#1f5f99" stroke-dasharray="4 3"/><text x="60" y="114" text-anchor="middle" font-size="10" fill="currentColor">délai</text>
      <line x1="110" y1="100" x2="110" y2="25" stroke="#1f5f99" stroke-dasharray="4 3"/><text x="110" y="114" text-anchor="middle" font-size="10" fill="currentColor">pic</text>
      <text x="300" y="114" text-anchor="end" font-size="10" fill="currentColor">fin d'effet</text><text x="26" y="16" font-size="10" fill="currentColor">effet</text></svg>
      <figcaption>Schéma de principe, pas à l'échelle. Délai : ${esc(vPh(r.delai))} ; pic : ${esc(vPh(r.pic))} ; durée : ${esc(vPh(r.duree))} (RCP).</figcaption></figure>`;
  }

  // Précautions d'un médicament : d'abord le texte du PISU (rubrique « Administration et surveillance » de la fiche),
  // puis les points à confirmer. Le RCP n'est pas recopié ici.
  const DILUTION_ABSENTE = { M9: "Dilution : non prévue par le PISU." };
  function precautions(mc, variante) {
    const d = document.createElement("div"); d.innerHTML = M[mc].fiche;
    const h2 = [...d.querySelectorAll("h2")].find(x => /Administration/i.test(x.textContent));
    const morceaux = [];
    if (h2) { let n = h2.nextElementSibling; while (n && n.tagName !== "H2") { if (!/TABLE/.test(n.tagName)) { const c = n.cloneNode(true); c.querySelectorAll("br").forEach(b => b.replaceWith("\n")); c.textContent.split("\n").map(t => t.replace(/\s+/g, " ").trim()).filter(Boolean).forEach(t => morceaux.push(t)); } n = n.nextElementSibling; } }
    const box = h("div", { class: "precautions" }, `<b class="h">Précautions · PISU, fiche ${mc}</b>`);
    morceaux.filter(Boolean).forEach(t => box.appendChild(h("p", {}, esc(t))));
    if (DILUTION_ABSENTE[mc]) box.appendChild(h("p", {}, DILUTION_ABSENTE[mc]));
    const conf = (variante && variante.conf) || (PREP[mc] && PREP[mc].variantes.map(v => v.conf).filter(Boolean)[0]);
    box.appendChild(h("p", { class: "note" }, "Volume à injecter calculé par le carnet : dose du PISU ÷ concentration de la fiche. Le PISU ne dit pas comment garder une seringue entre deux injections. La couleur du liquide sert à repérer le médicament."));
    if (conf) box.appendChild(h("p", { class: "a-conf" }, `<span class="badge-conf">à confirmer par le SSSM 44</span> ${esc(conf)}`));
    const r = (window.PISU_PHARMACO || {})[mc];
    const wrap = h("div");
    wrap.appendChild(box);
    if (r) {
      const rc = h("div", { class: "rcp-box" }, `<b class="h">RCP du produit (réglementaire)${r.date ? `, ${esc(r.date)}` : ""}</b><p><b>Effet attendu :</b> délai ${esc(vPh(r.delai))} ; durée ${esc(vPh(r.duree))}.</p>${r.url ? `<p class="note"><a href="${esc(r.url)}">RCP ${esc(r.specialite || "")}</a></p>` : ""}`);
      wrap.appendChild(rc);
    }
    return wrap;
  }

  function deroule(zone, code, L, sansLogi) {
    const byId = Object.fromEntries(L.nodes.map(n => [n.id, n]));
    const out = id => L.edges.filter(e => e.s === id);
    const DOSES = (window.PISU_DOSES || {})[code] || {};
    const BOU = (window.PISU_BOUCLES || {})[code] || {};
    const auPoids = Object.values(DOSES).flat().some(d => d.mgkg || d.mlkg || (d.choix || []).some(c => c.mgkg));
    if (sansLogi) zone.appendChild(h("p", { class: "note", style: "margin-top:0" }, "Pas de logigramme dans le PISU pour cet acte : les étapes suivent l'ordre du texte, sans branche ajoutée."));
    // Écran de l'étape : tient dans la hauteur de la fenêtre. En haut : frise des étapes passées ; au milieu, le logigramme ;
    // au milieu : l'étape en cours et ce qui se joue (préparation, message, scène) ; en bas, sous le pouce : les commandes.
    const ecran = h("section", { class: "ecran", "aria-label": "Étape en cours" });
    zone.appendChild(ecran);
    // 1. ligne fine : code et titre, bascule adulte ↔ enfant
    const ecTitre = h("div", { class: "ec-titre" }, `<a class="b ec-accueil" href="#/" aria-label="Retour à l'accueil du carnet">◀</a><span class="code ${classeCode(code)}">${esc(code)}</span><span class="ec-nom">${esc(P[code].titre)}</span>`);
    const autreAE = paire(code);
    if (autreAE && P[autreAE]) { const a = h("a", { class: "b ae-mini", href: `#/p/${autreAE}`, "aria-label": `Même protocole pour ${/E$/.test(autreAE) ? "l'enfant" : "l'adulte"}` }, `${autreAE} ⇄`); a.onclick = () => { if (deroule.saut) deroule.saut(autreAE); }; ecTitre.appendChild(a); }
    // 2. frise des étapes passées
    const frise = h("div", { class: "frise-pas", role: "list", "aria-label": "Étapes déjà parcourues : toucher pour y revenir" });
    // 3. carte de l'étape : badge et texte, rien d'autre
    const carte = h("div", { class: "carte-etape", "aria-live": "polite" });
    // 4. milieu : la scène de l'étape en tête, puis les compléments (seringues, jauge, précautions, message…)
    // logigramme d'abord : il occupe l'écran ; l'animation de l'étape en cours se place à sa droite
    // (ordinateur) ou juste sous le nœud en cours (téléphone)
    const milieu = h("div", { class: "ec-milieu logi-1er" });
    const logiZone = h("div", { class: "ec-logi" });
    const cote = h("div", { class: "ec-cote" });
    const media = h("div", { class: "ec-media" });
    const sceneBox = h("div", { class: "scene-box" });
    const sc = SC.intervention(sceneBox);
    const prep = h("div", { class: "prep-int" });
    const infos = h("div", { class: "ec-infos" });
    const plateau = h("div", { class: "plateau" });
    const saed = h("div", { class: "saed" });
    const extra = h("div", { class: "ec-extra" });
    media.append(sceneBox, prep);
    infos.append(plateau, saed, extra);
    cote.append(carte, media, infos);
    milieu.append(logiZone);
    // 5. barre du bas, fixe : une rangée fine (Retour, Pause) puis la ou les actions principales en grand
    const ecBas = h("div", { class: "ec-bas" });
    const barre = h("div");
    const B = SC.barreLecture(barre);
    const bRe = h("button", { class: "b petit", type: "button" }, "Recommencer");
    B.el.classList.add("fine");
    const choixBas = h("div", { class: "choix-bas" });
    ecBas.append(barre, choixBas);
    ecran.append(ecTitre, frise, milieu, ecBas);
    ecran.classList.add("logi-1er");
    const lcol = h("div", { class: "logi-col" });
    lcol.appendChild(h("p", { class: "aide" }, "Toucher une étape ou une branche (OUI, NON) pour reprendre de là."));
    const lg = h("div", { class: "lg" });
    lcol.appendChild(lg);
    if (L.notes.length) {
      const nbx = h("div", { class: "notes-logi" }, `<b class="h">Pendant toute la prise en charge</b>`);
      L.notes.forEach(id => { const n = byId[id]; nbx.appendChild(h("div", { class: "notes-tx" }, n.html + (n.ecart ? ecartHtml(n.ecart) : ""))); });
      lcol.appendChild(nbx);
    }
    logiZone.appendChild(lcol);
    // bilan de la fiche (cadre « Bilan paramédical » du PISU) : saisi à l'étape de départ, repris dans le Saed
    const BILAN = (() => { const d = document.createElement("div"); d.innerHTML = P[code].fiche || ""; return [...d.querySelectorAll("p.callout.info")].map(p => p.textContent.trim()).filter(Boolean); })();
    const bilan = {};
    try { Object.assign(bilan, JSON.parse(sessionStorage.getItem("pisu-bilan-" + code) || "{}")); } catch (e) {}

    // ---- logigramme HTML
    const elN = {}, elBr = {};
    const poids = items => Math.max(1, ...items.filter(i => i.t === "split").map(i => i.branches.reduce((a, b) => a + poids(b.items), 0)));
    function dessinerItems(items, parent) {
      items.forEach((it, i) => {
        if (i > 0 && it.t !== "split") parent.appendChild(h("div", { class: "lg-fl" }));
        if (it.t === "n") {
          const n = byId[it.id], [titre, cl] = KIND[n.k] || KIND.action;
          const wrap = h("div", { class: "lg-nw" + (BOU[n.id] ? " avec-boucle" : "") });
          const b = h("div", { class: `lg-n k-${cl}`, role: "button", tabindex: "0", "data-id": n.id });
          b.innerHTML = (n.k === "question" ? "" : `<span class="lg-k">${titre}</span>`) + `<span class="lg-tx">${estQuinze(n) ? "☎ 15" : n.html}</span>` + (n.ecart ? ecartHtml(n.ecart) : "");
          b.onclick = ev => { if (ev.target.closest("a")) return; allerVers(n.id, true); };
          wrap.appendChild(b);
          if (BOU[n.id]) {
            const bo = BOU[n.id];
            wrap.appendChild(h("div", { class: "lg-boucle" }, `<span class="fl-retour" aria-hidden="true"></span><b>↻ Répéter</b> ${esc(bo.rythme)}<small>Arrêt : ${esc(bo.arret)}</small>`));
          }
          elN[n.id] = b; parent.appendChild(wrap);
        } else if (it.t === "goto") {
          const n = byId[it.id];
          const b = h("button", { class: "lg-goto", type: "button" }, `↓ suite : ${esc(premiereLigne(n))}`);
          b.onclick = () => allerVers(n.id, true);
          parent.appendChild(b);
        } else {
          parent.appendChild(h("div", { class: "lg-fl" }));
          const sp = h("div", { class: "lg-split" });
          it.branches.forEach(br => {
            const lab = br.e.label || (it.branches.length > 1 ? "en même temps" : "");
            const col = h("div", { class: "lg-br " + (/^OUI/i.test(lab) ? "oui" : /^NON/i.test(lab) ? "non" : "par"), "data-e": br.e.id });
            const bl = h("div", { class: "lg-lab", role: "button", tabindex: "0" }, esc(lab) + (br.e.ecart ? ecartHtml(br.e.ecart) : ""));
            bl.onclick = ev => { if (ev.target.closest("a")) return; allerBranche(br.e, true); };
            col.appendChild(bl);
            dessinerItems(br.items, col);
            if (!br.items.length) col.appendChild(h("div", { class: "lg-vide" }, "↓ rejoint la suite"));
            col.style.flex = `${poids(br.items)} 1 0`;
            elBr[br.e.id] = col; sp.appendChild(col);
          });
          parent.appendChild(sp);
        }
      });
    }
    dessinerItems(structure(L), lg);
    lg.addEventListener("keydown", ev => { if ((ev.key === "Enter" || ev.key === " ") && ev.target.matches("[role=button]")) { ev.preventDefault(); ev.target.click(); } });

    // ---- état
    let chemin = [], auto = false, lect = [], masse = null;
    try { const m = JSON.parse(localStorage.getItem("pisu-poids-" + code) || "null"); if (m) masse = m; } catch (e) {}
    const courant = () => chemin[chemin.length - 1];
    const actif = c => c.ids.find(i => out(i).length) || c.ids[0];
    function suivants(id) {
      const n = byId[id], es = out(id);
      if (!es.length) return { type: "fin" };
      if (n.k === "question" || es.some(e => e.label)) return { type: "choix", es };
      if (es.length === 1) return { type: "suite", es };
      return { type: "parallele", es };
    }
    const avancer = e => { chemin.push({ ids: [e.t], via: e }); rendre(true); };
    const parallele = es => { chemin.push({ ids: es.map(e => e.t), via: null, par: es }); rendre(true); };
    function etapeSuivante() {
      const s = suivants(actif(courant()));
      if (s.type === "suite") avancer(s.es[0]); else if (s.type === "parallele") parallele(s.es);
    }
    function cheminVers(id) {
      const prev = { [L.start]: null }, q = [L.start];
      while (q.length) { const u = q.shift(); if (u === id) break; out(u).forEach(e => { if (!(e.t in prev)) { prev[e.t] = e; q.push(e.t); } }); }
      if (!(id in prev)) return null;
      const pas = []; let cur = id;
      while (cur !== L.start) { const e = prev[cur]; pas.unshift({ ids: [cur], via: e }); cur = e.s; }
      pas.unshift({ ids: [L.start], via: null });
      return pas;
    }
    function allerVers(id, depuisSchema) { const p = cheminVers(id); if (!p) return; chemin = p; arreterAuto(); rendre(true, depuisSchema); }
    function allerBranche(e, depuisSchema) { const p = cheminVers(e.s); if (!p) return; p.push({ ids: [e.t], via: e }); chemin = p; arreterAuto(); rendre(true, depuisSchema); }
    const recommencer = () => { chemin = [{ ids: [L.start], via: null }]; arreterAuto(); rendre(true); };
    const passages = (k = chemin.length - 1) => { let n = 1; while (k > 0 && chemin[k].boucle) { n++; k--; } return n; };

    // ---- mémoire des seringues : recalculée depuis le début du chemin (le retour arrière reste juste)
    function prodDe(m, v) { const p = PREP[m] && PREP[m].variantes[v]; return p && p.prod; }
    function calculer(jusqua) {
      const plat = {}, evs = [], cum = {};
      for (let k = 0; k <= jusqua; k++) {
        const st = chemin[k]; evs[k] = [];
        st.ids.forEach(id => (DOSES[id] || []).forEach((inj, j) => {
          const ci = (st.choix || {})[`${id}:${j}`] ?? 0;
          const opt = inj.choix ? Object.assign({ m: inj.m }, inj.choix[ci]) : inj;
          const pr = prodDe(opt.m, opt.v); if (!pr) return;
          let dose = null, ml = null;
          if (opt.mg != null) dose = opt.mg;
          else if (opt.mgkg != null && masse) dose = Math.min(opt.mgkg * masse, opt.max ?? Infinity);
          if (dose != null) ml = dose / pr.conc;
          if (opt.mlkg != null && masse) { ml = Math.min(opt.mlkg * masse, opt.maxml ?? Infinity); dose = ml * pr.conc; }
          const key = `${opt.m}:${opt.v}`;
          const ev = { k, id, j, inj, opt, m: opt.m, pr, key, dose, ml, voie: inj.voie || pr.voie, choix: ci, nouvelle: false, jetees: [], avant: null, apres: null };
          let sy = plat[key];
          if (ml == null) { if (!sy) { ev.nouvelle = true; plat[key] = sy = { ...pr, m: opt.m, v: opt.v, reste: pr.vol, n: 0, total: 0 }; } ev.avant = sy.reste; evs[k].push(ev); return; }
          ml = r2(ml); ev.ml = ml;
          if (sy && sy.reste + 1e-6 < ml) { ev.jetees.push({ reste: sy.reste, morph: opt.m === "M7" }); delete plat[key]; sy = null; }
          if (!sy) { ev.nouvelle = true; plat[key] = sy = { ...pr, m: opt.m, v: opt.v, reste: pr.vol, n: 0, total: 0 }; }
          ev.avant = sy.reste;
          if (ml > sy.reste + 1e-6) ev.tropGrand = true;
          sy.reste = r2(Math.max(0, sy.reste - ml)); sy.n++; sy.total = r2(sy.total + dose);
          ev.apres = sy.reste; ev.n = sy.n;
          const c = cum[opt.m] = cum[opt.m] || { n: 0, total: 0 }; c.n++; c.total = r2(c.total + dose);
          ev.annonce = annonceDe(ev, c, chemin[k], id);
          if (sy.reste <= 1e-6) { ev.vide = true; delete plat[key]; }
          evs[k].push(ev);
        }));
      }
      // cumul par médicament pour la transmission
      const cumul = {};
      evs.flat().forEach(ev => { if (ev.dose == null) return; const c = cumul[ev.m] = cumul[ev.m] || { n: 0, total: 0, u: ev.pr.u, voie: ev.voie, nom: ev.pr.nom }; c.n++; c.total = r2(c.total + ev.dose); });
      return { plat: Object.values(plat), evs, cumul };
    }

    // ---- phrase annoncée à voix haute au moment où le piston est poussé (boucle fermée) :
    // dose de cette injection + total du médicament depuis le début, calculés par la mémoire des seringues.
    // Chocs : seulement là où le PDF donne le rang (1A et 1E, « après le 3e choc », « après le 5e choc »).
    const ANNONCE_SRC = `<p>Phrases « à voix haute » : dose et total calculés par la mémoire des seringues du carnet ; l'heure n'apparaît pas, le carnet n'a pas de chronomètre d'intervention. Le PISU demande de comptabiliser les chocs (1A) sans prescrire d'annonce. Aucune recommandation ne prescrit cette phrase mot pour mot. L'ERC demande d'enseigner le travail d'équipe et les compétences non techniques, dont la communication (Greif et al., <a href="https://doi.org/10.1016/j.resuscitation.2021.02.016">ERC Guidelines 2021: Education for resuscitation</a>, Resuscitation 2021 ; recommandation professionnelle internationale, consensus, sans mention explicite de la boucle fermée). Communication en boucle fermée en équipe d'urgence : Härgestam et al., <a href="https://doi.org/10.1136/bmjopen-2013-003525">BMJ Open 2013</a> (étude exploratoire en simulation, 16 équipes : niveau de preuve faible).</p>`;
    const RANG_CHOC = { "1A": { c1: 3, c2: 5 }, "1E": { c1: 3, c2: 5 } };
    function annonceDe(ev, c, st, id) {
      const nom = ev.pr.nom.toLowerCase(), de = /^[aeiouyéèêh]/i.test(nom) ? "d'" : "de ";
      const accord = d => (d >= 2 ? "poussés" : "poussé");
      let t = `${nb(ev.dose)} ${ev.pr.u} ${de}${nom} ${accord(ev.dose)}, ${nb(c.total)} ${ev.pr.u} au total`;
      const rang = (RANG_CHOC[code] || {})[id];
      if (rang && ev.j === 0) t = `${rang}e choc délivré. ${t}`;
      return t + ".";
    }

    // ---- transmission SAED à l'appel du CRRA 15
    function transmission(k, calc) {
      const S = [], E = [];
      const dep = byId[L.start];
      S.push(`${(dep.txt || "").replace(/\n+/g, " · ")}`);
      BILAN.forEach((b, i) => { const v = bilan[i]; S.push(`${b.replace(/\s+/g, " ").slice(0, 110)} : ${v && v.val ? v.val : v && v.etat === "fait" ? "noté" : v && v.etat === "non" ? "absent" : "___"} <small>(fiche ${esc(code)})</small>`); });
      for (let i = 1; i <= k; i++) {
        const st = chemin[i], src = byId[st.via ? st.via.s : (chemin[i - 1] ? actif(chemin[i - 1]) : null)];
        if (st.via && st.via.label && src && src.k === "question") E.push(esc(`${src.txt.replace(/\s*\?\s*$/, "").replace(/\n+/g, " ")} : ${st.via.label.toLowerCase()}.`));
        st.ids.forEach(id => {
          const n = byId[id];
          if (["action", "medicament", "renvoi"].includes(n.k) && !(DOSES[id] || []).length) E.push(esc(n.txt.replace(/\n+/g, " ").replace(/\s+/g, " ").slice(0, 140)) + (st.boucle ? ` (passage ${passages(i)})` : ""));
        });
      }
      calc.evs.flat().forEach(ev => { if (ev.annonce) E.push(`« ${esc(ev.annonce)} » <small>(${esc(ev.voie || "")})</small>`); });
      if (auPoids && !masse) E.push("Poids : ___ kg");
      E.push("PA : ___   FC : ___   SpO₂ : ___");
      const suite = out(actif(chemin[k])).map(e => byId[e.t]).filter(n => ["orientation", "renvoi"].includes(n.k));
      const D = suite.length ? suite.map(n => esc(n.txt.replace(/\n+/g, " "))) : ["___"];
      return `<h3>Message au CRRA 15 <small>(Saed)</small></h3>
        <dl><dt>S · Situation</dt>${S.map(t => `<dd>${t}</dd>`).join("")}
        <dt>A · Antécédents</dt><dd>___</dd>
        <dt>E · Évaluation</dt>${E.map(t => `<dd>${t}</dd>`).join("")}
        <dt>D · Demande</dt>${D.map(t => `<dd>${t}</dd>`).join("")}</dl>
        <details class="sources"><summary>Source</summary><p>Structure Saed : HAS, <a href="${SAED_SRC.url}">${esc(SAED_SRC.titre)}</a>, ${SAED_SRC.date} (outil institutionnel). Contenu : le bilan de la fiche ${esc(code)} et les étapes parcourues ; les blancs « ___ » sont à compléter.</p>${ANNONCE_SRC}</details>`;
    }

    // ---- scène d'injection générée pour une seringue déjà prête
    function defInjection(ev) {
      const pr = ev.pr, im = ev.voie === "IM", morph = ev.m === "M7";
      const lab = `${pr.nom} ${nb(pr.conc)} ${pr.u}/ml`;
      const objets = {
        s: { f: ["seringue", pr.cap, { liq: pr.liq, pisu: "même seringue qu'à la préparation", vol: ev.avant, cible: ev.apres, etiq: lab }], x: 540, y: 330 },
        b: im ? { f: ["cuisseCoupe"], x: 290, y: 300 } : { f: ["bras"], x: 300, y: 420 },
      };
      objets.dasri = { f: ["collecteur"], x: 90, y: im ? 120 : 150 };
      const et = [{ t: `Seringue prête : ${esc(lab)}, ${nb(ev.avant)} ml. Le trait bleu de la jauge marque où s'arrêter.`, a: [["regler", "s", "vol", ev.avant], ["regler", "s", "cible", ev.apres], ["etiqueter", "s", lab]] }];
      if (im) {
        et.push({ t: "Ôter le bouchon, visser l'aiguille pour l'IM (calibre et longueur : non précisés par le PISU).", a: [["aiguille", "s", "aiguille"]] });
        et.push({ t: `Piquer perpendiculaire à la peau : l'aiguille traverse la peau et le tissu sous-cutané jusqu'au muscle. Injecter ${nb(ev.ml)} ml (${nb(ev.dose)} ${pr.u}), en l'annonçant à voix haute.`, a: [["injecter", "s", "b", ev.ml, { site: true, enfonce: 70, annonce: ev.annonce }]] });
        et.push({ t: "Retirer l'aiguille ; elle va directement au collecteur, sans recapuchonner.", a: [["aller", "s", 540, 330, 0], ["jeter", "s"]] });
        return { nom: lab, objets, etapes: et };
      }
      const rincePisu = ev.m === "M3" || ev.m === "M4";
      objets.r = { f: ["seringue", 10, { liq: "#e3f1f8", pisu: "seringue de rinçage (NaCl 0,9 %)", jauge: false }], x: 700, y: 330, op: 0 };
      objets.ch = { f: ["minuteur"], x: 470, y: 40 };
      const ivl = ev.voie === "IVL";
      et.push({ t: "Le robinet trois voies est fermé côté seringue (la branche « OFF » vise la seringue). Désinfecter le site, ôter le bouchon, visser la seringue (Luer-lock, quart de tour). Le PISU ne dit pas sur quelle voie injecter : le dessin montre le robinet de la voie principale de l'octopus.", a: [["regler", "b", "clamp", false], ["regler", "b", "angle", 0], ["aiguille", "s", "none"], ["connecter", "s", "b"]] });
      et.push({ t: "Tourner la manette : la branche « OFF » vise la perfusion, la voie seringue → patient est ouverte.", a: [["robinet", "b", true]] });
      et.push({ t: `Injecter ${nb(ev.ml)} ml (${nb(ev.dose)} ${pr.u}) en ${ev.voie}, en suivant la graduation jusqu'au trait bleu. Durée : ${ev.m === "M9" ? "« très lentement » (fiche M9), sans durée chiffrée" : "non précisée par le PISU"} ; le chronomètre montre une durée de démonstration. Annoncer l'injection à voix haute.`, a: [["injecter", "s", "b", ev.ml, { site: true, duree: ivl ? 9000 : 3500, chrono: "ch", reel: ivl ? 60 : 10, chronoTxt: "démo", annonce: ev.annonce }]] });
      et.push({ t: rincePisu ? "Rinçage de la tubulure : prévu par le PISU après chaque bolus (1A, 1E, fiche M3), volume non précisé par le PISU. La SF2H (2019, R21) recommande un rinçage pulsé d'au moins 10 ml : seringue de 10 ml de NaCl 0,9 %." : "Rinçage : le PISU ne le prévoit pas pour ce médicament, volume non précisé. La SF2H (2019, R21) recommande un rinçage pulsé d'au moins 10 ml après chaque injection : seringue de 10 ml de NaCl 0,9 %.", a: [["robinet", "b", false], ["deconnecter", "s", 540, 330], ["montrer", "r", true], ["regler", "r", "vol", 10], ["aiguille", "r", "none"], ["connecter", "r", "b"], ["robinet", "b", true], ["phase", "RINÇAGE"], ["injecter", "r", "b", 10, { site: true, duree: 2500 }]] });
      et.push({ t: "Refermer le robinet (branche « OFF » vers la seringue), dévisser la seringue de rinçage, remettre un bouchon stérile neuf.", a: [["robinet", "b", false], ["deconnecter", "r", 700, 330], ["aiguille", "r", "aiguille"], ["jeter", "r"]] });
      if (ev.vide) et.push(morph ? { t: "Seringue vide. Le PISU ne dit pas que faire de la seringue de morphine.", a: [["pause", 300]] } : { t: "Seringue vide : au collecteur.", a: [["aiguille", "s", "aiguille"], ["jeter", "s"]] });
      else et.push({ t: morph ? "La seringue est gardée pour la titration suivante. Le PISU ne dit pas comment la garder." : "La seringue est gardée pour l'injection suivante. Le PISU ne dit pas comment la garder.", a: [["aiguille", "s", "none"], ["regler", "s", "bouchon", true], ["aller", "s", 540, 330, 0], ["regler", "s", "vol", ev.apres]] });
      return { nom: lab, objets, etapes: et };
    }
    const G2 = (id, t) => t;

    // ---- rendu
    function arreterAuto() { auto = false; B.majLect(false); }
    function motPas(st) {
      const n = byId[actif(st)];
      if (st.boucle) return "↻";
      if (n.k === "titre") return "Départ";
      if (n.k === "question") return "?";
      if (n.k === "appel") return "☎ 15";
      if (n.k === "medicament") return (n.meds || []).join("+") || "Rx";
      if (n.k === "orientation") return "Orient.";
      return (n.txt.split(/[\s\n+]+/)[0] || "Action").slice(0, 8);
    }
    function rendre(anime, depuisSchema) {
      const k = chemin.length - 1, c = courant(), idA = actif(c), nA = byId[idA];
      const s = suivants(idA);
      const calc = calculer(k);
      const [titre, cl] = KIND[nA.k] || KIND.action;
      // frise : une ligne, mot court par étape ; toucher pour revenir
      frise.textContent = "";
      chemin.forEach((st, i) => {
        const n = byId[actif(st)], [, ck] = KIND[n.k] || KIND.action;
        const rep = chemin[i + 1] && chemin[i + 1].via && chemin[i + 1].via.label && n.k === "question" ? ` ${chemin[i + 1].via.label}` : "";
        const b = h("button", { class: `pas-chip k-${ck}${i === k ? " ici" : ""}`, type: "button", role: "listitem", "aria-label": `Étape ${i + 1} : ${premiereLigne(n)}${rep}` }, `<small>${i + 1}</small>${esc(motPas(st))}${esc(rep)}`);
        b.onclick = () => { if (i === k) return; chemin = chemin.slice(0, i + 1); arreterAuto(); rendre(true); };
        frise.appendChild(b);
      });
      frise.scrollLeft = frise.scrollWidth;
      // carte de l'étape en cours
      carte.className = `carte-etape k-${cl}`;
      const bo = BOU[idA], pass = passages();
      let html = `<span class="ce-badge">${titre}${bo ? ` · passage ${pass}` : ""}</span><div class="ce-corps">`;
      c.ids.forEach(id => { const n = byId[id]; html += `<div class="tx">${texteNoeud(n)}${n.ecart ? ecartHtml(n.ecart) : ""}</div>`; });
      if (s.type === "fin") html += `<div class="fin-tx">Fin du logigramme pour cette branche.</div>`;
      html += `</div>`;
      carte.innerHTML = html;
      // le texte de l'étape se lit dans le nœud du logigramme : la carte ne garde que ses liens (texte gardé pour les lecteurs d'écran)
      carte.querySelectorAll(".tx > .renvois").forEach(r => r.parentElement.after(r));
      extra.textContent = "";
      if (bo) extra.appendChild(h("p", { class: "ce-boucle" }, `↻ ${esc(bo.rythme)}. Arrêt : ${esc(bo.arret)}`));
      // bilan de la fiche, à l'étape de départ
      if (nA.k === "titre" && BILAN.length) {
        const bz = h("div", { class: "bilan" }, `<b class="h">Bilan paramédical (fiche ${esc(code)})</b>`);
        BILAN.forEach((t, i) => {
          const v = bilan[i] || {};
          const li = h("div", { class: "bilan-l" + (v.etat ? " rempli" : "") });
          li.appendChild(h("span", { class: "bl-tx" }, esc(t)));
          const bt = (lab, etat) => { const b = h("button", { class: "b mini" + (v.etat === etat ? " actif" : ""), type: "button", "aria-pressed": String(v.etat === etat) }, lab); b.onclick = () => { bilan[i] = { ...v, etat: v.etat === etat ? null : etat }; sauverBilan(); rendre(false); }; return b; };
          const inp = h("input", { type: "text", class: "bl-val", placeholder: "valeur", value: v.val || "", "aria-label": "Valeur : " + t.slice(0, 40) });
          inp.addEventListener("change", () => { bilan[i] = { ...v, val: inp.value.trim(), etat: inp.value.trim() ? "fait" : v.etat }; sauverBilan(); });
          const zb = h("div", { class: "bl-b" }); zb.append(bt("Noté", "fait"), bt("Absent", "non"), inp);
          li.appendChild(zb); bz.appendChild(li);
        });
        extra.appendChild(bz);
      }
      if (anime) { carte.classList.remove("entre"); void carte.offsetWidth; carte.classList.add("entre"); }
      // commandes du bas : la réponse aux décisions, sous le pouce
      choixBas.textContent = "";
      if (s.type === "choix") s.es.forEach(e => {
        const lab = e.label || premiereLigne(byId[e.t]);
        const b = h("button", { class: "b grand " + (/^OUI/i.test(lab) ? "oui" : /^NON/i.test(lab) ? "non" : "alt"), type: "button" }, esc(lab));
        b.onclick = () => { arreterAuto(); avancer(e); }; choixBas.appendChild(b);
      });
      if (bo) {
        let peut = bo.max == null || pass < bo.max;
        if (bo.maxTotal && chemin.some(st => st.ids.includes(bo.maxTotal.si)) && (calc.cumul[bo.maxTotal.m] || { n: 0 }).n >= bo.maxTotal.n) peut = false;
        const b = h("button", { class: "b grand boucle", type: "button" }, `↻ ${esc(bo.bouton)}`);
        b.disabled = !peut; if (!peut) b.title = "Limite du PDF atteinte";
        b.onclick = () => { arreterAuto(); chemin.push({ ids: [idA], via: null, boucle: true }); rendre(true); };
        choixBas.appendChild(b);
        if (!peut) choixBas.appendChild(h("span", { class: "limite" }, "Limite du PDF atteinte"));
      }
      if (s.type === "fin") { const b = h("button", { class: "b grand", type: "button" }, "Recommencer"); b.onclick = recommencer; choixBas.appendChild(b); }
      if (s.type === "suite" || s.type === "parallele") { B.suiv.classList.add("go", "grand"); choixBas.prepend(B.suiv); }
      else if (B.suiv.parentNode) B.suiv.remove();
      B.ret.disabled = k === 0;
      B.suiv.disabled = false;
      if (!B.el.contains(bRe)) B.el.appendChild(bRe);
      B.majLect(auto);
      // seringues prêtes : une ligne compacte
      plateau.innerHTML = "";
      if (Object.keys(DOSES).length) {
        const evK = Object.fromEntries((calc.evs[k] || []).filter(e => e.ml != null).map(e => [e.key, e]));
        const lignes = calc.plat.map(sy => ({ key: `${sy.m}:${sy.v}`, nom: sy.nom, conc: sy.conc, u: sy.u, liq: sy.liq, ml: evK[`${sy.m}:${sy.v}`] ? evK[`${sy.m}:${sy.v}`].avant : sy.reste }));
        // une seringue vidée à cette étape reste affichée jusqu'à la fin de l'injection
        Object.values(evK).forEach(e => { if (!lignes.some(l => l.key === e.key)) lignes.push({ key: e.key, nom: e.pr.nom, conc: e.pr.conc, u: e.pr.u, liq: e.pr.liq, ml: e.avant }); });
        let ph = lignes.map(l => `<span class="sy" data-key="${l.key}"><span class="temoin" style="background:${l.liq || "#ddd"}"></span><b>${esc(l.nom)}</b> ${nb(l.conc)} ${l.u}/ml · <b class="sy-ml">${nb(l.ml)} ml</b></span>`).join("") || `<span class="vide">Aucune seringue prête</span>`;
        if (auPoids) ph += `<label class="poids">Poids <input type="number" inputmode="decimal" min="1" max="200" step="0.5" value="${masse ?? ""}" placeholder="kg"> kg</label>`;
        plateau.innerHTML = `<b class="h">Seringues prêtes</b>${ph}`;
        const inp = $("input", plateau);
        if (inp) inp.addEventListener("change", () => { const v = parseFloat(String(inp.value).replace(",", ".")); masse = v > 0 ? v : null; try { localStorage.setItem("pisu-poids-" + code, JSON.stringify(masse)); } catch (e) {} rendre(false); });
      }
      plateau.style.display = Object.keys(DOSES).length && (plateau.querySelector(".sy") || auPoids) ? "" : "none";
      // ce qui se joue : message au 15, préparation, ou la scène
      lect.forEach(x => x && x.stop()); lect = [];
      prep.textContent = ""; saed.innerHTML = "";
      const meds = [...new Set(c.ids.flatMap(i => byId[i].meds || []))].filter(m => PREP[m]);
      const evsIci = calc.evs[k] || [];
      const tous = [...new Set([...meds, ...evsIci.map(e => e.m)])];
      const mode = nA.k === "appel" ? "saed" : tous.length ? "prep" : "scene";
      media.dataset.mode = mode;
      ecran.dataset.mode = mode;
      // sur téléphone, pendant une préparation, la carte se réduit à une ligne qu'on peut déplier
      sceneBox.style.display = mode === "prep" ? "none" : "";
      saed.style.display = mode === "saed" ? "" : "none";
      prep.style.display = mode === "prep" ? "" : "none";
      if (mode !== "prep") sc.montrer(nA.k, nA.txt);
      milieu.scrollTop = 0;
      if (mode === "saed") saed.innerHTML = transmission(k, calc);
      if (mode === "prep") {
        const mb = h("div", { class: "variantes" });
        const zoneP = h("div", { class: "zone-p" }); prep.appendChild(zoneP);
        if (tous.length > 1) extra.prepend(mb);
        const extraP = h("div"); extra.appendChild(extraP);
        const jouerMed = (mc, idx) => {
          [...mb.children].forEach((b, j) => b.setAttribute("aria-pressed", j === idx));
          lect.forEach(x => x && x.stop()); lect = [];
          zoneP.textContent = ""; extraP.textContent = "";
          const ev = evsIci.find(e => e.m === mc);
          if (ev && ev.inj.choix) {
            const cz = h("div", { class: "variantes" });
            ev.inj.choix.forEach((o, i) => { const b = h("button", { class: "b", type: "button", "aria-pressed": String(i === ev.choix) }, esc(o.lab)); b.onclick = () => { c.choix = c.choix || {}; c.choix[`${ev.id}:${ev.j}`] = i; rendre(false); }; cz.appendChild(b); });
            extraP.appendChild(cz);
          }
          const alerte = t => extraP.appendChild(h("p", { class: "alerte" }, t));
          if (ev && ev.ml == null && (ev.opt.mgkg || ev.opt.mlkg)) alerte("Indiquer le poids pour afficher le volume à injecter.");
          if (ev && ev.tropGrand) alerte(`La dose (${nb(ev.ml)} ml) dépasse le contenu d'une seringue (${nb(ev.pr.vol)} ml) : en préparer une de plus.`);
          ev && ev.jetees.forEach(j => alerte(j.morph ? `La seringue précédente ne suffit plus (reste ${nb(j.reste)} ml). Le PISU ne dit pas que faire du reste de morphine.` : `La seringue précédente ne suffit plus (reste ${nb(j.reste)} ml) : collecteur, et une nouvelle seringue.`));
          const nSrc = c.ids.map(i => byId[i]).find(n => (n.meds || []).includes(mc)) || nA;
          // une préparation neuve puis l'injection, ou seulement l'injection avec la seringue déjà prête
          const defs = [];
          if (!ev || ev.nouvelle) defs.push(PREP[mc].variantes[ev ? ev.opt.v : choisirVariante(mc, code, nSrc)]);
          if (ev && ev.ml != null) defs.push(defInjection(ev));
          if (!defs.length) { extraP.appendChild(h("p", { class: "prep-tete" }, `<span class="code med">${mc}</span><b>${esc(M[mc].dci)}</b> · seringue déjà prête, volume à injecter selon le poids`)); extraP.appendChild(precautions(mc, null)); return; }
          const def = defs.length > 1 ? fusionner(defs[0], defs[1]) : defs[0];
          extraP.prepend(h("p", { class: "prep-tete" }, `<span class="code med">${mc}</span><b>${esc(M[mc].dci)}</b> · ${ev && ev.ml != null ? `${ev.nouvelle ? "préparer, puis " : ""}injection ${ev.n} : ${nb(ev.ml)} ml = ${nb(ev.dose)} ${ev.pr.u} ${ev.voie}` : esc(def.nom)}`));
          const zl = h("div", { class: "zl" }); zoneP.appendChild(zl);
          const surSer = sy => { if (!ev || ev.ml == null || !zl.isConnected) return; const b = plateau.querySelector(`.sy[data-key="${ev.key}"] .sy-ml`); if (b) b.textContent = `${nb(sy.vol >= 0.95 ? Math.round(sy.vol * 10) / 10 : sy.vol)} ml`; };
          const lc = SC.lecteur(zl, def, { compact: true, surSer, surChange: en => { B.majLect(en); B.lect.querySelector("span") && (B.lect.querySelector("span").textContent = en ? " Pause" : " Animation"); } });
          lect.push(lc);
          extraP.appendChild(precautions(mc, ev ? PREP[mc].variantes[ev.opt.v] : null));
        };
        tous.forEach((mc, i) => { const b = h("button", { class: "b", type: "button", "aria-pressed": "false" }, `${mc} ${esc(M[mc].dci)}`); b.onclick = () => jouerMed(mc, i); mb.appendChild(b); });
        jouerMed(tous[0], 0);
      }
      // logigramme : chemin surligné, puis l'étape placée à côté du nœud en cours
      const vus = new Set(chemin.flatMap(x => x.ids));
      const pris = new Set(chemin.flatMap(x => x.via ? [x.via.id] : (x.par || []).map(e => e.id)));
      const prochains = new Set(s.es ? s.es.map(e => e.t) : []);
      Object.entries(elN).forEach(([id, b]) => {
        b.classList.toggle("vu", vus.has(id)); b.classList.toggle("ici", c.ids.includes(id));
        b.classList.toggle("prochain", prochains.has(id) && !vus.has(id));
      });
      Object.entries(elBr).forEach(([eid, col]) => {
        const e = L.edges.find(x => x.id === eid);
        col.classList.toggle("pris", pris.has(eid));
        col.classList.toggle("ecarte", vus.has(e.s) && !pris.has(eid) && !c.ids.includes(e.s));
      });
      lg.classList.add("joue");
      placer(anime);
      try { localStorage.setItem("pisu-derniere", JSON.stringify({ code, pas: chemin.map(x => ({ id: actif(x), via: x.via && x.via.id, boucle: !!x.boucle, choix: x.choix || null })), quand: Date.now() })); } catch (e) {}
      if (anime && ecran.getBoundingClientRect().top !== 0 && (depuisSchema || k === 0)) ecran.scrollIntoView({ block: "start", behavior: SC.mouvementReduit() ? "auto" : "smooth" });
      if (auto && (s.type === "suite" || s.type === "parallele")) setTimeout(() => { if (auto && courant() === c) etapeSuivante(); }, mode === "prep" ? 12000 : 2600);
      else if (auto) arreterAuto();
    }
    function sauverBilan() { try { sessionStorage.setItem("pisu-bilan-" + code, JSON.stringify(bilan)); } catch (e) {} }
    // l'étape en cours (badge, animation, seringues, message) à droite du nœud sur ordinateur, juste dessous sur téléphone ;
    // le logigramme défile pour amener le nœud en cours en haut, à hauteur de l'animation
    const large = window.matchMedia("(min-width: 901px)");
    function placer(anime) {
      const ici = lg.querySelector(".lg-n.ici");
      milieu.classList.toggle("deux-col", large.matches);
      if (large.matches) { if (cote.parentNode !== milieu) milieu.append(cote); }
      else if (ici) { const w = ici.closest(".lg-nw"); if (w.nextSibling !== cote) w.after(cote); }
      if (ici) {
        const y = ici.getBoundingClientRect().top - logiZone.getBoundingClientRect().top + logiZone.scrollTop - 6;
        logiZone.scrollTo({ top: Math.max(0, y), behavior: anime && !SC.mouvementReduit() ? "smooth" : "auto" });
      }
      cote.scrollTop = 0;
      // ordinateur : la jauge reste visible dans la colonne ; si l'étape a beaucoup d'infos, la scène rétrécit (pas sous 150 px)
      if (large.matches) requestAnimationFrame(() => {
        const sw = [...media.querySelectorAll(".scene-wrap")].find(x => x.offsetParent);
        const j = sw && [...sw.parentElement.querySelectorAll(".jauge")].find(x => x.offsetParent); if (!j) return;
        const trop = j.getBoundingClientRect().bottom - cote.getBoundingClientRect().bottom + 2;
        if (trop > 0) sw.style.height = Math.max(150, sw.getBoundingClientRect().height - trop) + "px";
      });
    }
    large.addEventListener("change", () => placer(false));
    // une préparation suivie de l'injection, dans une seule animation
    function fusionner(a, b) {
      const objets = { ...a.objets };
      const ren = {};
      Object.entries(b.objets).forEach(([id, o]) => { if (id === "s") return; const n = objets[id] ? id + "2" : id; ren[id] = n; objets[n] = { ...o, op: 0 }; });
      const sid = [...a.etapes].reverse().flatMap(e => e.a || []).find(x => ["trocart", "etiqueter"].includes(x[0]))?.[1] || "s";
      const map = x => x === "s" ? sid : ren[x] || x;
      const montrer = Object.values(ren).map(id => ["montrer", id, true]);
      const cacher = Object.keys(a.objets).filter(id => id !== sid && !/dasri|sac/.test(id)).map(id => ["montrer", id, false]);
      const etapesB = b.etapes.slice(1).map((e, i) => ({ t: e.t, a: [...(i === 0 ? [...cacher, ...montrer, ["aller", sid, 540, 330, 0, .7]] : []), ...(e.a || []).map(x => x.map((v, j) => (j >= 1 && j <= 2 && typeof v === "string") ? map(v) : v))] }));
      return { nom: a.nom, objets, etapes: [...a.etapes, ...etapesB] };
    }
    B.ret.onclick = () => { arreterAuto(); if (chemin.length > 1) { chemin.pop(); rendre(true); } };
    B.suiv.onclick = () => { arreterAuto(); etapeSuivante(); };
    B.lect.onclick = () => {
      const anim = lect.find(Boolean);
      if (media.dataset.mode === "prep" && anim) { anim.enLecture ? anim.pause() : anim.lecture(); return; }
      if (auto) arreterAuto(); else { auto = true; B.majLect(true); const s = suivants(actif(courant())); if (s.type === "suite" || s.type === "parallele") etapeSuivante(); else arreterAuto(); }
    };
    bRe.onclick = recommencer;

    // ---- départ : reprise, saut adulte ↔ enfant, ou début
    let repris = false;
    if (window.__pisuReprendre === code) {
      window.__pisuReprendre = null;
      try {
        const d = JSON.parse(localStorage.getItem("pisu-derniere") || "null");
        if (d && d.code === code && d.pas.length && d.pas[0].id === L.start) {
          chemin = d.pas.map(p => ({ ids: [p.id], via: p.via ? L.edges.find(e => e.id === p.via) || null : null, boucle: p.boucle, choix: p.choix || undefined }));
          repris = true; rendre(true);
        }
      } catch (e) {}
    }
    if (!repris && SAUT && SAUT.vers === code) {
      const cible = SAUT.txt; SAUT = null;
      const cand = L.nodes.filter(n => n.k === cible.k).map(n => ({ n, s: normTxt(n.txt).split(" ").filter(w => cible.mots.includes(w)).length })).sort((a, b) => b.s - a.s)[0];
      if (cand && cand.s >= 2 && cheminVers(cand.n.id)) { allerVers(cand.n.id); repris = true; }
    }
    if (!repris) recommencer();
    deroule.saut = (vers) => { const n = byId[actif(courant())]; SAUT = { vers, txt: { k: n.k, mots: normTxt(n.txt).split(" ") } }; };
    // lecture automatique quand la scène arrive à l'écran
    SC.auVisible(ecran, () => { if (chemin.length === 1 && !auto) B.lect.onclick(); });
  }

  // ------------------------------------------------------------- médicaments
  function pageMeds() {
    app.appendChild(h("h2", {}, "Médicaments M1 à M20"));
    const grille = h("div", { class: "grille" });
    Object.values(M).forEach(m => {
      const a = h("a", { class: "carte med", href: `#/med/${m.code}` });
      const v = imageMed(m.code, true); v.classList.add("vig"); a.appendChild(v);
      a.insertAdjacentHTML("beforeend", `<div class="pb">${esc(PREP[m.code]?.pres || "")}</div><h3><span class="code med">${m.code}</span>${esc(m.dci)}</h3><p>${esc(m.spe)}${m.protos.length ? " · " + m.protos.join(", ") : ""}</p>`);
      grille.appendChild(a);
    });
    app.appendChild(grille);
  }

  function pageMed(code) {
    const m = M[code], pr = PREP[code];
    app.appendChild(h("h2", { style: "font-size:22px;margin:8px 0 10px" }, `<span class="code med">${code}</span>${esc(m.dci)} <span style="color:var(--muted);font-weight:600">${esc(m.spe)}</span>`));
    const tete = h("div", { class: "med-tete" });
    tete.appendChild(figureMed(code));
    const info = h("div");
    info.innerHTML = `<p style="margin:0 0 6px"><b>Présentation :</b> ${esc(pr?.pres || "")}</p>` +
      (pr?.teinte ? `<p style="margin:0 0 6px"><span class="temoin" style="background:${pr.teinte}"></span> Couleur de repérage dans les animations (ce n'est pas la couleur réelle du produit).</p>` : "") +
      (m.protos.length ? `<p style="margin:0 0 6px"><b>Protocoles :</b> ${m.protos.map(c => `<a href="#/p/${c}">${c}</a>`).join(" · ")}</p>` : "");
    const { inc } = errataPour(code);
    if (inc.length) info.insertAdjacentHTML("beforeend", `<p><span class="badge-conf">${inc.length} point${inc.length > 1 ? "s" : ""} à confirmer par le SSSM 44</span></p>`);
    tete.appendChild(info);
    app.appendChild(tete);
    const liste = [];
    if (pr) liste.push({ id: "prep", titre: "Préparation animée", rendre: z => preparation(z, code, pr) });
    liste.push({ id: "fiche", titre: "Fiche", rendre: z => z.appendChild(fiche(m.fiche)) });
    if ((window.PISU_PHARMACO || {})[code]) liste.push({ id: "pharmaco", titre: "Pharmacologie <small>RCP</small>", rendre: z => z.appendChild(pharmaco(code)) });
    liste.push({ id: "confirmer", titre: `À confirmer <small>${inc.length} point${inc.length > 1 ? "s" : ""}</small>`, rendre: z => z.appendChild(blocConfirmer(code)) });
    onglets(app, liste, "pisu-onglet-med");
  }

  function preparation(z, code, pr) {
    const vb = h("div", { class: "variantes" });
    z.appendChild(vb);
    const scene = h("div");
    const res = h("div");
    z.append(scene, res);
    const choisir = i => {
      [...vb.children].forEach((b, k) => b.setAttribute("aria-pressed", k === i));
      const v = pr.variantes[i];
      SC.lecteur(scene, v);
      res.innerHTML = `<div class="resultat">${(v.resultat || []).map(([k, t], j) => `<div class="stat${j === 0 ? " check" : ""}"><b>${esc(k)}</b><span>${esc(t)}</span></div>`).join("")}</div>` +
        (v.conf ? `<div class="confirmer"><h3>À confirmer par le SSSM 44</h3><p style="margin:0;font-size:14px">${esc(v.conf)}</p></div>` : "") +
        `<p class="note">Source : PISU 2024, ${esc(v.src)}. Les gestes (casser, prélever, purger, étiqueter, jeter) sont détaillés et sourcés dans l'onglet <a href="#/gestes">Gestes</a>. Le PISU ne précise pas le contenant du NaCl 0,9 % ni de l'EPPI : le dessin montre une ampoule.</p>`;
    };
    pr.variantes.forEach((v, i) => { const b = h("button", { class: "b", "aria-pressed": "false" }, esc(v.nom)); b.onclick = () => choisir(i); vb.appendChild(b); });
    choisir(0);
  }

  // ------------------------------------------------------------- gestes
  const NIV = { reglementaire: "réglementaire", institutionnel: "institutionnel", professionnel: "professionnel", fabricant: "fabricant", pisu: "PISU" };
  function pageGestes(id) {
    app.appendChild(h("h2", {}, "Gestes"));
    app.appendChild(h("p", { class: "sub", style: "margin-top:-6px" }, "Les gestes ne sont pas décrits dans le PISU. Chaque geste donne ses sources, avec leur niveau et leur date."));
    const liste = h("div", { class: "gestes-liste" });
    GESTES.forEach(g => liste.appendChild(h("a", { href: `#/gestes/${g.id}`, "aria-current": String(g.id === (id || GESTES[0]?.id)) }, `${esc(g.titre)}<small>${esc(g.sous || "")}</small>`)));
    app.appendChild(liste);
    const g = GESTES.find(x => x.id === id) || GESTES[0];
    if (!g) return;
    const z = h("div", { class: "proto", style: "border-top:1px solid var(--line);border-radius:14px" });
    app.appendChild(z);
    z.appendChild(h("h3", { style: "margin-top:0;font-size:18px" }, esc(g.titre)));
    if (g.intro) z.appendChild(h("p", {}, g.intro));
    const sc = h("div"); z.appendChild(sc);
    SC.lecteur(sc, g);
    if (g.note) z.appendChild(h("p", { class: "note" }, g.note));
    const src = h("div", { class: "sources" });
    src.innerHTML = `<b>Sources</b><ul>${(g.sources || []).map(s => `<li><span class="niv">${esc(NIV[s.niveau] || s.niveau)}</span>${s.url ? `<a href="${esc(s.url)}">${esc(s.titre)}</a>` : esc(s.titre)}, ${esc(s.editeur || "")}${s.date ? `, ${esc(s.date)}` : ""}.${s.cite ? ` « ${esc(s.cite)} »` : ""}${s.remarque ? ` <i>${esc(s.remarque)}</i>` : ""}</li>`).join("")}</ul>`;
    z.appendChild(src);
  }

  route();
})();
