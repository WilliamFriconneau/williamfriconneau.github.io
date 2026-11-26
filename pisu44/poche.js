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
  // glycémie : la même valeur en mmol/l, pour les lecteurs réglés ainsi (1 g/l = 5,55 mmol/l, masse molaire du glucose 180,16 g/mol)
  const MMOL_SRC = "1 g/l = 5,55 mmol/l (masse molaire du glucose : 180,16 g/mol, PubChem)";
  const mmol = html => String(html || "").replace(/(\d+(?:,\d+)?)\s*g\s*\/\s*l\b/gi, (m, v) => { const g = +v.replace(",", "."); return g > 0 && g < 6 ? `${m}<span class="mmol" title="${MMOL_SRC}"> ≈ ${(Math.round(g * 5.551 * 100) / 100).toString().replace(".", ",")} mmol/l</span>` : m; });
  const premiereLigne = n => estQuinze(n) ? "Appel CRRA 15" : (n.txt || "").split("\n")[0].trim().slice(0, 90);
  // cibles d'un nœud : fiches médicament et protocoles cités
  function cibles(n) {
    const t = (n.meds || []).filter(m => M[m]).map(m => {
      const d = M[m];
      return { href: `#/med/${m}`, lab: `Fiche ${m} · ${esc(d.spe || d.dci)}` };
    });
    if (/PISU|PSSO|Appliquer/i.test(n.txt))
      [...new Set((n.txt.match(/\b([1-9] ?[AE]|[12] ?AT|[1-5] ?SSO)\b/g) || []).map(c => c.replace(" ", "")))].filter(c => P[c])
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
    const hauteur = () => { if (!etroit()) { sp.style.height = ""; return; } const c = cols()[act]; if (c) sp.style.height = c.offsetHeight + 2 + "px"; };
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
  // ------------------------------------------------------------- la victime : poids et âge, pour toute l'intervention (effacés à la fermeture)
  const DOSES = window.PISU_DOSES || {}, PROD = window.PISU_PROD || {};
  const VIC_CLE = "pisu44-victime";
  // ------------------------------------------------------------- intervention en cours : victime, journal horodaté, dernier endroit
  // gardée même si l'app est fermée ou le téléphone mis en veille (interruptions), effacée après 6 h ou par « Nouvelle victime »
  const INT_CLE = "pisu44-intervention", DUREE_MAX = 6 * 3600e3;
  const INT = (() => { try { const x = JSON.parse(localStorage.getItem(INT_CLE) || "null"); if (x && Date.now() - x.maj < DUREE_MAX) return x; } catch (e) {} return { vic: {}, evts: [], debut: null, maj: 0, ou: null }; })();
  const vic = INT.vic;
  const sauverInt = () => { INT.maj = Date.now(); try { localStorage.setItem(INT_CLE, JSON.stringify(INT)); } catch (e) {} majBandeauInt(); };
  const enCours = () => !!(INT.debut || INT.evts.length || vic.poids != null || vic.age != null);
  const garderVic = () => { if (!INT.debut) INT.debut = Date.now(); sauverInt(); document.querySelectorAll("[data-dose]").forEach(majDose); document.querySelectorAll(".lg-info:not([hidden]) .saed, .lg-cote .saed").forEach(majSaed); majPerf(); majCrit(); majBarre(); document.querySelectorAll("[data-tl]").forEach(majTL); };
  const majPerf = () => document.querySelectorAll("[data-perf]").forEach(el => { const L = P[el.closest("[data-code]")?.dataset.code]?.logi; const n = L && L.nodes.find(x => x.id === el.dataset.perf); if (n) el.innerHTML = perfusions(n); });
  const heure = t => new Date(t).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const evtsDe = (code, id, j) => INT.evts.filter(e => e.code === code && e.id === id && (j == null || e.j === j));
  function noter(code, id, j, txt) { if (!INT.debut) INT.debut = Date.now(); INT.evts.push({ t: Date.now(), code, id, j, txt }); sauverInt(); }
  function nouvelleIntervention() { Object.keys(vic).forEach(k => delete vic[k]); INT.evts = []; INT.debut = null; INT.ou = null; try { localStorage.removeItem(INT_CLE); } catch (e) {} majBandeauInt(); }
  // intervalle de répétition du PISU (« toutes les 4 min ») pour ce nœud, en millisecondes
  const intervalle = (code, id) => { const b = (BOU[code] || {})[id]; const m = b && /(\d+)\s*min/.exec(b.rythme); return m ? +m[1] * 60e3 : null; };
  const nb = x => (Math.round(x * 100) / 100).toString().replace(".", ",");
  function reglettes(code) {
    const enf = /E$/.test(code), med = /^M\d/.test(code);
    const z = h("div", { class: "vic", role: "group", "aria-label": "La victime" });
    const ligne = (cle, lab, min, max, pas, unite, defaut) => {
      const d = h("div", { class: "vic-l" });
      d.innerHTML = `<label for="vic-${cle}">${lab}</label><button type="button" class="vic-m" aria-label="${lab} moins">−</button><input id="vic-${cle}" type="range" min="${min}" max="${max}" step="${pas}" value="${vic[cle] ?? defaut}"><button type="button" class="vic-p" aria-label="${lab} plus">+</button><output>${vic[cle] != null ? nb(vic[cle]) + " " + unite : "—"}</output>`;
      const r = $("input", d), o = $("output", d);
      const poser = v => { v = Math.min(max, Math.max(min, Math.round(v / pas) * pas)); vic[cle] = v; r.value = v; o.textContent = nb(v) + " " + unite; z.classList.add("rempli"); garderVic(); };
      r.addEventListener("input", () => poser(+r.value));
      $(".vic-m", d).onclick = () => poser((vic[cle] ?? +r.value) - pas);
      $(".vic-p", d).onclick = () => poser((vic[cle] ?? +r.value) + pas);
      return d;
    };
    z.appendChild(ligne("poids", "Poids", enf || med ? 2 : 30, enf ? 80 : 160, enf || med ? 0.5 : 1, "kg", enf ? 20 : 70));
    z.appendChild(ligne("age", "Âge", 0, enf ? 15 : 110, 1, "ans", enf ? 6 : 50));
    // âge pas encore saisi : on le demande d'abord, en un toucher (moins de 15 ans → protocole enfant)
    const m = /^([1-9])([AE])$/.exec(code);
    if (m && vic.age == null) {
      const q = h("div", { class: "vic-q" }, `<b>Âge de la victime ?</b>`);
      const bA = h("button", { type: "button", class: "b vic-qb" }, "15 ans et plus"), bE = h("button", { type: "button", class: "b vic-qb e" }, "Moins de 15 ans");
      bA.onclick = () => { if (m[2] === "E") location.hash = `#/p/${m[1]}A/logi`; else { q.remove(); $("#vic-age", z)?.focus(); } };
      bE.onclick = () => { if (m[2] === "A") location.hash = `#/p/${m[1]}E/logi`; else { q.remove(); $("#vic-age", z)?.focus(); } };
      q.append(bA, bE); z.prepend(q); z.classList.add("a-saisir");
    }
    const raz = h("button", { type: "button", class: "vic-raz" }, "Nouvelle victime");
    raz.onclick = () => { if (INT.evts.length && !raz.classList.contains("sur")) { raz.classList.add("sur"); raz.textContent = `Effacer les ${INT.evts.length} actes notés ? Toucher encore`; setTimeout(() => { raz.classList.remove("sur"); raz.textContent = "Nouvelle victime"; }, 4000); return; } nouvelleIntervention(); const n = reglettes(code); z.replaceWith(n); document.querySelectorAll("[data-dose]").forEach(majDose); };
    z.appendChild(raz);
    if (vic.poids != null || vic.age != null) z.classList.add("rempli");
    // âge saisi sur un autre protocole, qui ne correspond pas à celui-ci
    const al = h("p", { class: "vic-alerte", hidden: "" });
    const verifierAge = () => {
      const a = vic.age, m = /^([1-9])([AE])$/.exec(code);
      al.hidden = !(m && a != null && ((m[2] === "E" && a >= 15) || (m[2] === "A" && a < 15)));
      if (!al.hidden) al.innerHTML = `Victime de ${nb(a)} ans : ce protocole est pour ${m[2] === "E" ? "l'enfant de moins de 15 ans" : "l'adulte et l'enfant de 15 ans et plus"}. <a href="#/p/${m[1]}${m[2] === "E" ? "A" : "E"}">Ouvrir le ${m[1]}${m[2] === "E" ? "A" : "E"}</a>`;
    };
    verifierAge(); z.addEventListener("input", verifierAge); z.addEventListener("click", verifierAge);
    z.appendChild(al);
    return z;
  }
  // un critère du PISU (« ≥ 60 kg et < 75 ans ») évalué sur la victime ; null si une donnée manque
  function critere(lab) {
    const t = lab.split(":")[0];
    const termes = [...t.matchAll(/(≥|≤|<|>)\s*(\d+(?:[.,]\d+)?)\s*(kg|ans?)/g)];
    if (!termes.length) return null;
    const val = termes.map(([, op, n, u]) => { const v = /kg/.test(u) ? vic.poids : vic.age; if (v == null) return null; n = +n.replace(",", "."); return op === "≥" ? v >= n : op === "≤" ? v <= n : op === "<" ? v < n : v > n; });
    if (val.includes(null)) return null;
    return / ou /.test(t) ? val.some(Boolean) : val.every(Boolean);
  }
  // dose d'une injection du PISU pour cette victime : dose, volume, voie, calcul détaillé, préparation (ampoules, solvant)
  const PREPS = window.PISU_PREP || {};
  const r2 = x => Math.round(x * 100) / 100;
  function calculDose(inj) {
    let opt = inj, choix = "";
    if (inj.choix) {
      const i = inj.choix.map(c => critere(c.lab)).indexOf(true);
      if (i < 0) return { manque: "poids et âge", options: inj.choix.map(c => c.lab), m: inj.m };
      opt = Object.assign({ m: inj.m }, inj.choix[i]); choix = inj.choix[i].lab.split(":")[0].trim();
    }
    const pv = (PREPS[opt.m] || [])[opt.v] || {}, pr = pv.prod;
    const u = pr ? pr.u : "mg", voie = inj.voie || (pr && pr.voie) || "";
    const r = { m: opt.m, v: opt.v, pv, pr, u, voie, choix, calc: [], dose: null, ml: null, plafond: false };
    if (opt.mg != null) { r.dose = opt.mg; r.calc.push(`Dose fixe du PISU : ${nb(opt.mg)} ${u}`); }
    else if (opt.mgkg != null) {
      r.regle = `${nb(opt.mgkg)} ${u}/kg${opt.max != null ? `, max ${nb(opt.max)} ${u}` : ""}`;
      if (vic.poids == null) return Object.assign(r, { manque: "poids" });
      const brut = opt.mgkg * vic.poids;
      r.calc.push(`${nb(vic.poids)} kg × ${nb(opt.mgkg)} ${u}/kg = ${nb(r2(brut))} ${u}`);
      if (opt.max != null && brut > opt.max) { r.plafond = true; r.calc.push(`plafonné au maximum du PISU : ${nb(opt.max)} ${u}`); }
      r.dose = Math.min(brut, opt.max ?? Infinity);
    } else if (opt.mlkg != null) {
      r.regle = `${nb(opt.mlkg)} ml/kg${opt.maxml != null ? `, max ${nb(opt.maxml)} ml` : ""}`;
      if (vic.poids == null) return Object.assign(r, { manque: "poids" });
      const brut = opt.mlkg * vic.poids;
      r.calc.push(`${nb(vic.poids)} kg × ${nb(opt.mlkg)} ml/kg = ${nb(r2(brut))} ml`);
      if (opt.maxml != null && brut > opt.maxml) { r.plafond = true; r.calc.push(`plafonné au maximum du PISU : ${nb(opt.maxml)} ml`); }
      r.ml = Math.min(brut, opt.maxml ?? Infinity);
      if (pr) { r.dose = r.ml * pr.conc; r.calc.push(`${nb(r2(r.ml))} ml × ${nb(pr.conc)} ${u}/ml = ${nb(r2(r.dose))} ${u}`); }
    }
    if (r.ml == null && r.dose != null && pr) { r.ml = r.dose / pr.conc; r.calc.push(`${nb(r2(r.dose))} ${u} ÷ ${nb(pr.conc)} ${u}/ml = ${nb(r2(r.ml))} ml`); }
    if (r.ml != null && pr && r.ml > pr.vol + 1e-9) r.depasse = true;
    return r;
  }
  // ------------------------------------------------------------- icônes : ampoule, solvant, seringue, poche de perfusion
  const IC = {
    amp: '<svg viewBox="0 0 24 32" class="ic"><path d="M10 2h4v6l3 4v16a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V12l3-4z" fill="#fde2e2" stroke="#9aa6ad" stroke-width="1.4"/><path d="M8 18h8v8H8z" fill="#f7c2cf"/><path d="M9.5 8.5h5" stroke="#555" stroke-width="1.2"/></svg>',
    solv: '<svg viewBox="0 0 24 32" class="ic"><path d="M9 2h6v4l3 3v19a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9l3-3z" fill="#e4f2f8" stroke="#6fa8c7" stroke-width="1.4"/><path d="M7 16h10v11H7z" fill="#cfe8f5"/></svg>',
    ser: '<svg viewBox="0 0 40 16" class="ic ic-l"><path d="M2 8h4M6 5h22v6H6z" fill="#fff" stroke="#9aa6ad" stroke-width="1.3"/><path d="M6 5h14v6H6z" fill="#b9dcf5"/><path d="M28 3v10M28 8h8M36 4v8" stroke="#9aa6ad" stroke-width="1.6"/></svg>',
    poche: '<svg viewBox="0 0 26 36" class="ic"><path d="M4 3h18v20a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" fill="#e4f2f8" stroke="#6fa8c7" stroke-width="1.5"/><path d="M5 12h16v11a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3z" fill="#cfe8f5"/><path d="M13 27v7M10 3V1h6v2" stroke="#6fa8c7" stroke-width="1.5"/></svg>',
  };
  const ico = (k, lab, sous) => `<span class="eq-i">${IC[k]}<span class="eq-l">${lab}${sous ? `<small>${sous}</small>` : ""}</span></span>`;
  // l'équation de la dilution : [ampoule(s)] + [solvant] = [seringue à la concentration finale]
  function equation(pv) {
    const p = pv.prod; if (!p || !pv.amp || !pv.amp.length) return "";
    const parse = l => { const x = l.split(" ").slice(-3); return { dose: +x[0].replace(",", "."), u: x[1].split("/")[0], vol: +(x[1].split("/")[1] || x[2]).replace(/[^\d.,]/g, "").replace(",", ".") || +x[2] }; };
    const amps = pv.amp.map(a => ({ a, q: parse(a.l) }));
    const volAmp = amps.reduce((s, x) => s + x.a.n * (x.q.vol || 0), 0), doseAmp = amps.reduce((s, x) => s + x.a.n * x.q.dose, 0);
    const txt = pv.prep.join(" "), solv = (txt.match(/NaCl 0,9 %|glucose 5 %|EPPI|solvant/) || ["solvant"])[0];
    const ampsHtml = amps.map(x => ico("amp", `${x.a.n > 1 ? x.a.n + " × " : ""}${esc(x.a.l.replace(/^\S+\s/, ""))}`, esc(x.a.l.split(" ")[0]))).join('<span class="eq-o">+</span>');
    const prem = txt.match(/ramenée à (\d+) ml/);
    if (/Première dilution/.test(txt) && prem) {
      const v1 = +prem[1], c1 = doseAmp / v1, x = r2(p.conc * p.vol / c1);
      return `<span class="eq">${ampsHtml}<span class="eq-o">+</span>${ico("solv", `${nb(r2(v1 - volAmp))} ml`, esc(solv))}<span class="eq-o">=</span>${ico("ser", `${nb(v1)} ml`, `${nb(r2(c1))} ${esc(p.u)}/ml`)}</span>`
        + `<span class="eq">${ico("ser", `${nb(x)} ml`, `de la 1re dilution`)}<span class="eq-o">+</span>${ico("solv", `${nb(r2(p.vol - x))} ml`, esc(solv))}<span class="eq-o">=</span>${ico("ser", `${nb(p.vol)} ml`, `<b>${nb(p.conc)} ${esc(p.u)}/ml</b>`)}</span>`;
    }
    const solvant = r2(p.vol - volAmp);
    return `<span class="eq">${ampsHtml}${solvant > 0.001 ? `<span class="eq-o">+</span>${ico("solv", `${nb(solvant)} ml`, esc(solv))}` : ""}<span class="eq-o">=</span>${ico("ser", `${nb(p.vol)} ml`, `<b>${nb(p.conc)} ${esc(p.u)}/ml</b>`)}</span>`;
  }
  // poches de perfusion d'un nœud : volume (au poids s'il le faut, plafonné comme le dit le PISU) et débit
  function perfusions(n) {
    const t = n.txt.replace(/\n/g, " ");
    const re = /(NaCl(?: 0,9 %)?|Ringer Lactate|G ?5 %)\s*(?:VVP\s*)?(\d+(?:,\d+)?)\s*ml(\/kg)?([^+]*)/g;
    const out = [];
    for (const m of t.matchAll(re)) {
      if (/dans\s*$/.test(t.slice(0, m.index))) continue;   // « dans 100 ml NaCl » : la dilution d'un médicament
      const sol = m[1], reste = m[4] || "", max = (reste.match(/(?:sans excéder|max)\s*(\d+)\s*ml/) || [])[1], duree = (reste.match(/en\s*(\d+)\s*min/) || [])[1];
      let vol = +m[2].replace(",", "."), lab, calc = "";
      if (m[3]) {
        if (vic.poids == null) { lab = `${m[2]} ml/kg`; calc = "poids ?"; vol = null; }
        else { const brut = vol * vic.poids; vol = Math.min(brut, max ? +max : Infinity); lab = `${nb(r2(vol))} ml`; calc = `${nb(vic.poids)} kg × ${m[2]} ml/kg${max && brut > +max ? `, plafonné à ${max} ml` : ""}`; }
      } else lab = `${m[2]} ml`;
      const deb = vol != null && duree ? `${nb(r2(vol / +duree))} ml/min` : /GV|débit libre/.test(reste + t) ? "" : "";
      out.push({ sol, lab, calc, deb, duree });
    }
    if (!out.length) return "";
    const deux = /2(?:e|ème|eme)\s*(?:voie|VVP|ABORD)/i.test(t);
    const l = deux && out.length === 1 ? [Object.assign({}, out[0], { voie: "voie 1" }), Object.assign({}, out[0], { voie: "voie 2" })] : out;
    return `<span class="perf">${l.map(x => `<span class="perf-i">${IC.poche}<span class="eq-l">${esc(x.lab)}<small>${esc(x.sol)}${x.voie ? " · " + x.voie : ""}</small>${x.deb ? `<small>${esc(x.deb)}</small>` : ""}${x.calc ? `<small class="perf-c">${esc(x.calc)}</small>` : ""}</span></span>`).join("")}</span>`;
  }
  function prepHtml(r) {
    const pv = r.pv; if (!pv || !pv.prod) return "";
    const amp = (pv.amp || []).map(a => `${a.n} ${a.n > 1 ? "ampoules" : "ampoule"} ${esc(a.l)}`).join(" + ");
    return `${equation(pv)}<span class="ds-prep"><b>Préparer</b>${amp ? ` <small>(${amp})</small>` : ""}<ol>${(pv.prep || []).map(t => `<li>${esc(t)}</li>`).join("")}<li><b>${nb(pv.prod.vol)} ml à ${nb(pv.prod.conc)} ${esc(pv.prod.u)}/ml</b></li></ol><small>${esc(pv.src)}</small></span>`;
  }
  function doseTexte(inj) {
    const r = calculDose(inj);
    const nom = r.pr ? r.pr.nom.toLowerCase() : r.m;
    if (r.manque) return { manque: r.manque, nom, txt: r.options ? r.options.map(esc).join(" · ") : `${esc(nom)} ${esc(r.regle || "")}`, html: "" };
    const tete = `<span class="ds-dose"><b>${nb(r2(r.dose))} ${esc(r.u)}</b>${r.ml != null ? ` = <b>${nb(r2(r.ml))} ml</b>` : ""} de ${esc(nom)}${r.voie ? ` <span class="ds-voie">${esc(r.voie)}</span>` : ""}</span>`;
    const calc = `<span class="ds-calc"><b>Pour contrôle :</b> ${r.calc.map(esc).join(" → ")}${r.choix ? ` <small>(${esc(r.choix)})</small>` : ""}${r.depasse ? ` <b class="ds-alerte">Volume supérieur à la seringue préparée (${nb(r.pr.vol)} ml)</b>` : ""}</span>`;
    return { dose: r2(r.dose), ml: r.ml != null ? r2(r.ml) : null, u: r.u, nom, voie: r.voie, html: tete + calc + prepHtml(r), txt: tete };
  }
  // « ≥ 60 kg et < 75 ans = 3 mg » : au repos tout s'affiche ; victime connue, seul le cas qui s'applique reste
  function lignesVictime(html) {
    const seg = String(html).split(/(<br\s*\/?>|\n)/);
    let etat = null, cache = 0;
    const out = seg.map(x => {
      if (/^(<br\s*\/?>|\n)$/.test(x)) return etat === false ? "" : x;
      const t = x.replace(/<[^>]+>/g, "").trim();
      if (/^\+?$/.test(t)) { etat = null; return x; }
      if (/(≥|≤|<|>)\s*\d+(?:[.,]\d+)?\s*(kg|ans?)\b/.test(t) && /=|:/.test(t)) { etat = critere(t.split(/=/)[0] + ":"); }
      if (etat === false) { cache++; return ""; }
      return etat === true ? `<span class="cr-ok">${x}</span>` : x;
    }).join("").replace(/^(<br\s*\/?>)+|(<br\s*\/?>)+$/g, "").replace(/(<br\s*\/?>){2,}/g, "<br>");
    return out + (cache ? `<span class="cr-note">selon ${[vic.poids != null ? nb(vic.poids) + " kg" : "", vic.age != null ? nb(vic.age) + " ans" : ""].filter(Boolean).join(", ")}</span>` : "");
  }
  const majCrit = () => document.querySelectorAll("[data-crit]").forEach(el => { const [c, id] = el.dataset.crit.split(":"); const n = P[c]?.logi?.nodes.find(x => x.id === id); if (n && !estQuinze(n)) el.innerHTML = lignesVictime(mmol(n.html)); });
  // fiche médicament : par protocole, la préparation une fois, puis la frise des injections dans l'ordre du logigramme
  function majTL(cz) {
    const code = cz.dataset.tl;
    let html = `<h2>Doses dans les protocoles</h2>`;
    Object.entries(DOSES).forEach(([c, nds]) => {
      const L = P[c]?.logi; if (!L) return;
      const out = {}; L.edges.forEach(e => (out[e.s] = out[e.s] || []).push(e));
      const ordre = {}, q = [L.start]; ordre[L.start] = 0; let k = 1;
      while (q.length) { const u = q.shift(); (out[u] || []).forEach(e => { if (!(e.t in ordre)) { ordre[e.t] = k++; q.push(e.t); } }); }
      const pas = Object.entries(nds).filter(([, l]) => l.some(inj => inj.m === code)).sort((x, y) => (ordre[x[0]] ?? 99) - (ordre[y[0]] ?? 99));
      if (!pas.length) return;
      const premier = pas[0][1].find(inj => inj.m === code), r0 = calculDose(premier);
      html += `<div class="tl-p"><a class="cm-p" href="#/p/${c}/logi">${picto(c)}<span class="code ${classeCode(c)}">${c}</span><span>${esc(P[c].titre)}</span></a>${r0.pv ? equation(r0.pv) : ""}<ol class="tl">`;
      pas.forEach(([id, l]) => l.forEach((inj, j) => {
        if (inj.m !== code) return;
        const n = L.nodes.find(x => x.id === id), d = doseTexte(inj), bo = (BOU[c] || {})[id];
        let quand = (n ? premiereLigne(n) : id).replace(/\s*:?\s*injecter.*$/i, "").replace(/[:\s]+$/, "");
        if (!quand) { const e = L.edges.find(x => x.t === id), src = e && L.nodes.find(x => x.id === e.s); quand = src && src.k === "question" ? `${premiereLigne(src).replace(/\s*\?\s*$/, " ?")} ${(e.label || "").toLowerCase()}` : "Puis"; }
        html += `<li><span class="tl-q">${esc(quand)}</span><span class="tl-d">${d.manque ? `<span class="tl-m">poids ou âge ?</span> ${d.txt}` : `<b>${nb(d.dose)} ${esc(d.u)}</b>${d.ml != null ? ` = <b>${nb(d.ml)} ml</b>` : ""} ${d.voie ? `<span class="ds-voie">${esc(d.voie)}</span>` : ""}`}</span>${bo ? `<span class="tl-r">↻ ${esc(bo.rythme)}</span>` : ""}</li>`;
      }));
      html += `</ol></div>`;
    });
    cz.innerHTML = html;
  }
  function majDose(el) {
    const [code, id] = el.dataset.dose.split(":");
    const fiche = !!el.dataset.med;
    el.innerHTML = (DOSES[code]?.[id] || []).map((inj, j) => [inj, j]).filter(([inj]) => !fiche || inj.m === el.dataset.med).map(([inj, j]) => {
      const d = doseTexte(inj), faits = evtsDe(code, id, j);
      const fait = fiche ? "" : `<span class="ds-fait"><button type="button" class="b ds-ok" data-j="${j}">✓ Fait${faits.length ? ` <small>${faits.length}×</small>` : ""}</button>${faits.length ? `<span class="ds-h">${faits.map(e => heure(e.t)).join(" · ")}</span>` : ""}<span class="ds-rebours" data-j="${j}"></span></span>`;
      return `<span class="ds">${d.manque ? `<a class="ds-m" href="#" onclick="document.querySelector('.vic')?.scrollIntoView({block:'center'});return false">Indiquer ${d.manque} ↑</a> ${d.txt}` : d.html}${fait}</span>`;
    }).join("");
    if (fiche) return;
    el.querySelectorAll(".ds-ok").forEach(b => b.onclick = ev => {
      ev.stopPropagation();
      const j = +b.dataset.j, inj = DOSES[code][id][j], d = doseTexte(inj);
      noter(code, id, j, d.manque ? (d.nom || inj.m) : `${d.nom} ${nb(d.dose)} ${d.u}${d.ml != null ? ` (${nb(d.ml)} ml)` : ""}${d.voie ? " " + d.voie : ""}`);
      majDose(el); vibrer(30);
    });
    rebours(el, code, id);
  }
  const vibrer = m => { try { if (navigator.vibrate && navigator.userActivation?.hasBeenActive) navigator.vibrate(m); } catch (e) {} };
  // compte à rebours jusqu'à la prochaine injection quand le PISU fixe un rythme ; à zéro, la case clignote et vibre
  const REB = new Set();
  function rebours(el, code, id) {
    const iv = intervalle(code, id); if (!iv) return;
    REB.add(el); if (REB.size === 1) setTimeout(tic, 0);
  }
  function tic() {
    for (const el of [...REB]) {
      if (!el.isConnected) { REB.delete(el); continue; }
      const [code, id] = el.dataset.dose.split(":"), iv = intervalle(code, id);
      el.querySelectorAll(".ds-rebours").forEach(r => {
        const l = evtsDe(code, id, +r.dataset.j); if (!l.length) { r.textContent = ""; return; }
        const reste = l[l.length - 1].t + iv - Date.now(), s_ = Math.abs(Math.round(reste / 1000));
        const mm = `${Math.floor(s_ / 60)}:${String(s_ % 60).padStart(2, "0")}`;
        r.textContent = reste > 0 ? `Prochaine dans ${mm}` : `Prochaine maintenant (+${mm})`;
        const echu = reste <= 0;
        if (echu && !r.classList.contains("echu")) vibrer([200, 100, 200]);
        r.classList.toggle("echu", echu);
      });
    }
    if (REB.size) setTimeout(tic, 1000);
  }
  // ---- bilan à transmettre au 15 (Saed, HAS) : situation de la fiche, étapes du logigramme jusqu'à cet appel
  const SAED_SRC = `<p class="inf-src2">Structure Saed : HAS, <a href="https://www.has-sante.fr/jcms/c_1776178/fr/saed-un-guide-pour-faciliter-la-communication-entre-professionnels-de-sante" target="_blank" rel="noopener">Saed, un guide pour faciliter la communication entre professionnels de santé</a>, octobre 2014 (outil institutionnel). Contenu : le bilan paramédical de la fiche et les étapes du logigramme jusqu'à cet appel. Les « ___ » sont à compléter.</p>`;
  function cheminVers(L, id) {
    const out = {}; L.edges.forEach(e => (out[e.s] = out[e.s] || []).push(e));
    const prev = { [L.start]: null }, q = [L.start];
    while (q.length) { const u = q.shift(); if (u === id) break; (out[u] || []).forEach(e => { if (!(e.t in prev)) { prev[e.t] = e; q.push(e.t); } }); }
    if (!(id in prev)) return null;
    const pas = []; for (let c = id; c !== L.start; c = prev[c].s) pas.unshift(prev[c]);
    return pas;
  }
  function gestesChips(det) {
    if (det.dataset.gestes) return; det.dataset.gestes = "1";
    const retirer = c => { INT.retires = INT.retires || []; INT.retires.push(c.dataset.k); sauverInt(); c.classList.add("part"); setTimeout(() => majSaed(det), 180); };
    det.addEventListener("click", e => {
      const x = e.target.closest(".chip-x"); if (x) { e.stopPropagation(); retirer(x.parentElement); return; }
      if (e.target.closest(".chip-raz")) { e.stopPropagation(); const code = det.dataset.saed.split(":")[0]; INT.retires = (INT.retires || []).filter(k => !k.startsWith(code + "|")); sauverInt(); majSaed(det); }
    });
    // glisser une pastille hors de la case : elle est retirée
    let c = null, x0 = 0, y0 = 0;
    det.addEventListener("pointerdown", e => { const ch = e.target.closest(".chip"); if (!ch || e.target.closest(".chip-x")) return; c = ch; x0 = e.clientX; y0 = e.clientY; ch.setPointerCapture(e.pointerId); });
    det.addEventListener("pointermove", e => { if (!c) return; const dx = e.clientX - x0, dy = e.clientY - y0; c.style.transform = `translate(${dx}px, ${dy}px)`; c.style.opacity = String(Math.max(.3, 1 - Math.hypot(dx, dy) / 160)); });
    const fin = e => { if (!c) return; const d = Math.hypot(e.clientX - x0, e.clientY - y0), ch = c; c = null; if (d > 70) retirer(ch); else { ch.style.transform = ""; ch.style.opacity = ""; } };
    det.addEventListener("pointerup", fin); det.addEventListener("pointercancel", fin);
  }
  function majSaed(det) {
    gestesChips(det);
    const [code, id] = det.dataset.saed.split(":"), p = P[code], L = p.logi, byId = Object.fromEntries(L.nodes.map(n => [n.id, n]));
    const ligne = t => (t || "").replace(/\n+/g, " ").replace(/\s+/g, " ").trim();
    const d = document.createElement("div"); d.innerHTML = p.fiche || "";
    const bilan = [...d.querySelectorAll("p.callout.info")].map(x => ligne(x.textContent)).filter(Boolean);
    const S = [ligne(byId[L.start].txt), `Victime : ${vic.age != null ? nb(vic.age) + " ans" : "âge ___"}, ${vic.poids != null ? nb(vic.poids) + " kg" : "poids ___"}`];
    const E = [];
    (cheminVers(L, id) || []).forEach(e => {
      const src = byId[e.s], n = byId[e.t];
      if (e.label && src.k === "question") E.push(`${ligne(src.txt).replace(/\s*\?\s*$/, "")} : ${e.label.toLowerCase()}`);
      if (n.id !== id && ["action", "medicament", "renvoi"].includes(n.k)) {
        const ds = (DOSES[code]?.[n.id] || []).map((inj, j) => Object.assign(doseTexte(inj), { j })).filter(x => x.dose != null);
        const hs = j => { const l = evtsDe(code, n.id, j); return l.length ? l.map(e => heure(e.t)).join(", ") : "___ h"; };
        E.push(ds.length ? ds.map(x => `${x.nom} ${nb(x.dose)} ${x.u}${x.ml != null ? ` (${nb(x.ml)} ml)` : ""}${x.voie ? " " + x.voie : ""} à ${hs(x.j)}`).join(" ; ") : ligne(n.txt).slice(0, 160));
      }
    });
    E.push("Bilan : ___ (PA, FC, FR, SpO₂, glycémie, EN, Glasgow selon la situation)");
    const out = {}; L.edges.forEach(e => (out[e.s] = out[e.s] || []).push(e));
    const D = (out[id] || []).map(e => byId[e.t]).filter(n => n && ["orientation", "renvoi", "action", "medicament"].includes(n.k)).map(n => ligne(n.txt).slice(0, 120));
    INT.retires = INT.retires || [];
    const chips = (t, i) => {
      const k = t.indexOf(":"); if (k < 0) return `<dd>${esc(t)} : ___</dd>`;
      const tete = t.slice(0, k).trim(), parts = t.slice(k + 1).split(/,|—|;|\s+puis\s+|:/).map(x => x.trim()).filter(x => x.length > 1 && x.length < 90);
      if (parts.length < 2) return `<dd>${esc(t)} : ___</dd>`;
      return `<dd><span class="sc-t">${esc(tete)}</span><span class="sc">${parts.map((x, j) => { const cle = `${code}|${i}|${j}`; return INT.retires.includes(cle) ? "" : `<span class="chip" data-k="${esc(cle)}">${esc(x)}<button type="button" class="chip-x" aria-label="Retirer ${esc(x)}">×</button></span>`; }).join("")}</span></dd>`;
    };
    const nbRet = INT.retires.filter(k => k.startsWith(code + "|")).length;
    $(".saed-c", det).innerHTML = `<dl><dt>S · Situation</dt>${S.map(t => `<dd>${esc(t)}</dd>`).join("")}${bilan.map(chips).join("")}${nbRet ? `<dd><button type="button" class="b chip-raz">Remettre les ${nbRet} signes retirés</button></dd>` : ""}
      <dt>A · Antécédents</dt><dd>Antécédents, traitements, allergies : ___</dd>
      <dt>E · Évaluation et actions</dt>${E.map(t => `<dd>${esc(t)}</dd>`).join("")}
      <dt>D · Demande</dt>${D.length ? D.map(t => `<dd>Accord pour : ${esc(t)}</dd>`).join("") : "<dd>Conduite à tenir et orientation : ___</dd>"}</dl>${SAED_SRC}`;
  }
  function logigramme(code, L, prof = 0) {
    const byId = Object.fromEntries(L.nodes.map(n => [n.id, n]));
    const bou = BOU[code] || {};
    const lg = h("div", { class: "lg", "data-code": code });
    const poids = items => Math.max(1, ...items.filter(i => i.t === "split").map(i => i.branches.reduce((a, b) => a + poids(b.items), 0)));
    function dessiner(items, parent) {
      items.forEach((it, i) => {
        if (i > 0 && it.t !== "split") parent.appendChild(h("div", { class: "lg-fl" }));
        if (it.t === "n") {
          const n = byId[it.id], [titre, cl] = KIND[n.k] || KIND.action;
          const wrap = h("div", { class: "lg-nw", id: "n-" + n.id });
          const cs = cibles(n), inf = infosNoeud(code, n);
          const pf = perfusions(n);
          const aDose = (DOSES[code]?.[n.id] || []).length, assoc = !prof ? cs.filter(c => /^#\/p\//.test(c.href)).map(c => c.href.slice(4)).filter(c => P[c]?.logi && c !== code) : [];
          const ctx = aDose || n.k === "appel" || assoc.length || inf;
          const contenu = (n.k === "question" ? "" : `<span class="lg-k">${titre}</span>`) + `<span class="lg-tx" data-crit="${code}:${n.id}">${estQuinze(n) ? PICTO15 : lignesVictime(mmol(n.html))}</span>` + (pf ? `<span class="lg-perf" data-perf="${n.id}">${pf}</span>` : "") + (n.ecart ? ecartHtml(n.ecart) : "");
          const liens = cs.length ? `<span class="renvois">${cs.map(c => `<a class="b" href="${c.href}">${c.lab} ›</a>`).join(" ")}</span>` : "";
          const noeud = h("div", ctx ? { class: `lg-n k-${cl} a-info`, role: "button", tabindex: "0", "aria-expanded": "false" } : { class: `lg-n k-${cl}` },
            contenu + liens + (ctx ? `<span class="lg-plus" aria-hidden="true">${aDose ? "💉" : n.k === "appel" ? "☎" : "i"}</span>` : ""));
          wrap.appendChild(noeud);
          if (ctx) {
            const info = h("div", { class: "lg-info", hidden: "" });
            if (aDose) { const d = h("div", { class: "lg-dose", "data-dose": `${code}:${n.id}` }); majDose(d); info.appendChild(d); }
            if (n.k === "appel") { const sd = h("div", { class: "saed", "data-saed": `${code}:${n.id}` }, `<p class="saed-t">Bilan au 15</p><div class="saed-c"></div>`); info.appendChild(sd); }
            assoc.forEach(autre => {
              // le protocole associé s'ouvre sous le nœud, dans le logigramme ; les branches voisines se replient
              const bt = h("button", { type: "button", class: "b lg-imb-b" }, `${picto(autre)}Voir le ${autre} ici`);
              bt.onclick = ev => {
                ev.stopPropagation();
                const z = wrap.querySelector(":scope > .lg-imb-zone");
                const pousser = on => { for (let br = wrap.closest(".lg-br"); br; br = br.parentElement.closest(".lg-br")) { const sp = br.parentElement; sp.classList.toggle("pousse", on); [...sp.children].forEach(f => { f.classList.toggle("choisie", on && f === br); f.classList.toggle("ecartee", on && f !== br); }); } };
                if (z) { z.remove(); pousser(false); bt.innerHTML = `${picto(autre)}Voir le ${autre} ici`; return; }
                const zone = h("div", { class: "lg-imb-zone" }, `<p class="lg-imb-t">${picto(autre)}${autre} · ${esc(P[autre].titre)}</p>`);
                zone.appendChild(logigramme(autre, P[autre].logi, prof + 1));
                wrap.appendChild(zone); pousser(true); bt.innerHTML = `Fermer le ${autre}`;
                zone.scrollIntoView({ block: "start", behavior: calme() ? "auto" : "smooth" });
              };
              info.appendChild(bt);
            });
            if (inf) info.appendChild(h("details", { class: "lg-plusinfo" }, `<summary>Fiche et protocole</summary>${inf}`));
            wrap.appendChild(info);
          }
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
            col.appendChild(h("div", { class: "lg-lab", role: "button", tabindex: "0" }, esc(lab) + (br.e.ecart ? ecartHtml(br.e.ecart) : "")));
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
      if (ouvrir) i.querySelectorAll(".saed").forEach(majSaed);
      i.hidden = !ouvrir; n.setAttribute("aria-expanded", String(ouvrir));
    };
    // grand écran : les infos vont dans un panneau à droite, à hauteur de lecture, au lieu de recouvrir le logigramme
    const large = () => !prof && matchMedia("(min-width: 1100px)").matches;
    const cote = h("aside", { class: "lg-cote", "aria-live": "polite" }, `<p class="lc-vide">Survoler ou cliquer un nœud marqué <span class="lg-plus-ex">i</span> : ce que disent la fiche et le protocole s'affiche ici.</p>`);
    let fixe = null;
    let deplace = null;
    const rendre = () => { if (deplace) { deplace.i.hidden = true; deplace.n.after(deplace.i); deplace = null; } };
    const montrer = (n, garder) => {
      const i = n.nextElementSibling?.classList.contains("lg-info") ? n.nextElementSibling : deplace && deplace.n === n ? deplace.i : null; if (!i) return;
      if (garder) { lg.querySelectorAll(".lg-n.fixe").forEach(x => x.classList.remove("fixe")); n.classList.add("fixe"); fixe = n; }
      if (deplace && deplace.n === n) return;
      rendre();
      i.querySelectorAll(".saed").forEach(majSaed);
      cote.replaceChildren(h("p", { class: "lc-t" }, esc(premiereLigne(byId[n.parentElement.id.slice(2)] || { txt: "" }))), i);
      i.hidden = false; deplace = { n, i };
    };
    lg.addEventListener("click", e => {
      if (e.target.closest("a")) return;
      if (large() && e.target.closest(".lg-n.a-info")) { montrer(e.target.closest(".lg-n.a-info"), true); return; }
      // choisir une branche (oui / non) : les autres s'effacent ; un second clic annule
      const lab = e.target.closest(".lg-lab");
      if (lab) {
        const br = lab.parentElement, freres = [...br.parentElement.children];
        const deja = br.classList.contains("choisie");
        freres.forEach(f => f.classList.remove("choisie", "ecartee"));
        if (!deja) { br.classList.add("choisie"); freres.filter(f => f !== br).forEach(f => f.classList.add("ecartee")); }
        return;
      }
      const n = e.target.closest(".lg-n.a-info"); if (!n) return;
      n.parentElement.classList.remove("survol");
      basculer(n);
    });
    lg.addEventListener("keydown", e => { const n = e.target.closest?.(".lg-n.a-info"); if (n && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); basculer(n); } });
    if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
      lg.addEventListener("mouseover", e => { if (large()) { const n = e.target.closest(".lg-n.a-info"); if (n) montrer(n, false); return; } const w = e.target.closest(".lg-nw"); if (!w || w.classList.contains("survol")) return; const n = $(".lg-n.a-info", w); if (n && n.getAttribute("aria-expanded") === "false") { w.classList.add("survol"); basculer(n, true); } });
      lg.addEventListener("mouseleave", () => { if (large() && fixe) montrer(fixe, false); });
      lg.addEventListener("mouseout", e => { if (large()) return; const w = e.target.closest(".lg-nw.survol"); if (!w || w.contains(e.relatedTarget)) return; w.classList.remove("survol"); basculer($(".lg-n.a-info", w), false); });
    }
    const z = h("div", { class: "logi" });
    z.appendChild(lg);
    z.appendChild(cote);
    if (L.notes && L.notes.length) {
      const nb = h("div", { class: "notes-logi" }, `<b class="h">Pendant toute la prise en charge</b>`);
      L.notes.forEach(id => {
        const n = byId[id], cs = cibles(n);
        const d = h("div", { class: "notes-tx" }, n.html + (cs.length ? `<span class="renvois">${cs.map(c => `<a class="b" href="${c.href}">${c.lab} ›</a>`).join(" ")}</span>` : ""));
        if (!prof) cs.filter(c => /^#\/p\//.test(c.href)).forEach(c => {
          const autre = c.href.slice(4); if (!P[autre]?.logi || autre === code) return;
          const det = h("details", { class: "lg-imb" }, `<summary>${picto(autre)}Déplier le ${autre} ici</summary>`);
          det.addEventListener("toggle", () => { if (det.open && !det.querySelector(".logi")) det.appendChild(logigramme(autre, P[autre].logi, 1)); });
          d.appendChild(det);
        });
        nb.appendChild(d);
      });
      z.appendChild(nb);
    }
    return z;
  }

  // ------------------------------------------------------------- pages
  const fiche = html => h("div", { class: "fiche" }, mmol(html));
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
    return `<a class="ligne proto ${classeCode(c)}" href="#/p/${c}">${picto(c)}<span class="code ${classeCode(c)}">${c}</span><span>${esc(p.titre)}</span></a>`;
  }
  // déjà ouvert depuis l'écran d'accueil : inutile de proposer l'installation
  const installe = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
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
  // ------------------------------------------------------------- bandeau d'installation, selon l'appareil et le navigateur
  function plateforme() {
    const u = navigator.userAgent, ios = /iPhone|iPad|iPod/.test(u) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (ios) return "ios";
    if (/Android/.test(u)) return "android";
    if (/Firefox\//.test(u)) return "firefox";
    if (/Macintosh/.test(u) && /Safari\//.test(u) && !/Chrome|Chromium|Edg\//.test(u)) return "mac-safari";
    return "bureau";
  }
  function bandeauInstall() {
    if (installe() || !/^https?:$/.test(location.protocol)) return null;
    try { if (+localStorage.getItem("pisu44-bandeau") > Date.now()) return null; } catch (e) {}
    const pf = plateforme();
    const txt = {
      ios: "Pour l'avoir hors ligne : bouton Partager <b>⬆︎</b>, puis <b>« Sur l'écran d'accueil »</b>.",
      android: installer ? "Installer PISU 44 : il marche ensuite sans réseau." : "Menu <b>⋮</b> de Chrome, puis <b>« Installer l'application »</b>.",
      "mac-safari": "Sur Mac : menu <b>Fichier</b>, puis <b>« Ajouter au Dock »</b>. L'app marche ensuite sans réseau.",
      bureau: installer ? "Installer PISU 44 sur cet ordinateur : il marche ensuite sans réseau." : "Chrome ou Edge : icône <b>Installer</b> à droite de la barre d'adresse.",
      firefox: "Firefox n'installe pas les applications web : ouvrir cette page dans Chrome, Edge ou Safari.",
    }[pf];
    const b = h("div", { class: "bandeau-inst", role: "region", "aria-label": "Installer l'application" }, `<img src="icones/icone-192.png" alt="" width="40" height="40"><p>${txt}</p>`);
    if (installer && (pf === "android" || pf === "bureau")) {
      const k = h("button", { type: "button", class: "b bi-ok" }, "Installer");
      k.onclick = async () => { installer.prompt(); await installer.userChoice; installer = null; b.remove(); };
      b.appendChild(k);
    }
    const x = h("button", { type: "button", class: "bi-x", "aria-label": "Masquer" }, "×");
    x.onclick = () => { try { localStorage.setItem("pisu44-bandeau", String(Date.now() + 30 * 864e5)); } catch (e) {} b.remove(); };
    b.appendChild(x);
    return b;
  }
  function pageProtocoles(public_) {
    document.title = "PISU 44";
    let pub = public_;
    if (!pub) { try { pub = localStorage.getItem("pisu44-public"); } catch (e) {} }
    pub = pub === "enfants" ? "enfants" : "adultes";
    try { localStorage.setItem("pisu44-public", pub); } catch (e) {}
    const seg = h("nav", { class: "seg seg-pub", "aria-label": "Public" });
    [["adultes", "Adulte <small>≥ 15 ans</small>"], ["enfants", "Enfant <small>&lt; 15 ans</small>"]].forEach(([id, lab]) =>
      seg.appendChild(h("a", { href: `#/${id}`, class: "seg-b " + (id === "enfants" ? "e" : "a"), "aria-current": String(id === pub) }, lab)));
    const bi = bandeauInstall(); if (bi) app.appendChild(bi);
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
    if (f.resume && f.resume.length) z.appendChild(h("section", { class: "bloc t-resume" }, `<h2>L'essentiel</h2><p class="petit">Extraits du document, recopiés tels quels. La fiche complète suit.</p>${f.resume.map(r => `<h3>${esc(r.titre)}</h3><ul>${r.points.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`).join("")}`));
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
  // ------------------------------------------------------------- aide-mémoire : court, sourcé, le PISU prime
  const faible = n => /faible|pédagog/i.test(n || "");
  function blocMemos(l) {
    return h("div", { class: "memos" }, `<p class="memo-avt">Aide-mémoire. <b>Le PISU prime</b> en cas de différence.</p>` + l.map(m => `<section class="memo"><h3>${esc(m.titre)}</h3><ul>${m.lignes.map(x => `<li>${esc(x)}</li>`).join("")}</ul><details class="memo-src"><summary>Source${m.sources.length > 1 ? "s" : ""}${m.sources.some(x => faible(x.niveau)) ? ' <span class="memo-faible">niveau faible</span>' : ""}</summary><ul>${m.sources.map(x => `<li><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.titre)}</a><small>${[x.editeur, x.niveau, x.date].filter(Boolean).map(esc).join(" · ")}</small></li>`).join("")}</ul></details></section>`).join(""));
  }
  function pageMemo(id) {
    const m = (window.PISU_MEMOS?.general || []).find(x => x.id === id);
    document.title = `${m.titre} · PISU 44`;
    app.appendChild(h("div", { class: "p-tete" }, `<div class="pt-tx"><h1>${esc(m.titre)}</h1></div>`));
    const z = h("div", { class: "contenu" }); z.appendChild(blocMemos([m])); app.appendChild(z);
  }
  function pagePlus() {
    document.title = "Plus · PISU 44";
    const gens = [...ORDRE_GEN.filter(c => P[c]), ...Object.keys(P).filter(c => estGen(c) && !ORDRE_GEN.includes(c))];
    const C = window.PISU_COMP;
    app.appendChild(h("div", { class: "contenu accueil" }, `<h1 class="h-rub">Plus</h1>`
      + `<section class="bloc"><h2>Soutien sanitaire opérationnel</h2>${PROTO_SSO.filter(c => P[c]).map(lienCode).join("")}</section>`
      + `<section class="bloc"><h2>Actes de télémédecine</h2>${PROTO_AT.filter(c => P[c]).map(lienCode).join("")}</section>`
      + ((window.PISU_MEMOS?.general || []).length ? `<section class="bloc"><h2>Aide-mémoire</h2>${PISU_MEMOS.general.map(m => `<a class="ligne" href="#/memo/${m.id}"><span>${esc(m.titre)}</span></a>`).join("")}</section>` : "")
      + (C && C.fiches.length ? `<section class="bloc"><h2>Gestes infirmiers de base</h2>${C.fiches.map(f => `<a class="ligne" href="#/c/${f.id}"><span>${esc(f.titre)}</span></a>`).join("")}<a class="ligne" href="#/c/cadre"><span>Le cadre infirmier en 2026</span></a></section>` : "")
      + `<section class="bloc"><h2>Généralités et annexes</h2>${gens.map(c => `<a class="ligne" href="#/p/${c}"><span>${esc(P[c].titre)}</span></a>`).join("")}</section>`
      + (installe() ? "" : `<section class="bloc"><h2>Sur l'écran d'accueil</h2><p class="petit">Le carnet s'installe comme une application, sans store, et marche sans réseau : tout est téléchargé à la première ouverture. Pour mettre à jour, tirer la page vers le bas avec du réseau. iPhone : Safari, bouton Partager, « Sur l'écran d'accueil ». Android : Chrome, menu ⋮, « Installer l'application ».</p><button class="ligne b-inst" type="button" hidden><span>Installer PISU 44 sur cet appareil</span></button></section>`)));
    const bi = $(".b-inst", app);
    if (bi && installer) { bi.hidden = false; bi.onclick = async () => { installer.prompt(); await installer.userChoice; installer = null; bi.hidden = true; }; }
    // à propos ; trois touchers rapides dessus ouvrent le menu caché des points à confirmer
    const ap = h("p", { class: "apropos" }, `Carnet de travail personnel, par William Friconneau, infirmier principal SPV. Le PDF « PISU 2024 » du SSSM 44 fait foi.`);
    const cache = h("section", { class: "bloc confirmer-menu", hidden: "" }, `<h2>À confirmer</h2><p class="petit">Écarts au PDF et incohérences relevés pendant la saisie, montrés tels quels.</p>`
      + Object.keys(P).filter(c => { const e = errataPour(c); return e.inc.length || e.cor.length; }).map(c => { const e = errataPour(c); return `<a class="ligne" href="#/p/${c}/confirmer"><span class="code ${classeCode(c)}">${estGen(c) ? "" : c}</span><span>${esc(P[c].titre)}</span><span class="pr-n">${e.inc.length + e.cor.length}</span></a>`; }).join("")
      + Object.keys(M).filter(c => { const e = errataPour(c); return e.inc.length || e.cor.length; }).map(c => { const e = errataPour(c); return `<a class="ligne" href="#/med/${c}/confirmer"><span class="code med">${c}</span><span>${esc(M[c].dci)}</span><span class="pr-n">${e.inc.length + e.cor.length}</span></a>`; }).join("")
      + `<a class="ligne" href="#/confirmer"><span>Points sans protocole précis</span></a>`);
    let n = 0, t0 = 0;
    ap.addEventListener("click", () => { const t = Date.now(); n = t - t0 < 600 ? n + 1 : 1; t0 = t; if (n >= 3) { cache.hidden = false; cache.scrollIntoView({ behavior: "smooth" }); } });
    try { if (sessionStorage.getItem("pisu44-confirmer")) cache.hidden = false; } catch (e) {}
    cache.addEventListener("click", () => { try { sessionStorage.setItem("pisu44-confirmer", "1"); } catch (e) {} });
    $(".contenu", app).append(ap, cache);
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
    const memos = window.PISU_MEMOS?.par_pisu?.[code] || [];
    if (memos.length) liste.push({ id: "memo", titre: "Mémo", rendre: z => z.appendChild(blocMemos(memos)) });
    // « À confirmer » n'apparaît plus dans les protocoles : on y accède par le menu caché de « Plus »
    if (partie === "confirmer" && (inc.length || cor.length)) liste.push({ id: "confirmer", titre: `À confirmer <small>${inc.length + cor.length}</small>`, rendre: z => z.appendChild(blocConfirmer(code)) });
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
      if (Object.values(DOSES).some(nds => Object.values(nds).some(l => l.some(inj => inj.m === code)))) {
        const cz = h("section", { class: "bloc calc-med", "data-tl": code });
        z.appendChild(cz); majTL(cz);
      }
      if ((VID[code] || []).length) z.appendChild(h("div", { class: "preps" }, `<h2>Préparation</h2>${VID[code].map(videoHtml).join("")}`));
      z.appendChild(fiche(m.fiche));
      const f = figureMed(code); if (f) z.appendChild(f);
    } }];
    if (partie === "confirmer" && (inc.length || cor.length)) liste.push({ id: "confirmer", titre: `À confirmer <small>${inc.length + cor.length}</small>`, rendre: z => z.appendChild(blocConfirmer(code)) });
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

  // ------------------------------------------------------------- la victime, toujours sous le pouce : toucher pour taper, maintenir et glisser pour régler
  const barre = h("div", { class: "vicbar", hidden: "" });
  document.body.appendChild(barre);
  const CHAMPS = { poids: { lab: "Poids", u: "kg", min: 1, max: 200, px: 7, pas: v => (v < 20 ? 0.5 : 1) }, age: { lab: "Âge", u: "ans", min: 0, max: 110, px: 9, pas: () => 1 } };
  const toast = txt => { const t = h("div", { class: "toast", role: "status" }, txt); document.body.appendChild(t); setTimeout(() => t.remove(), 3200); };
  // âge connu et protocole du mauvais public : on passe tout de suite au bon, et on le dit
  function bonPublic() {
    const r = decodeURIComponent(location.hash || ""), m = r.match(/^#\/p\/([1-9])([AE])(\/.*)?$/);
    if (!m || vic.age == null) return false;
    const veut = vic.age < 15 ? "E" : "A";
    if (m[2] === veut || !P[m[1] + veut]) return false;
    toast(veut === "E" ? `Passage au protocole pédiatrique : ${m[1]}E` : `Passage au protocole adulte : ${m[1]}A`);
    location.hash = `#/p/${m[1]}${veut}${m[3] && !/^\/[a-z]+\/.+/.test(m[3]) ? m[3] : "/logi"}`;
    return true;
  }
  function poserVic(cle, v) {
    const c = CHAMPS[cle]; if (v == null || isNaN(v)) return;
    v = Math.min(c.max, Math.max(c.min, Math.round(v / c.pas(v)) * c.pas(v)));
    vic[cle] = v; garderVic(); if (cle === "age") bonPublic();
  }
  function construireBarre() {
    barre.innerHTML = "";
    Object.entries(CHAMPS).forEach(([cle, c]) => {
      const b = h("div", { class: "vp", "data-k": cle, role: "spinbutton", "aria-label": c.lab, tabindex: "0" });
      const lab = h("span", { class: "vp-v" });
      const inp = h("input", { id: "vic-" + cle, class: "vp-in", type: "number", inputmode: "decimal", min: String(c.min), max: String(c.max), step: "any", "aria-label": `${c.lab} en ${c.u}` });
      b.append(lab, inp);
      let x0 = null, v0 = 0, glisse = false;
      b.addEventListener("pointerdown", e => { if (e.target === inp) return; x0 = e.clientX; v0 = vic[cle] ?? (cle === "poids" ? 70 : 40); glisse = false; b.setPointerCapture(e.pointerId); });
      b.addEventListener("pointermove", e => {
        if (x0 == null) return; const dx = e.clientX - x0;
        if (!glisse && Math.abs(dx) < 8) return;
        glisse = true; b.classList.add("glisse");
        poserVic(cle, v0 + Math.round(dx / c.px) * c.pas(v0));
      });
      const fin = () => { if (x0 == null) return; x0 = null; b.classList.remove("glisse"); if (!glisse) { b.classList.add("tape"); inp.value = vic[cle] ?? ""; inp.focus(); inp.select(); } };
      b.addEventListener("pointerup", fin); b.addEventListener("pointercancel", () => { x0 = null; b.classList.remove("glisse"); });
      inp.addEventListener("input", () => { if (inp.value !== "") { vic[cle] = null; poserVic(cle, +inp.value.replace(",", ".")); } });
      inp.addEventListener("keydown", e => { if (e.key === "Enter") inp.blur(); });
      inp.addEventListener("blur", () => b.classList.remove("tape"));
      barre.appendChild(b);
    });
    const raz = h("button", { type: "button", class: "vp-raz", "aria-label": "Nouvelle victime" }, "↺");
    raz.onclick = () => { if (!raz.classList.contains("sur")) { raz.classList.add("sur"); raz.textContent = "Effacer ?"; setTimeout(() => { raz.classList.remove("sur"); raz.textContent = "↺"; }, 3000); return; } raz.classList.remove("sur"); raz.textContent = "↺"; nouvelleIntervention(); garderVic(); };
    barre.appendChild(raz);
  }
  construireBarre();
  function majBarre() {
    barre.querySelectorAll(".vp").forEach(b => {
      const cle = b.dataset.k, c = CHAMPS[cle], v = vic[cle];
      $(".vp-v", b).innerHTML = v != null ? `<small>${c.lab}</small><b>${nb(v)}</b> ${c.u}` : `<small>${c.lab}</small><b>?</b>`;
      b.classList.toggle("vide", v == null);
    });
  }
  // ------------------------------------------------------------- bandeau « intervention en cours » : reprendre après une interruption
  const bInt = h("div", { class: "b-int", hidden: "" });
  document.querySelector(".barre").after(bInt);
  function majBandeauInt() {
    if (!enCours()) { bInt.hidden = true; veille(false); return; }
    const min = INT.debut ? Math.round((Date.now() - INT.debut) / 60e3) : 0;
    const ou = INT.ou && INT.ou.hash, code = ou && protoDe(ou);
    const ici = code && protoDe(decodeURIComponent(location.hash || "")) === code;
    bInt.hidden = false;
    bInt.innerHTML = `<span class="bi-pt" aria-hidden="true"></span><span class="bi-tx"><b>Intervention</b> ${min} min${vic.poids != null ? ` · ${nb(vic.poids)} kg` : ""}${vic.age != null ? ` · ${nb(vic.age)} ans` : ""}${INT.evts.length ? ` · ${INT.evts.length} acte${INT.evts.length > 1 ? "s" : ""}` : ""}</span>`
      + (code && !ici ? `<a class="b bi-go" href="${esc(ou)}">Reprendre ${esc(code)}</a>` : "") + `<a class="b bi-j" href="#/journal">Journal</a>`;
    const go = $(".bi-go", bInt); if (go) go.onclick = () => { repriseY = INT.ou.y || 0; };
    veille(true);
  }
  setInterval(() => { if (enCours()) majBandeauInt(); }, 30e3);
  // l'écran ne s'éteint pas pendant une intervention (si le navigateur le permet)
  let verrou = null;
  async function veille(on) {
    try {
      if (on && !verrou && "wakeLock" in navigator && document.visibilityState === "visible") { verrou = await navigator.wakeLock.request("screen"); verrou.addEventListener("release", () => (verrou = null)); }
      if (!on && verrou) { await verrou.release(); verrou = null; }
    } catch (e) {}
  }
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && enCours()) veille(true); });
  // dernier endroit consulté dans un protocole, pour y revenir
  let repriseY = null;
  window.addEventListener("scroll", () => { const r = decodeURIComponent(location.hash || ""); if (protoDe(r) && enCours()) { INT.ou = { hash: r, y: Math.round(scrollY) }; clearTimeout(window.__sv); window.__sv = setTimeout(sauverInt, 400); } }, { passive: true });
  function pageJournal() {
    document.title = "Journal · PISU 44";
    const l = INT.evts.slice().reverse();
    app.appendChild(h("div", { class: "contenu" }, `<h1 class="h-rub">Journal de l'intervention</h1>`
      + (INT.debut ? `<p class="petit">Début : ${heure(INT.debut)}${vic.poids != null ? ` · ${nb(vic.poids)} kg` : ""}${vic.age != null ? ` · ${nb(vic.age)} ans` : ""}. Gardé sur ce téléphone seulement, effacé après 6 h ou par « Nouvelle victime ».</p>` : `<p class="petit">Aucune intervention en cours.</p>`)
      + (l.length ? `<ol class="journal">${l.map(e => `<li><b>${heure(e.t)}</b> <a href="#/p/${esc(e.code)}/logi/${esc(e.id)}"><span class="code ${classeCode(e.code)}">${esc(e.code)}</span></a> ${esc(e.txt)}</li>`).join("")}</ol>` : "")
      + (enCours() ? `<button type="button" class="ligne j-raz"><span>Nouvelle victime : tout effacer</span></button>` : "")));
    const rz = $(".j-raz", app); if (rz) rz.onclick = () => { if (!rz.classList.contains("sur")) { rz.classList.add("sur"); $("span", rz).textContent = "Toucher encore pour tout effacer"; return; } nouvelleIntervention(); route(); };
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
    if (/^#\/(plus|reste|c\/|confirmer|memo|journal)/.test(r)) return "plus";
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
    else if (r === "#/journal") pageJournal();
    else if ((m = r.match(/^#\/memo\/([a-z0-9-]+)$/)) && (window.PISU_MEMOS?.general || []).some(x => x.id === m[1])) pageMemo(m[1]);
    else if (r === "#/medicaments") pageMedicaments();
    else if (r === "#/techniques") pageTechniques();
    else if (/^#\/(plus|reste)$/.test(r)) pagePlus();
    else pageProtocoles((r.match(/^#\/(adultes|enfants)$/) || [])[1]);
    if (repriseY != null) { const y = repriseY; repriseY = null; requestAnimationFrame(() => window.scrollTo(0, y)); }
    majBandeauInt();
    const pc = protoDe(r), avecVic = (pc && !estGen(pc)) || /^#\/med\//.test(r);
    barre.hidden = !avecVic; document.body.classList.toggle("avec-vic", avecVic); majBarre();
    document.body.classList.toggle("peds", /^[1-9]E$/.test(pc || "") || r === "#/enfants");
    bonPublic();
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
  window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); installer = e; if (rubrique(decodeURIComponent(location.hash || "#/")) === "protocoles" && !/^#\/p\//.test(location.hash)) route(); });
  // le manifeste d'installation seulement sur le web (en fichier local, Chrome le refuse et le signale en erreur)
  if (/^https?:$/.test(location.protocol)) document.head.appendChild(h("link", { rel: "manifest", href: "app.webmanifest" }));
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
    else { finir("Rechargement depuis le réseau…"); setTimeout(() => location.reload(), 500); }
  });
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
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

  // ------------------------------------------------------------- premier lancement : avertissement à accepter, puis la préface du PISU
  const ACCORD = "pisu44-accord-1";
  function premierLancement() {
    try { if (localStorage.getItem(ACCORD)) return; } catch (e) { return; }
    const pre = P["00-preface"];
    const d = h("div", { class: "accord", role: "dialog", "aria-modal": "true", "aria-label": "Avant d'utiliser PISU 44" },
      `<div class="ac-c"><img src="images/logo_sdis44.png" alt="" class="ac-logo"><h1>Avant d'utiliser PISU 44</h1>
      <ul class="ac-l">
        <li><b>Prototype personnel</b>, pas un outil du SDIS 44. Il peut contenir des erreurs.</li>
        <li><b>La seule source qui fait foi</b> : le carnet PISU remis ou envoyé officiellement par le SDIS 44.</li>
        <li>Doses et volumes calculés ici : <b>toujours vérifier</b> avec le carnet officiel avant d'injecter.</li>
        <li>Les fiches techniques sont des copies de documents du SDIS ; la version en vigueur est celle de la GED.</li>
        <li>Rien de ce qui est saisi (poids, âge, heures) ne quitte ce téléphone.</li>
      </ul>
      <button type="button" class="b ac-ok">J'ai lu, j'accepte</button>
      ${pre ? `<details class="ac-pre"><summary>Préface du PISU</summary><div class="fiche">${pre.fiche}</div></details>` : ""}</div>`);
    $(".ac-ok", d).onclick = () => {
      try { localStorage.setItem(ACCORD, new Date().toISOString()); } catch (e) {}
      if (pre) { d.querySelector(".ac-l").remove(); $(".ac-ok", d).remove(); $("h1", d).textContent = "Préface du PISU"; const det = $(".ac-pre", d); det.open = true; $("summary", det).remove();
        const k = h("button", { type: "button", class: "b ac-ok" }, "Commencer"); k.onclick = () => d.remove(); d.querySelector(".ac-c").append(k); d.scrollTop = 0; }
      else d.remove();
    };
    document.body.appendChild(d);
  }
  route();
  premierLancement();
  passe();
})();
