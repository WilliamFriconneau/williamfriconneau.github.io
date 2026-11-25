/* Injections répétées dans un même protocole : la seringue préparée est gardée et resservie.
   Chaque dose est recopiée du nœud du logigramme (PISU 2024) ; v = variante de préparation de la fiche M.
   mg : dose fixe ; mgkg + max : dose au poids ; mlkg + maxml : volume au poids ; choix : la dose dépend d'un critère du PISU.
   Le PISU ne dit pas comment la seringue est gardée entre deux injections. */
(() => {
  const ADRE_ACR_A = { m: "M3", v: 0, mg: 1 };
  const ADRE_ACR_E = { m: "M3", v: 1, mgkg: 0.01, max: 1 };
  const ADRE_IM = { m: "M3", v: 2, mgkg: 0.01, max: 0.5, voie: "IM" };
  const MORPHINE_A = { m: "M7", choix: [
    { lab: "≥ 60 kg et < 75 ans : 3 mg", v: 0, mg: 3 },
    { lab: "< 60 kg ou ≥ 75 ans : 2 mg", v: 0, mg: 2 },
  ] };
  const MORPHINE_E = { m: "M7", choix: [
    { lab: "< 40 kg : 0,05 mg/kg", v: 1, mgkg: 0.05 },
    { lab: "≥ 40 kg : 2 mg", v: 0, mg: 2 },
  ] };
  window.PISU_DOSES = {
    "1A": { c1: [ADRE_ACR_A, { m: "M4", v: 0, mg: 300 }], c2: [ADRE_ACR_A, { m: "M4", v: 1, mg: 150 }], c3: [ADRE_ACR_A], b1: [ADRE_ACR_A], b2: [ADRE_ACR_A] },
    "1E": { c1: [ADRE_ACR_E, { m: "M4", v: 0, mgkg: 5, max: 300 }], c2: [ADRE_ACR_E, { m: "M4", v: 0, mgkg: 5, max: 150 }], c3: [ADRE_ACR_E], b1: [ADRE_ACR_E], b2: [ADRE_ACR_E] },
    "4A": { ar: [ADRE_IM], al: [ADRE_IM], a5: [ADRE_IM] },
    "4E": { ar: [ADRE_IM], al: [ADRE_IM], a5: [ADRE_IM] },
    "5A": { b1: [{ m: "M8", v: 0, mg: 1 }], b2: [{ m: "M8", v: 0, mg: 1 }] },
    "5E": { b2: [{ m: "M8", v: 0, mgkg: 0.05, max: 1.5 }] },
    "8A": { chlor: [MORPHINE_A], morph: [MORPHINE_A], titr: [MORPHINE_A] },
    "8E": { chlor: [MORPHINE_E], morph: [MORPHINE_E] },
    "9A": { vvp: [{ m: "M9", v: 0, mg: 6 }], g2: [{ m: "M9", v: 0, mg: 6 }] },
    "9E": { vvp: [{ m: "M9", v: 0, mlkg: 1, maxml: 30 }] },
  };
})();
