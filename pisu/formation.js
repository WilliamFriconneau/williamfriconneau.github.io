/* Mode formation : séparé de l'intervention (page #/formation). Cas concrets (données fictives, conduite lue dans
   le logigramme du PISU), entraînements, suivi local dans le navigateur (aucune donnée envoyée). */
(() => {
  const P = window.PISU_PAGES || {}, M = window.PISU_MEDS || {}, PREP = window.PISU_PREP || {}, CAS = window.PISU_CAS || [], PH = window.PISU_PHARMACO || {};
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const h = (tag, attrs = {}, html) => { const e = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); if (html !== undefined) e.innerHTML = html; return e; };
  const melange = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const nb = v => String(Math.round(v * 100) / 100).replace(".", ",");
  // suivi local
  const SUIVI = "pisu-formation";
  const lire = () => { try { return JSON.parse(localStorage.getItem(SUIVI) || "{}"); } catch (e) { return {}; } };
  const noter = (cle, ok, erreur) => { const s = lire(); const r = s[cle] = s[cle] || { fait: 0, juste: 0, erreurs: {} }; r.fait++; if (ok) r.juste++; else if (erreur) r.erreurs[erreur] = (r.erreurs[erreur] || 0) + 1; try { localStorage.setItem(SUIVI, JSON.stringify(s)); } catch (e) {} };

  function page(app) {
    app.appendChild(h("div", { class: "form-bandeau" }, `<b>Mode formation</b> · séparé de l'intervention. Les cas sont fictifs ; la conduite à tenir est lue dans le PISU 2024.`));
    const onglets = [["cas", "Cas concrets"], ["dose", "Calcul de volume"], ["ordre", "Remettre en ordre"], ["materiel", "Seringue et aiguille"], ["sites", "Sites IM et IO"], ["saed", "Message Saed"], ["quiz", "Quiz des fiches"], ["suivi", "Mon suivi"]];
    const bar = h("div", { class: "tabs sous-tabs", role: "tablist" }), zone = h("div", { class: "proto" });
    app.append(bar, zone);
    const aller = id => { [...bar.children].forEach(b => b.setAttribute("aria-selected", b.dataset.id === id)); zone.textContent = ""; ({ cas, dose, ordre, materiel, sites, saed, quiz, suivi })[id](zone); };
    onglets.forEach(([id, t]) => { const b = h("button", { class: "tab", role: "tab", "data-id": id, type: "button" }, t); b.onclick = () => aller(id); bar.appendChild(b); });
    aller("cas");
  }

  // ---------------------------------------------------------------- cas concrets
  function cas(z) {
    const g = h("div", { class: "grille" });
    CAS.forEach((c, i) => { const s = lire()["cas-" + c.code]; const a = h("button", { class: "carte cas-c", type: "button" }, `<div class="pb">${esc(c.code)} · ${s ? `${s.juste}/${s.fait} réussi` : "à faire"}</div><h3>${esc(c.titre)}</h3><p>${esc(c.recit.slice(0, 90))}…</p>`); a.onclick = () => jouerCas(z, c); g.appendChild(a); });
    z.appendChild(g);
  }
  function jouerCas(z, c) {
    z.textContent = "";
    const L = P[c.code].logi, byId = Object.fromEntries(L.nodes.map(n => [n.id, n])), out = id => L.edges.filter(e => e.s === id);
    const txt = n => (n.txt || "").replace(/\n+/g, " ").replace(/\s+/g, " ");
    z.appendChild(h("p", { class: "note" }, `<button class="b" type="button" id="retcas">◀ Tous les cas</button>`));
    z.querySelector("#retcas").onclick = () => { z.textContent = ""; cas(z); };
    z.appendChild(h("div", { class: "recit" }, `<span class="code">${esc(c.code)}</span><b>${esc(c.titre)}</b><p>${esc(c.recit)}</p><p class="note">Données cliniques fictives. Protocole : ${esc(P[c.code].titre)}.</p>`));
    const fil = h("div", { class: "cas-fil" }); z.appendChild(fil);
    let id = L.start, justes = 0, total = 0, garde = 0;
    const suite = () => {
      while (garde++ < 60) {
        const n = byId[id], es = out(id);
        if (n.k !== "question") {
          if (n.k !== "titre") fil.appendChild(h("div", { class: "cas-pas" }, `<small>PISU</small> ${esc(n.k === "appel" ? "Appel CRRA 15" : txt(n))}`));
          if (!es.length) { fin(); return; }
          id = es[0].t; continue;
        }
        const r = c.reponses[id];
        const q = h("div", { class: "cas-q" }, `${r ? `<p class="fait">${esc(r.fait)}</p>` : ""}<p class="question">${esc(txt(n))}</p>`);
        const bz = h("div", { class: "choix-btns" });
        es.forEach(e => { const b = h("button", { class: "b grand " + (/OUI/.test(e.label) ? "oui" : "non"), type: "button" }, esc(e.label)); b.onclick = () => repondre(e, q, bz, r, es); bz.appendChild(b); });
        q.appendChild(bz); fil.appendChild(q); q.scrollIntoView({ block: "nearest" });
        return;
      }
    };
    const repondre = (e, q, bz, r, es) => {
      bz.remove(); total++;
      const bonne = es.find(x => r && x.label === r.rep) || e, ok = bonne === e;
      if (ok) justes++;
      noter("cas-" + c.code, ok, ok ? null : txt(byId[id]));
      const expl = es.map(x => `si ${x.label} : « ${esc(txt(byId[x.t]))} »`).join(" ; ");
      q.appendChild(h("p", { class: ok ? "retour ok" : "retour ko" }, `${ok ? "Bonne branche." : `Pas cette branche : la bonne réponse est ${bonne.label}.`} Le logigramme du PISU dit : ${expl}.`));
      id = bonne.t; suite();
    };
    const fin = () => fil.appendChild(h("div", { class: "cas-fin" }, `<b>Fin du cas : ${justes}/${total} bonne${justes > 1 ? "s" : ""} décision${total > 1 ? "s" : ""}.</b>`));
    suite();
  }

  // ---------------------------------------------------------------- calcul de volume, avec la jauge
  const EXOS = [
    { m: "M3", v: 0, dose: 1, txt: "ACR adulte (1A) : 1 mg d'adrénaline IVD." },
    { m: "M7", v: 0, dose: 3, txt: "Antalgie (8A), 80 kg, 40 ans : chlorhydrate de morphine 3 mg IVL." },
    { m: "M7", v: 0, dose: 2, txt: "Antalgie (8A), 55 kg : chlorhydrate de morphine 2 mg IVL." },
    { m: "M8", v: 0, dose: 1, txt: "Convulsions (5A) : clonazépam 1 mg." },
    { m: "M9", v: 0, dose: 6, txt: "Hypoglycémie (9A) : G30 % 6 g IVL." },
    { m: "M3", v: 1, dose: 0.01 * 20, txt: "ACR enfant (1E), poids fictif 20 kg : adrénaline 0,01 mg/kg." },
    { m: "M3", v: 2, dose: 0.01 * 30, txt: "Anaphylaxie (4E), poids fictif 30 kg : adrénaline IM 0,01 mg/kg (max 0,5 mg)." },
    { m: "M7", v: 1, dose: 0.05 * 30, txt: "Antalgie enfant (8E), poids fictif 30 kg : morphine 0,05 mg/kg." },
  ];
  function dose(z) {
    const ex = EXOS[Math.floor(Math.random() * EXOS.length)];
    const pr = PREP[ex.m].variantes[ex.v].prod, bon = ex.dose / pr.conc;
    z.appendChild(h("p", { class: "consigne" }, `${esc(ex.txt)} Seringue préparée : <b>${esc(pr.nom)} ${nb(pr.conc)} ${pr.u}/ml</b> (fiche ${ex.m}). Placez le piston sur le volume à injecter.`));
    const jz = h("div"); z.appendChild(jz);
    const def = { nom: "exercice", objets: { s: { f: ["seringue", pr.cap, { liq: pr.liq }], x: 320, y: 330 } }, etapes: [{ t: "Exercice", a: [["pause", 1]] }] };
    window.PISU_SCENES.lecteur(jz, def, { compact: true, auto: false });
    const r = h("input", { type: "range", min: 0, max: pr.cap, step: pr.cap <= 2 ? 0.05 : pr.cap <= 10 ? 0.1 : 0.5, value: 0, class: "frise-range", "aria-label": "Volume dans la seringue" }); z.appendChild(r);
    const lab = h("p", { class: "consigne" }, "0 ml"); z.appendChild(lab);
    const sy = () => Object.values(jz.__etat().objs).find(o => o.cap);
    r.addEventListener("input", () => { const s = sy(); s.vol = +r.value; s.maj(); lab.textContent = `${nb(+r.value)} ml`; });
    const bv = h("button", { class: "b grand go", type: "button" }, "Vérifier"); z.appendChild(bv);
    const res = h("p"); z.appendChild(res);
    bv.onclick = () => { const v = +r.value, ok = Math.abs(v - bon) < 0.051; noter("dose", ok, ok ? null : ex.txt); res.className = ok ? "retour ok" : "retour ko"; res.textContent = ok ? `Juste : ${nb(bon)} ml.` : `Non : ${nb(ex.dose)} ${pr.u} à ${nb(pr.conc)} ${pr.u}/ml = ${nb(bon)} ml.`; };
    const bn = h("button", { class: "b", type: "button" }, "Autre exercice"); bn.onclick = () => { z.textContent = ""; dose(z); }; z.appendChild(bn);
  }

  // ---------------------------------------------------------------- remettre en ordre les étapes d'une préparation
  function ordre(z) {
    const meds = Object.keys(PREP).filter(m => PREP[m].variantes.some(v => v.etapes.length >= 5));
    const m = meds[Math.floor(Math.random() * meds.length)], v = PREP[m].variantes.find(x => x.etapes.length >= 5);
    const vraies = v.etapes.map(e => e.t.replace(/<[^>]+>/g, ""));
    z.appendChild(h("p", { class: "consigne" }, `${m} ${esc(M[m].dci)} · ${esc(v.nom)} : touchez les étapes dans l'ordre.`));
    const choix = h("div", { class: "ordre" }), rep = h("ol", { class: "etapes" });
    z.append(choix, rep);
    let k = 0, err = 0;
    melange(vraies.map((t, i) => ({ t, i }))).forEach(({ t, i }) => {
      const b = h("button", { class: "b ordre-b", type: "button" }, esc(t));
      b.onclick = () => {
        if (i === k) { k++; b.remove(); rep.appendChild(h("li", { class: "fait" }, esc(t))); if (k === vraies.length) { noter("ordre", err === 0, err ? m : null); z.appendChild(h("p", { class: "retour ok" }, `Terminé${err ? ` avec ${err} erreur${err > 1 ? "s" : ""}` : " sans erreur"}. Source : PISU 2024, ${esc(v.src)}.`)); } }
        else { err++; b.classList.add("faux"); setTimeout(() => b.classList.remove("faux"), 600); }
      };
      choix.appendChild(b);
    });
    const bn = h("button", { class: "b", type: "button" }, "Autre préparation"); bn.onclick = () => { z.textContent = ""; ordre(z); }; z.appendChild(bn);
  }

  // ---------------------------------------------------------------- quiz des fiches (PISU et RCP)
  function questions() {
    const q = [];
    Object.entries(PREP).forEach(([m, p]) => p.variantes.forEach(v => { const r = (v.resultat || [])[0]; if (r && /Concentration/.test(r[0])) q.push({ q: `${m} ${M[m].dci}, ${v.nom} : concentration obtenue ?`, bon: r[1], src: `PISU 2024, ${v.src}`, famille: "conc" }); }));
    Object.entries(PH).forEach(([m, r]) => { if (r.delai && r.delai.val && !/non précisé/.test(r.delai.val)) q.push({ q: `${m} ${M[m].dci} : délai d'action selon le RCP ?`, bon: r.delai.val, src: `RCP ${r.specialite || ""}${r.date ? ", " + r.date : ""}`, famille: "delai" }); });
    return q;
  }
  function quiz(z) {
    const Q = questions(); if (!Q.length) { z.appendChild(h("p", {}, "Pas de question disponible.")); return; }
    const x = Q[Math.floor(Math.random() * Q.length)];
    const autres = melange(Q.filter(y => y.famille === x.famille && y.bon !== x.bon).map(y => y.bon)).filter((v, i, a) => a.indexOf(v) === i).slice(0, 3);
    z.appendChild(h("p", { class: "consigne" }, esc(x.q)));
    const bz = h("div", { class: "quiz" }); z.appendChild(bz);
    const res = h("p"); z.appendChild(res);
    melange([x.bon, ...autres]).forEach(v => { const b = h("button", { class: "b quiz-b", type: "button" }, esc(v)); b.onclick = () => { const ok = v === x.bon; noter("quiz", ok, ok ? null : x.q); res.className = ok ? "retour ok" : "retour ko"; res.textContent = `${ok ? "Juste." : `Non : ${x.bon}.`} Source : ${x.src}.`; bz.querySelectorAll("button").forEach(c => c.disabled = true); }; bz.appendChild(b); });
    const bn = h("button", { class: "b", type: "button" }, "Autre question"); bn.onclick = () => { z.textContent = ""; quiz(z); }; z.appendChild(bn);
  }

  // ---------------------------------------------------------------- seringue et aiguille
  // La taille de seringue n'est pas dans le PISU : la bonne réponse est la plus petite seringue qui contient le volume final de la fiche.
  // L'aiguille de prélèvement 18G a l'embase rose (ISO 6009:2016, tableau 1).
  function materiel(z) {
    const v = melange(Object.entries(PREP).flatMap(([m, p]) => p.variantes.filter(x => x.prod).map(x => ({ m, x }))))[0];
    const vol = v.x.prod.vol, tailles = [1, 2, 5, 10, 20], bon = tailles.find(t => t >= vol);
    z.appendChild(h("p", { class: "consigne" }, `${v.m} ${esc(M[v.m].dci)} · ${esc(v.x.nom)} : volume final ${nb(vol)} ml (fiche). Quelle seringue, au plus juste ?`));
    const res = h("p");
    const bz = h("div", { class: "quiz" });
    tailles.forEach(t => { const b = h("button", { class: "b quiz-b", type: "button" }, `Seringue de ${t} ml`); b.onclick = () => { const ok = t === bon; noter("seringue", ok, ok ? null : `${v.m} ${vol} ml`); res.className = ok ? "retour ok" : "retour ko"; res.textContent = ok ? "Juste." : `Non : ${bon} ml est la plus petite qui contient ${nb(vol)} ml. Le PISU ne précise pas la taille.`; }; bz.appendChild(b); });
    z.append(bz, res);
    z.appendChild(h("p", { class: "consigne" }, "Couleur de l'embase de l'aiguille de prélèvement 18G (trocart) ?"));
    const res2 = h("p"), bz2 = h("div", { class: "quiz" });
    melange(["rose", "verte", "jaune", "bleue"]).forEach(c => { const b = h("button", { class: "b quiz-b", type: "button" }, c); b.onclick = () => { const ok = c === "rose"; noter("aiguille", ok, ok ? null : c); res2.className = ok ? "retour ok" : "retour ko"; res2.textContent = `${ok ? "Juste" : "Non : rose"}. Source : ISO 6009:2016, tableau 1 (« 1,2 18 Pink »).`; }; bz2.appendChild(b); });
    z.append(bz2, res2);
    const bn = h("button", { class: "b", type: "button" }, "Autre préparation"); bn.onclick = () => { z.textContent = ""; materiel(z); }; z.appendChild(bn);
  }

  // ---------------------------------------------------------------- sites IM et IO : toucher le bon site
  function sites(z) {
    const exos = [
      { titre: "Adrénaline IM (anaphylaxie) : touchez le site recommandé.", src: "SFMU 2016, RFE anaphylaxie : « face latéroexterne du tiers moyen de la cuisse ».", svg: `<svg viewBox="0 0 400 160" class="site-svg"><path d="M20 50 Q200 30 330 50 Q370 60 372 80 Q370 100 330 110 Q200 130 20 110 Z" fill="var(--peau)" stroke="var(--peau-line)" stroke-width="2"/><ellipse cx="372" cy="80" rx="18" ry="26" fill="var(--peau)" stroke="var(--peau-line)"/><text x="25" y="40" font-size="12" fill="var(--muted)">hanche</text><text x="360" y="125" font-size="12" fill="var(--muted)">genou</text></svg>`,
        zones: [{ id: "bon", x: 46, y: 40, l: "tiers moyen, face latéro-externe" }, { id: "genou", x: 82, y: 50, l: "près du genou" }, { id: "haut", x: 14, y: 40, l: "racine de cuisse" }] },
      { titre: "EZ-IO, adulte, tibia proximal : touchez le site décrit par le fabricant.", src: "Teleflex, procedure template (document du fabricant) : « approximately 2 cm medial to the tibial tuberosity ».", svg: `<svg viewBox="0 0 400 160" class="site-svg"><path d="M40 60 Q200 48 350 64 L360 66 Q372 80 360 100 L350 102 Q200 114 40 102 Z" fill="var(--peau)" stroke="var(--peau-line)" stroke-width="2"/><ellipse cx="44" cy="81" rx="24" ry="34" fill="var(--peau)" stroke="var(--peau-line)"/><ellipse cx="86" cy="88" rx="10" ry="7" fill="none" stroke="var(--peau-line)" stroke-width="2"/><text x="30" y="40" font-size="12" fill="var(--muted)">rotule</text><text x="70" y="128" font-size="12" fill="var(--muted)">tubérosité tibiale</text><text x="330" y="128" font-size="12" fill="var(--muted)">cheville</text></svg>`,
        zones: [{ id: "bon", x: 27, y: 46, l: "≈ 2 cm en dedans de la tubérosité" }, { id: "rotule", x: 11, y: 50, l: "sur la rotule" }, { id: "milieu", x: 55, y: 50, l: "milieu de la jambe" }] },
    ];
    const ex = exos[Math.floor(Math.random() * exos.length)];
    z.appendChild(h("p", { class: "consigne" }, esc(ex.titre)));
    const box = h("div", { class: "site-box" }, ex.svg); z.appendChild(box);
    const res = h("p");
    melange(ex.zones).forEach(zn => { const b = h("button", { class: "b site-pt", type: "button", style: `left:${zn.x}%;top:${zn.y}%`, "aria-label": zn.l }, "+"); b.onclick = () => { const ok = zn.id === "bon"; noter("sites", ok, ok ? null : zn.l); res.className = ok ? "retour ok" : "retour ko"; res.textContent = `${ok ? "Juste" : `Non (${zn.l})`}. ${ex.src}`; }; box.appendChild(b); });
    z.appendChild(res);
    const bn = h("button", { class: "b", type: "button" }, "Autre site"); bn.onclick = () => { z.textContent = ""; sites(z); }; z.appendChild(bn);
  }

  // ---------------------------------------------------------------- message Saed à compléter à partir d'un cas
  function saed(z) {
    const c = CAS[Math.floor(Math.random() * CAS.length)], L = P[c.code].logi, N = Object.fromEntries(L.nodes.map(n => [n.id, n]));
    const items = [
      { t: (N[L.start].txt || "").replace(/\n+/g, " · "), bon: "S" },
      { t: "Antécédents et traitements habituels : ___", bon: "A" },
      ...Object.values(c.reponses).slice(0, 2).map(r => ({ t: r.fait, bon: "E" })),
      { t: (L.nodes.find(n => n.k === "orientation") || { txt: "Orientation selon CRRA 15" }).txt.replace(/\n+/g, " "), bon: "D" },
    ];
    z.appendChild(h("p", { class: "consigne" }, `Cas « ${esc(c.titre)} » (${esc(c.code)}, données fictives) : rangez chaque élément dans le message Saed au CRRA 15.`));
    const res = h("p"); let fautes = 0, faits = 0;
    melange(items).forEach(it => {
      const l = h("div", { class: "saed-l" }, `<span>${esc(it.t)}</span>`); const bz = h("div", { class: "bl-b" });
      ["S", "A", "E", "D"].forEach(k => { const b = h("button", { class: "b mini", type: "button" }, k); b.onclick = () => { if (l.dataset.ok) return; if (k === it.bon) { b.classList.add("actif"); l.dataset.ok = 1; faits++; if (faits === items.length) { noter("saed", fautes === 0, fautes ? c.code : null); res.className = "retour ok"; res.textContent = `Message complet${fautes ? ` (${fautes} erreur${fautes > 1 ? "s" : ""})` : ""}. Structure : HAS, guide Saed, octobre 2014.`; } } else { fautes++; b.classList.add("faux"); } }; bz.appendChild(b); });
      l.appendChild(bz); z.appendChild(l);
    });
    z.appendChild(res);
    const bn = h("button", { class: "b", type: "button" }, "Autre cas"); bn.onclick = () => { z.textContent = ""; saed(z); }; z.appendChild(bn);
  }

  // ---------------------------------------------------------------- suivi
  function suivi(z) {
    const s = lire(), lignes = Object.entries(s);
    if (!lignes.length) { z.appendChild(h("p", { class: "vide" }, "Rien de fait pour l'instant. Le suivi reste dans ce navigateur.")); return; }
    z.appendChild(h("table", { class: "tab-mat" }, `<tr><th>Exercice</th><th>Fait</th><th>Réussi</th><th>Erreurs fréquentes</th></tr>${lignes.map(([k, r]) => `<tr><td>${esc(k)}</td><td>${r.fait}</td><td>${r.juste}</td><td>${Object.entries(r.erreurs).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t, n]) => `${esc(t.slice(0, 60))} (${n})`).join("<br>")}</td></tr>`).join("")}`));
    const b = h("button", { class: "b", type: "button" }, "Effacer mon suivi"); b.onclick = () => { if (confirm("Effacer le suivi de formation de ce navigateur ?")) { try { localStorage.removeItem(SUIVI); } catch (e) {} z.textContent = ""; suivi(z); } }; z.appendChild(b);
    z.appendChild(h("p", { class: "note" }, "Le suivi reste dans ce navigateur : aucun compte, aucun envoi."));
  }

  window.PISU_FORMATION = { page };
})();
