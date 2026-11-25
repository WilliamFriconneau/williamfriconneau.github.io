/* Carnet PISU : scènes animées (préparations et gestes). SVG pur, sans bibliothèque. */
(() => {
  const NS = "http://www.w3.org/2000/svg";
  const W = 640, H = 470;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const reduit = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  function el(tag, attrs = {}, parent) {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null) e.setAttribute(k, v);
    if (parent) parent.appendChild(e);
    return e;
  }
  function txt(s, attrs, parent) { const t = el("text", attrs, parent); t.textContent = s; return t; }
  function lignes(s, attrs, parent, dy = 1.15) {
    const t = el("text", attrs, parent);
    String(s).split("\n").forEach((l, i) => { const ts = el("tspan", { x: attrs.x || 0, dy: i ? `${dy}em` : 0 }, t); ts.textContent = l; });
    return t;
  }

  // ------------------------------------------------------------- moteur
  let audio = null;
  const sonActif = () => { try { return localStorage.getItem("pisu-son") === "1"; } catch (e) { return false; } };
  function son(mot) {
    if (!sonActif() || mouvementReduitTot()) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const t = audio.currentTime, o = audio.createOscillator(), g = audio.createGain();
      const bruit = /PSS|CLAC/.test(mot);
      o.type = bruit ? "sawtooth" : /BIP/.test(mot) ? "sine" : "square";
      o.frequency.setValueAtTime(/BIP/.test(mot) ? 1000 : /TAP/.test(mot) ? 300 : bruit ? 160 : 900, t);
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.08, t + .005); g.gain.exponentialRampToValueAtTime(.0001, t + (bruit ? .25 : .06));
      o.connect(g).connect(audio.destination); o.start(t); o.stop(t + (bruit ? .26 : .08));
    } catch (e) {}
  }
  const mouvementReduitTot = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const DEFS = `<linearGradient id="g-verre" x1="0" x2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".95"/><stop offset=".25" stop-color="#eef6f9" stop-opacity=".9"/><stop offset=".8" stop-color="#dbe9ef" stop-opacity=".9"/><stop offset="1" stop-color="#c6d9e1" stop-opacity=".95"/></linearGradient>
    <linearGradient id="g-plast" x1="0" x2="1"><stop offset="0" stop-color="#fbfdfe"/><stop offset=".7" stop-color="#eef4f7"/><stop offset="1" stop-color="#dde7ec"/></linearGradient>
    <linearGradient id="g-acier" x1="0" x2="1"><stop offset="0" stop-color="#8d979d"/><stop offset=".45" stop-color="#eef2f4"/><stop offset="1" stop-color="#7a848a"/></linearGradient>
    <linearGradient id="g-tige" x1="0" x2="1"><stop offset="0" stop-color="#eceff1"/><stop offset=".6" stop-color="#d4d9dc"/><stop offset="1" stop-color="#b9c0c4"/></linearGradient>`;

  function moteur(svg) {
    const S = { objs: {}, vitesse: 1 };
    const tween = (ms, f) => {
      const d = ms * S.vitesse;
      if (d <= 0 || reduit()) { f(1); return Promise.resolve(); }
      return new Promise(res => {
        const t0 = performance.now();
        const pas = now => { const t = Math.min(1, (now - t0) / d); f(ease(t)); if (t < 1) requestAnimationFrame(pas); else res(); };
        requestAnimationFrame(pas);
      });
    };
    const attente = ms => (S.vitesse && !reduit() ? sleep(ms * S.vitesse) : Promise.resolve());
    if (!svg.querySelector("defs")) el("defs", {}, svg).innerHTML = DEFS;
    const couches = { fond: el("g", {}, svg), objets: el("g", {}, svg), dessus: el("g", {}, svg) };

    function objet(id, o) {
      o.id = id; o.x = o.x || 0; o.y = o.y || 0; o.r = o.r || 0; o.s = o.s || 1; o.op = o.op ?? 1;
      o.g = el("g", {}, o.fond ? couches.fond : couches.objets);
      o.E = api;
      o.place = () => { o.g.setAttribute("transform", `translate(${o.x} ${o.y}) rotate(${o.r}) scale(${o.s})`); o.g.style.opacity = o.op * (o.vis ?? 1); if (o.apresPlace) o.apresPlace(); };
      o.dessiner(o.g, S);
      o.place();
      S.objs[id] = o;
      return o;
    }
    async function bouger(o, x, y, r = o.r, ms = 650, s = o.s) {
      const [x0, y0, r0, s0] = [o.x, o.y, o.r, o.s];
      if (S.avantMouv) await S.avantMouv(o, x, y, r, s);
      await tween(ms, t => { o.x = x0 + (x - x0) * t; o.y = y0 + (y - y0) * t; o.r = r0 + (r - r0) * t; o.s = s0 + (s - s0) * t; o.place(); });
    }
    // onomatopées : petits traits autour d'un mot rouge, trois au plus à l'écran (comme les « CLIC » des boîtes à morphine)
    const pile = [];
    function bulle(x, y, texte = "CLIC") {
      if (!S.vitesse) return;
      if (S.vb) { const [vx, vy, vw, vh] = S.vb, m = 46; x = Math.max(vx + m, Math.min(vx + vw - m, x)); y = Math.max(vy + m, Math.min(vy + vh - 20, y)); }
      son(texte);
      for (let k = 0; k < 4 && pile.some(b => Math.abs(b.__x - x) < 70 && Math.abs(b.__y - y) < 40); k++) y -= 42;
      // ne pas recouvrir un texte de la scène (graduations, étiquettes) : on décale la bulle
      try {
        const M = svg.getScreenCTM(), pt = svg.createSVGPoint();
        const ecran = (px, py) => { pt.x = px; pt.y = py; const q = pt.matrixTransform(M); return [q.x, q.y]; };
        const txts = [...svg.querySelectorAll("text")].filter(t => !couches.dessus.contains(t) && t.textContent.trim() && getComputedStyle(t).opacity !== "0" && !t.closest("[style*='opacity: 0']")).map(t => t.getBoundingClientRect()).filter(r => r.width);
        const touche = (px, py) => { const [ax, ay] = ecran(px - 34, py - 40), [bx, by] = ecran(px + 34, py + 22); return txts.some(r => r.left < bx && r.right > ax && r.top < by && r.bottom > ay); };
        const borne = (px, py) => { if (!S.vb) return [px, py]; const [vx, vy, vw, vh] = S.vb, m = 46; return [Math.max(vx + m, Math.min(vx + vw - m, px)), Math.max(vy + m, Math.min(vy + vh - 20, py))]; };
        const essais = [];
        for (const r of [0, 50, 90, 130, 180]) for (const a of [0, -90, 90, -45, 45, 180, -135, 135]) { essais.push(borne(x + r * Math.cos(a * Math.PI / 180), y + r * Math.sin(a * Math.PI / 180))); if (!r) break; }
        const bon = essais.find(([px, py]) => !touche(px, py) && !pile.some(b => Math.abs(b.__x - px) < 70 && Math.abs(b.__y - py) < 40));
        if (bon) [x, y] = bon;
      } catch (e) {}
      const g = el("g", { transform: `translate(${x} ${y}) scale(.4)` }, couches.dessus);
      g.__x = x; g.__y = y;
      for (let k = 0; k < 8; k++) {
        const a = k * Math.PI / 4;
        el("line", { x1: 12 * Math.cos(a), y1: 12 * Math.sin(a) - 16, x2: 21 * Math.cos(a), y2: 21 * Math.sin(a) - 16, stroke: "#a8191a", "stroke-width": 3, "stroke-linecap": "round" }, g);
      }
      txt(texte, { y: 16, "text-anchor": "middle", "font-size": 20, "font-weight": 900, fill: "#a8191a", "paint-order": "stroke", stroke: "var(--soft)", "stroke-width": 4 }, g);
      g.style.transition = "transform .18s ease-out, opacity .45s ease";
      requestAnimationFrame(() => requestAnimationFrame(() => g.setAttribute("transform", `translate(${x} ${y}) scale(1)`)));
      pile.push(g); while (pile.length > 3) pile.shift().remove();
      setTimeout(() => { g.style.opacity = 0; setTimeout(() => { g.remove(); const i = pile.indexOf(g); if (i >= 0) pile.splice(i, 1); }, 470); }, 750);
    }
    // mot d'étape affiché en haut de la scène pendant la phase (calque HTML, hors du zoom de la caméra)
    function phase(mot) { if (S.onPhase) S.onPhase(mot); }
    // phrase dite à voix haute à l'équipe (calque HTML du lecteur, hors du zoom)
    function annonce(t) { if (S.onAnnonce) S.onAnnonce(t); }
    const api = { S, svg, el, txt, couches, objet, bouger, tween, attente, bulle, phase, annonce };
    return api;
  }

  // ------------------------------------------------------------- objets
  const COUL = { morphine: "#d4ecf7", clair: "#e4f2f8", jaune: "#f6e7a8", rose: "#f7c9d4", rouge: "#d63b3b", g30: "#f4ecc8", violet: "#c8a5e8" };

  const fmt = v => (Math.round(v * 100) / 100).toString().replace(".", ",");
  // volume lu en direct : au dixième dès 1 ml (graduations de 0,2 ml au mieux), au centième en dessous (seringue de 1 ml)
  const fmtV = v => fmt(v >= 0.95 ? Math.round(v * 10) / 10 : v);
  // Modèles réels (photos de référence 5, 10 et 20 ml Luer-lock ; fiches fabricants pour 1 et 2 ml).
  // bw, lh : diamètre du corps et longueur graduée du volume nominal, en px à l'échelle 3,2 px/mm ;
  // max : longueur du corps (en ml) ; grad : dernière graduation = volume nominal (le corps dépasse un peu) ; pas : [petit trait, chiffre].
  const K = 1.6;
  // Une seule échelle pour toutes les scènes : 1 mm réel = K unités SVG.
  // Seringues : longueur graduée minimale ISO 7886-1:1993 (tableau 1) et pas des fiches B. Braun (catalogue 12/2023),
  // Terumo et BD Plastipak ; diamètres d'après un tableau de diamètres intérieurs BD/Terumo (source faible) + paroi.
  // Les longueurs exactes ne sont publiées par aucun fabricant : valeurs approchées, proportions conservées.
  const MODELES = {
    1: { d: 6.8, l: 57, max: 1, pas: [0.01, 0.1] },
    2: { d: 9.2, l: 35, max: 3, grad: 2, pas: [0.1, 0.5] },
    5: { d: 13.6, l: 45, max: 6, grad: 5, pas: [0.2, 1] },
    10: { d: 16.6, l: 55, max: 12, grad: 10, pas: [0.2, 1] },
    20: { d: 21.2, l: 65, max: 20, pas: [1, 5] },
  };
  Object.values(MODELES).forEach(m => { m.bw = m.d * K; m.lh = m.l * K; });
  // Rapports mesurés sur les photos de référence, en diamètres D du corps.
  const RAP = { luer: .83, joint: .31, ailettes: 1.9, ailEp: .13, tigeVide: 1.0, poussoir: 1.55 };
  const MOD = cap => MODELES[cap] || MODELES[Object.keys(MODELES).map(Number).find(k => k >= cap) || 20];
  const PAS = cap => MOD(cap).pas;
  const AIG = 40 * K;           // aiguille 18G × 40 mm (B. Braun Sterican, ISO 7864) : seule l'aiguille entre dans l'ampoule
  const BAS = -(AIG + 26);      // bas du corps : le raccord de l'aiguille coiffe l'embout, bout à bout, sans entrer dans le corps

  function seringue(cap = 10, opts = {}) {
    const M = MOD(cap), BW = M.bw, LH = M.lh, LG = LH * M.max / cap;   // LG : longueur graduée totale
    const HAUT = BAS - LG - 10;                                            // fond du corps, côté ailettes
    const ROD = (BAS - HAUT) + BW * RAP.tigeVide;                           // la tige dépasse toujours, même seringue vide
    return Object.assign({
      cap, vol: opts.vol || 0, air: 0, ac: 0, aiguille: "aiguille", liq: opts.liq || COUL.clair, etiq: opts.etiq || "", goutte: false, orale: !!opts.orale, cible: opts.cible ?? null,
      pisu: opts.pisu || "",
      dessiner(g) {
        this.gAig = el("g", {}, g);
        el("path", { d: `M-1.5 ${-AIG} L1.5 ${-AIG} L1.5 -7 L0 0 L-1.5 -9 Z`, fill: "url(#g-acier)", stroke: "#6d777d", "stroke-width": .5 }, this.gAig);
        el("path", { d: `M-9 ${-AIG - 16} h18 l-4 16 h-10 z`, fill: opts.cone || "#ef8fb0", stroke: "#8a5060", "stroke-width": 1 }, this.gAig);
        el("rect", { x: -10, y: -AIG - 19, width: 20, height: 4, rx: 1.5, fill: opts.cone || "#ef8fb0", stroke: "#8a5060", "stroke-width": .8 }, this.gAig);
        // embout Luer-lock : bague à pas de vis
        el("rect", { x: -4, y: BAS + 2, width: 8, height: 12, fill: "#e8edf0", stroke: "#7d8a90" }, g);
        el("rect", { x: -10, y: BAS, width: 20, height: 12, rx: 2, fill: this.orale ? "#b48ad1" : "rgba(240,246,249,.95)", stroke: "#7d8a90" }, g);
        for (let i = 0; i < 4; i++) el("line", { x1: -10, x2: 10, y1: BAS + 1 + i * 3, y2: BAS + 3.5 + i * 3, stroke: "#8a969d", "stroke-width": .9 }, g);
        // corps transparent
        el("path", { d: `M${-BW / 2} ${HAUT} V${BAS - 6} Q${-BW / 2} ${BAS} ${-BW / 2 + 6} ${BAS} H${BW / 2 - 6} Q${BW / 2} ${BAS} ${BW / 2} ${BAS - 6} V${HAUT} Z`, fill: "url(#g-verre)", stroke: "#56656d", "stroke-width": 1.6 }, g);
        this.liqR = el("rect", { x: -BW / 2 + 2, width: BW - 4, fill: this.liq }, g);
        this.liqH = el("rect", { x: -BW / 2 + 4, width: Math.max(2, BW / 8), fill: "#ffffff", opacity: .45 }, g);
        this.bulles = el("g", { opacity: 0 }, g);
        const rb = Math.max(2, BW / 12);
        [[-.25, 0], [.18, -6], [0, -11], [.28, 4]].forEach(([fx, dy], i) => el("circle", { cx: fx * BW, cy: dy, r: rb + (i % 2), fill: "#fff", stroke: "#56656d", "stroke-width": 1 }, this.bulles));
        // piston : joint noir à nervures (son bord avant marque le volume), tige en croix, poussoir rond plat
        this.piston = el("g", {}, g);
        const jw = BW - 3, jh = Math.max(6, BW * RAP.joint);
        el("rect", { x: -BW * .07, y: -ROD - 2, width: BW * .14, height: ROD, fill: "#d4d9dc", stroke: "#8a9399", "stroke-width": .6 }, this.piston);
        el("rect", { x: -BW * .3, y: -ROD - 2, width: BW * .6, height: ROD, fill: "url(#g-tige)", opacity: .55, stroke: "#9aa3a8", "stroke-width": .6 }, this.piston);
        el("rect", { x: -BW * RAP.poussoir / 2, y: -ROD - 10, width: BW * RAP.poussoir, height: Math.max(4, BW * .14), rx: 3, fill: "url(#g-tige)", stroke: "#8a9399" }, this.piston);
        el("path", { d: `M${-jw / 2} ${-jh} h${jw} v${jh - 2} q0 2 -2 2 h${-(jw - 4)} q-2 0 -2 -2 z`, fill: "#1e1e1e" }, this.piston);
        for (let i = 1; i < 3; i++) el("line", { x1: -jw / 2, x2: jw / 2, y1: -jh * i / 3, y2: -jh * i / 3, stroke: "#4a4a4a", "stroke-width": 1.2 }, this.piston);
        // ailettes de prise larges et arrondies
        el("rect", { x: -BW * RAP.ailettes / 2, y: HAUT - 4, width: BW * RAP.ailettes, height: Math.max(4, BW * RAP.ailEp), rx: 3, fill: "url(#g-tige)", stroke: "#8a9399" }, g);
        // graduation noire : petits traits et chiffres, lus depuis l'embout
        const gr = el("g", {}, g);
        const [p, P] = M.pas;
        for (let k = 0; k * p <= (M.grad ?? M.max) + 1e-9; k++) {
          const v = k * p, y = BAS - LH * v / cap, maj = Math.abs(v / P - Math.round(v / P)) < 1e-6, mi = !maj && Math.abs((v * 2) / P - Math.round((v * 2) / P)) < 1e-6;
          el("line", { x1: BW / 2 - (maj ? BW * .5 : mi ? BW * .34 : BW * .22), x2: BW / 2 - 1, y1: y, y2: y, stroke: "#1a1a1a", "stroke-width": maj ? 1.3 : .7 }, gr);
          if (maj && v > 0) {
            const lab = M.mL && Math.abs(v - M.mL) < 1e-6 ? "mL" : fmt(v);
            const fs = Math.max(6, Math.min(12, LH * P / cap * .85));
            txt(lab, { x: BW / 2 + 3, y: y + fs * .35, "font-size": fs, "font-weight": 700, fill: "var(--ink)" }, gr);
          }
        }
        this.cap_t = txt("", { x: 0, y: 0, "font-size": 1, opacity: 0 }, g);   // capacité : affichée dans la jauge seulement
        this.repere = el("g", {}, g);
        el("line", { x1: -BW / 2 - 8, x2: BW / 2 + 8, y1: 0, y2: 0, stroke: "#a8191a", "stroke-width": 2.5 }, this.repere);
        el("path", { d: `M${-BW / 2 - 8} 0 l-10 -7 v14 z`, fill: "#a8191a" }, this.repere);
        this.repT = txt("", { x: -BW / 2 - 22, y: 7, "text-anchor": "end", "font-size": 19, "font-weight": 900, fill: "#a8191a", "paint-order": "stroke", stroke: "var(--soft)", "stroke-width": 4 }, this.repere);
        this.etiqG = el("g", { opacity: 0 }, g);
        el("rect", { x: -BW / 2 - 2, y: HAUT + LG * .15, width: BW * .55, height: LG * .6, rx: 3, fill: "#fffbe6", stroke: "#c9a227", "stroke-width": 1.5, opacity: .95 }, this.etiqG);
        this.etiqT = el("text", { x: 0, y: 0, transform: `translate(${-BW / 2 + BW * .3} ${HAUT + LG * .45}) rotate(-90)`, "text-anchor": "middle", "font-size": Math.min(12, BW / 3.2), "font-weight": 900, fill: "#5a4300" }, this.etiqG);
        this.gouttE = el("path", { d: "M0 6 q-5 8 0 12 q5 -4 0 -12z", fill: this.liq, stroke: "#6aa9c9", opacity: 0 }, g);
        this.gBouchon = el("rect", { x: -7, y: BAS + 12, width: 14, height: 12, rx: 3, fill: "#d32f2f", stroke: "#7f0000", opacity: 0 }, g);
        this.gCapu = el("rect", { x: -6, y: -AIG - 4, width: 12, height: AIG + 8, rx: 5, fill: "rgba(239,143,176,.55)", stroke: "#8a5060", opacity: 0 }, g);
        this.maj();
      },
      maj() {
        if (this.gBouchon) { this.gBouchon.setAttribute("opacity", this.bouchon && this.aiguille !== "aiguille" ? 1 : 0); this.gCapu.setAttribute("opacity", this.capuchon && this.aiguille === "aiguille" ? 1 : 0); }
        const h = LH * this.vol / this.cap, a = LH * this.air / this.cap;
        const bas = BAS - a * this.ac;
        this.liqR.setAttribute("y", bas - h); this.liqR.setAttribute("height", Math.max(0, h));
        this.liqH.setAttribute("y", bas - h + 2); this.liqH.setAttribute("height", Math.max(0, h - 4));
        this.liqR.setAttribute("fill", this.liq);
        this.piston.setAttribute("transform", `translate(0 ${BAS - h - a})`);
        const yb = this.ac > .5 ? BAS - a / 2 : BAS - h - a / 2;
        this.bulles.setAttribute("transform", `translate(0 ${yb})`);
        this.bulles.setAttribute("opacity", this.air > 0.001 ? 1 : 0);
        this.gAig.style.display = this.aiguille === "aiguille" ? "" : "none";
        this.gouttE.setAttribute("opacity", this.goutte ? 1 : 0);
        this.gouttE.setAttribute("transform", `translate(0 ${this.aiguille === "aiguille" ? 0 : BAS + 14}) rotate(180)`);
        this.etiqG.setAttribute("opacity", this.etiq ? 1 : 0);
        this.etiqT.textContent = this.etiq;
        this.repere.setAttribute("opacity", this.vol > 0.001 ? 1 : 0);
        this.repT.textContent = `${fmtV(this.vol)} ml`;
        this.yRep = bas - h;
        this.cap_t.setAttribute("y", BAS - h - a - ROD - 26);
        this.apresPlace();
        if (this.E && this.E.S.onSer) this.E.S.onSer(this);
      },
      entree: 0,
      decal() { return this.aiguille === "aiguille" ? 0 : -BAS - 14; },
      apresPlace() {
        if (!this.repere) return;
        const r = -(this.r || 0);
        this.repere.setAttribute("transform", `translate(0 ${this.yRep || 0})`);
        this.repT.setAttribute("transform", `rotate(${r} ${-BW / 2 - 40} 0)`);
        this.cap_t.setAttribute("transform", `rotate(${r} 0 ${+this.cap_t.getAttribute("y") - 6})`);
      },
    }, opts);
  }

  // Ampoules : dimensions de la norme ISO 9187-1:2010 (tableau 1, forme B), à la même échelle K que les seringues.
  const AMP = { 1: [10.75, 60], 2: [10.75, 72], 5: [14.75, 83], 10: [17.75, 102], 20: [22, 120] };
  const ampDim = v => AMP[Object.keys(AMP).map(Number).find(k => k >= v) || 20];
  function ampoule(lab, vol, opts = {}) {
    const [dmm, hmm] = ampDim(opts.max || vol), w = dmm * K, H = hmm * K, col = H * .12, hb = H - col - H * .3;
    return Object.assign({
      vol, max: opts.max || vol, cassee: false, liq: opts.liq || COUL.clair, lab,
      dessiner(g) {
        const verre = opts.plastique ? "url(#g-plast)" : "url(#g-verre)";
        el("rect", { x: -w / 2, y: -hb, width: w, height: hb, rx: w * .22, fill: verre, stroke: "#6f7f88", "stroke-width": 1.6 }, g);
        this.liqR = el("rect", { x: -w / 2 + 1.5, width: w - 3, rx: w * .18, fill: this.liq }, g);
        el("path", { d: `M${-w / 2} ${-hb + 6} Q${-w / 2} ${-hb - col * .3} ${-w * .17} ${-hb - col * .45} L${-w * .15} ${-hb - col} L${w * .15} ${-hb - col} L${w * .17} ${-hb - col * .45} Q${w / 2} ${-hb - col * .3} ${w / 2} ${-hb + 6}`, fill: verre, stroke: "#6f7f88", "stroke-width": 1.6 }, g);
        // inscription imprimée dans la longueur, comme sur les vraies ampoules
        el("rect", { x: -w / 2 + 1, y: -hb * .9, width: w - 2, height: hb * .72, rx: 2, fill: opts.bande || "#ffffff", opacity: .92, stroke: "#9aa6ad", "stroke-width": .6 }, g);
        const lignesLab = String(lab).split("\n");
        lignesLab.forEach((l, i) => txt(l, { x: 0, y: 0, transform: `translate(${(i - (lignesLab.length - 1) / 2) * 11 + 4} ${-hb * .54}) rotate(-90)`, "text-anchor": "middle", "font-size": Math.min(10.5, hb * .72 / Math.max(6, l.length) * 1.7), "font-weight": 900, fill: "#10212b" }, g));
        el("path", { d: `M${-w * .3} ${-hb * .2} v${hb * .14}`, stroke: "#ffffff", "stroke-width": 3, "stroke-linecap": "round", opacity: .6 }, g);
        // bord de cassure, net et un peu irrégulier, visible quand la tête est partie
        const ht = -hb - col;
        this.bord = el("path", { d: `M${-w * .15} ${ht} l${w * .07} -1.5 l${w * .06} 1.2 l${w * .07} -1.4 l${w * .05} 1.6 l${w * .05} -1.2`, fill: "none", stroke: "#4f5e66", "stroke-width": 1.4 }, g);
        this.tete = el("g", {}, g);
        // tête : court étranglement puis bulbe, comme sur l'ampoule du fabricant (cassure au trait juste sous le bulbe)
        el("path", { d: `M${-w * .15} ${ht} L${-w * .12} ${ht - H * .05} Q${-w * .36} ${ht - H * .1} ${-w * .3} ${ht - H * .22} Q0 ${ht - H * .3} ${w * .3} ${ht - H * .22} Q${w * .36} ${ht - H * .1} ${w * .12} ${ht - H * .05} L${w * .15} ${ht} Z`, fill: verre, stroke: "#6f7f88", "stroke-width": 1.6 }, this.tete);
        el("rect", { x: -w * .17, y: ht - 4, width: w * .34, height: 4, rx: 2, fill: opts.point || "#1f5f99", opacity: .85 }, this.tete);
        this.maj();
      },
      maj() {
        const h = (hb - 3) * Math.max(0, this.vol) / this.max;
        // retournée, le liquide reste côté goulot (capillarité)
        this.liqR.setAttribute("y", this.inv ? -hb + 1.5 : -1.5 - h); this.liqR.setAttribute("height", h);
        this.tete.style.display = this.cassee ? "none" : "";
        this.bord.style.display = this.cassee ? "" : "none";
      },
      entree: -hb * .35, haut: -hb - col - 4, hTete: H,
    }, opts);
  }

  function flacon(lab, opts = {}) {
    return Object.assign({
      vol: opts.vol || 0, max: opts.max || 10, poudre: opts.poudre !== false, opercule: true, lab, liq: opts.liq || COUL.clair, dissous: false,
      dessiner(g) {
        el("path", { d: "M-36 0 L-36 -86 Q-36 -98 -20 -102 L-20 -116 L20 -116 L20 -102 Q36 -98 36 -86 L36 0 Z", fill: "rgba(232,242,246,.95)", stroke: "#6f7f88", "stroke-width": 2 }, g);
        this.liqR = el("rect", { x: -34, width: 68, fill: this.liq }, g);
        this.poudreG = el("g", {}, g);
        for (let i = 0; i < 26; i++) el("circle", { cx: -28 + (i * 37) % 56, cy: -6 - (i * 7) % 18, r: 2.4, fill: opts.coulPoudre || "#f2f2ee", stroke: "#b8b8b0", "stroke-width": .6 }, this.poudreG);
        el("rect", { x: -24, y: -128, width: 48, height: 14, rx: 3, fill: "#8d969b", stroke: "#5d666b" }, g);
        this.op = el("rect", { x: -22, y: -136, width: 44, height: 10, rx: 4, fill: opts.capColor || "#e07b00", stroke: "#8a4b00" }, g);
        el("rect", { x: -37, y: -70, width: 74, height: 40, fill: "#ffffff", stroke: "#9aa6ad" }, g);
        lignes(lab, { x: 0, y: -55, "text-anchor": "middle", "font-size": 10.5, "font-weight": 900, fill: "#10212b" }, g, 1.1);
        this.maj();
      },
      maj() {
        const h = 84 * Math.max(0, this.vol) / this.max;
        this.liqR.setAttribute("y", -2 - h); this.liqR.setAttribute("height", h);
        this.poudreG.style.display = this.poudre && !this.dissous ? "" : "none";
        this.op.style.display = this.opercule ? "" : "none";
      },
      entree: -100, haut: -140,
    }, opts);
  }

  function poche(lab, vol, opts = {}) {
    return Object.assign({
      vol, max: opts.max || vol, lab, liq: opts.liq || COUL.clair,
      dessiner(g) {
        el("path", { d: "M-6 -12 h12 v12 h-12z", fill: "#8d969b" }, g);
        el("path", { d: "M-58 0 Q-62 0 -62 10 L-62 160 Q-62 178 -40 182 L40 182 Q62 178 62 160 L62 10 Q62 0 58 0 Z", fill: "rgba(240,246,249,.95)", stroke: "#6f7f88", "stroke-width": 2 }, g);
        this.liqR = el("rect", { x: -60, width: 120, rx: 10, fill: this.liq }, g);
        el("rect", { x: -48, y: 30, width: 96, height: 56, fill: "#ffffff", stroke: "#9aa6ad" }, g);
        lignes(lab, { x: 0, y: 52, "text-anchor": "middle", "font-size": 12, "font-weight": 900, fill: "#10212b" }, g, 1.15);
        el("rect", { x: -18, y: 182, width: 12, height: 22, fill: "#dfe5e8", stroke: "#7d8a90" }, g);
        el("rect", { x: 6, y: 182, width: 12, height: 26, fill: "#3d5a80", stroke: "#24364d" }, g);
        this.maj();
      },
      maj() { const h = 176 * Math.max(0, this.vol) / this.max; this.liqR.setAttribute("y", 180 - h); this.liqR.setAttribute("height", h); },
      entree: 212,
    }, opts);
  }

  function collecteur(opts = {}) {
    return Object.assign({
      dessiner(g) {
        el("rect", { x: -40, y: -60, width: 80, height: 118, rx: 9, fill: "#f2c200", stroke: "#8a6d00", "stroke-width": 2.5 }, g);
        el("rect", { x: -46, y: -80, width: 92, height: 22, rx: 5, fill: "#f4f4f0", stroke: "#9e9e9e", "stroke-width": 2 }, g);
        el("rect", { x: -18, y: -82, width: 34, height: 6, rx: 3, fill: "#5c4900" }, g);
        el("line", { x1: -40, x2: 40, y1: -34, y2: -34, stroke: "#8a6d00", "stroke-width": 2, "stroke-dasharray": "6 4" }, g);
        txt("limite", { x: 0, y: -38, "text-anchor": "middle", "font-size": 10, "font-weight": 800, fill: "#5c4900" }, g);
        el("rect", { x: -15, y: -12, width: 30, height: 30, fill: "#fff", stroke: "#111", "stroke-width": 2, transform: "rotate(45 0 3)" }, g);
        txt("☣", { x: 0, y: 12, "text-anchor": "middle", "font-size": 22, fill: "#111" }, g);
        txt("DASRI", { x: 0, y: 44, "text-anchor": "middle", "font-size": 14, "font-weight": 900, fill: "#3a2e00" }, g);
        this.ferme = el("rect", { x: -46, y: -84, width: 92, height: 26, rx: 5, fill: "#e8e8e2", stroke: "#555", "stroke-width": 2, opacity: 0 }, g);
      },
      maj() { this.ferme.setAttribute("opacity", this.verrou ? 1 : 0); },
      bouche: [0, -86],
    }, opts);
  }

  function sacDasri() {
    return {
      dessiner(g) {
        el("path", { d: "M-50 -70 L50 -70 L58 60 Q0 74 -58 60 Z", fill: "#f6d21c", stroke: "#8a6d00", "stroke-width": 2 }, g);
        el("path", { d: "M-50 -70 Q0 -86 50 -70", fill: "none", stroke: "#8a6d00", "stroke-width": 2 }, g);
        txt("☣", { x: 0, y: 4, "text-anchor": "middle", "font-size": 30, fill: "#111" }, g);
        txt("DASRI", { x: 0, y: 34, "text-anchor": "middle", "font-size": 14, "font-weight": 900, fill: "#3a2e00" }, g);
      },
      bouche: [0, -78],
    };
  }

  function compresse() {
    return { dessiner(g) { el("rect", { x: -26, y: -20, width: 52, height: 40, rx: 3, fill: "#fbfbf8", stroke: "#b5b5ad", "stroke-dasharray": "3 2" }, g); txt("compresse", { x: 0, y: 34, "text-anchor": "middle", "font-size": 11, fill: "#5f6670" }, g); } };
  }

  function bras(opts = {}) {
    return Object.assign({
      dessiner(g) {
        el("path", { d: "M-320 -40 Q-80 -54 120 -34 Q170 -30 190 -6 Q170 22 120 26 Q-80 40 -320 36 Z", fill: "var(--peau)", stroke: "var(--peau-line)", "stroke-width": 2 }, g);
        el("path", { d: "M-60 -14 Q0 -10 40 -12", fill: "none", stroke: "#5b7fb0", "stroke-width": 4, opacity: .55 }, g);
        el("rect", { x: -60, y: -26, width: 70, height: 26, rx: 4, fill: "rgba(255,255,255,.85)", stroke: "#9aa6ad" }, g);
        el("path", { d: "M10 -14 L38 -14", stroke: "#e8a200", "stroke-width": 6 }, g);
        // prolongateur multivoies (« octopus ») : tronc court, trois voies, une valve au bout de deux d'entre elles
        el("path", { d: "M38 -14 L56 -14", stroke: "#9fb3ba", "stroke-width": 7 }, g);
        el("rect", { x: 52, y: -26, width: 22, height: 24, rx: 5, fill: "#e8eef1", stroke: "#7d8a90" }, g);
        el("path", { d: "M70 -26 L70 -80", fill: "none", stroke: "#9fb3ba", "stroke-width": 6 }, g);
        el("path", { d: "M74 -18 Q120 -22 150 -54", fill: "none", stroke: "#9fb3ba", "stroke-width": 5 }, g);
        el("path", { d: "M74 -8 Q130 -4 160 -10", fill: "none", stroke: "#9fb3ba", "stroke-width": 5 }, g);
        for (const [x, y] of [[150, -54], [160, -10]]) { el("rect", { x: x - 2, y: y - 9, width: 20, height: 18, rx: 4, fill: "#f2f2ee", stroke: "#5d666b" }, g); el("circle", { cx: x + 8, cy: y, r: 4, fill: "#9e9e9e" }, g); }
        // clamp de la voie utilisée
        this.clampG = el("g", { transform: "translate(70 -54)" }, g);
        el("rect", { x: -11, y: -6, width: 22, height: 12, rx: 3, fill: "#ffffff", stroke: "#5d666b", "stroke-width": 1.5 }, this.clampG);
        this.clampM = el("rect", { x: -14, y: -3, width: 10, height: 6, rx: 2, fill: "#a8191a" }, this.clampG);
        txt("octopus", { x: 112, y: 22, "font-size": 12, "font-weight": 700, fill: "var(--muted)" }, g);
        txt("clamp", { x: 40, y: -50, "text-anchor": "end", "font-size": 12, "font-weight": 700, fill: "var(--muted)" }, g);
        this.clamp = true;
        this.robinet = el("g", { transform: "translate(70 -96)" }, g);
        el("rect", { x: -18, y: -18, width: 36, height: 36, rx: 7, fill: "#f4f4f0", stroke: "#5d666b", "stroke-width": 2 }, this.robinet);
        el("rect", { x: -7, y: -26, width: 14, height: 10, rx: 2, fill: "#e8edf0", stroke: "#5d666b" }, this.robinet);
        // manette : fermée, elle pointe vers le site d'injection (le haut) ; ouverte, elle pointe vers la perfusion
        // manette à trois branches ; la branche marquée « OFF » montre la voie fermée (comme sur le BD Connecta)
        this.manette = el("g", {}, this.robinet);
        el("path", { d: "M-5 0 L-4 -30 Q0 -35 4 -30 L5 0 Z", fill: "#1f5f99", stroke: "#123a63" }, this.manette);
        el("path", { d: "M0 -5 L18 -3 Q22 0 18 3 L0 5 Z M0 -5 L-18 -3 Q-22 0 -18 3 L0 5 Z", fill: "#5c8fd6", stroke: "#123a63" }, this.manette);
        el("circle", { r: 8, fill: "#1f5f99", stroke: "#123a63" }, this.manette);
        txt("OFF", { x: 0, y: -18, "text-anchor": "middle", "font-size": 7, "font-weight": 900, fill: "#fff" }, this.manette);
        this.etatR = txt("fermé côté seringue", { x: -26, y: 4, "text-anchor": "end", "font-size": 12, "font-weight": 800, fill: "#a8191a" }, this.robinet);
        this.angle = 0;
        el("path", { d: "M-16 0 L-120 0 Q-150 0 -150 -40 L-150 -150", fill: "none", stroke: "#9fb3ba", "stroke-width": 5 }, g);
        txt("vers la perfusion", { x: -150, y: -160, "text-anchor": "middle", "font-size": 13, "font-weight": 700, fill: "var(--muted)" }, g);
        txt("site d'injection", { x: 104, y: -120, "font-size": 13, "font-weight": 700, fill: "var(--muted)" }, g);
      },
      site: [70, -122],
      zone: [20, -160, 120, 10],
      maj() {
        this.manette.setAttribute("transform", `rotate(${this.angle})`);
        this.etatR.textContent = this.angle < -45 ? "ouvert seringue → patient" : "fermé côté seringue";
        this.etatR.setAttribute("fill", this.angle < -45 ? "#2e7d32" : "#a8191a");
        // clamp fermé : la languette rouge pince la tubulure
        this.clampM.setAttribute("x", this.clamp ? -5 : -14); this.clampM.setAttribute("fill", this.clamp ? "#a8191a" : "#2e7d32");
      },
    }, opts);
  }

  function cuisse() {
    return {
      dessiner(g) {
        el("path", { d: "M-260 -60 Q-40 -86 160 -60 Q210 -50 214 0 Q210 50 160 60 Q-40 86 -260 60 Z", fill: "var(--peau)", stroke: "var(--peau-line)", "stroke-width": 2 }, g);
        el("ellipse", { cx: 216, cy: 0, rx: 26, ry: 34, fill: "var(--peau)", stroke: "var(--peau-line)", "stroke-width": 2 }, g);
        txt("genou", { x: 216, y: 56, "text-anchor": "middle", "font-size": 13, fill: "var(--muted)" }, g);
        txt("hanche", { x: -250, y: -70, "font-size": 13, fill: "var(--muted)" }, g);
        el("rect", { x: -110, y: -42, width: 170, height: 52, rx: 26, fill: "rgba(168,25,26,.14)", stroke: "#a8191a", "stroke-width": 2, "stroke-dasharray": "7 5" }, g);
        txt("face latéro-externe, tiers moyen", { x: -25, y: 34, "text-anchor": "middle", "font-size": 14, "font-weight": 800, fill: "#a8191a" }, g);
      },
      site: [-25, -18],
    };
  }

  function cuisseCoupe() {
    return {
      dessiner(g) {
        el("rect", { x: -230, y: -16, width: 460, height: 14, fill: "var(--peau)", stroke: "var(--peau-line)" }, g);
        el("rect", { x: -230, y: -2, width: 460, height: 40, fill: "#f3e3a2" }, g);
        for (let i = 0; i < 14; i++) el("circle", { cx: -215 + i * 33, cy: 18, r: 9, fill: "#f8eebc", stroke: "#e2cd78" }, g);
        el("rect", { x: -230, y: 38, width: 460, height: 120, fill: "#c0504d" }, g);
        for (let i = 0; i < 9; i++) el("path", { d: `M-230 ${50 + i * 12} Q0 ${44 + i * 12} 230 ${50 + i * 12}`, stroke: "#9e3a37", "stroke-width": 1.5, fill: "none" }, g);
        const lab = (y, t) => txt(t, { x: 236, y, "font-size": 15, "font-weight": 800, fill: "var(--ink)" }, g);
        lab(-4, "peau"); lab(22, "tissu sous-cutané"); lab(100, "muscle");
        txt("face latéro-externe, tiers moyen de la cuisse", { x: 0, y: -60, "text-anchor": "middle", "font-size": 17, "font-weight": 800, fill: "#a8191a" }, g);
        el("path", { d: "M0 -50 v26", stroke: "#a8191a", "stroke-width": 3, "marker-end": "" }, g);
        el("path", { d: "M-7 -32 L0 -20 L7 -32 Z", fill: "#a8191a" }, g);
      },
      site: [0, -16],
      zone: [-60, -70, 60, 60],
    };
  }

  function jambeIO() {
    return {
      dessiner(g) {
        el("path", { d: "M-280 -46 Q-60 -60 120 -40 L150 -38 Q170 -10 150 30 L120 34 Q-60 50 -280 40 Z", fill: "var(--peau)", stroke: "var(--peau-line)", "stroke-width": 2 }, g);
        el("ellipse", { cx: -270, cy: -3, rx: 30, ry: 44, fill: "var(--peau)", stroke: "var(--peau-line)", "stroke-width": 2 }, g);
        txt("genou", { x: -270, y: 58, "text-anchor": "middle", "font-size": 13, fill: "var(--muted)" }, g);
        txt("cheville", { x: 150, y: 56, "text-anchor": "middle", "font-size": 13, fill: "var(--muted)" }, g);
        el("circle", { cx: -200, cy: -18, r: 12, fill: "none", stroke: "#a8191a", "stroke-width": 3 }, g);
        txt("tibia proximal", { x: -200, y: -40, "text-anchor": "middle", "font-size": 14, "font-weight": 800, fill: "#a8191a" }, g);
      },
      site: [-200, -18],
    };
  }

  function nebuliseur(opts = {}) {
    return Object.assign({
      vol: 0, max: 6,
      dessiner(g) {
        el("path", { d: "M-60 -150 Q0 -205 60 -150 Q72 -100 30 -78 L-30 -78 Q-72 -100 -60 -150 Z", fill: "rgba(220,236,242,.85)", stroke: "#5f8796", "stroke-width": 2.5 }, g);
        el("path", { d: "M-70 -140 Q-90 -130 -100 -150 M70 -140 Q90 -130 100 -150", stroke: "#2b8a3e", "stroke-width": 3, fill: "none" }, g);
        txt("masque", { x: 0, y: -210, "text-anchor": "middle", "font-size": 13, "font-weight": 800, fill: "var(--muted)" }, g);
        el("path", { d: "M-26 -78 L-26 0 Q-26 12 -14 12 L14 12 Q26 12 26 0 L26 -78", fill: "rgba(232,242,246,.95)", stroke: "#5f8796", "stroke-width": 2.5 }, g);
        this.liqR = el("rect", { x: -24, width: 48, rx: 6, fill: opts.liq || COUL.clair }, g);
        el("path", { d: "M0 12 L0 40 Q0 60 40 60 L200 60", fill: "none", stroke: "#2b8a3e", "stroke-width": 6 }, g);
        txt("O₂", { x: 210, y: 66, "font-size": 18, "font-weight": 900, fill: "#2b8a3e" }, g);
        txt("réservoir", { x: 34, y: -30, "font-size": 13, "font-weight": 800, fill: "var(--muted)" }, g);
        this.brume = el("g", { opacity: 0 }, g);
        for (let i = 0; i < 9; i++) el("circle", { cx: -30 + (i * 23) % 60, cy: -96 - (i * 13) % 50, r: 6 + (i % 3) * 3, fill: "#ffffff", opacity: .8 }, this.brume);
        this.maj();
      },
      maj() { const h = 86 * this.vol / this.max; this.liqR.setAttribute("y", 10 - h); this.liqR.setAttribute("height", h); this.brume.setAttribute("opacity", this.marche ? 1 : 0); },
      entree: -60, haut: -90,
    }, opts);
  }

  function unidose(lab, vol, opts = {}) {
    return Object.assign({
      vol, max: vol, ouverte: false,
      dessiner(g) {
        el("path", { d: "M-22 0 L-22 -80 Q-22 -92 -8 -96 L-8 -108 L8 -108 L8 -96 Q22 -92 22 -80 L22 0 Z", fill: "#f7fbfd", stroke: "#6f7f88", "stroke-width": 2 }, g);
        this.liqR = el("rect", { x: -20, width: 40, rx: 4, fill: opts.liq || COUL.clair }, g);
        this.bouchon = el("path", { d: "M-12 -108 L12 -108 L16 -132 L-16 -132 Z", fill: "#f7fbfd", stroke: "#6f7f88", "stroke-width": 2 }, g);
        lignes(lab, { x: 0, y: -58, "text-anchor": "middle", "font-size": 10, "font-weight": 900, fill: "#10212b" }, g, 1.1);
        this.maj();
      },
      maj() { const h = 76 * this.vol / this.max; this.liqR.setAttribute("y", -2 - h); this.liqR.setAttribute("height", h); this.bouchon.style.display = this.ouverte ? "none" : ""; },
      haut: -112,
    }, opts);
  }

  function spray(lab) {
    return {
      bouffee: false,
      dessiner(g) {
        el("rect", { x: -24, y: -110, width: 48, height: 110, rx: 10, fill: "#f0f4f6", stroke: "#6f7f88", "stroke-width": 2 }, g);
        el("rect", { x: -24, y: -76, width: 48, height: 46, fill: "#c0392b" }, g);
        lignes(lab, { x: 0, y: -60, "text-anchor": "middle", "font-size": 10, "font-weight": 900, fill: "#fff" }, g, 1.1);
        el("rect", { x: -10, y: -136, width: 20, height: 26, rx: 4, fill: "#ffffff", stroke: "#6f7f88", "stroke-width": 2 }, g);
        el("rect", { x: 8, y: -132, width: 26, height: 8, rx: 3, fill: "#ffffff", stroke: "#6f7f88", "stroke-width": 2 }, g);
        this.nuage = el("g", { opacity: 0 }, g);
        for (let i = 0; i < 7; i++) el("circle", { cx: 44 + i * 9, cy: -128 + ((i % 3) - 1) * 7, r: 4 + i, fill: "#d6eaf8", opacity: .85 }, this.nuage);
      },
      maj() { this.nuage.setAttribute("opacity", this.bouffee ? 1 : 0); },
    };
  }

  function comprimes(lab, n = 2, opts = {}) {
    return {
      dessiner(g) {
        el("rect", { x: -70, y: -60, width: 140, height: 60, rx: 8, fill: "#e8edf0", stroke: "#8a9399", "stroke-width": 2 }, g);
        for (let i = 0; i < n; i++) {
          const cx = -40 + i * 40;
          el("circle", { cx, cy: -30, r: 15, fill: opts.coul || "#ffffff", stroke: "#9aa6ad", "stroke-width": 2 }, g);
          if (opts.secable) el("line", { x1: cx - 13, x2: cx + 13, y1: -30, y2: -30, stroke: "#9aa6ad", "stroke-width": 2 }, g);
        }
        lignes(lab, { x: 0, y: 20, "text-anchor": "middle", "font-size": 12, "font-weight": 900, fill: "var(--ink)" }, g, 1.1);
      },
    };
  }

  function seringueOrale(lab, coul) {
    return {
      dessiner(g) {
        el("rect", { x: -100, y: -14, width: 170, height: 28, rx: 6, fill: "#f4f8fb", stroke: "#6f7f88", "stroke-width": 2 }, g);
        el("rect", { x: -96, y: -10, width: 120, height: 20, fill: "#e6f0f4" }, g);
        el("rect", { x: 70, y: -5, width: 60, height: 10, fill: coul, stroke: "#333" }, g);
        el("rect", { x: 130, y: -18, width: 10, height: 36, rx: 3, fill: coul, stroke: "#333" }, g);
        el("rect", { x: -118, y: -6, width: 18, height: 12, rx: 3, fill: "#f4f8fb", stroke: "#6f7f88" }, g);
        txt(lab, { x: -20, y: 36, "text-anchor": "middle", "font-size": 13, "font-weight": 900, fill: "var(--ink)" }, g);
      },
    };
  }

  function bouteilleMeopa() {
    return {
      dessiner(g) {
        el("rect", { x: -34, y: -230, width: 68, height: 230, rx: 26, fill: "#ffffff", stroke: "#6f7f88", "stroke-width": 2 }, g);
        el("path", { d: "M-34 -200 Q-34 -230 0 -232 Q34 -230 34 -200 L34 -186 L-34 -186 Z", fill: "#2b5aa8", stroke: "#1d3d73" }, g);
        el("rect", { x: -20, y: -262, width: 40, height: 32, rx: 5, fill: "#8d969b", stroke: "#5d666b" }, g);
        txt("MÉOPA", { x: 0, y: -120, "text-anchor": "middle", "font-size": 15, "font-weight": 900, fill: "#1d3d73", transform: "rotate(-90 0 -120)" }, g);
        el("path", { d: "M20 -250 Q120 -250 140 -170", fill: "none", stroke: "#9fb3ba", "stroke-width": 6 }, g);
        el("path", { d: "M110 -170 Q140 -215 170 -170 Q178 -140 140 -126 Q102 -140 110 -170 Z", fill: "rgba(220,236,242,.85)", stroke: "#5f8796", "stroke-width": 2.5 }, g);
        txt("masque", { x: 140, y: -104, "text-anchor": "middle", "font-size": 13, "font-weight": 800, fill: "var(--muted)" }, g);
        txt("debout", { x: 0, y: 20, "text-anchor": "middle", "font-size": 14, "font-weight": 900, fill: "#a8191a" }, g);
      },
    };
  }

  function minuteur() {
    return {
      texte: "",
      dessiner(g) {
        this.g2 = el("g", { opacity: 0 }, g);
        el("circle", { r: 30, fill: "var(--panel)", stroke: "#a8191a", "stroke-width": 4 }, this.g2);
        this.aig = el("line", { x1: 0, y1: 0, x2: 0, y2: -22, stroke: "#a8191a", "stroke-width": 4, "stroke-linecap": "round" }, this.g2);
        this.t = txt("", { y: 54, "text-anchor": "middle", "font-size": 17, "font-weight": 900, fill: "var(--ink)" }, this.g2);
      },
      maj() { this.g2.setAttribute("opacity", this.texte ? 1 : 0); this.t.textContent = this.texte; },
    };
  }

  function mains() {
    return {
      dessiner(g) {
        const main = dx => el("path", { d: `M${dx - 30} 40 L${dx - 30} -10 Q${dx - 30} -40 ${dx - 18} -40 L${dx - 18} -70 Q${dx - 10} -80 ${dx - 4} -70 L${dx - 4} -80 Q${dx + 4} -90 ${dx + 10} -80 L${dx + 10} -74 Q${dx + 18} -82 ${dx + 24} -72 L${dx + 24} -10 Q${dx + 40} -30 ${dx + 46} -18 L${dx + 24} 30 L${dx + 20} 40 Z`, fill: "var(--peau)", stroke: "var(--peau-line)", "stroke-width": 2 }, g);
        main(-50); main(50);
        this.gel = el("g", { opacity: 0 }, g);
        for (let i = 0; i < 10; i++) el("circle", { cx: -70 + (i * 37) % 140, cy: -60 + (i * 23) % 80, r: 5, fill: "#bfe3f5", stroke: "#6aa9c9" }, this.gel);
      },
      maj() { this.gel.setAttribute("opacity", this.frotte ? 1 : 0); },
    };
  }

  function ezio() {
    return {
      dessiner(g) {
        el("line", { x1: 0, y1: 0, x2: 0, y2: -46, stroke: "#8a9399", "stroke-width": 5 }, g);
        el("rect", { x: -3, y: -24, width: 6, height: 4, fill: "#111" }, g);
        el("rect", { x: -10, y: -60, width: 20, height: 16, rx: 3, fill: "#2b5aa8" }, g);
        el("rect", { x: -30, y: -150, width: 60, height: 92, rx: 12, fill: "#9aa3a8", stroke: "#5d666b", "stroke-width": 2 }, g);
        el("rect", { x: 14, y: -130, width: 70, height: 30, rx: 10, fill: "#9aa3a8", stroke: "#5d666b", "stroke-width": 2 }, g);
        txt("EZ-IO", { x: 0, y: -100, "text-anchor": "middle", "font-size": 14, "font-weight": 900, fill: "#10212b" }, g);
      },
    };
  }

  // ---- pose de VVP : avant-bras, garrot, cathéter (couleur selon le calibre), pansement, prolongateur
  function brasPose(coul = "#2e7d32", calibre = "18G") {
    return {
      garrot: false, antisepsie: 0, cath: 0, mandrin: true, pansement: false, prolong: false, reflux: false,
      dessiner(g) {
        el("path", { d: "M-320 -50 Q-60 -62 150 -40 Q205 -34 225 -6 Q205 26 150 30 Q-60 46 -320 42 Z", fill: "var(--peau)", stroke: "var(--peau-line)", "stroke-width": 2 }, g);
        el("path", { d: "M-300 -8 Q-120 -18 60 -10 Q120 -6 170 -14", fill: "none", stroke: "#4d6fa8", "stroke-width": 7, opacity: .55, "stroke-linecap": "round" }, g);
        this.veine = el("path", { d: "M-300 -8 Q-120 -18 60 -10 Q120 -6 170 -14", fill: "none", stroke: "#3a5f9c", "stroke-width": 11, opacity: 0, "stroke-linecap": "round" }, g);
        txt("veine", { x: -260, y: -24, "font-size": 13, fill: "var(--muted)", "font-weight": 700 }, g);
        this.gGar = el("g", { opacity: 0 }, g);
        el("rect", { x: -250, y: -60, width: 34, height: 112, rx: 6, fill: "#3d5a80" }, this.gGar);
        txt("garrot", { x: -233, y: 72, "text-anchor": "middle", "font-size": 13, "font-weight": 800, fill: "var(--ink)" }, this.gGar);
        this.gAnti = el("ellipse", { cx: 20, cy: -10, rx: 70, ry: 30, fill: "#d97c2b", opacity: 0 }, g);
        // cathéter : canule + embase colorée + mandrin
        this.gCath = el("g", {}, g);
        el("rect", { x: 0, y: -2, width: 70, height: 4, fill: "#e8eef1", stroke: "#9aa6ad" }, this.gCath);
        el("rect", { x: 70, y: -11, width: 34, height: 22, rx: 4, fill: coul, stroke: "#333" }, this.gCath);
        el("rect", { x: 80, y: -20, width: 14, height: 10, rx: 2, fill: coul, stroke: "#333" }, this.gCath);
        this.gMand = el("g", {}, this.gCath);
        el("line", { x1: -6, x2: 70, y1: 0, y2: 0, stroke: "#8a9399", "stroke-width": 1.5 }, this.gMand);
        el("rect", { x: 104, y: -8, width: 60, height: 16, rx: 3, fill: "rgba(240,246,249,.9)", stroke: "#7d8a90" }, this.gMand);
        this.gSang = el("rect", { x: 106, y: -6, width: 0, height: 12, fill: "#b71c1c" }, this.gMand);
        txt(calibre, { x: 87, y: 34, "text-anchor": "middle", "font-size": 15, "font-weight": 900, fill: "var(--ink)" }, this.gCath);
        this.gPans = el("rect", { x: -10, y: -34, width: 130, height: 64, rx: 10, fill: "rgba(220,240,255,.45)", stroke: "#7aa3b5", "stroke-width": 2, "stroke-dasharray": "5 4", opacity: 0 }, g);
        this.gProl = el("g", { opacity: 0 }, g);
        el("path", { d: "M104 0 Q160 0 180 -40 L190 -80", fill: "none", stroke: "#9fb3ba", "stroke-width": 6 }, this.gProl);
        el("rect", { x: 172, y: -112, width: 36, height: 36, rx: 7, fill: "#f4f4f0", stroke: "#5d666b", "stroke-width": 2 }, this.gProl);
        el("path", { d: "M184 -94 h12 M190 -100 v12", stroke: "#1f5f99", "stroke-width": 4 }, this.gProl);
        txt("robinet trois voies", { x: 190, y: -122, "text-anchor": "middle", "font-size": 13, "font-weight": 700, fill: "var(--muted)" }, this.gProl);
        this.maj();
      },
      maj() {
        this.gGar.setAttribute("opacity", this.garrot ? 1 : 0);
        this.veine.setAttribute("opacity", this.garrot ? .8 : 0);
        this.gAnti.setAttribute("opacity", this.antisepsie * .35);
        // cath : 0 = hors du bras (à droite), 1 = en place
        this.gCath.setAttribute("transform", `translate(${40 + (1 - this.cath) * 170} ${-10 - (1 - this.cath) * 40}) rotate(${-12 * (1 - this.cath)})`);
        this.gMand.style.display = this.mandrin ? "" : "none";
        this.gSang.setAttribute("width", this.reflux ? 40 : 0);
        this.gPans.setAttribute("opacity", this.pansement ? 1 : 0);
        this.gProl.setAttribute("opacity", this.prolong ? 1 : 0);
      },
    };
  }

  // ---- voie intra-osseuse : jambe, repère, aiguille EZ-IO (couleur selon la longueur), stabilisateur, raccord
  function jambeIO2(coul = "#1f5f99", lg = "25 mm") {
    return {
      site: [-200, -18], repere: false, antisepsie: 0, aig: 0, mandrin: true, stab: false, connect: false,
      dessiner(g) {
        el("path", { d: "M-280 -46 Q-60 -60 120 -40 L150 -38 Q170 -10 150 30 L120 34 Q-60 50 -280 40 Z", fill: "var(--peau)", stroke: "var(--peau-line)", "stroke-width": 2 }, g);
        el("ellipse", { cx: -270, cy: -3, rx: 30, ry: 44, fill: "var(--peau)", stroke: "var(--peau-line)", "stroke-width": 2 }, g);
        el("ellipse", { cx: -232, cy: 6, rx: 12, ry: 9, fill: "none", stroke: "var(--peau-line)", "stroke-width": 2 }, g);
        txt("rotule", { x: -270, y: -54, "text-anchor": "middle", "font-size": 13, fill: "var(--muted)" }, g);
        txt("tubérosité tibiale", { x: -232, y: 34, "text-anchor": "middle", "font-size": 13, fill: "var(--muted)" }, g);
        this.gRep = el("g", { opacity: 0 }, g);
        el("circle", { cx: -200, cy: -18, r: 12, fill: "none", stroke: "#a8191a", "stroke-width": 3 }, this.gRep);
        el("path", { d: "M-232 2 L-202 -14", stroke: "#a8191a", "stroke-width": 2, "stroke-dasharray": "4 3" }, this.gRep);
        txt("≈ 2 cm en dedans (adulte)", { x: -200, y: -42, "text-anchor": "middle", "font-size": 14, "font-weight": 800, fill: "#a8191a" }, this.gRep);
        this.gAnti = el("ellipse", { cx: -200, cy: -18, rx: 40, ry: 26, fill: "#d97c2b", opacity: 0 }, g);
        this.gAig = el("g", {}, g);
        el("rect", { x: -203, y: -70, width: 6, height: 60, fill: "url(#g-acier)", stroke: "#6d777d" }, this.gAig);
        el("rect", { x: -203, y: -44, width: 6, height: 3, fill: "#111" }, this.gAig);
        el("rect", { x: -214, y: -86, width: 28, height: 16, rx: 4, fill: coul, stroke: "#333" }, this.gAig);
        txt(lg, { x: -200, y: -92, "text-anchor": "middle", "font-size": 14, "font-weight": 900, fill: "var(--ink)" }, this.gAig);
        this.gMand = el("rect", { x: -202, y: -100, width: 4, height: 16, fill: "#8a9399" }, this.gAig);
        this.gStab = el("path", { d: "M-236 -30 h72 l-10 24 h-52 z", fill: "#9fd4e8", stroke: "#4d8aa3", opacity: 0 }, g);
        this.gConn = el("path", { d: "M-200 -86 Q-200 -130 -140 -140 L-60 -140", fill: "none", stroke: "#9fb3ba", "stroke-width": 6, opacity: 0 }, g);
        this.maj();
      },
      maj() {
        this.gRep.setAttribute("opacity", this.repere ? 1 : 0);
        this.gAnti.setAttribute("opacity", this.antisepsie * .35);
        this.gAig.setAttribute("opacity", this.aig > 0 ? 1 : 0);
        this.gAig.setAttribute("transform", `translate(0 ${(1 - this.aig) * -60 + this.aig * 36})`);
        this.gMand.style.display = this.mandrin ? "" : "none";
        this.gStab.setAttribute("opacity", this.stab ? 1 : 0);
        this.gConn.setAttribute("opacity", this.connect ? 1 : 0);
      },
    };
  }

  // ---- bassin vu de face, ceinture pelvienne
  function bassin() {
    return {
      pos: 0, ferme: false, pont: false,
      dessiner(g) {
        el("rect", { x: -120, y: -200, width: 240, height: 150, rx: 50, fill: "#5f6670" }, g);
        el("path", { d: "M-120 -60 Q-140 40 -110 220 L-30 220 L-10 30 L10 30 L30 220 L110 220 Q140 40 120 -60 Z", fill: "#3d5a80" }, g);
        el("path", { d: "M-90 -40 Q-110 -90 -40 -100 Q0 -70 40 -100 Q110 -90 90 -40 Q60 10 0 20 Q-60 10 -90 -40 Z", fill: "none", stroke: "#f2f2ee", "stroke-width": 4, opacity: .8 }, g);
        for (const x of [-112, 112]) el("circle", { cx: x, cy: 10, r: 10, fill: "#ffeb3b", stroke: "#a8191a", "stroke-width": 3 }, g);
        txt("grand trochanter", { x: -130, y: 14, "text-anchor": "end", "font-size": 13, "font-weight": 800, fill: "var(--ink)" }, g);
        txt("grand trochanter", { x: 130, y: 14, "text-anchor": "start", "font-size": 13, "font-weight": 800, fill: "var(--ink)" }, g);
        el("circle", { cx: 0, cy: 4, r: 6, fill: "#f2f2ee" }, g);
        txt("symphyse", { x: 0, y: -10, "text-anchor": "middle", "font-size": 12, fill: "#f2f2ee" }, g);
        this.gCeint = el("g", {}, g);
        this.bandeG = el("rect", { y: -18, height: 44, rx: 6, fill: "#1b1b1b", opacity: .9 }, this.gCeint);
        this.bandeD = el("rect", { y: -18, height: 44, rx: 6, fill: "#e65100", opacity: .9 }, this.gCeint);
        this.boucle = el("rect", { x: -8, y: -12, width: 16, height: 32, rx: 3, fill: "#9e9e9e", stroke: "#333", opacity: 0 }, this.gCeint);
        this.maj();
      },
      maj() {
        // pos : 0 = sous les genoux, 1 = centrée sur les trochanters ; ferme : extrémités ramenées sur la symphyse
        const y = 190 - this.pos * 180;
        this.gCeint.setAttribute("transform", `translate(0 ${y})`);
        const w = this.ferme ? 130 : 70;
        this.bandeG.setAttribute("x", this.ferme ? -130 : -150); this.bandeG.setAttribute("width", w);
        this.bandeD.setAttribute("x", this.ferme ? 0 : 80); this.bandeD.setAttribute("width", w);
        this.boucle.setAttribute("opacity", this.ferme ? 1 : 0);
      },
    };
  }

  // ---- bouteille de MÉOPA : robinet, manodétendeur, raccord, valve à la demande, filtre, masque
  function meopaKit() {
    return {
      ouvert: false, valve: false, filtre: false, masque: false, ballon: 0,
      dessiner(g) {
        el("rect", { x: -40, y: -260, width: 80, height: 260, rx: 30, fill: "#ffffff", stroke: "#6f7f88", "stroke-width": 2 }, g);
        el("path", { d: "M-40 -230 Q-40 -262 0 -264 Q40 -262 40 -230 L40 -214 L-40 -214 Z", fill: "#ffffff", stroke: "#6f7f88" }, g);
        el("rect", { x: -40, y: -246, width: 80, height: 12, fill: "#2b5aa8" }, g);
        txt("MÉOPA", { x: 0, y: -130, "text-anchor": "middle", "font-size": 16, "font-weight": 900, fill: "#1d3d73", transform: "rotate(-90 0 -130)" }, g);
        el("rect", { x: -24, y: -300, width: 48, height: 40, rx: 6, fill: "#8d969b", stroke: "#5d666b" }, g);
        this.volant = el("g", { transform: "translate(0 -310)" }, g);
        el("rect", { x: -18, y: -8, width: 36, height: 12, rx: 4, fill: "#1f5f99" }, this.volant);
        this.mano = el("circle", { cx: 40, cy: -284, r: 16, fill: "#fff", stroke: "#5d666b", "stroke-width": 2 }, g);
        this.aig = el("line", { x1: 40, y1: -284, x2: 30, y2: -294, stroke: "#a8191a", "stroke-width": 3 }, g);
        this.gValve = el("g", { opacity: 0 }, g);
        el("path", { d: "M24 -280 Q120 -280 150 -220", fill: "none", stroke: "#9fb3ba", "stroke-width": 7 }, this.gValve);
        el("rect", { x: 130, y: -222, width: 46, height: 46, rx: 10, fill: "#455a64" }, this.gValve);
        txt("valve à la demande", { x: 153, y: -232, "text-anchor": "middle", "font-size": 13, "font-weight": 800, fill: "var(--muted)" }, this.gValve);
        this.gFiltre = el("g", { opacity: 0 }, g);
        el("rect", { x: 138, y: -176, width: 30, height: 30, rx: 6, fill: "#e0f2f1", stroke: "#00796b", "stroke-width": 2 }, this.gFiltre);
        txt("filtre", { x: 200, y: -156, "font-size": 13, "font-weight": 800, fill: "var(--muted)" }, this.gFiltre);
        this.gMasque = el("g", { opacity: 0 }, g);
        el("path", { d: "M120 -146 Q153 -190 186 -146 Q194 -116 153 -102 Q112 -116 120 -146 Z", fill: "rgba(220,236,242,.85)", stroke: "#5f8796", "stroke-width": 2.5 }, this.gMasque);
        txt("masque", { x: 153, y: -84, "text-anchor": "middle", "font-size": 13, "font-weight": 800, fill: "var(--muted)" }, this.gMasque);
        this.maj();
      },
      maj() {
        this.volant.setAttribute("transform", `translate(0 -310) rotate(${this.ouvert ? 90 : 0})`);
        this.aig.setAttribute("x2", this.ouvert ? 52 : 30); this.aig.setAttribute("y2", this.ouvert ? -292 : -294);
        this.gValve.setAttribute("opacity", this.valve ? 1 : 0);
        this.gFiltre.setAttribute("opacity", this.filtre ? 1 : 0);
        this.gMasque.setAttribute("opacity", this.masque ? 1 : 0);
      },
    };
  }

  // Mise à l'échelle K des objets dessinés librement (dimensions approchées : flacon ≈ 23 × 50 mm, poche 100 ml ≈ 95 × 180 mm,
  // mini-collecteur ≈ 70 × 110 mm, unidose ≈ 12 × 55 mm ; aucune fiche fabricant ouverte pour ces objets).
  const ECH = { flacon: .52, poche: 1.25, collecteur: 1.2, unidose: .65, nebuliseur: .85, spray: .8, comprimes: .7, seringueOrale: .9, sacoche: .9 };
  const FABRIQUE = { brasPose, jambeIO2, bassin, meopaKit, ezio, cuisseCoupe, sacoche: () => sacoche(), seringue, ampoule, flacon, poche, collecteur, sacDasri, compresse, bras, cuisse, jambeIO, nebuliseur, unidose, spray, comprimes, seringueOrale, bouteilleMeopa, minuteur, mains };

  // ------------------------------------------------------------- actions
  // Chaque action reçoit (E, ...args). E = moteur + objets. Toutes acceptent la vitesse 0 (rejouer d'un coup).
  const ACTIONS = {
    async montrer(E, id, on = true) { const o = E.S.objs[id]; const a = o.op; await E.tween(300, t => { o.op = a + ((on ? 1 : 0) - a) * t; o.place(); }); },
    async aller(E, id, x, y, r, s) { const o = E.S.objs[id]; await E.bouger(o, x, y, r ?? o.r, 650, s ?? o.s); },
    async casser(E, id, vers = "dasri") {
      const a = E.S.objs[id], d = E.S.objs[vers];
      E.phase("OUVERTURE"); E.bulle(a.x + 60 * (a.s || 1), a.y - (a.hTete || 150) * a.s * .8, "CLAC");
      if (!d || !E.S.vitesse) { a.cassee = true; a.maj(); return; }
      const t = E.el("g", {}, E.couches.dessus);
      const tt = a.tete.cloneNode(true); tt.style.display = ""; t.appendChild(tt);
      a.cassee = true; a.maj();
      const [x0, y0] = [a.x, a.y], [x1, y1] = [d.x + d.bouche[0], d.y + d.bouche[1] + 150];
      await E.tween(800, k => { t.setAttribute("transform", `translate(${x0 + (x1 - x0) * k} ${y0 + (y1 - y0) * k - Math.sin(k * Math.PI) * 120}) rotate(${k * 400} 0 ${-(a.hTete || 150)}) scale(${1 - k * .4})`); });
      t.remove();
    },
    // Prélever : la seringue arrive au-dessus du contenant, seule l'aiguille plonge dedans.
    async aspirer(E, sid, fromId, ml, opts = {}) {
      const s = E.S.objs[sid], f = E.S.objs[fromId];
      const fs = f.s || 1, haut = (f.haut ?? -140) * fs;
      const ent = Math.min((f.entree ?? -40) * fs + 26, haut + AIG * (s.s || 1) - 10) - 26;   // le raccord rose reste au-dessus du goulot
      E.phase(f.neutre && s.vol > 0 ? "DILUTION" : "PRÉLÈVEMENT");
      let retour = null;
      if (f.hTete && !opts.par) {
        // ampoule : on la retourne, partie cassée vers le bas, un peu inclinée ; la seringue arrive dessous, aiguille vers le haut
        const th = 168, rad = th * Math.PI / 180, ax = f.x, ay = f.y - 170 * fs, d = -(-haut) * .62;
        const rot = (lx, ly) => [ax + lx * Math.cos(rad) - ly * Math.sin(rad), ay + lx * Math.sin(rad) + ly * Math.cos(rad)];
        const [x0, y0, r0] = [f.x, f.y, f.r || 0];
        f.inv = true; f.maj && f.maj();
        await E.bouger(f, ax, ay, th, 750);
        const [tx, ty] = rot(0, d / fs), [ox, oy] = rot(0, (d - AIG - 30) / fs);
        await E.bouger(s, ox, oy, th, 700);
        await E.bouger(s, tx, ty, th, 650);
        retour = async () => { await E.bouger(s, ox, oy, th, 500); await E.bouger(s, s.x + 60, s.y + 80, 180, 500); f.inv = false; await E.bouger(f, x0, y0, r0, 650); f.maj && f.maj(); };
      } else if (opts.par === "dessous") {
        await E.bouger(s, f.x, f.y + ent + 8, 180, 750);
      } else {
        await E.bouger(s, f.x, f.y + haut - 20, 0, 700);
        await E.bouger(s, f.x, f.y + ent + 26, 0, 650);
      }
      if (opts.liq) s.liq = opts.liq;
      else if (f.liq && !f.neutre && !f.cap) s.liq = f.liq;   // la seringue prend la teinte témoin du médicament
      else if (f.cap && f.liq) s.liq = f.liq;
      const v0 = s.vol, fv0 = f.vol ?? 0, a0 = s.air, a1 = opts.sansAir ? a0 : Math.min(Math.max(a0, s.cap * 0.06), Math.max(0, s.cap * 1.07 - s.vol - ml));
      s.ac = 0;
      await E.tween(Math.max(1100, ml * 220), t => { s.vol = v0 + ml * t; s.air = a0 + (a1 - a0) * t; s.maj(); if (f.vol !== undefined) { f.vol = fv0 - ml * t; f.maj(); } });
      await E.attente(250);
      if (retour) await retour();
      else if (opts.par !== "dessous") await E.bouger(s, f.x, f.y + haut - 20, 0, 600);
    },
    async injecter(E, sid, toId, ml, opts = {}) {
      const s = E.S.objs[sid], f = E.S.objs[toId];
      const fs = f.s || 1, haut = (f.haut ?? -140) * fs;
      const ent = opts.par === "dessous" ? (f.entree ?? -40) * fs : Math.min((f.entree ?? -40) * fs + 26, haut + AIG * (s.s || 1) - 10) - 26;
      const d = (s.decal ? s.decal() : 0) * s.s;
      E.phase(f.cap || f.site || f.marche !== undefined ? "INJECTION" : f.poudre ? "RECONSTITUTION" : "DILUTION");
      if (opts.par === "dessous") await E.bouger(s, f.x, f.y + ent + 8, 180, 750);
      else if (opts.site) {
        const [sx, sy] = f.site, X = f.x + sx, Y = f.y + sy + d + (opts.enfonce ?? 0);
        if (Math.hypot(s.x - X, s.y - Y) > 2) {
          await E.bouger(s, X, f.y + sy + d - 24, opts.r ?? 0, 750);
          await E.bouger(s, X, Y, opts.r ?? 0, 650);
        }
      } else { await E.bouger(s, f.x, f.y + haut - 20, 0, 700); await E.bouger(s, f.x, f.y + ent + 26, 0, 650); }
      const v0 = s.vol, fv0 = f.vol;
      const vol = ml === "tout" ? s.vol : ml;
      const a0 = s.air, ch = opts.chrono && E.S.objs[opts.chrono];
      const ms = opts.duree ? opts.duree : opts.lent ? 2800 : Math.max(900, vol * 180);
      if (ch) { ch.texte = opts.chronoTxt || ""; ch.maj(); }
      if (opts.annonce) E.annonce(opts.annonce);
      await E.tween(ms, t => { s.vol = v0 - vol * t; s.air = a0 * (1 - t); s.maj(); if (fv0 !== undefined && f.maj) { f.vol = fv0 + vol * t; f.maj(); } if (ch) { ch.aig.setAttribute("transform", `rotate(${t * 360})`); if (opts.reel) ch.t.textContent = `${Math.round(t * opts.reel)} s (démo)`; } });
      await E.attente(250);
      if (opts.retire !== false && !opts.site) await E.bouger(s, f.x, opts.par === "dessous" ? f.y + ent + 60 : f.y + haut - 20, opts.par === "dessous" ? 180 : 0, 550);
    },
    async air(E, sid, ml) { const s = E.S.objs[sid]; const a0 = s.air; await E.tween(500, t => { s.air = a0 + (ml - a0) * t; s.maj(); }); },
    // Purge : seringue verticale embout en haut, on tapote pour faire monter l'air,
    // puis on pousse doucement le piston jusqu'au trait du volume. Le piston n'est jamais tiré.
    async purger(E, sid, x, y) {
      const s = E.S.objs[sid];
      await E.bouger(s, x ?? s.x, y ?? s.y, 180, 700);
      if (s.air < 0.001) { s.goutte = true; s.maj(); await E.attente(400); return; }
      E.phase("PURGE");
      for (let i = 0; i < 4; i++) {
        if (i % 2 === 0) E.bulle(s.x + 46 * s.s, s.y + 120 * s.s, "TAP TAP");
        await E.bouger(s, s.x + 4, s.y, 180, 90); await E.bouger(s, s.x - 4, s.y, 180, 90);
        const a = s.ac; await E.tween(160, t => { s.ac = a + (Math.min(1, a + .3) - a) * t; s.maj(); });
      }
      await E.bouger(s, s.x + 4, s.y, 180, 60);
      s.ac = 1; s.maj();
      await E.attente(300);
      const a0 = s.air;
      E.bulle(s.x, s.y - 20, "PSSHIT");
      await E.tween(1600, t => { s.air = a0 * (1 - t); s.maj(); });
      s.goutte = true; s.maj();
      await E.attente(600);
    },
    async goutte(E, sid, on = false) { const s = E.S.objs[sid]; s.goutte = on; s.maj(); },
    async aiguille(E, sid, type) { const s = E.S.objs[sid]; s.aiguille = type; s.bouchon = false; s.capuchon = false; s.maj(); },
    async etiqueter(E, sid, texte) { const s = E.S.objs[sid]; E.phase("ÉTIQUETAGE"); s.etiq = texte; s.maj(); await E.attente(300); },
    async jeter(E, id, vers = "dasri") {
      const o = E.S.objs[id], d = E.S.objs[vers];
      E.phase("ÉLIMINATION");
      await E.bouger(o, d.x + d.bouche[0], d.y + d.bouche[1] - 40, o.r, 600, .55);
      await E.bouger(o, d.x + d.bouche[0], d.y + d.bouche[1] + 30, o.r, 300, .4);
      o.op = 0; o.place();
    },
    async trocart(E, sid, mode = "collecteur", vers = "dasri") {
      const s = E.S.objs[sid], d = E.S.objs[vers];
      E.phase(mode === "capuchon" ? "RECAPUCHONNAGE" : "TROCART");
      if (mode === "capuchon") { s.capuchon = true; s.maj && s.maj(); E.bulle(s.x + 40, s.y - 20, "!"); await E.attente(900); return; }
      E.bulle(s.x + 30, s.y - 120 * s.s, "CLIC");
      const t = E.el("g", {}, E.couches.dessus);
      const ag = s.gAig.cloneNode(true); t.appendChild(ag);
      s.aiguille = "none"; s.maj();
      const [x0, y0] = [s.x, s.y], [x1, y1] = d ? [d.x + d.bouche[0], d.y + d.bouche[1] + 20] : [x0, y0 + 80];
      await E.tween(900, k => t.setAttribute("transform", `translate(${x0 + (x1 - x0) * k} ${y0 + (y1 - y0) * k - Math.sin(k * Math.PI) * 60}) rotate(${(s.r || 0) + k * 30}) scale(${s.s * (1 - k * .3)})`));
      t.remove();
      s.bouchon = true; s.maj(); E.bulle(s.x + 30, s.y - 130 * s.s, "CLIC");
      await E.attente(300);
    },
    async clamp(E, id, ferme) { const o = E.S.objs[id]; o.clamp = ferme; o.maj(); E.bulle(o.x + 20, o.y - 70, "CLIC"); await E.attente(500); },
    async robinet(E, id, ouvert) {
      const o = E.S.objs[id], a0 = o.angle, a1 = ouvert ? -90 : 0;   // ouvert : la branche OFF pointe vers la perfusion
      E.bulle(o.x + o.site[0] + 40, o.y + o.site[1] + 10, "CLIC");
      await E.tween(700, t => { o.angle = a0 + (a1 - a0) * t; o.maj(); });
    },
    async connecter(E, sid, toId) {
      const s = E.S.objs[sid], f = E.S.objs[toId];
      const d = (s.decal ? s.decal() : 0) * s.s, [sx, sy] = f.site;
      await E.bouger(s, f.x + sx, f.y + sy + d - 30, 0, 800);
      await E.bouger(s, f.x + sx, f.y + sy + d, 0, 450);
      for (let i = 0; i < 2; i++) { await E.bouger(s, s.x, s.y, 8, 140); await E.bouger(s, s.x, s.y, -8, 140); }
      await E.bouger(s, s.x, s.y, 0, 100);
      E.bulle(s.x + 50, s.y - 60, "CLIC");
    },
    async deconnecter(E, sid, x, y) {
      const s = E.S.objs[sid];
      for (let i = 0; i < 2; i++) { await E.bouger(s, s.x, s.y, -8, 140); await E.bouger(s, s.x, s.y, 8, 140); }
      await E.bouger(s, x, y, 0, 700);
    },
    async ranger(E, id, vers = "sac") {
      const o = E.S.objs[id], d = E.S.objs[vers];
      await E.bouger(o, d.x + d.bouche[0], d.y + d.bouche[1] - 50, 0, 700, .45);
      await E.bouger(o, d.x + d.bouche[0], d.y + d.bouche[1] + 18, 0, 400, .3);
      E.phase("RANGEMENT");
    },
    async ouvrir(E, id) { const o = E.S.objs[id]; o.opercule = false; o.ouverte = true; o.maj(); E.bulle(o.x, o.y - 140, "CLIC"); await E.attente(300); },
    async dissoudre(E, id) {
      const o = E.S.objs[id];
      for (let i = 0; i < 4; i++) { await E.bouger(o, o.x, o.y, 12, 140); await E.bouger(o, o.x, o.y, -12, 140); }
      await E.bouger(o, o.x, o.y, 0, 100);
      o.dissous = true; o.maj();
    },
    async fondu(E, id, champ, val, ms = 900) { const o = E.S.objs[id], v0 = +o[champ] || 0; await E.tween(ms, t => { o[champ] = v0 + (val - v0) * t; o.maj(); }); },
    async regler(E, id, champ, val) { const o = E.S.objs[id]; o[champ] = val; o.maj && o.maj(); await E.attente(250); },
    async minuteur(E, id, texte, ms = 1600) {
      const o = E.S.objs[id]; o.texte = texte; o.maj();
      await E.tween(ms, t => o.aig.setAttribute("transform", `rotate(${t * 360})`));
    },
    async pause(E, ms) { await E.attente(ms); },
    async bulle(E, x, y, t) { if (/^(RINÇAGE|INJECTION|IVD|IVL|IM)$/.test(t)) E.phase(t === "RINÇAGE" ? "RINÇAGE" : "INJECTION"); E.bulle(x, y, t); await E.attente(500); },
    async phase(E, mot) { E.phase(mot); await E.attente(200); },
  };

  // ------------------------------------------------------------- jauge : la seringue en grand, graduations lisibles
  function jauge(conteneur, compact) {
    const d = document.createElement("div"); d.className = "jauge"; conteneur.appendChild(d);
    const tete = document.createElement("div"); tete.className = "jauge-t"; d.appendChild(tete);
    const svg = el("svg", { viewBox: "0 0 1000 200", class: "jauge-svg", role: "img", "aria-label": "seringue en grand" }, d);
    if (!svg.querySelector("defs")) el("defs", {}, svg).innerHTML = DEFS;
    let cle = "", G = null;
    function dessiner(sy) {
      const cap = sy.cap, mod = MOD(cap);
      if (`${cap}` !== cle) {
        svg.querySelectorAll(":scope > :not(defs)").forEach(n => n.remove()); cle = `${cap}`;
        // même modèle que la scène : longueur graduée / diamètre du fabricant, rapports des photos
        const L = 320, HB = Math.min(118, L * mod.d / mod.l), LM = L * mod.max / cap, lu = HB * RAP.luer;
        const X0 = 20 + lu + 6, Y = 40, fin = X0 + LM + HB * .25, ROD = (fin - X0) + HB * RAP.tigeVide;
        const H = Y + HB + 70, Wt = X0 + LM + ROD + HB * .3 + 30;
        svg.setAttribute("viewBox", `0 0 ${Math.round(Wt)} ${Math.round(H)}`);
        G = { X0, L, LM, HB, Y, ROD };
        // embout Luer-lock à vis
        el("rect", { x: X0 - lu - 6, y: Y + HB / 2 - HB * .12, width: lu * .45, height: HB * .24, fill: "#e8edf0", stroke: "#7d8a90" }, svg);
        el("rect", { x: X0 - lu * .6, y: Y + HB * .2, width: lu * .6, height: HB * .6, rx: 4, fill: "rgba(240,246,249,.95)", stroke: "#7d8a90" }, svg);
        for (let i = 0; i < 4; i++) el("line", { x1: X0 - lu * .55 + i * lu * .13, x2: X0 - lu * .5 + i * lu * .13, y1: Y + HB * .2, y2: Y + HB * .8, stroke: "#8a969d", "stroke-width": 1.4 }, svg);
        // corps transparent
        el("rect", { x: X0, y: Y, width: fin - X0, height: HB, rx: 6, fill: "url(#g-verre)", stroke: "#56656d", "stroke-width": 2 }, svg);
        svg.liq = el("rect", { x: X0 + 1, y: Y + 2, height: HB - 4, fill: "#bfe0f0" }, svg);
        svg.air = el("rect", { x: X0 + 1, y: Y + 2, height: HB - 4, fill: "#ffffff", opacity: .9 }, svg);
        // piston : joint noir à nervures, tige en croix, poussoir rond
        svg.pis = el("g", {}, svg);
        const jw = HB * RAP.joint;
        el("rect", { x: jw, y: Y + HB * .2, width: ROD, height: HB * .6, fill: "rgba(225,231,234,.75)", stroke: "#9aa3a8" }, svg.pis);
        el("rect", { x: jw, y: Y + HB / 2 - HB * .07, width: ROD, height: HB * .14, fill: "url(#g-tige)", stroke: "#8a9399" }, svg.pis);
        el("rect", { x: jw + ROD, y: Y + HB / 2 - HB * RAP.poussoir / 2, width: Math.max(8, HB * .12), height: HB * RAP.poussoir, rx: 5, fill: "url(#g-tige)", stroke: "#8a9399" }, svg.pis);
        el("path", { d: `M0 ${Y + 2} h${jw} v${HB - 4} h${-jw} q-3 0 -3 -3 v${-(HB - 10)} q0 -3 3 -3 z`, fill: "#1e1e1e" }, svg.pis);
        for (const f of [.3, .55, .8]) el("line", { x1: jw * f, x2: jw * f, y1: Y + 2, y2: Y + HB - 2, stroke: "#4d4d4d", "stroke-width": 1.6 }, svg.pis);
        // ailettes larges
        el("rect", { x: fin - 2, y: Y + HB / 2 - HB * RAP.ailettes / 2, width: Math.max(8, HB * RAP.ailEp), height: HB * RAP.ailettes, rx: 5, fill: "url(#g-tige)", stroke: "#8a9399" }, svg);
        // graduation noire
        const [p, P] = mod.pas;
        for (let k = 0; k * p <= (mod.grad ?? mod.max) + 1e-9; k++) {
          const v = k * p, x = X0 + L * v / cap, maj = Math.abs(v / P - Math.round(v / P)) < 1e-6;
          el("line", { x1: x, x2: x, y1: Y, y2: Y + HB * (maj ? .45 : .25), stroke: "#1f2328", "stroke-width": maj ? 2.2 : 1 }, svg);
          if (maj && !(mod.mL && Math.abs(v - mod.mL) < 1e-6)) txt(fmt(v), { x, y: Y + HB + 30, "text-anchor": "middle", "font-size": 24, "font-weight": 800, fill: "var(--ink)" }, svg);
        }
        txt("mL", { x: X0 + L * (mod.grad ?? mod.max) / cap + 30, y: Y + HB + 30, "font-size": 20, "font-weight": 800, fill: "var(--muted)" }, svg);
        svg.rep = el("g", {}, svg);
        el("path", { d: "M0 0 l-11 -16 h22 z", fill: "#a8191a" }, svg.rep);
        el("line", { x1: 0, x2: 0, y1: 0, y2: HB + 4, stroke: "#a8191a", "stroke-width": 3 }, svg.rep);
        svg.repT = txt("", { x: 0, y: -20, "text-anchor": "middle", "font-size": 26, "font-weight": 900, fill: "#a8191a" }, svg.rep);
        svg.cib = el("g", {}, svg);
        el("line", { x1: 0, x2: 0, y1: Y - 6, y2: Y + HB + 8, stroke: "#1f5f99", "stroke-width": 4, "stroke-dasharray": "6 4" }, svg.cib);
        svg.cibT = txt("", { x: 0, y: Y + HB + 56, "text-anchor": "middle", "font-size": 20, "font-weight": 900, fill: "#1f5f99" }, svg.cib);
      }
      const { X0, L, LM, HB, Y } = G, mx = mod.max / cap;
      const xv = X0 + L * Math.min(mx, sy.vol / cap), xa = X0 + L * Math.min(mx, (sy.vol + sy.air) / cap);
      const airDebut = sy.ac > .5;
      svg.liq.setAttribute("x", airDebut ? X0 + L * sy.air / cap : X0); svg.liq.setAttribute("width", Math.max(0, L * sy.vol / cap));
      svg.liq.setAttribute("fill", sy.liq || "#bfe0f0");
      svg.air.setAttribute("x", airDebut ? X0 : xv); svg.air.setAttribute("width", Math.max(0, L * sy.air / cap));
      svg.pis.setAttribute("transform", `translate(${xa} 0)`);
      svg.rep.setAttribute("transform", `translate(${xv} ${Y - 2})`);
      svg.repT.setAttribute("x", Math.max(X0 + 30, xv) - xv);
      svg.rep.style.opacity = sy.vol > 0.001 ? 1 : 0;
      svg.repT.textContent = `${fmtV(sy.vol)} ml`;
      const aC = sy.cible != null && sy.cible < sy.vol - 1e-6;
      svg.cib.style.display = aC ? "" : "none";
      if (aC) { const xc = X0 + L * sy.cible / cap; svg.cib.setAttribute("transform", `translate(${xc} 0)`); svg.cibT.textContent = `pousser jusqu'à ${fmt(sy.cible)} ml`; svg.cibT.setAttribute("x", Math.max(X0 + 130, xc) - xc); }
      tete.innerHTML = `<b>Seringue de ${fmt(cap)} ml</b> <span title="La couleur du liquide sert à repérer le médicament, ce n'est pas sa couleur réelle.">${sy.pisu ? sy.pisu : "taille non précisée par le PISU"}</span><em>${sy.air > 0.001 ? "air à chasser" : ""}</em>`;
      d.style.display = "";
    }
    d.style.display = "none";
    return { dessiner, cacher() { d.style.display = "none"; cle = ""; } };
  }

  // ------------------------------------------------------------- commandes de lecture (les mêmes partout)
  function barreLecture(parent) {
    const d = document.createElement("div"); d.className = "lecture"; parent.appendChild(d);
    const mk = (cls, html, label) => { const b = document.createElement("button"); b.type = "button"; b.className = "b " + cls; b.innerHTML = html; b.setAttribute("aria-label", label); d.appendChild(b); return b; };
    return {
      el: d,
      ret: mk("l-ret", "◀<span> Retour</span>", "Étape précédente"),
      lect: mk("l-lect", "❚❚<span> Pause</span>", "Pause"),
      suiv: mk("l-suiv go", "<span>Suivant </span>▶", "Étape suivante"),
      majLect(enLecture) { this.lect.innerHTML = enLecture ? "❚❚<span> Pause</span>" : "▶<span> Lecture</span>"; this.lect.setAttribute("aria-label", enLecture ? "Pause" : "Lecture"); },
    };
  }
  const mouvementReduit = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  // lance une fonction quand l'élément arrive à l'écran (une fois), sauf si l'utilisateur limite les animations
  function auVisible(elm, f) {
    if (mouvementReduit() || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); f(); } }, { threshold: .2 });
    io.observe(elm);
  }

  // ------------------------------------------------------------- lecteur
  function lecteur(conteneur, def, opts = {}) {
    conteneur.textContent = "";
    const wrap = document.createElement("div"); wrap.className = "scene-wrap"; conteneur.appendChild(wrap);
    const svg = el("svg", { viewBox: `0 -100 ${W} ${H + 100}`, class: "scene", role: "img", "aria-label": def.titre || def.nom || "scène animée" }, wrap);
    const motPhase = document.createElement("div"); motPhase.className = "mot-phase"; motPhase.setAttribute("aria-hidden", "true"); wrap.appendChild(motPhase);
    const dit = document.createElement("div"); dit.className = "annonce"; dit.setAttribute("role", "status"); dit.hidden = true; wrap.appendChild(dit);
    const leg = document.createElement("p"); leg.className = "legende"; leg.setAttribute("aria-live", "polite"); conteneur.appendChild(leg);
    const J = jauge(conteneur, false);
    const B = barreLecture(conteneur);
    if (opts.compact) conteneur.classList.add("lecteur-compact");
    const N = def.etapes.length;
    const frise = document.createElement("input");
    Object.assign(frise, { type: "range", min: 0, max: N, step: 1, value: 0, className: "frise-range" });
    frise.setAttribute("aria-label", "Avancement de l'animation");
    conteneur.appendChild(frise);
    const ol = document.createElement("ol"); ol.className = "etapes"; conteneur.appendChild(ol);
    def.etapes.forEach((e, i) => {
      const li = document.createElement("li"); li.innerHTML = e.t; if (e.src) li.innerHTML += ` <span class="src">${e.src}</span>`;
      li.addEventListener("click", ev => { if (ev.target.closest("a")) return; pause(); allerA(i + 1); }); li.style.cursor = "pointer"; ol.appendChild(li);
    });
    let E, n = 0, occupe = false, cible = null, enLecture = false, motCour = "";
    const majLegende = () => { leg.innerHTML = `<b>${n || 0}/${N}</b>${motCour ? ` <span class="mot">${motCour}</span>` : ""} ${def.etapes[Math.max(0, n - 1)].t}`; };

    function monter() {
      svg.textContent = "";
      J.cacher();
      E = moteur(svg);
      E.S.onSer = sy => { if (sy.jauge === false) return; J.dessiner(sy); if (opts.surSer) opts.surSer(sy); };
      motPhase.textContent = ""; motCour = "";
      E.S.onPhase = m => { motCour = m; majLegende(); };
      dit.hidden = true;
      E.S.onAnnonce = t => { dit.innerHTML = `<small>À voix haute</small>${t}`; dit.hidden = false; dit.classList.remove("pop"); void dit.offsetWidth; dit.classList.add("pop"); };
      for (const [id, spec] of Object.entries(def.objets)) {
        const [type, ...args] = spec.f;
        const o = FABRIQUE[type](...args);
        Object.assign(o, { x: spec.x, y: spec.y, r: spec.r || 0, s: spec.s || ECH[type] || 1, op: spec.op ?? 1, vis: 1 });
        E.objet(id, o);
      }
      const s0 = Object.values(E.S.objs).find(o => o.cap && o.jauge !== false);
      if (s0) J.dessiner(s0);
      Object.entries(E.S.objs).forEach(([id, o]) => { if (passager(id) && usage[id]) { o.vis = 0; o.place(); } });
      poserVB([0, -100, W, H + 100]);
      E.S.vitesse = 0; cadrer(0, 0);
    }
    // Cadrage : seuls les objets utiles à la phase sont à l'écran ; le collecteur et la sacoche n'entrent qu'au moment
    // où ils servent ; la caméra (viewBox) suit le geste.
    const usage = {};
    const DEF_VERS = { jeter: "dasri", trocart: "dasri", ranger: "sac" };   // la tête d'ampoule cassée file vers le collecteur hors cadre
    def.etapes.forEach((e, i) => (e.a || []).forEach(a => {
      const refs = a.slice(1).filter(v => typeof v === "string" && def.objets[v]);
      if (DEF_VERS[a[0]] && def.objets[DEF_VERS[a[0]]] && !a.slice(2).some(v => typeof v === "string" && def.objets[v] && v !== a[1])) refs.push(DEF_VERS[a[0]]);
      refs.forEach(v => (usage[v] = usage[v] || new Set()).add(i));
    }));
    const passager = id => /^(dasri|sac)/.test(id);
    // une étape sans objet garde le cadre de l'étape voisine (la suivante pour la première, sinon la précédente)
    const aRefs = i => Object.values(usage).some(u => u.has(i));
    const etapeCadre = i => { if (aRefs(i)) return i; if (i === 0) { for (let j = 0; j < def.etapes.length; j++) if (aRefs(j)) return j; return 0; } for (let j = i; j >= 0; j--) if (aRefs(j)) return j; return i; };
    const visibleA = (id, i) => {
      const u = usage[id]; if (!u) return true;
      if (passager(id)) return u.has(i);
      const l = [...u]; return i >= Math.min(...l) && i <= Math.max(...l) || (i > Math.max(...l) && def.objets[id].f[0] === "seringue");
    };
    let vb = [0, -100, W, H + 100];
    const ratioVue = () => { const r = svg.getBoundingClientRect(); return r.width > 20 && r.height > 20 ? r.width / r.height : W / (H + 100); };
    function poserVB(v) { vb = v; if (E) E.S.vb = v; svg.setAttribute("viewBox", v.map(x => Math.round(x * 10) / 10).join(" ")); }
    async function cadrer(i0, vit) {
      const i = etapeCadre(i0), objs = E.S.objs, tw = [];
      const appliquer = (dansCadre) => { for (const [id, o] of Object.entries(objs)) {
        const v = visibleA(id, i) && dansCadre(id, o) ? 1 : 0;
        if (o.vis === v) continue;
        if (passager(id)) { const y1 = o.y; o.y0 = o.y0 ?? y1; if (v) { o.y = o.y0 + 260; o.vis = 1; o.place(); tw.push(E.bouger(o, o.x, o.y0, o.r, 600)); } else tw.push(E.bouger(o, o.x, o.y0 + 260, o.r, 500).then(() => { o.vis = 0; o.y = o.y0; o.place(); })); }
        else { const v0 = o.vis ?? 1; tw.push(E.tween(400, t => { o.vis = v0 + (v - v0) * t; o.place(); })); }
      } };
      // boîte englobante des objets visibles et des points où va la seringue
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      const inclure = (ax, ay, bx, by) => { x0 = Math.min(x0, ax); y0 = Math.min(y0, ay); x1 = Math.max(x1, bx); y1 = Math.max(y1, by); };
      const refsIci = Object.keys(usage).filter(id => usage[id].has(i) && objs[id] && (objs[id].op ?? 1) !== 0);
      const boite = {};
      for (const [id, o] of Object.entries(objs)) {
        if (!visibleA(id, i) || o.op === 0) continue;
        if (refsIci.length && !refsIci.includes(id)) { try { const b = o.g.getBBox(); if (b.width) { const sc = o.s || 1, inv = Math.abs(((o.r || 0) % 360 + 360) % 360 - 180) < 30; boite[id] = [o.x + b.x * sc, inv ? o.y - (b.y + b.height) * sc : o.y + b.y * sc, o.x + (b.x + b.width) * sc, inv ? o.y - b.y * sc : o.y + (b.y + b.height) * sc]; } } catch (e) {} continue; }
        let b; try { b = o.g.getBBox(); } catch (e) { continue; }
        if (!b.width) continue;
        if (o.zone) b = { x: o.zone[0], y: o.zone[1], width: o.zone[2] - o.zone[0], height: o.zone[3] - o.zone[1] };
        const sc = o.s || 1, inv = Math.abs(((o.r || 0) % 360 + 360) % 360 - 180) < 30;
        inclure(o.x + b.x * sc, inv ? o.y - (b.y + b.height) * sc : o.y + b.y * sc, o.x + (b.x + b.width) * sc, inv ? o.y - b.y * sc : o.y + (b.y + b.height) * sc);
      }
      (def.etapes[i].a || []).forEach(a => { if (["purger", "aller", "deconnecter"].includes(a[0]) && typeof a[2] === "number") { const o = objs[a[1]]; const L = o && o.cap ? 260 : 80; inclure(a[2] - 40, a[3] - 20, a[2] + 40, a[3] + L); } });
      if (!isFinite(x0)) { appliquer(() => true); return Promise.all(tw); }
      const pad = 18, ratio = ratioVue();
      // les objets utiles occupent la hauteur de la vue ; la largeur suit le format de l'écran
      let h = Math.max(140, (y1 - y0) / .84), w = h * ratio;
      if (w < x1 - x0 + 2 * pad) { w = x1 - x0 + 2 * pad; h = w / ratio; }
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      const cible = [cx - w / 2, cy - h / 2, w, h];
      // un objet visible mais hors du geste en cours s'efface s'il ne tient pas dans le cadre ; il revient quand il resert
      appliquer((id) => { const q = boite[id]; if (!q) return true; return q[0] >= cible[0] - 2 && q[1] >= cible[1] - 2 && q[2] <= cible[0] + cible[2] + 2 && q[3] <= cible[1] + cible[3] + 2; });
      const dep = vb.slice();
      tw.push(E.tween(700, t => poserVB(dep.map((v, k) => v + (cible[k] - v) * t))));
      await Promise.all(tw);
    }
    // avant un déplacement : si l'objet va sortir du cadre, la caméra recule pour le garder entier
    function boiteA(o, x, y, r, sc) {
      let b; try { b = o.g.getBBox(); } catch (e) { return null; }
      const inv = Math.abs(((r || 0) % 360 + 360) % 360 - 180) < 30, ext = o.cap ? 60 : 0;
      return inv ? [x + b.x * sc, y - (b.y + b.height) * sc, x + (b.x + b.width) * sc, y - b.y * sc + ext] : [x + b.x * sc, y + b.y * sc - ext, x + (b.x + b.width) * sc, y + (b.y + b.height) * sc];
    }
    async function garder(o, x, y, r, sc) {
      if ((o.op ?? 1) * (o.vis ?? 1) === 0) return;
      if (S0.refs && S0.refs.length && !S0.refs.includes(o.id)) return;
      const bb = boiteA(o, x, y, r, sc || 1); if (!bb) return;
      const m = 14, [vx, vy, vw, vh] = vb;
      if (bb[0] >= vx + m && bb[1] >= vy + m && bb[2] <= vx + vw - m && bb[3] <= vy + vh - m) return;
      let x0 = Math.min(vx, bb[0] - m), y0 = Math.min(vy, bb[1] - m), x1 = Math.max(vx + vw, bb[2] + m), y1 = Math.max(vy + vh, bb[3] + m);
      const ratio = ratioVue(); let w = x1 - x0, h = y1 - y0;
      if (w / h < ratio) { const d = h * ratio - w; x0 -= d / 2; w = h * ratio; } else { const d = w / ratio - h; y0 -= d / 2; h = w / ratio; }
      const dep = vb.slice(), cible = [x0, y0, w, h];
      await E.tween(350, t => poserVB(dep.map((v, k) => v + (cible[k] - v) * t)));
    }
    const S0 = {};
    async function jouer(i, vit) {
      E.S.vitesse = vit;
      dit.hidden = true;
      S0.refs = Object.keys(usage).filter(id => usage[id].has(i));
      E.S.avantMouv = (o, x, y, r, sc) => garder(o, x, y, r, sc);
      await cadrer(i, vit);
      for (const a of def.etapes[i].a || []) { const [nom, ...args] = a; await ACTIONS[nom](E, ...args); }
      // fin d'étape : tout ce qui reste visible tient dans le cadre
      for (const o of Object.values(E.S.objs)) await garder(o, o.x, o.y, o.r, o.s);
    }
    function maj() {
      [...ol.children].forEach((li, i) => { li.className = i < n - 1 ? "fait" : i === n - 1 ? "ici" : ""; });
      B.ret.disabled = n === 0; B.suiv.disabled = n >= N;
      B.majLect(enLecture);
      frise.value = n;
      if (opts.surChange) opts.surChange(enLecture);
      majLegende();
    }
    // aller à l'étape k : on replace la scène d'un coup jusqu'à k-1, puis on anime l'étape k (sauf « instant »)
    async function allerA(k, instant = false) {
      k = Math.max(0, Math.min(N, k));
      if (occupe) { cible = [k, instant]; return; }
      occupe = true;
      try {
        if (k <= n) { monter(); for (let i = 0; i < k - 1; i++) await jouer(i, 0); }
        else { for (let i = n; i < k - 1; i++) await jouer(i, 0); }
        n = k; maj();
        if (k > 0) await jouer(k - 1, instant ? 0 : 1);
      } finally { occupe = false; maj(); }
      if (cible) { const [k2, i2] = cible; cible = null; await allerA(k2, i2); }
    }
    async function lecture() {
      if (enLecture) return;
      enLecture = true; maj();
      if (n >= N) { monter(); n = 0; }
      while (enLecture && n < N && conteneur.isConnected) { await allerA(n + 1); if (enLecture) await sleep(600); }
      enLecture = false; maj();
    }
    function pause() { enLecture = false; maj(); }
    B.lect.onclick = () => (enLecture ? pause() : lecture());
    B.ret.onclick = () => { pause(); allerA(n - 1); };
    B.suiv.onclick = () => { pause(); allerA(n + 1); };
    frise.addEventListener("input", () => { pause(); allerA(+frise.value, true); });
    wrap.addEventListener("click", () => (enLecture ? pause() : lecture()));
    monter(); maj();
    if (opts.auto !== false) auVisible(wrap, lecture);
    // état lisible par les tests de bout en bout (tests/e2e.mjs)
    conteneur.__etat = () => ({ n, N, enLecture, occupe, objs: E.S.objs });
    return { svg, stop() { enLecture = false; maj(); }, lecture, pause, get enLecture() { return enLecture; }, set surChange(f) { opts.surChange = f; } };
  }

  // ------------------------------------------------------------- scène de l'intervention (page protocole)
  function vli(parent, x, y, sens = 1, ech = 1) {
    const g = el("g", { transform: `translate(${x} ${y}) scale(${sens * ech} ${ech})` }, parent);
    const add = (t, a) => el(t, a, g);
    add("path", { d: "M-27 3 L-27 -7 L-25 -11.5 L4 -12 L12 -5.5 L24 -3.5 L27 0 L27 3 Z", fill: "#c62828", stroke: "#5a0b0b", "stroke-width": .8 });
    add("path", { d: "M-23.5 -10.5 L3 -10.8 L9.5 -5.8 L-23.5 -5.8 Z", fill: "#263238" });
    add("path", { d: "M-9 -10.8 v5 M-3 -10.8 v5", stroke: "#c62828", "stroke-width": 1.2 });
    add("rect", { x: -27, y: -5, width: 51, height: 1.6, fill: "#ffeb3b" });
    for (let i = -24; i < 24; i += 4) add("path", { d: `M${i} 2.6 l2 -2.6 h2 l-2 2.6 z`, fill: "#ffeb3b" });
    g.gyro = add("rect", { x: -7, y: -14.5, width: 14, height: 2.5, rx: 1, fill: "#2196f3" });
    for (const cx of [-16, 16]) { add("circle", { cx, cy: 3.5, r: 4.4, fill: "#212121" }); add("circle", { cx, cy: 3.5, r: 2.2, fill: "#b0bec5" }); }
    add("path", { d: "M23.5 -2.5 l3 .6 v1.4 l-3 -.4 z", fill: "#fff59d" });
    return g;
  }
  const ICONES = {
    titre: "▶", question: "?", medicament: "💉", action: "✚", appel: "☎ 15", orientation: "➜", renvoi: "↪", fin: "✓",
  };
  // scène de l'étape : la victime, l'ISP et l'appareil ou le geste de CETTE étape, cadrés serré
  function intervention(conteneur) {
    const svg = el("svg", { viewBox: "0 0 400 170", class: "scene scene-int", role: "img", "aria-hidden": "true", preserveAspectRatio: "xMidYMid meet" }, conteneur);
    if (!svg.querySelector("defs")) el("defs", {}, svg).innerHTML = DEFS;
    el("rect", { x: 0, y: 150, width: 400, height: 20, fill: "var(--box)" }, svg);
    const vic = el("g", { transform: "translate(270 142)" }, svg);
    el("rect", { x: -62, y: -11, width: 112, height: 20, rx: 10, fill: "#5f6670" }, vic);
    el("circle", { cx: 64, cy: -1, r: 12, fill: "var(--peau)", stroke: "var(--peau-line)" }, vic);
    const isp = el("g", { transform: "translate(372 146)" }, svg);
    el("path", { d: "M-14 4 L-10 -30 Q0 -40 12 -30 L16 0 L26 4 Z", fill: "#1d3d73" }, isp);
    el("rect", { x: -11, y: -22, width: 24, height: 5, fill: "#ffeb3b" }, isp);
    el("circle", { cx: 2, cy: -48, r: 11, fill: "var(--peau)", stroke: "var(--peau-line)" }, isp);
    el("path", { d: "M-11 -53 Q2 -66 15 -53 Z", fill: "#a8191a" }, isp);
    const dev = el("g", {}, svg);
    dev.style.transition = "opacity .35s ease, transform .35s ease";
    const T = (t, a) => txt(t, Object.assign({ "text-anchor": "middle", "font-weight": 900 }, a), dev);
    const D = {
      defib: () => {   // défibrillateur avec écran de tracé, électrodes reliées au thorax
        el("rect", { x: 20, y: 40, width: 130, height: 100, rx: 12, fill: "#f2c200", stroke: "#8a6d00", "stroke-width": 2 }, dev);
        el("rect", { x: 32, y: 52, width: 106, height: 46, rx: 4, fill: "#10212b" }, dev);
        el("polyline", { class: "trace", points: "36,76 50,76 54,64 58,90 62,70 66,80 70,76 84,76 88,64 92,90 96,70 100,80 104,76 134,76", fill: "none", stroke: "#4cff7a", "stroke-width": 2 }, dev);
        el("circle", { cx: 60, cy: 118, r: 11, fill: "#d32f2f", stroke: "#7f0000" }, dev);
        T("⚡", { x: 60, y: 123, "font-size": 13, fill: "#fff" });
        el("circle", { cx: 110, cy: 118, r: 9, fill: "#1f5f99" }, dev);
        el("path", { d: "M150 100 Q200 120 232 132 M150 110 Q210 140 262 136", fill: "none", stroke: "#333", "stroke-width": 2 }, dev);
        el("rect", { x: 226, y: 126, width: 14, height: 10, fill: "#eee", stroke: "#666" }, dev); el("rect", { x: 256, y: 128, width: 14, height: 10, fill: "#eee", stroke: "#666" }, dev);
      },
      telephone: () => {
        el("rect", { x: 50, y: 36, width: 70, height: 110, rx: 12, fill: "#10212b", stroke: "#333" }, dev);
        el("rect", { x: 57, y: 46, width: 56, height: 82, rx: 4, fill: "#1f5f99" }, dev);
        T("15", { x: 85, y: 96, "font-size": 30, fill: "#fff" });
        [26, 38].forEach(r => el("path", { class: "onde", d: `M${120 + r} 70 a${r} ${r} 0 0 1 0 40`, fill: "none", stroke: "#1f5f99", "stroke-width": 3 }, dev));
      },
      glucometre: () => {
        el("rect", { x: 40, y: 50, width: 80, height: 96, rx: 14, fill: "#eceff1", stroke: "#607d8b", "stroke-width": 2 }, dev);
        el("rect", { x: 50, y: 60, width: 60, height: 36, rx: 4, fill: "#c8e6c9", stroke: "#607d8b" }, dev);
        T("g/l", { x: 80, y: 84, "font-size": 14, fill: "#10212b" });
        el("rect", { x: 74, y: 140, width: 12, height: 22, fill: "#fff", stroke: "#607d8b" }, dev);
        el("path", { d: "M180 120 c-4 6 -8 10 -8 14 a8 8 0 0 0 16 0 c0 -4 -4 -8 -8 -14z", fill: "#c62828" }, dev);
      },
      tension: () => {
        el("circle", { cx: 80, cy: 80, r: 42, fill: "#fff", stroke: "#455a64", "stroke-width": 3 }, dev);
        for (let i = 0; i < 12; i++) { const a = (i / 12) * 2 * Math.PI; el("line", { x1: 80 + 34 * Math.cos(a), y1: 80 + 34 * Math.sin(a), x2: 80 + 40 * Math.cos(a), y2: 80 + 40 * Math.sin(a), stroke: "#455a64", "stroke-width": 2 }, dev); }
        el("line", { class: "aiguille-m", x1: 80, y1: 80, x2: 104, y2: 60, stroke: "#c62828", "stroke-width": 3 }, dev);
        el("path", { d: "M80 122 Q120 150 210 134", fill: "none", stroke: "#455a64", "stroke-width": 3 }, dev);
        el("rect", { x: 200, y: 124, width: 34, height: 20, rx: 4, fill: "#1f5f99" }, dev);
        T("PA", { x: 80, y: 30, "font-size": 16, fill: "var(--ink)" });
      },
      vvp: () => {
        el("path", { d: "M20 120 Q120 108 230 118 Q250 122 252 132 Q240 142 220 142 Q120 150 20 146 Z", fill: "var(--peau)", stroke: "var(--peau-line)" }, dev);
        el("rect", { x: 140, y: 120, width: 26, height: 12, rx: 3, fill: "#2e7d32", stroke: "#1b5e20" }, dev);
        el("path", { d: "M166 126 Q200 100 200 60 L200 30", fill: "none", stroke: "#9fb3ba", "stroke-width": 4 }, dev);
        el("path", { d: "M186 10 h28 l-4 20 h-20 z", fill: "rgba(220,240,250,.9)", stroke: "#6f7f88" }, dev);
      },
      medicament: () => {
        el("rect", { x: 60, y: 50, width: 24, height: 90, rx: 4, fill: "url(#g-verre)", stroke: "#2e7d32", "stroke-width": 2 }, dev);
        el("rect", { x: 63, y: 96, width: 18, height: 42, fill: "#bfe0f0" }, dev);
        el("rect", { x: 68, y: 20, width: 8, height: 30, fill: "#b9c0c4" }, dev);
        el("rect", { x: 56, y: 16, width: 32, height: 6, rx: 3, fill: "#b9c0c4" }, dev);
        el("line", { x1: 72, x2: 72, y1: 140, y2: 166, stroke: "#6d777d", "stroke-width": 2 }, dev);
      },
      aerosol: () => {
        el("path", { d: "M60 60 Q100 20 140 60 Q150 96 116 110 L84 110 Q50 96 60 60 Z", fill: "rgba(220,236,242,.9)", stroke: "#5f8796", "stroke-width": 3 }, dev);
        el("rect", { x: 88, y: 110, width: 24, height: 34, rx: 5, fill: "#e8f2f6", stroke: "#5f8796" }, dev);
        [0, 1, 2].forEach(i => el("circle", { class: "onde", cx: 90 + i * 10, cy: 70 - i * 8, r: 5 + i, fill: "#fff", opacity: .9 }, dev));
        T("O₂", { x: 160, y: 140, "font-size": 18, fill: "#2b8a3e" });
      },
      rcp: () => {
        el("path", { d: "M180 70 L200 120 L230 120 L210 70 Z", fill: "#1d3d73" }, dev);
        el("rect", { x: 190, y: 112, width: 50, height: 14, rx: 6, fill: "var(--peau)", stroke: "var(--peau-line)" }, dev);
        el("path", { class: "onde", d: "M215 96 v-14 M205 100 l-8 -10 M225 100 l8 -10", stroke: "#c62828", "stroke-width": 3 }, dev);
        T("RCP", { x: 100, y: 90, "font-size": 30, fill: "#c62828" });
      },
      ecrit: () => {
        el("rect", { x: 50, y: 30, width: 80, height: 110, rx: 6, fill: "#fff", stroke: "#78909c", "stroke-width": 2 }, dev);
        el("rect", { x: 72, y: 22, width: 36, height: 14, rx: 3, fill: "#78909c" }, dev);
        [56, 74, 92, 110].forEach(y => el("line", { x1: 62, x2: 118, y1: y, y2: y, stroke: "#b0bec5", "stroke-width": 3 }, dev));
        el("path", { d: "M62 56 l6 6 l10 -12", stroke: "#2e7d32", "stroke-width": 3, fill: "none" }, dev);
      },
      vli: () => { const g = el("g", {}, dev); vli(g, 0, 0, 1, 3.2); g.setAttribute("transform", "translate(100 140)"); g.classList.add("vli-move"); },
      hemorragie: () => { el("path", { d: "M90 40 C78 64 64 80 64 98 A26 26 0 0 0 116 98 C116 80 102 64 90 40 Z", fill: "#c62828" }, dev); },
      douleur: () => {
        for (let i = 0; i <= 10; i++) el("rect", { x: 20 + i * 14, y: 80, width: 12, height: 22, rx: 2, fill: `hsl(${120 - i * 12} 70% 45%)` }, dev);
        T("EN", { x: 95, y: 70, "font-size": 18, fill: "var(--ink)" });
      },
    };
    function choisir(kind, t) {
      t = (t || "").toLowerCase();
      if (kind === "appel") return "telephone";
      if (/choc|dsa|défibr|rythme/.test(t)) return "defib";
      if (/glyc|resucr|sucre|g30|g 30/.test(t)) return "glucometre";
      if (/pas |pas<|pas ≤|pas >|tension|pression art|objectif tensionnel/.test(t)) return "tension";
      if (/aérosol|nébul|dyspnée|respir/.test(t)) return "aerosol";
      if (/rcp|massage|acr|arrêt cardio/.test(t)) return "rcp";
      if (/hémorrag|saign|garrot|ceinture/.test(t)) return "hemorragie";
      if (/\ben\b|douleur|antalg/.test(t)) return "douleur";
      if (kind === "medicament") return "medicament";
      if (/vvp|perfus|io\b|ez-io|nacl|ringer/.test(t)) return "vvp";
      if (kind === "titre" || kind === "orientation") return "vli";
      return "ecrit";
    }
    let anim = null;
    function montrer(kind, texte) {
      clearInterval(anim);
      dev.textContent = "";
      const c = choisir(kind, texte);
      D[c]();
      dev.style.opacity = 0; requestAnimationFrame(() => requestAnimationFrame(() => { dev.style.opacity = 1; }));
      if (mouvementReduit()) return;
      let k = 0;
      anim = setInterval(() => {
        k++;
        dev.querySelectorAll(".onde").forEach((o, i) => o.setAttribute("opacity", (k + i) % 2 ? .25 : 1));
        const tr = dev.querySelector(".trace"); if (tr) tr.setAttribute("transform", `translate(${-(k % 6) * 6} 0)`);
        const ai = dev.querySelector(".aiguille-m"); if (ai) ai.setAttribute("x2", 104 - (k % 4) * 4);
      }, 380);
      setTimeout(() => clearInterval(anim), 6000);
    }
    return { montrer, svg };
  }

  // sacoche des stupéfiants (reprise du dessin des boîtes à morphine) : 5 places, pleines en haut, vides en bas
  function sacoche() {
    return {
      places: 0,
      dessiner(g) {
        el("rect", { x: -110, y: -60, width: 220, height: 104, rx: 12, fill: "#3d5a80" }, g);
        txt("SACOCHE : 5 PLACES", { x: -98, y: -42, "font-size": 12, "font-weight": 800, fill: "#fff" }, g);
        txt("PLEINES", { x: -98, y: -12, "font-size": 10.5, "font-weight": 700, fill: "#fff" }, g);
        txt("VIDES", { x: -98, y: 24, "font-size": 10.5, "font-weight": 700, fill: "#fff" }, g);
        for (let k = 0; k < 5; k++) for (const y of [-16, 20]) {
          el("circle", { cx: -30 + k * 30, cy: y, r: 12, fill: "#6f6d66" }, g);
          txt(String(k + 1), { x: -30 + k * 30, y: y + 4, "text-anchor": "middle", "font-size": 10, "font-weight": 700, fill: "#f2c9c9" }, g);
        }
      },
      bouche: [90, 20],
    };
  }

  // ------------------------------------------------------------- dessins de présentation (quand il n'y a pas de photo)
  function dessinProduit(def) {
    const svg = el("svg", { viewBox: "-120 -280 240 320", role: "img", "aria-label": "dessin de la présentation" });
    const E = moteur(svg); E.S.vitesse = 0;
    const [type, ...args] = def.f;
    const o = FABRIQUE[type](...args); Object.assign(o, { x: def.x || 0, y: def.y || 0, s: def.s || 1.2, r: def.r || 0 });
    E.objet("p", o);
    return svg;
  }

  window.PISU_SCENES = { sonActif, lecteur, dessinProduit, intervention, barreLecture, auVisible, mouvementReduit, COUL };
})();
