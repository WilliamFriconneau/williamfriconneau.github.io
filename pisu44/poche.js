/* PISU 44, format poche : tout le contenu du carnet PISU 2024 (fiches, logigrammes, protocoles, médicaments, annexes),
   lisible au téléphone et hors ligne. Ni animation ni formation : seulement le texte du PDF et les points à confirmer. */
(() => {
  const P = window.PISU_PAGES || {}, M = window.PISU_MEDS || {}, ER = window.PISU_ERRATA || { corrections: [], incoherences: [] };
  const IMG = window.PISU_IMAGES || {}, BOU = window.PISU_BOUCLES || {};
  const app = document.getElementById("app");
  const $ = (s, r = document) => r.querySelector(s);
  const h = (tag, attrs = {}, html) => { const e = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); if (html !== undefined) e.innerHTML = html; return e; };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  const classeCode = c => /SSO$/.test(c) ? "sso" : /AT$/.test(c) ? "at" : /E$/.test(c) ? "e" : /^M/.test(c) ? "med" : /A$/.test(c) ? "a" : "gen";
  const estGen = c => /^(GEN|ANNEXE|BIBLIO|00)/.test(c);
  const paire = c => { const m = /^([1-9])([AE])$/.exec(c); return m ? m[1] + (m[2] === "A" ? "E" : "A") : null; };
  const PROTO_AT = ["1AT", "2AT"], PROTO_SSO = ["1SSO", "2SSO", "3SSO", "4SSO", "5SSO"];
  const ORDRE_GEN = ["00-preface", "GEN-explications-pisu", "GEN-explications-logigrammes", "GEN-marche-generale", "ANNEXE-bilan-circonstanciel", "ANNEXE-bilan-primaire", "ANNEXE-bilan-secondaire-glasgow", "ANNEXE-constantes-apgar-malinas", "GEN-acronymes", "BIBLIO"];

  // ------------------------------------------------------------- thème
  const themeBtn = $("#theme");
  const THEMES = ["auto", "light", "dark"], NOMS = { auto: "◐", light: "☀", dark: "☾" };
  function appliquerTheme(t) {
    if (t === "auto") document.documentElement.removeAttribute("data-theme"); else document.documentElement.setAttribute("data-theme", t);
    themeBtn.textContent = NOMS[t]; store.set("pisu-theme", t);
    themeBtn.setAttribute("aria-label", `Thème : ${{ auto: "celui du système", light: "clair", dark: "sombre" }[t]}. Toucher pour changer.`);
  }
  appliquerTheme(store.get("pisu-theme") || "auto");
  themeBtn.onclick = () => appliquerTheme(THEMES[(THEMES.indexOf(store.get("pisu-theme") || "auto") + 1) % 3]);

  // ------------------------------------------------------------- points à confirmer
  const errataPour = code => ({ inc: ER.incoherences.filter(r => r.codes.includes(code)), cor: ER.corrections.filter(r => r.codes.includes(code)) });
  function blocConfirmer(code) {
    const { inc, cor } = errataPour(code);
    const d = h("div");
    if (cor.length) d.appendChild(h("div", { class: "corrige", id: "ecarts" }, `<h3>Écarts au PDF</h3><p class="petit">Le PDF du PISU 2024 fait foi. Le carnet suit ici un autre texte que le PDF.</p>` +
      cor.map(r => `<div class="ecart-l"><b>${r.n}. ${r.ou}</b><div><span class="lab">Le PDF écrit</span> ${r.pdf}</div><div><span class="lab">Le carnet écrit</span> ${r.wiki}</div><div><span class="lab">Pourquoi</span> ${r.pourquoi}</div></div>`).join("")));
    if (inc.length) d.appendChild(h("div", { class: "confirmer" }, `<h3>À confirmer par le SSSM 44</h3><p class="petit">Incohérences relevées dans le PDF (relevé du ${ER.date}), montrées telles quelles.</p><ul>${inc.map(r => `<li><span class="grav ${r.grav}">${r.grav}</span><b>${r.ou}</b> : ${r.constat}</li>`).join("")}</ul>`));
    if (!cor.length && !inc.length) d.appendChild(h("p", { class: "vide" }, "Aucun écart ni point à confirmer relevé pour cette page."));
    return d;
  }
  // les écarts au PDF ne s'affichent pas dans les pages : ils sont listés dans « À confirmer »
  const ecartHtml = () => "";

  // ------------------------------------------------------------- logigramme : suite verticale, branches côte à côte ou empilées
  const KIND = {
    titre: ["Départ", "titre"], question: ["Décision", "question"], medicament: ["Médicament", "medicament"],
    action: ["Action", "action"], appel: ["Appel CRRA 15", "appel"], orientation: ["Orientation", "orientation"],
    renvoi: ["Renvoi", "renvoi"], fin: ["Fin du logigramme", "fin"],
  };
  const estQuinze = n => n.k === "appel" && /^\s*(☎\s*)?15\s*$/.test(n.txt);
  const PICTO15 = '<img class="picto15" src="images/icones/appel15.svg" alt="Appel CRRA 15">';
  const premiereLigne = n => estQuinze(n) ? "Appel CRRA 15" : (n.txt || "").split("\n")[0].trim().slice(0, 90);
  // cibles d'un nœud : fiches médicament et protocoles cités
  function cibles(n) {
    const t = (n.meds || []).filter(m => M[m]).map(m => {
      const d = M[m];
      return { href: `#/med/${m}`, lab: `Fiche ${m} · ${esc(d.spe || d.dci)}` };
    });
    if (/PISU|PSSO|Appliquer/i.test(n.txt))
      [...new Set((n.txt.match(/\b([1-9][AE]|[12]AT|[1-5]SSO)\b/g) || []))].filter(c => P[c])
        .forEach(c => t.push({ href: `#/p/${c}`, lab: `Ouvrir le ${c}` }));
    return t;
  }
  // ------------------------------------------------------------- infos d'un nœud : ce que disent la fiche, le protocole, les points à confirmer
  const VID = window.PISU_VIDEOS || {};
  function videoPour(m, code) {
    const vs = VID[m] || [];
    if (!vs.length) return null;
    const enf = /E$/.test(code);
    return vs.find(v => enf === /enfant/i.test(v.nom) && !(enf && /adulte/i.test(v.nom))) || vs[0];
  }
  const videoHtml = v => `<figure class="prep"><img src="${v.f}" alt="Préparation animée : ${esc(v.nom)}" loading="lazy" decoding="async"><figcaption>${esc(v.nom)} · <span class="prep-z">toucher pour agrandir</span></figcaption></figure>`;
  // préparation en grand : plein écran, repart du début, on peut zoomer avec deux doigts ; un toucher ferme
  document.addEventListener("click", e => {
    const im = e.target.closest?.(".prep img, .t-page img"); if (!im) return;
    e.preventDefault(); e.stopPropagation();
    const z = document.createElement("div"); z.className = "prep-grand"; z.setAttribute("role", "dialog"); z.setAttribute("aria-label", im.alt);
    z.innerHTML = `<img src="${im.getAttribute("src")}" alt="${esc(im.alt)}"><p>${esc(im.alt.replace(/^Préparation animée : /, "").slice(0, 80))} · toucher pour fermer</p>`;
    const fermer = () => { z.remove(); document.removeEventListener("keydown", esc_); };
    const esc_ = ev => { if (ev.key === "Escape") fermer(); };
    z.addEventListener("click", fermer); document.addEventListener("keydown", esc_);
    document.body.appendChild(z);
  }, true);
  const VIDES = new Set("avec dans pour sans plus moins puis entre selon apres avant chez etre faire fait cette celui elle sont tout tous toute toutes adulte enfant mmhg mg/kg victime".split(" "));
  const mots = s => new Set((s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").match(/[a-z0-9]{4,}/g)?.filter(w => !VIDES.has(w)) || []);
  const BLOCS = {};
  function blocs(code) {
    if (BLOCS[code]) return BLOCS[code];
    const p = P[code], out = [];
    for (const [src, html] of [["Fiche", p.fiche], ["Protocole", p.protocole]]) {
      if (!html) continue;
      const d = document.createElement("div"); d.innerHTML = html;
      d.querySelectorAll("p, li, tr").forEach(e => {
        if (e.querySelector("p, li, tr")) return;
        const t = e.textContent.replace(/\s+/g, " ").trim();
        if (t.length < 12 || t.length > 420) return;
        e.querySelectorAll("img").forEach(i => i.remove());
        out.push({ src, html: e.tagName === "TR" ? [...e.children].map(c => c.innerHTML).filter(Boolean).join(" · ") : e.innerHTML, m: mots(t) });
      });
    }
    return (BLOCS[code] = out);
  }
  function infosNoeud(code, n) {
    if (n.k === "titre") return "";
    const nm = mots(n.txt.replace(/M\d+/g, ""));
    if (!nm.size && !(n.meds || []).length && !(BOU[code] || {})[n.id]) return "";
    const score = m => [...nm].filter(w => m.has(w)).length;
    const vus = new Set();
    const choisis = blocs(code).map(b => ({ b, s: score(b.m) })).filter(x => x.s >= Math.min(2, nm.size))
      .sort((a, b) => b.s - a.s).filter(x => { const k = x.b.html; if (vus.has(k)) return false; vus.add(k); return true; }).slice(0, 3);
    let html = choisis.map(x => `<div class="inf-b"><span class="inf-src">${x.b.src}</span>${x.b.html}</div>`).join("");
    const bo = (BOU[code] || {})[n.id];
    if (bo) html = `<div class="inf-b"><span class="inf-src">Répétition</span>${esc(bo.rythme)}. Arrêt : ${esc(bo.arret)}</div>` + html;
    (n.meds || []).forEach(m => { const v = videoPour(m, code); if (v) html += videoHtml(v); });
    const inc = errataPour(code).inc.map(r => ({ r, s: score(mots(r.constat)) })).filter(x => x.s >= 2).sort((a, b) => b.s - a.s)[0];
    if (inc) html += `<div class="inf-b conf"><span class="inf-src">À confirmer</span>${esc(inc.r.constat)}</div>`;
    return html;
  }
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
  // colonnes à glisser : l'onglet suit la colonne à l'écran, la hauteur suit la colonne affichée
  function carrousel(choix, ong, sp) {
    const cols = () => [...sp.children];
    let act = 0;
    const etroit = () => getComputedStyle(sp).overflowX === "auto";
    const hauteur = () => { if (!etroit()) { sp.style.height = ""; return; } const c = cols()[act]; if (c) sp.style.height = c.scrollHeight + "px"; };
    const activer = i => {
      if (i === act && sp.style.height) return;
      act = i;
      [...ong.children].forEach((b, k) => b.setAttribute("aria-selected", String(k === i)));
      cols().forEach((c, k) => c.classList.toggle("vue", k === i));
      hauteur();
    };
    ong.addEventListener("click", e => {
      const b = e.target.closest(".lg-og"); if (!b) return;
      const i = +b.dataset.i; activer(i);
      sp.scrollTo({ left: cols()[i].offsetLeft - sp.offsetLeft - parseFloat(getComputedStyle(sp).paddingLeft || 0), behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    });
    let t;
    sp.addEventListener("scroll", () => { clearTimeout(t); t = setTimeout(() => {
      const x = sp.scrollLeft + sp.clientWidth / 2; let best = 0, d = Infinity;
      cols().forEach((c, k) => { const m = c.offsetLeft - sp.offsetLeft + c.offsetWidth / 2, dd = Math.abs(m - x); if (dd < d) { d = dd; best = k; } });
      activer(best); choix.classList.add("vu");
    }, 60); }, { passive: true });
    if ("ResizeObserver" in window) { const ro = new ResizeObserver(() => hauteur()); cols().forEach(c => ro.observe(c)); ro.observe(sp); }
    cols()[0]?.classList.add("vue");
    requestAnimationFrame(() => {
      hauteur();
      // les onglets restent visibles sous la barre et les onglets de la page
      const sg = document.querySelector(".seg");
      if (sg) document.documentElement.style.setProperty("--colle", Math.round((parseFloat(getComputedStyle(sg).top) || 0) + sg.getBoundingClientRect().height) + "px");
    });
  }
  function logigramme(code, L) {
    const byId = Object.fromEntries(L.nodes.map(n => [n.id, n]));
    const bou = BOU[code] || {};
    const lg = h("div", { class: "lg" });
    const poids = items => Math.max(1, ...items.filter(i => i.t === "split").map(i => i.branches.reduce((a, b) => a + poids(b.items), 0)));
    function dessiner(items, parent) {
      items.forEach((it, i) => {
        if (i > 0 && it.t !== "split") parent.appendChild(h("div", { class: "lg-fl" }));
        if (it.t === "n") {
          const n = byId[it.id], [titre, cl] = KIND[n.k] || KIND.action;
          const wrap = h("div", { class: "lg-nw", id: "n-" + n.id });
          const cs = cibles(n), inf = infosNoeud(code, n);
          const contenu = (n.k === "question" ? "" : `<span class="lg-k">${titre}</span>`) + `<span class="lg-tx">${estQuinze(n) ? PICTO15 : n.html}</span>` + (n.ecart ? ecartHtml(n.ecart) : "");
          const liens = cs.length ? `<span class="renvois">${cs.map(c => `<a class="b" href="${c.href}">${c.lab} ›</a>`).join(" ")}</span>` : "";
          const noeud = h("div", inf ? { class: `lg-n k-${cl} a-info`, role: "button", tabindex: "0", "aria-expanded": "false" } : { class: `lg-n k-${cl}` },
            contenu + liens + (inf ? `<span class="lg-plus" aria-hidden="true">i</span>` : ""));
          wrap.appendChild(noeud);
          if (inf) wrap.appendChild(h("div", { class: "lg-info", hidden: "" }, inf));
          if (bou[n.id]) wrap.appendChild(h("div", { class: "lg-boucle" }, `<span class="fl-retour" aria-hidden="true"></span><b>↻ Répéter</b> ${esc(bou[n.id].rythme)}`));
          parent.appendChild(wrap);
        } else if (it.t === "goto") {
          const n = byId[it.id];
          parent.appendChild(h("a", { class: "lg-goto", href: `#/p/${code}/logi/${n.id}` }, `↓ suite : ${esc(premiereLigne(n))}`));
        } else {
          parent.appendChild(h("div", { class: "lg-fl" }));
          const sp = h("div", { class: "lg-split" });
          const plusieurs = it.branches.length > 1;
          // sur téléphone, une branche par colonne : on glisse de l'une à l'autre, les onglets disent laquelle est à l'écran
          const choix = h("div", { class: "lg-choix" + (plusieurs ? " multi" : "") });
          const ong = plusieurs ? h("div", { class: "lg-onglets", role: "tablist" }) : null;
          it.branches.forEach((br, bi) => {
            const lab = br.e.label || (plusieurs ? "en même temps" : "");
            const sens = /^OUI/i.test(lab) ? "oui" : /^NON/i.test(lab) ? "non" : "par";
            const col = h("div", { class: "lg-br " + sens });
            if (ong) ong.appendChild(h("button", { type: "button", class: "lg-og " + sens, role: "tab", "aria-selected": String(bi === 0), "data-i": String(bi) },
              `<span class="og-tx">${esc(lab)}</span>`));
            col.appendChild(h("div", { class: "lg-lab" }, esc(lab) + (br.e.ecart ? ecartHtml(br.e.ecart) : "")));
            dessiner(br.items, col);
            if (!br.items.length) col.appendChild(h("div", { class: "lg-vide" }, "↓ rejoint la suite"));
            col.style.flex = `${poids(br.items)} 1 0`;
            sp.appendChild(col);
          });
          if (ong) { choix.appendChild(ong); choix.appendChild(h("div", { class: "lg-glisse", "aria-hidden": "true" }, `‹ glisser pour voir les ${it.branches.length} choix ›`)); }
          choix.appendChild(sp);
          parent.appendChild(choix);
          if (ong) carrousel(choix, ong, sp);
        }
      });
    }
    dessiner(structure(L), lg);
    // toucher ou clic : l'info s'ouvre sous le nœud ; survol à la souris : elle s'affiche par-dessus
    const basculer = (n, ouvrir) => {
      const i = n.nextElementSibling; if (!i || !i.classList.contains("lg-info")) return;
      ouvrir = ouvrir ?? i.hidden;
      i.hidden = !ouvrir; n.setAttribute("aria-expanded", String(ouvrir));
    };
    lg.addEventListener("click", e => {
      if (e.target.closest("a")) return;
      const n = e.target.closest(".lg-n.a-info"); if (!n) return;
      n.parentElement.classList.remove("survol");
      basculer(n);
    });
    lg.addEventListener("keydown", e => { const n = e.target.closest?.(".lg-n.a-info"); if (n && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); basculer(n); } });
    if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
      lg.addEventListener("mouseover", e => { const w = e.target.closest(".lg-nw"); if (!w || w.classList.contains("survol")) return; const n = $(".lg-n.a-info", w); if (n && n.getAttribute("aria-expanded") === "false") { w.classList.add("survol"); basculer(n, true); } });
      lg.addEventListener("mouseout", e => { const w = e.target.closest(".lg-nw.survol"); if (!w || w.contains(e.relatedTarget)) return; w.classList.remove("survol"); basculer($(".lg-n.a-info", w), false); });
    }
    const z = h("div", { class: "logi" });
    z.appendChild(lg);
    if (L.notes && L.notes.length) {
      const nb = h("div", { class: "notes-logi" }, `<b class="h">Pendant toute la prise en charge</b>`);
      L.notes.forEach(id => { const n = byId[id]; nb.appendChild(h("div", { class: "notes-tx" }, n.html + (n.ecart ? ecartHtml(n.ecart) : ""))); });
      z.appendChild(nb);
    }
    return z;
  }

  // ------------------------------------------------------------- pages
  const fiche = html => h("div", { class: "fiche" }, html);
  function onglets(liste, actif, base) {
    const bar = h("nav", { class: "seg", "aria-label": "Parties de la page" });
    liste.forEach(it => bar.appendChild(h("a", { href: `${base}/${it.id}`, "aria-current": String(it.id === actif.id), class: "seg-b" }, it.titre)));
    app.append(bar);
    const z = h("div", { class: "contenu" });
    actif.rendre(z);
    app.appendChild(z);
  }
  // ------------------------------------------------------------- pictogrammes des protocoles (traits, 24 × 24)
  const PICTO = {
    1: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/><path d="M3 12h4l1.5-3 2.5 6 1.5-3H21"/>',
    2: '<path d="M12 4v8M12 12c-1.5 0-3-1-3-1M12 12c1.5 0 3-1 3-1"/><path d="M9 8c-3 0-5 4-5 8 0 2 1 3 2.5 3S9 17 9 15V8zM15 8c3 0 5 4 5 8 0 2-1 3-2.5 3S15 17 15 15V8z"/>',
    3: '<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/><path d="M9.5 15a2.5 2.5 0 0 0 2.5 2.5"/>',
    4: '<circle cx="12" cy="12" r="8"/><path d="M12 7v6M12 16.5v.5"/>',
    5: '<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 6 1V5a2 2 0 0 0-3-1zM15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-6 1"/><path d="M16 8l-2 4h3l-2 4"/>',
    6: '<path d="M12 21a6 6 0 0 0 6-6c0-4-3-6-3-9-2 1-3 3-3 5-1-1-1.5-2-1.5-3C7 10 6 12.5 6 15a6 6 0 0 0 6 6z"/>',
    7: '<path d="M6 17a3 3 0 0 1 0-6 4 4 0 0 1 7.5-1.5A3.5 3.5 0 1 1 17 17z"/><path d="M8 20h8M10 7c0-2 2-2 2-4M15 7c0-1.5 1.5-1.5 1.5-3"/>',
    8: '<path d="M13 3L5 13h6l-1 8 8-10h-6z"/>',
    9: '<path d="M12 3s5 6 5 9.5a5 5 0 0 1-10 0C7 9 12 3 12 3z"/><path d="M10 13h4M12 11v4"/>',
    "1AT": '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/><path d="M12 8v5M12 15.5v.5"/>',
    "2AT": '<circle cx="8" cy="9" r="1.6"/><circle cx="14" cy="7" r="1.2"/><circle cx="11" cy="14" r="1.8"/><circle cx="16" cy="13" r="1"/><path d="M19 4v10a2 2 0 1 1-2 3"/>',
    "1SSO": '<path d="M4 15a8 8 0 0 1 16 0z"/><path d="M3 15h18v2H3zM12 7V4"/>',
    "2SSO": '<path d="M12 3l7 3v5c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6z"/><path d="M12 17a3 3 0 0 0 3-3c0-2-1.5-3-1.5-4.5-1 .5-1.5 1.5-1.5 2.5-.5-.5-.7-1-.7-1.5C9.7 11 9 12.5 9 14a3 3 0 0 0 3 3z"/>',
    "3SSO": '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
    "4SSO": '<path d="M12 2v6"/><circle cx="12" cy="10" r="2"/><path d="M8 13l4 2 4-2M8 13v4l4 3 4-3v-4"/>',
    "5SSO": '<path d="M3 9h18v5a3 3 0 0 1-3 3h-3l-3-3-3 3H6a3 3 0 0 1-3-3z"/><path d="M19 9V5"/>',
  };
  // silhouette d'enfant, en bas à droite, sur pastille bleue
  const ENFANT = '<g class="pi-enf"><circle cx="20" cy="20" r="8.5" class="pi-enf-fond"/><circle cx="20" cy="15.6" r="2.3" class="pi-enf-tete"/><path d="M15.8 26v-3.4a4.2 4.2 0 0 1 8.4 0V26z" class="pi-enf-tete"/></g>';
  function picto(c) {
    const m = c.match(/^(\d)([AE])$/), d = PICTO[c] || (m && PICTO[m[1]]);
    if (!d) return "";
    const enf = m && m[2] === "E";
    return `<svg class="picto ${classeCode(c)}" viewBox="0 0 24 24" aria-hidden="true"><g class="pi-tr"${enf ? ' transform="translate(-1.5 -1.5) scale(.85)"' : ""}>${d}</g>${enf ? ENFANT : ""}</svg>`;
  }
  function lienCode(c) {
    const p = P[c];
    return `<a class="ligne proto ${classeCode(c)}" href="#/p/${c}">${picto(c)}<span class="code ${classeCode(c)}">${c}</span><span>${esc(p.titre)}</span>${errataPour(c).inc.length ? `<span class="pr-n" title="points à confirmer">${errataPour(c).inc.length}</span>` : ""}</a>`;
  }
  // dans les apps PISU 44 (vue web Android « ; wv) », vue web iOS sans « Safari ») : pas de proposition d’installation
  const dansLApp = () => { const u = navigator.userAgent; return /; wv\)/.test(u) || (/iPhone|iPad/.test(u) && !/Safari\//.test(u)); };
  // ------------------------------------------------------------- récents : les dernières fiches ouvertes, pour revenir vite en intervention
  const RECENTS_CLE = "pisu44-recents";
  const lireRecents = () => { try { return JSON.parse(localStorage.getItem(RECENTS_CLE) || "[]"); } catch (e) { return []; } };
  function noterRecent(href, lab) {
    const l = [{ href, lab }, ...lireRecents().filter(r => r.href !== href)].slice(0, 6);
    try { localStorage.setItem(RECENTS_CLE, JSON.stringify(l)); } catch (e) {}
  }
  function blocRecents() {
    const l = lireRecents();
    if (!l.length) return "";
    return `<section class="recents" aria-label="Ouverts récemment"><h2>Récents</h2><div class="rc-l">${l.map(r => `<a class="rc" href="${esc(r.href)}">${r.lab}</a>`).join("")}</div></section>`;
  }
  const T = window.PISU_TECH || { cats: [], fiches: [] };
  const TECH = Object.fromEntries(T.fiches.map(f => [f.id, f]));
  const listeProtos = suf => [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(i => P[i + suf]).map(i => lienCode(i + suf)).join("");
  // ------------------------------------------------------------- accueil : protocoles (adulte ou enfant), médicaments, techniques, plus
  function pageProtocoles(public_) {
    document.title = "PISU 44";
    let pub = public_;
    if (!pub) { try { pub = localStorage.getItem("pisu44-public"); } catch (e) {} }
    pub = pub === "enfants" ? "enfants" : "adultes";
    try { localStorage.setItem("pisu44-public", pub); } catch (e) {}
    const seg = h("nav", { class: "seg seg-pub", "aria-label": "Public" });
    [["adultes", "Adulte <small>≥ 15 ans</small>"], ["enfants", "Enfant <small>&lt; 15 ans</small>"]].forEach(([id, lab]) =>
      seg.appendChild(h("a", { href: `#/${id}`, class: "seg-b " + (id === "enfants" ? "e" : "a"), "aria-current": String(id === pub) }, lab)));
    app.appendChild(h("div", { class: "contenu accueil" }, blocRecents()));
    app.appendChild(seg);
    app.appendChild(h("div", { class: "contenu accueil" }, `<section class="bloc">${listeProtos(pub === "enfants" ? "E" : "A")}</section>`));
  }
  function pageMedicaments() {
    document.title = "Médicaments · PISU 44";
    app.appendChild(h("div", { class: "contenu accueil" }, `<h1 class="h-rub">Médicaments</h1><section class="bloc">${Object.values(M).map(m => `<a class="ligne" href="#/med/${m.code}"><span class="code med">${m.code}</span><span>${esc(m.dci)} <small>${esc(m.spe)}</small></span></a>`).join("")}</section>`));
  }
  const refTech = f => [f.ref, f.date || (f.en_ligne ? "en ligne le " + f.en_ligne.split("-").reverse().join("/") : "")].filter(Boolean).join(" · ");
  function pageTechniques() {
    document.title = "Techniques · PISU 44";
    app.appendChild(h("div", { class: "contenu accueil" }, `<h1 class="h-rub">Fiches techniques</h1><p class="petit">Documents du SDIS 44 (SSSM et GED opérationnelle), montrés tels quels.</p>`
      + T.cats.map(([id, nom]) => { const l = T.fiches.filter(f => f.cat === id); return l.length ? `<section class="bloc"><h2>${esc(nom)}</h2>${l.map(f => `<a class="ligne tech" href="#/t/${f.id}"><span>${esc(f.titre)}${refTech(f) ? `<small>${esc(refTech(f))}</small>` : ""}</span>${f.videos.length ? `<span class="t-vid" title="vidéo en ligne">▶</span>` : ""}</a>`).join("")}</section>` : ""; }).join("")));
  }
  function pageTech(id) {
    const f = TECH[id];
    document.title = `${f.titre} · PISU 44`;
    noterRecent(`#/t/${id}`, `<span class="rc-t">T</span>${esc(f.titre)}`);
    const src = f.document ? `<p class="t-src">Source : « ${esc(f.document)} »${f.ref ? `, ${esc(f.ref)}` : ""}${f.date ? `, ${esc(f.date)}` : ""}. ${esc(f.origine)}${f.en_ligne ? `, mis en ligne le ${f.en_ligne.split("-").reverse().join("/")}` : ""}.</p>` : "";
    app.appendChild(h("div", { class: "p-tete" }, `<div class="pt-tx"><h1>${esc(f.titre)}</h1>${src}</div>`));
    const z = h("div", { class: "contenu tech-c" });
    if (f.videos.length) z.appendChild(h("section", { class: "bloc t-videos" }, `<h2>En vidéo <small>(réseau nécessaire)</small></h2>${f.videos.map(v => `<a class="ligne" href="${esc(v.url)}" target="_blank" rel="noopener"><span class="t-vid">▶</span><span>${esc(v.titre)}<small>${esc(v.par)}</small></span></a>`).join("")}`));
    if (f.pages) z.appendChild(h("div", { class: "t-pages" }, f.pages.map((p, i) => `<figure class="t-page"><img src="techniques/${p}" alt="${esc(f.titre)}, page ${i + 1} : ${esc((f.texte[i] || "").slice(0, 300))}" loading="${i < 2 ? "eager" : "lazy"}" decoding="async"><figcaption>Page ${i + 1} / ${f.pages.length} · toucher pour agrandir</figcaption></figure>`).join("")));
    if (f.blocs) {
      const d = h("div", { class: "fiche t-blocs" });
      let ul = null;
      f.blocs.forEach(b => {
        if (b.t !== "li") ul = null;
        if (b.t === "h") d.appendChild(h("h3", {}, esc(b.x)));
        else if (b.t === "p") d.appendChild(h("p", {}, esc(b.x)));
        else if (b.t === "li") { if (!ul) { ul = h("ul"); d.appendChild(ul); } ul.appendChild(h("li", {}, esc(b.x))); }
        else if (b.t === "img") d.appendChild(h("figure", { class: "t-page" }, `<img src="techniques/${b.f}" alt="Illustration du document" loading="lazy" decoding="async">`));
        else if (b.t === "table") d.appendChild(h("table", {}, b.l.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")));
      });
      z.appendChild(d);
    }
    app.appendChild(z);
  }
  function pagePlus() {
    document.title = "Plus · PISU 44";
    const gens = [...ORDRE_GEN.filter(c => P[c]), ...Object.keys(P).filter(c => estGen(c) && !ORDRE_GEN.includes(c))];
    const C = window.PISU_COMP;
    app.appendChild(h("div", { class: "contenu accueil" }, `<h1 class="h-rub">Plus</h1>`
      + `<section class="bloc"><h2>Soutien sanitaire opérationnel</h2>${PROTO_SSO.filter(c => P[c]).map(lienCode).join("")}</section>`
      + `<section class="bloc"><h2>Actes de télémédecine</h2>${PROTO_AT.filter(c => P[c]).map(lienCode).join("")}</section>`
      + (C && C.fiches.length ? `<section class="bloc"><h2>Gestes infirmiers de base</h2>${C.fiches.map(f => `<a class="ligne" href="#/c/${f.id}"><span>${esc(f.titre)}</span></a>`).join("")}<a class="ligne" href="#/c/cadre"><span>Le cadre infirmier en 2026</span></a></section>` : "")
      + `<section class="bloc"><h2>Généralités et annexes</h2>${gens.map(c => `<a class="ligne" href="#/p/${c}"><span>${esc(P[c].titre)}</span></a>`).join("")}<a class="ligne" href="#/confirmer"><span>Points à confirmer sans protocole précis</span></a></section>`
      + (dansLApp() ? "" : `<section class="bloc"><h2>Sur l'écran d'accueil</h2><p class="petit">Le carnet s'installe comme une application, sans store, et marche sans réseau : tout est téléchargé à la première ouverture. Pour mettre à jour, tirer la page vers le bas avec du réseau. iPhone : Safari, bouton Partager, « Sur l'écran d'accueil ». Android : Chrome, menu ⋮, « Installer l'application ».</p><button class="ligne b-inst" type="button" hidden><span>Installer PISU 44 sur cet appareil</span></button></section>`)));
    const bi = $(".b-inst", app);
    if (bi && installer) { bi.hidden = false; bi.onclick = async () => { installer.prompt(); await installer.userChoice; installer = null; bi.hidden = true; }; }
  }
  function pageProto(code, partie, cible) {
    const p = P[code];
    document.title = `${estGen(code) ? "" : code + " · "}${p.titre}`;
    if (!estGen(code)) noterRecent(`#/p/${code}`, `${picto(code)}<span class="code ${classeCode(code)}">${code}</span>`);
    const tete = h("div", { class: "p-tete" }, `<div class="pt-tx"><h1>${estGen(code) ? "" : `${picto(code)}<span class="code ${classeCode(code)}">${code}</span>`}${esc(p.titre)}</h1>${p.ecartTitre ? `<p>${ecartHtml(p.ecartTitre)}</p>` : ""}</div>`);
    const autre = paire(code);
    if (autre && P[autre]) tete.appendChild(h("a", { class: "b ae-b", href: `#/p/${autre}/${partie || "logi"}`, "aria-label": `Même protocole pour ${/E$/.test(autre) ? "l'enfant" : "l'adulte"}` }, `${autre} ⇄`));
    app.appendChild(tete);
    const { inc, cor } = errataPour(code);
    const liste = [];
    if (p.logi) liste.push({ id: "logi", titre: "Logigramme", rendre: z => z.appendChild(logigramme(code, p.logi)) });
    if (p.fiche) liste.push({ id: "fiche", titre: /AT$/.test(code) ? "Texte" : estGen(code) ? "Texte" : "Fiche", rendre: z => z.appendChild(fiche(p.fiche)) });
    if (p.protocole) liste.push({ id: "protocole", titre: "Protocole", rendre: z => z.appendChild(fiche(p.protocole)) });
    if (inc.length || cor.length) liste.push({ id: "confirmer", titre: `À confirmer <small>${inc.length + cor.length}</small>`, rendre: z => z.appendChild(blocConfirmer(code)) });
    if (!liste.length) { app.appendChild(h("p", { class: "vide" }, "Page vide.")); return; }
    const actif = liste.find(x => x.id === partie) || liste[0];
    if (liste.length > 1) onglets(liste, actif, `#/p/${code}`);
    else { const z = h("div", { class: "contenu" }); actif.rendre(z); app.appendChild(z); }
    if (cible) { const q = document.getElementById("n-" + cible); if (q) {
      // le nœud visé peut être dans une colonne cachée : on ouvre les bons onglets, du plus profond au plus haut
      for (let c = q.closest(".lg-br"); c; c = c.parentElement.closest(".lg-br")) {
        const og = c.closest(".lg-choix")?.querySelector(":scope > .lg-onglets"); const i = [...c.parentElement.children].indexOf(c);
        if (og && og.children[i]) og.children[i].click();
      }
      q.scrollIntoView({ block: "center" }); q.classList.add("vise");
    } }
  }
  function figureMed(code) {
    const im = IMG[code]; if (!im) return null;
    const f = h("figure", { class: "photo" });
    f.appendChild(h("img", { src: im.fichier, alt: `${M[code]?.spe || code} : ${im.montre || "présentation"}`, loading: "lazy" }));
    f.appendChild(h("figcaption", {}, `Photo : ${esc(im.montre || "")}. Source : <a href="${esc(im.page_source)}">${esc(im.proprietaire || im.page_source)}</a>, consultée le ${esc(im.consulte_le || "")}.${im.licence ? ` Droits : ${esc(im.licence)}.` : ""}`));
    (im.autres || []).forEach(a => {
      f.appendChild(h("img", { src: a.fichier, alt: a.montre, loading: "lazy" }));
      f.appendChild(h("figcaption", {}, `Photo : ${esc(a.montre)}. Source : <a href="${esc(a.page_source)}">${esc(a.proprietaire)}</a>, consultée le ${esc(a.consulte_le)}. Droits : ${esc(a.licence)}.`));
    });
    return f;
  }
  function pageMed(code, partie) {
    const m = M[code];
    document.title = `${code} · ${m.dci}`;
    noterRecent(`#/med/${code}`, `<span class="code med">${code}</span>${esc(m.dci)}`);
    app.appendChild(h("div", { class: "p-tete" }, `<div class="pt-tx"><h1><span class="code med">${code}</span>${esc(m.dci)} <small>${esc(m.spe)}</small></h1></div>`));
    const { inc, cor } = errataPour(code);
    const liste = [{ id: "fiche", titre: "Fiche", rendre: z => {
      if (m.protos.length) z.appendChild(h("section", { class: "bloc protos" }, `<h2>Utilisé dans</h2>${m.protos.filter(c => P[c]).map(lienCode).join("")}`));
      if ((VID[code] || []).length) z.appendChild(h("div", { class: "preps" }, `<h2>Préparation</h2>${VID[code].map(videoHtml).join("")}`));
      z.appendChild(fiche(m.fiche));
      const f = figureMed(code); if (f) z.appendChild(f);
    } }];
    if (inc.length || cor.length) liste.push({ id: "confirmer", titre: `À confirmer <small>${inc.length + cor.length}</small>`, rendre: z => z.appendChild(blocConfirmer(code)) });
    const actif = liste.find(x => x.id === partie) || liste[0];
    if (liste.length > 1) onglets(liste, actif, `#/med/${code}`); else { const z = h("div", { class: "contenu" }); actif.rendre(z); app.appendChild(z); }
  }
  function pageConfirmer() {
    document.title = "Points à confirmer";
    app.appendChild(h("div", { class: "p-tete" }, `<h1>Points à confirmer sans protocole précis</h1>`));
    app.appendChild(h("div", { class: "contenu confirmer" }, `<p class="petit">Relevé du ${ER.date}, montré tel quel.</p><ul>${ER.incoherences.filter(r => !r.codes.length).map(r => `<li><span class="grav ${r.grav}">${r.grav}</span><b>${r.ou}</b> : ${r.constat}</li>`).join("")}</ul>`));
  }

  // ------------------------------------------------------------- recherche (fautes et accents tolérés)
  const norm = s => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/œ/g, "oe").replace(/[^a-z0-9]+/g, " ").trim();
  const texteDe = html => { const d = document.createElement("div"); d.innerHTML = html || ""; return d.textContent; };
  let INDEX = null;
  function indexer() {
    INDEX = [];
    Object.values(P).forEach(p => INDEX.push({ t: `${p.code} ${p.titre}`, c: texteDe((p.fiche || "") + " " + (p.protocole || "")) + " " + (p.logi ? p.logi.nodes.map(n => n.txt).join(" ") : ""), href: `#/p/${p.code}`, lab: `${estGen(p.code) ? "" : `<span class="code ${classeCode(p.code)}">${p.code}</span>`}${esc(p.titre)}` }));
    Object.values(M).forEach(m => INDEX.push({ t: `${m.code} ${m.dci} ${m.spe}`, c: texteDe(m.fiche), href: `#/med/${m.code}`, lab: `<span class="code med">${m.code}</span>${esc(m.dci)} <small>${esc(m.spe)}</small>` }));
    T.fiches.forEach(f => INDEX.push({ t: `${f.titre} ${f.document || ""}`, c: (f.texte || []).join(" ") + " " + f.videos.map(v => v.titre).join(" "), href: `#/t/${f.id}`, lab: `<span class="code tech">T</span>${esc(f.titre)}` }));
    (window.PISU_COMP?.fiches || []).forEach(f => INDEX.push({ t: f.titre, c: [f.pour_quoi, ...(f.etapes || []).map(e => e.t), ...(f.points_cles || []).map(e => e.t)].join(" "), href: `#/c/${f.id}`, lab: `<span class="code comp">IDE</span>${esc(f.titre)}` }));
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
      for (const m of mots) { const s = Math.max(scoreMot(m, x.tw) * 3, scoreMot(m, x.cw)); if (!s) return null; tot += s; }
      let extrait = "";
      if (!mots.every(m => scoreMot(m, x.tw))) { const i = x.cn.indexOf(mots[0].slice(0, 4)); if (i >= 0) extrait = x.cn.slice(Math.max(0, i - 30), i + 70); }
      return { x, tot, extrait };
    }).filter(Boolean).sort((a, b) => b.tot - a.tot).slice(0, 15);
  }
  const rq = $("#q"), rres = $("#res");
  function afficherRes() {
    rres.textContent = "";
    if (!rq.value.trim()) { rres.hidden = true; return; }
    rres.hidden = false;
    const r = chercher(rq.value);
    if (!r.length) { rres.appendChild(h("li", { class: "vide" }, "Rien trouvé.")); return; }
    r.forEach(({ x, extrait }) => { const li = h("li"); const a = h("a", { href: x.href }, `<span>${x.lab}${extrait ? `<small class="ext">… ${esc(extrait)} …</small>` : ""}</span>`); a.onclick = fermer; li.appendChild(a); rres.appendChild(li); });
  }
  function fermer() { rq.value = ""; rres.textContent = ""; rres.hidden = true; rq.blur(); }
  rq.addEventListener("input", afficherRes);
  rq.addEventListener("keydown", e => {
    if (e.key === "Escape") fermer();
    if (e.key === "Enter") { const a = $("a", rres); if (a) { location.hash = a.getAttribute("href"); fermer(); } }
  });

  // ------------------------------------------------------------- gestes infirmiers de base (fiches sourcées)
  function pageComp(id) {
    const C = window.PISU_COMP;
    const srcHtml = (sources, ids) => ids && ids.length ? `<sup class="c-s">${ids.map(i => { const k = sources.findIndex(x => x.id === i); return k >= 0 ? `<a href="#s-${esc(i)}">${k + 1}</a>` : ""; }).join(",")}</sup>` : "";
    const listeSources = sources => `<section class="bloc c-sources"><h2>Sources</h2><ol>${sources.map(x => `<li id="s-${esc(x.id)}"><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.titre)}</a><small>${[x.editeur, x.niveau, x.date].filter(Boolean).map(esc).join(" · ")}</small></li>`).join("")}</ol></section>`;
    if (id === "cadre") {
      document.title = "Cadre infirmier 2026 · PISU 44";
      app.appendChild(h("div", { class: "p-tete" }, `<div class="pt-tx"><h1>Le cadre infirmier en 2026</h1><p class="t-src">Fiche de synthèse, ${esc(C.genere_le)}, chaque point renvoie à sa source.</p></div>`));
      app.appendChild(h("div", { class: "contenu fiche" }, `<ul>${C.cadre.resume.map(r => `<li>${esc(r.t ?? r)}${srcHtml(C.cadre.sources, r.s)}</li>`).join("")}</ul>${listeSources(C.cadre.sources)}`));
      return;
    }
    const f = C.fiches.find(x => x.id === id);
    document.title = `${f.titre} · PISU 44`;
    noterRecent(`#/c/${id}`, `<span class="rc-t">IDE</span>${esc(f.titre)}`);
    const liste = (titre, l, ol) => l && l.length ? `<h2>${titre}</h2><${ol ? "ol" : "ul"}>${l.map(e => `<li>${esc(e.t ?? e)}${srcHtml(f.sources, e.s)}</li>`).join("")}</${ol ? "ol" : "ul"}>` : "";
    app.appendChild(h("div", { class: "p-tete" }, `<div class="pt-tx"><h1>${esc(f.titre)}</h1><p class="t-src">Récapitulatif du geste infirmier, à part des documents du SDIS. ${esc(f.pour_quoi || "")}</p></div>`));
    app.appendChild(h("div", { class: "contenu fiche" }, liste("Matériel", f.materiel) + liste("Étapes", f.etapes, true) + liste("Points clés", f.points_cles) + listeSources(f.sources)));
  }

  // ------------------------------------------------------------- navigation : barre du bas au pouce, un toucher par rubrique
  const RUB = [
    { id: "protocoles", href: "#/", lab: "Protocoles", ic: '<path d="M5 4h11l3 3v13H5z"/><path d="M8 10h8M8 14h8M8 18h5"/>' },
    { id: "medicaments", href: "#/medicaments", lab: "Médicaments", ic: '<rect x="3" y="9" width="18" height="7" rx="3.5" transform="rotate(-35 12 12.5)"/><path d="M9.2 8.3l5.7 8"/>' },
    { id: "techniques", href: "#/techniques", lab: "Techniques", ic: '<path d="M14 6l4 4-9 9H5v-4z"/><path d="M12.5 7.5l4 4"/>' },
    { id: "plus", href: "#/plus", lab: "Plus", ic: '<circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/>' },
  ];
  const bas = h("nav", { class: "bas", "aria-label": "Rubriques" }, RUB.map(r => `<a href="${r.href}" data-r="${r.id}"><svg viewBox="0 0 24 24" aria-hidden="true">${r.ic}</svg><span>${r.lab}</span></a>`).join(""));
  document.body.appendChild(bas);
  function rubrique(r) {
    if (/^#\/(med|medicaments)/.test(r)) return "medicaments";
    if (/^#\/(t\/|techniques)/.test(r)) return "techniques";
    if (/^#\/(plus|reste|c\/|confirmer)/.test(r)) return "plus";
    const m = r.match(/^#\/p\/([^/]+)/);
    if (m && (estGen(m[1]) || /SSO$|AT$/.test(m[1]))) return "plus";
    return "protocoles";
  }
  function route() {
    const r = decodeURIComponent(location.hash || "#/");
    app.textContent = "";
    window.scrollTo(0, 0);
    const rub = rubrique(r);
    bas.querySelectorAll("a").forEach(a => a.setAttribute("aria-current", String(a.dataset.r === rub)));
    const home = /^#\/?(adultes|enfants|medicaments|techniques|plus|reste)?$/.test(r);
    $("#accueil").hidden = home;
    let m;
    if ((m = r.match(/^#\/p\/([^/]+)(?:\/([a-z]+))?(?:\/(.+))?$/)) && P[m[1]]) pageProto(m[1], m[2], m[3]);
    else if ((m = r.match(/^#\/med\/(M\d+)(?:\/([a-z]+))?$/)) && M[m[1]]) pageMed(m[1], m[2]);
    else if ((m = r.match(/^#\/t\/([a-z0-9-]+)$/)) && TECH[m[1]]) pageTech(m[1]);
    else if ((m = r.match(/^#\/c\/([a-z0-9-]+)$/)) && window.PISU_COMP && (m[1] === "cadre" || PISU_COMP.fiches.some(f => f.id === m[1]))) pageComp(m[1]);
    else if (r === "#/confirmer") pageConfirmer();
    else if (r === "#/medicaments") pageMedicaments();
    else if (r === "#/techniques") pageTechniques();
    else if (/^#\/(plus|reste)$/.test(r)) pagePlus();
    else pageProtocoles((r.match(/^#\/(adultes|enfants)$/) || [])[1]);
  }
  // ------------------------------------------------------------- la VLI : au démarrage, à l'ouverture d'un protocole, et de temps en temps
  const VLI = `<svg viewBox="-30 -17 60 25" aria-hidden="true"><path d="M-27 3 L-27 -7 L-25 -11.5 L4 -12 L12 -5.5 L24 -3.5 L27 0 L27 3 Z" fill="#c62828" stroke="#5a0b0b" stroke-width=".8"/><path d="M-23.5 -10.5 L3 -10.8 L9.5 -5.8 L-23.5 -5.8 Z" fill="#263238"/><path d="M-9 -10.8 v5 M-3 -10.8 v5" stroke="#c62828" stroke-width="1.2"/><rect x="-27" y="-5" width="51" height="1.6" fill="#ffeb3b"/>${[...Array(12)].map((_, k) => `<path d="M${-24 + 4 * k} 2.6 l2 -2.6 h2 l-2 2.6 z" fill="#ffeb3b"/>`).join("")}<rect class="gy g1" x="-7" y="-14.5" width="7" height="2.5" rx="1"/><rect class="gy g2" x="0" y="-14.5" width="7" height="2.5" rx="1"/><circle cx="-16" cy="3.5" r="4.4" fill="#212121"/><circle cx="-16" cy="3.5" r="2.2" fill="#b0bec5"/><circle cx="16" cy="3.5" r="4.4" fill="#212121"/><circle cx="16" cy="3.5" r="2.2" fill="#b0bec5"/><path d="M23.5 -2.5 l3 .6 v1.4 l-3 -.4 z" fill="#fff59d"/></svg>`;
  const calme = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  // la voiture traverse le bas de l'écran ; rien ne bloque, la page est déjà là
  function passe() {
    if (calme()) return;
    const old = $(".vli-passe"); if (old) old.remove();
    const v = h("div", { class: "vli-passe", "aria-hidden": "true" }, VLI);
    document.body.appendChild(v);
    v.addEventListener("animationend", () => v.remove());
  }
  // ouverture d'un protocole : un écran avec seulement la VLI, gyrophares allumés, qui démarre et s'en va (0,7 s, un toucher l'écarte)
  function depart() {
    if (calme()) return;
    const old = $(".vli-depart"); if (old) old.remove();
    const d = h("div", { class: "vli-depart", "aria-hidden": "true" }, `<div class="vd-halo"></div><div class="vd-car">${VLI}</div><div class="vd-route"></div>`);
    const fin = () => d.remove();
    d.addEventListener("pointerdown", fin);
    d.addEventListener("animationend", e => { if (e.target === d) fin(); });
    document.body.appendChild(d);
  }
  const protoDe = r => (r.match(/^#\/p\/([^/]+)/) || [])[1];
  let avant = decodeURIComponent(location.hash || "#/"), changements = 0;
  window.addEventListener("hashchange", () => {
    const r = decodeURIComponent(location.hash || "#/"), pa = protoDe(avant), pn = protoDe(r);
    route();
    if (!calme()) { app.classList.remove("entre"); void app.offsetWidth; app.classList.add("entre"); }
    // nouveau protocole (pas un changement d'onglet dans le même) : écran de départ
    if (pn && pn !== pa && !estGen(pn) && !paireDe(pn, pa)) depart();
    // en passant d'un protocole à autre chose, la voiture repasse de temps en temps (une fois sur quatre)
    else if (pa && !pn && ++changements % 4 === 0) passe();
    avant = r;
  });
  const paireDe = (a, b) => b && paire(a) === b;

  // ------------------------------------------------------------- hors ligne (PWA) : tout le site en cache, mis à jour en ligne
  const hl = h("div", { class: "hl", role: "status" });
  document.body.appendChild(hl);
  const dire = (txt, bouton) => { hl.innerHTML = txt; hl.hidden = !txt; if (bouton) hl.appendChild(bouton); };
  let installer = null;
  window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); installer = e; });
  // le manifeste d'installation seulement sur le web (en fichier local, Chrome le refuse et le signale en erreur)
  if (/^https?:$/.test(location.protocol) && !dansLApp()) document.head.appendChild(h("link", { rel: "manifest", href: "app.webmanifest" }));
  // tirer vers le bas en haut de page : cherche une mise à jour si le réseau est là ; sans réseau, la copie enregistrée reste telle quelle
  const tir = h("div", { class: "tirer", "aria-hidden": "true" }, `<span class="ti-f">↓</span><span class="ti-t">Tirer pour mettre à jour</span>`);
  document.body.appendChild(tir);
  let tirY = null, tirD = 0, tirEnCours = false, demandeTir = null;
  const SEUIL = 80;
  window.addEventListener("touchstart", e => { tirY = (window.scrollY <= 0 && !tirEnCours && e.touches.length === 1 && !e.target.closest(".lg-split, .prep-grand, .t-zoom")) ? e.touches[0].clientY : null; tirD = 0; }, { passive: true });
  window.addEventListener("touchmove", e => {
    if (tirY === null) return;
    tirD = Math.max(0, e.touches[0].clientY - tirY);
    if (window.scrollY > 0) { tirY = null; tirD = 0; }
    const k = Math.min(1, tirD / SEUIL);
    tir.style.transform = `translate(-50%, ${Math.min(tirD, SEUIL * 1.3) - 50}px)`;
    tir.style.opacity = String(k);
    tir.classList.toggle("pret", k >= 1);
    $(".ti-t", tir).textContent = k >= 1 ? "Relâcher pour mettre à jour" : "Tirer pour mettre à jour";
  }, { passive: true });
  window.addEventListener("touchend", () => {
    if (tirY === null) return;
    const go = tirD >= SEUIL; tirY = null; tirD = 0;
    if (!go) { tir.style.transform = ""; tir.style.opacity = "0"; return; }
    tirEnCours = true; tir.classList.add("tourne"); $(".ti-t", tir).textContent = "Recherche de mise à jour…";
    const finir = txt => { $(".ti-t", tir).textContent = txt; setTimeout(() => { tir.classList.remove("tourne", "pret"); tir.style.transform = ""; tir.style.opacity = "0"; tirEnCours = false; }, 1400); };
    if (!navigator.onLine) return finir("Pas de réseau : la version enregistrée reste utilisée.");
    if (demandeTir) demandeTir(finir);
    else if (window.webkit?.messageHandlers?.pisu) { window.webkit.messageHandlers.pisu.postMessage("maj"); finir("Mise à jour demandée."); }
    else finir("Pas de mise à jour possible ici.");
  });
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost") && !dansLApp()) {
    let majPrete = false, telecharge = false, attenteTir = null;
    demandeTir = finir => {
      attenteTir = finir;
      navigator.serviceWorker.ready.then(r => r.active ? r.active.postMessage("verifier") : finir("Pas encore installé."));
      setTimeout(() => { if (attenteTir === finir) { attenteTir = null; finir("Pas de réponse : la version enregistrée reste utilisée."); } }, 20000);
    };
    const verifier = () => navigator.serviceWorker.ready.then(r => { if (navigator.onLine && r.active) r.active.postMessage("verifier"); });
    navigator.serviceWorker.register("sw.js").then(verifier);
    // à chaque retour du réseau et à chaque retour sur l'app
    window.addEventListener("online", verifier);
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") verifier(); });
    navigator.serviceWorker.addEventListener("message", e => {
      const d = e.data || {};
      // demande faite en tirant : on recharge tout de suite si une version est arrivée
      if (attenteTir && d.type !== "progres") {
        const f = attenteTir; attenteTir = null;
        if (d.type === "etat" && (d.nouveau || majPrete)) { f("Nouvelle version : rechargement."); setTimeout(() => location.reload(), 600); return; }
        if (d.type === "etat") { f("Déjà à jour."); return; }
        f("Échec : la version enregistrée reste utilisée."); return;
      }
      if (majPrete) return;   // la proposition de recharger reste affichée
      if (d.type === "progres") { telecharge = true; dire(`Téléchargement pour le hors ligne : ${d.fait} / ${d.total}`); }
      else if (d.type === "etat" && d.nouveau) {
        majPrete = true;
        const b = h("button", { class: "b", type: "button" }, "Recharger");
        b.onclick = () => location.reload();
        dire("Nouvelle version du carnet téléchargée. ", b);
      } else if (d.type === "etat" && telecharge) {
        telecharge = false;
        dire("Carnet disponible hors ligne.");
        setTimeout(() => { if (!majPrete) dire(""); }, 2500);
      } else if (d.type === "erreur" && telecharge) { telecharge = false; dire(""); }
    });
  } else dire("");

  route();
  passe();
})();
