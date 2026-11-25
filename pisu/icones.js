/* Icônes animées du carnet, dessinées en SVG (aucune police ni banque d'icônes). Animation CSS (style.css, « ic- »), coupée si prefers-reduced-motion. */
(() => {
  const S = (inner, label) => `<svg class="ico-anim" viewBox="0 0 64 64" role="img" aria-label="${label}">${inner}</svg>`;
  const I = {
    1: () => S(`<path class="ic-coeur" d="M32 54 C10 38 6 26 12 18 C18 10 28 12 32 20 C36 12 46 10 52 18 C58 26 54 38 32 54 Z" fill="#d32f2f"/>
      <polyline class="ic-ecg" points="4,34 18,34 22,26 27,44 31,20 35,34 60,34" fill="none" stroke="#fff" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>`, "arrêt cardio-respiratoire"),
    2: () => S(`<g class="ic-poumons"><path d="M29 14 V30 Q20 22 13 30 Q6 40 8 50 Q10 56 18 54 Q28 50 29 40 Z" fill="#e57373"/><path d="M35 14 V30 Q44 22 51 30 Q58 40 56 50 Q54 56 46 54 Q36 50 35 40 Z" fill="#e57373"/></g>
      <path d="M32 6 V30 M32 30 L24 36 M32 30 L40 36" stroke="#8d6e63" stroke-width="3.5" fill="none" stroke-linecap="round"/>`, "détresse respiratoire"),
    3: () => S(`<path class="ic-goutte" d="M32 8 C24 22 16 30 16 40 A16 16 0 0 0 48 40 C48 30 40 22 32 8 Z" fill="#c62828"/><path d="M24 40 a8 8 0 0 0 6 8" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>`, "hémorragie"),
    4: () => S(`<circle class="ic-gonfle" cx="34" cy="38" r="18" fill="#f8bbd0"/><circle cx="34" cy="38" r="5" fill="#c2185b"/>
      <g transform="rotate(-40 20 20)"><rect x="14" y="4" width="10" height="22" rx="2" fill="#cfd8dc" stroke="#607d8b"/><line x1="19" y1="26" x2="19" y2="36" stroke="#607d8b" stroke-width="2"/></g>`, "réaction anaphylactique"),
    5: () => S(`<path class="ic-eclair" d="M36 4 L14 36 H30 L24 60 L50 24 H34 Z" fill="#fbc02d" stroke="#f57f17" stroke-width="2" stroke-linejoin="round"/>`, "convulsions"),
    6: () => S(`<path class="ic-flamme" d="M32 6 C40 18 50 24 48 40 A16 16 0 0 1 16 40 C14 30 22 26 24 16 C28 22 30 24 32 6 Z" fill="#ff7043"/><path class="ic-flamme2" d="M32 28 C36 34 40 38 38 46 A6 6 0 0 1 26 46 C26 40 30 38 32 28 Z" fill="#ffd54f"/>`, "brûlure"),
    7: () => S(`<circle class="ic-fumee f1" cx="24" cy="46" r="10" fill="#90a4ae"/><circle class="ic-fumee f2" cx="38" cy="34" r="12" fill="#78909c"/><circle class="ic-fumee f3" cx="28" cy="20" r="9" fill="#b0bec5"/>`, "intoxication aux fumées"),
    8: () => S(`<rect x="6" y="40" width="52" height="10" rx="5" fill="url(#ic-deg)"/><defs><linearGradient id="ic-deg"><stop offset="0" stop-color="#66bb6a"/><stop offset=".5" stop-color="#fdd835"/><stop offset="1" stop-color="#e53935"/></linearGradient></defs>
      <path class="ic-curseur" d="M18 36 l6 -10 l6 10 z" fill="var(--ink)"/><path d="M40 8 L30 22 H38 L34 32 L46 16 H38 Z" fill="#e53935"/>`, "antalgie"),
    9: () => S(`<rect x="12" y="20" width="26" height="26" rx="3" fill="#fff" stroke="#9e9e9e" stroke-width="2"/><path d="M12 20 l8 -8 h26 l-8 8 z M38 20 l8 -8 v26 l-8 8 z" fill="#eeeeee" stroke="#9e9e9e" stroke-width="2"/>
      <path class="ic-goutte" d="M50 34 C47 40 44 43 44 47 A6 6 0 0 0 56 47 C56 43 53 40 50 34 Z" fill="#c62828"/>`, "hypoglycémie"),
    AT1: () => S(`<rect x="6" y="10" width="52" height="36" rx="4" fill="#1f5f99"/><polyline class="ic-ecg" points="10,30 22,30 26,20 31,40 35,24 38,30 54,30" fill="none" stroke="#fff" stroke-width="3" stroke-linejoin="round"/><rect x="24" y="48" width="16" height="6" fill="#1f5f99"/>`, "télémédecine douleur thoracique"),
    AT2: () => S(`<circle cx="32" cy="32" r="24" fill="var(--peau)"/><g class="ic-taches"><circle cx="24" cy="26" r="4" fill="#8e24aa"/><circle cx="38" cy="22" r="3" fill="#8e24aa"/><circle cx="36" cy="40" r="5" fill="#8e24aa"/><circle cx="22" cy="40" r="3" fill="#8e24aa"/></g>`, "taches purpuriques"),
    SSO: () => S(`<path d="M32 6 L54 14 V30 C54 44 44 54 32 58 C20 54 10 44 10 30 V14 Z" fill="#e07b00"/><path class="ic-coeur" d="M26 26 h12 M32 20 v12" stroke="#fff" stroke-width="6" stroke-linecap="round"/>`, "soutien sanitaire opérationnel"),
    MED: () => S(`<g class="ic-pilule"><rect x="10" y="22" width="44" height="20" rx="10" fill="#2e7d32"/><rect x="32" y="22" width="22" height="20" rx="10" fill="#a5d6a7"/><rect x="32" y="22" width="12" height="20" fill="#a5d6a7"/></g>`, "médicaments"),
    GESTE: () => S(`<g class="ic-seringue" transform="rotate(-45 32 32)"><rect x="26" y="8" width="12" height="34" rx="2" fill="#e3f2fd" stroke="#546e7a" stroke-width="2"/><rect x="28" y="24" width="8" height="16" fill="#90caf9"/><rect x="30" y="2" width="4" height="8" fill="#90a4ae"/><rect x="24" y="0" width="16" height="4" rx="2" fill="#90a4ae"/><line x1="32" y1="42" x2="32" y2="60" stroke="#546e7a" stroke-width="2"/></g>`, "gestes"),
    ANNEXE: () => S(`<rect x="12" y="8" width="40" height="50" rx="4" fill="#eceff1" stroke="#78909c" stroke-width="2"/><rect x="22" y="4" width="20" height="8" rx="2" fill="#78909c"/><path class="ic-coche" d="M20 32 l7 7 l14 -14" stroke="#2e7d32" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`, "annexes"),
    LOUPE: () => S(`<circle class="ic-loupe" cx="27" cy="27" r="16" fill="none" stroke="var(--red)" stroke-width="6"/><path d="M39 39 L56 56" stroke="var(--red)" stroke-width="8" stroke-linecap="round"/>`, "recherche"),
    REPRENDRE: () => S(`<path class="ic-tourne" d="M32 10 A22 22 0 1 1 10 32" fill="none" stroke="var(--red)" stroke-width="6" stroke-linecap="round"/><path d="M10 18 V34 H26" fill="none" stroke="var(--red)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`, "reprendre"),
  };
  window.PISU_ICONES = code => {
    let m;
    if ((m = /^([1-9])[AE]$/.exec(code))) return I[m[1]]();
    if (code === "1AT") return I.AT1();
    if (code === "2AT") return I.AT2();
    if (/SSO$/.test(code) || code === "GEN-marche-generale") return I.SSO();
    return (I[code] || I.ANNEXE)();
  };
})();
