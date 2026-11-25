/* Préparations animées des fiches M1 à M20.
   Les doses, volumes, dilutions et voies sont recopiés des fiches du PISU 2024 (pages 111 à 152).
   Les gestes (casser, prélever, purger, étiqueter, jeter) renvoient à l'onglet Gestes, qui donne leurs sources.
   Quand le PISU ne dit pas le contenant (NaCl 0,9 %, EPPI), le dessin montre une ampoule : c'est un choix de dessin. */
(() => {
  const C = { clair: "#e4f2f8", morph: "#d6ecf8", g5: "#f3ecd2", g30: "#f1e6b8", rose: "#f6c4d2", rouge: "#d94a4a", jaune: "#f6e7a8", violet: "#d9c4f0" };
  const DASRI = { f: ["collecteur"], x: 572, y: 405 };
  const SAC = { f: ["sacoche"], x: 470, y: -40, s: .8 };
  const amp = (lab, vol, x, liq, o = {}) => ({ f: ["ampoule", lab, vol, Object.assign({ liq }, o)], x, y: 420 });
  const nacl = (x, vol = 10, lab = "NaCl 0,9 %\n10 ml\ncontenant non précisé") => ({ f: ["ampoule", lab, vol, { liq: C.clair, plastique: true, bande: "#e6f3fb" }], x, y: 420 });
  const ser = (cap, x = 400, y = 330, o = {}) => ({ f: ["seringue", cap, o], x, y });
  const purge = (id = "s", x = 400, y = 85) => [["purger", id, x, y]];
  const retour = (id = "s", x = 400, y = 330) => [["aller", id, x, y, 0], ["goutte", id, false]];
  const G = (id, t) => `<a href="#/gestes/${id}">${t}</a>`;
  const VERIF = { t: `Vérifier le produit, le dosage, la date de péremption ; ${G("mains", "friction hydroalcoolique")} des mains.`, a: [["pause", 300]] };

  const P = {};

  P.M1 = {
    pres: "Poudre 500 mg (IVL/IVD) ; 500 mg per os",
    dessin: { f: ["flacon", "ASPÉGIC\n500 mg", { poudre: true, capColor: "#7b1fa2" }], y: 30 },
    variantes: [{
      nom: "Reconstitution 500 mg + EPPI",
      src: "Fiche M1, p.112",
      objets: { f: { f: ["flacon", "ASPÉGIC\n500 mg", { poudre: true, capColor: "#7b1fa2", max: 4 }], x: 110, y: 420 }, e: amp("EPPI\n2 ml", 2, 230, C.clair, { plastique: true }), s: ser(5), dasri: DASRI },
      etapes: [
        VERIF,
        { t: "Retirer l'opercule du flacon de poudre.", a: [["ouvrir", "f"]] },
        { t: `Ouvrir l'EPPI et ${G("ampoule", "prélever")} 2 ml.`, a: [["casser", "e"], ["aspirer", "s", "e", 2]] },
        { t: `Injecter dans le flacon et ${G("reconstitution", "dissoudre la poudre")}.`, a: [["injecter", "s", "f", "tout"], ["dissoudre", "f"]] },
        { t: "Prélever la dose prescrite.", a: [["aspirer", "s", "f", 2]] },
        { t: `${G("purge", "Purger")} puis ${G("etiquetage", "étiqueter")} la seringue.`, a: [...purge(), ...retour(), ["etiqueter", "s", "ASPÉGIC 500 mg/2 ml"]] },
        { t: `Flacon et ampoule vides au ${G("elimination", "collecteur")}.`, a: [["jeter", "e"], ["jeter", "f"]] },
      ],
      resultat: [["Concentration obtenue", "500 mg/2 ml"], ["Douleur thoracique", "250 mg IVL"], ["Accident de plongée", "500 mg IVD ou per os"]],
      conf: "La fiche cite deux concentrations (500 mg/5 ml et 500 mg/2 ml) : le volume pour 250 mg change du simple au double. Le 1AT dit « 250 mg IVL ou per os », la fiche ne prévoit pas 250 mg per os.",
    }],
  };

  P.M2 = {
    pres: "Ampoule 0,5 g/5 ml",
    dessin: { f: ["ampoule", "EXACYL\n0,5 g/5 ml", 5, {}] },
    variantes: [{
      nom: "Adulte et enfant ≥ 15 ans : 1 g sur 10 min",
      src: "Fiche M2, p.113",
      objets: { a1: amp("EXACYL\n0,5 g/5 ml", 5, 70, C.clair), a2: amp("EXACYL\n0,5 g/5 ml", 5, 170, C.clair), p: { f: ["poche", "NaCl 0,9 %\n100 ml", 100, { max: 110, entree: 190 }], x: 280, y: 20 }, s: ser(10, 420, 330), dasri: DASRI, t: { f: ["minuteur"], x: 470, y: 70 } },
      etapes: [
        VERIF,
        { t: `${G("ampoule", "Casser")} les 2 ampoules de 0,5 g/5 ml.`, a: [["casser", "a1"], ["casser", "a2"]] },
        { t: "Prélever les 2 ampoules : 10 ml.", a: [["aspirer", "s", "a1", 5], ["aspirer", "s", "a2", 5]] },
        { t: "Les injecter dans la poche de 100 ml de NaCl 0,9 %.", a: [["injecter", "s", "p", "tout", { par: "dessous" }]] },
        { t: "1 g/100 ml = 10 mg/ml. Passer 1 g IV sur 10 min.", a: [["minuteur", "t", "10 min"]] },
        { t: "Seringue et ampoules au collecteur.", a: [["jeter", "s"], ["jeter", "a1"], ["jeter", "a2"]] },
      ],
      resultat: [["Concentration obtenue", "1 g/100 ml = 10 mg/ml"], ["Adulte et enfant ≥ 15 ans", "1 g IV sur 10 min"], ["Délai", "à dispenser dans l'heure suivant le traumatisme"]],
      conf: "3A et 3E disent « trauma < 3 heures », M2 « dans l'heure suivant le traumatisme ». 3E dilue dans 50 ml, M2 et 3A dans 100 ml.",
    }, {
      nom: "Enfant > 1 an et < 15 ans : 20 mg/kg sur 20 min (max 1 g)",
      src: "Fiche M2, p.113-114",
      objets: { a1: amp("EXACYL\n0,5 g/5 ml", 5, 70, C.clair), a2: amp("EXACYL\n0,5 g/5 ml", 5, 170, C.clair), p: { f: ["poche", "NaCl 0,9 %\n100 ml", 100, { max: 110, entree: 190 }], x: 280, y: 20 }, s: ser(10, 420, 330), dasri: DASRI, t: { f: ["minuteur"], x: 470, y: 70 } },
      etapes: [
        VERIF,
        { t: "Même dilution : 2 ampoules dans 100 ml de NaCl 0,9 % = 10 mg/ml.", a: [["casser", "a1"], ["casser", "a2"], ["aspirer", "s", "a1", 5], ["aspirer", "s", "a2", 5], ["injecter", "s", "p", "tout", { par: "dessous" }]] },
        { t: "Prélever dans le perfuseur pédiatrique la dose en ml en fonction du poids (tableau de la fiche : 5 kg = 10 ml … ).", a: [["bulle", 340, 260, "ml/kg"]] },
        { t: "Passer sur 20 min.", a: [["minuteur", "t", "20 min"]] },
        { t: "Seringue et ampoules au collecteur.", a: [["jeter", "s"], ["jeter", "a1"], ["jeter", "a2"]] },
      ],
      resultat: [["Concentration obtenue", "1 g/100 ml = 10 mg/ml"], ["Enfant > 1 an et < 15 ans", "20 mg/kg sur 20 min (max 1 g)"]],
      conf: "3E dilue dans 50 ml ; M2 calcule son tableau sur 100 ml.",
    }],
  };

  P.M3 = {
    pres: "Ampoules 1 mg/1 ml ou 5 mg/5 ml",
    dessin: { f: ["ampoule", "ADRÉNALINE\n1 mg/1 ml", 1, { bande: "#fde2e2" }] },
    variantes: [{
      nom: "ACR adulte et enfant ≥ 15 ans : 1 mg IVD", prod: { nom: "ADRÉNALINE", conc: 1, u: "mg", vol: 5, cap: 5, voie: "IVD" },
      src: "Fiche M3, p.115",
      objets: { a: amp("ADRÉNALINE\n5 mg/5 ml", 5, 110, C.clair, { bande: "#fde2e2" }), s: ser(5), dasri: DASRI },
      etapes: [
        VERIF,
        { t: "Casser l'ampoule de 5 mg/5 ml.", a: [["casser", "a"]] },
        { t: "Prélever les 5 ml : 5 mg en 5 ml, soit 1 mg/ml. Pas de dilution.", a: [["aspirer", "s", "a", 5]] },
        { t: "Purger, étiqueter.", a: [...purge(), ...retour(), ["etiqueter", "s", "ADRÉNALINE 1 mg/ml"]] },
        { t: `1 mg (1 ml) en ${G("ivd", "IVD")} toutes les 4 min, avec rinçage de la voie de perfusion après chaque bolus et surélévation du membre perfusé.`, a: [["bulle", 400, 80, "1 ml"]] },
        { t: "Ampoule au collecteur.", a: [["jeter", "a"]] },
      ],
      resultat: [["Concentration", "5 mg en 5 ml soit 1 mg/ml"], ["Posologie", "1 mg en IVD toutes les 4 min"], ["Délai", "< 1 min, durée < 5 min"]],
    }, {
      nom: "ACR enfant < 15 ans : 0,01 mg/kg IVD", prod: { nom: "ADRÉNALINE", conc: 0.1, u: "mg", vol: 10, cap: 10, voie: "IVD" },
      src: "Fiche M3, p.115-116",
      objets: { a: amp("ADRÉNALINE\n1 mg/1 ml", 1, 80, C.clair, { bande: "#fde2e2" }), n: nacl(190), s: ser(10), p: ser(2, 250, 330, { pisu: "le PISU dit « seringue de 1 ou 2 ml » (fiche M3)" }), dasri: DASRI },
      etapes: [
        VERIF,
        { t: "Casser l'ampoule de 1 mg/1 ml et prélever 1 ml.", a: [["casser", "a"], ["aspirer", "s", "a", 1]] },
        { t: "Ajouter 9 ml de NaCl 0,9 % : 10 ml.", a: [["casser", "n"], ["aspirer", "s", "n", 9]] },
        { t: "Purger, étiqueter : 0,1 mg/ml.", a: [...purge(), ...retour(), ["etiqueter", "s", "ADRÉNALINE 0,1 mg/ml"]] },
        { t: "Transférer le volume correspondant au poids dans une seringue de 1 ou 2 ml : 0,1 ml/kg (ex. : 12 kg = 1,2 ml).", a: [["aspirer", "p", "s", 1.2, { par: "dessous" }], ["aller", "p", 250, 330, 0], ["etiqueter", "p", "ADRÉ 0,1 mg/ml"]] },
        { t: "Ampoules au collecteur.", a: [["jeter", "a"], ["jeter", "n"]] },
      ],
      resultat: [["Concentration obtenue", "0,1 mg/ml"], ["Quantité à administrer", "0,1 ml/kg"], ["Posologie", "0,01 mg/kg en IVD toutes les 4 min"]],
    }, {
      nom: "Anaphylaxie sévère : 0,01 mg/kg IM (max 0,5 mg)", prod: { nom: "ADRÉNALINE", conc: 0.25, u: "mg", vol: 4, cap: 5, voie: "IM" },
      src: "Fiche M3, p.116",
      objets: { a: amp("ADRÉNALINE\n1 mg/1 ml", 1, 90, C.clair, { bande: "#fde2e2" }), n: nacl(200), s: ser(5), dasri: DASRI },
      etapes: [
        VERIF,
        { t: "Casser l'ampoule de 1 mg/1 ml, prélever 1 ml.", a: [["casser", "a"], ["aspirer", "s", "a", 1]] },
        { t: "Ajouter 3 ml de NaCl 0,9 % : 4 ml.", a: [["casser", "n"], ["aspirer", "s", "n", 3]] },
        { t: "Purger, étiqueter : 0,25 mg/ml.", a: [...purge(), ...retour(), ["etiqueter", "s", "ADRÉ 0,25 mg/ml"]] },
        { t: `Injecter la dose du tableau (ex. : 10 kg = 0,4 ml) en ${G("im", "intramusculaire")}.`, a: [["bulle", 400, 80, "IM"]] },
        { t: "Ampoules au collecteur.", a: [["jeter", "a"], ["jeter", "n"]] },
      ],
      resultat: [["Concentration obtenue", "1 mg/4 ml (0,25 mg/ml)"], ["Posologie IM adulte et enfant", "0,01 mg/kg (max 0,5 mg)"]],
      conf: "4A p.33 et 4E p.71 écrivent « 0,01 mg » pour le renouvellement ; le logigramme et M3 disent 0,01 mg/kg (écart E-06 au PDF).",
    }, {
      nom: "Anaphylaxie avec dyspnée inspiratoire : aérosol",
      src: "Fiche M3, p.116",
      objets: { a: amp("ADRÉNALINE\n5 mg/5 ml", 5, 90, C.clair, { bande: "#fde2e2" }), s: ser(5), neb: { f: ["nebuliseur", {}], x: 300, y: 330 }, dasri: DASRI },
      etapes: [
        VERIF,
        { t: "Adulte et enfant ≥ 15 ans : 5 mg. Casser l'ampoule et prélever.", a: [["casser", "a"], ["aspirer", "s", "a", 5]] },
        { t: `Verser dans le réservoir du ${G("aerosol", "nébuliseur")}. Le volume total dans le réservoir de la chambre d'inhalation doit être de 4 à 5 ml.`, a: [["injecter", "s", "neb", "tout", { retire: true }]] },
        { t: "Enfant < 15 ans : 0,1 mg/kg (max 5 mg), volume du tableau (ex. : 10 kg = 1 ml).", a: [["regler", "neb", "marche", true]] },
        { t: "Seringue et ampoule au collecteur.", a: [["jeter", "s"], ["jeter", "a"]] },
      ],
      resultat: [["Adulte et enfant ≥ 15 ans", "5 mg"], ["Enfant < 15 ans", "0,1 mg/kg (max 5 mg)"], ["Réservoir", "4 à 5 ml au total"]],
    }],
  };

  P.M4 = {
    pres: "Ampoule 150 mg/3 ml",
    dessin: { f: ["ampoule", "CORDARONE\n150 mg/3 ml", 3, {}] },
    variantes: [{
      nom: "Dilution 1 : 300 mg/20 ml (15 mg/ml)", prod: { nom: "AMIODARONE", conc: 15, u: "mg", vol: 20, cap: 20, voie: "IVD", liq: "#f6e7a8" },
      src: "Fiche M4, p.119",
      objets: { a1: amp("CORDARONE\n150 mg/3 ml", 3, 60, C.jaune), a2: amp("CORDARONE\n150 mg/3 ml", 3, 150, C.jaune), g: amp("GLUCOSE 5 %\n", 20, 250, C.g5, { plastique: true, max: 20, bande: "#fff6d6" }), s: ser(20, 400, 330), dasri: DASRI },
      etapes: [
        VERIF,
        { t: "Casser les 2 ampoules de 150 mg/3 ml et les prélever.", a: [["casser", "a1"], ["casser", "a2"], ["aspirer", "s", "a1", 3, { liq: C.jaune }], ["aspirer", "s", "a2", 3]] },
        { t: "Ajouter 14 ml de glucose 5 % : 20 ml.", a: [["casser", "g"], ["aspirer", "s", "g", 14]] },
        { t: "Purger, étiqueter : 300 mg/20 ml.", a: [...purge(), ...retour(), ["etiqueter", "s", "CORDARONE 15 mg/ml"]] },
        { t: "Ampoules au collecteur.", a: [["jeter", "a1"], ["jeter", "a2"], ["jeter", "g"]] },
      ],
      resultat: [["Concentration obtenue", "300 mg/20 ml (15 mg/ml)"], ["ACR adulte et enfant ≥ 15 ans", "1ère injection → 300 mg"], ["ACR enfant < 15 ans", "dilution 1 ; 1ère → 5 mg/kg (max 300 mg), 2ème → 5 mg/kg (max 150 mg)"]],
      conf: "Tableau p.120, volumes à 15 mg/ml : 20 kg 6,5 ml (calcul 6,7), 35 kg 11,5 (11,7), 40 kg 13,5 (13,3), 50 kg 16,5 (16,7). 1E dit « > 3 ans », M4 contre-indique « < 3 ans ».",
    }, {
      nom: "Dilution 2 : 150 mg/20 ml (7,5 mg/ml)", prod: { nom: "AMIODARONE", conc: 7.5, u: "mg", vol: 20, cap: 20, voie: "IVD", liq: "#f6e7a8" },
      src: "Fiche M4, p.119",
      objets: { a1: amp("CORDARONE\n150 mg/3 ml", 3, 90, C.jaune), g: amp("GLUCOSE 5 %\n", 20, 220, C.g5, { plastique: true, max: 20, bande: "#fff6d6" }), s: ser(20, 400, 330), dasri: DASRI },
      etapes: [
        VERIF,
        { t: "Casser 1 ampoule de 150 mg/3 ml et la prélever.", a: [["casser", "a1"], ["aspirer", "s", "a1", 3, { liq: C.jaune }]] },
        { t: "Ajouter 17 ml de glucose 5 % : 20 ml.", a: [["casser", "g"], ["aspirer", "s", "g", 17]] },
        { t: "Purger, étiqueter : 150 mg/20 ml.", a: [...purge(), ...retour(), ["etiqueter", "s", "CORDARONE 7,5 mg/ml"]] },
        { t: "Ampoules au collecteur.", a: [["jeter", "a1"], ["jeter", "g"]] },
      ],
      resultat: [["Concentration obtenue", "150 mg/20 ml (7,5 mg/ml)"], ["ACR adulte et enfant ≥ 15 ans", "2ème injection → 150 mg"]],
    }],
  };

  P.M5 = {
    pres: "Unidoses 0,5 mg/2 ml ou 0,25 mg/1 ml, aérosol",
    dessin: { f: ["unidose", "ATROVENT\n0,5 mg/2 ml", 2, {}] },
    variantes: [{
      nom: "Aérosol avec salbutamol",
      src: "Fiches M5, p.121 et M19, p.149",
      objets: { u: { f: ["unidose", "ATROVENT\n0,5 mg/2 ml", 2, {}], x: 90, y: 420 }, v: { f: ["unidose", "VENTOLINE\n5 mg/2,5 ml", 2.5, {}], x: 190, y: 420 }, s: ser(5), neb: { f: ["nebuliseur", {}], x: 330, y: 330 }, dasri: DASRI },
      etapes: [
        VERIF,
        { t: "Toujours en association avec un ß2-mimétique (salbutamol/Ventoline®). Ouvrir les unidoses.", a: [["ouvrir", "u"], ["ouvrir", "v"]] },
        { t: "Verser ipratropium et salbutamol dans le réservoir. Le volume total de solution doit être de 5 ml.", a: [["aspirer", "s", "u", 2], ["aspirer", "s", "v", 2.5], ["injecter", "s", "neb", "tout"]] },
        { t: "Durée de l'aérosol : 15 minutes.", a: [["regler", "neb", "marche", true]] },
        { t: "Unidoses et seringue au collecteur.", a: [["jeter", "s"], ["jeter", "u"], ["jeter", "v"]] },
      ],
      resultat: [["Adulte et enfant ≥ 15 ans", "0,5 mg renouvelable 1 fois"], ["Enfant < 15 ans", "0,25 mg renouvelable 1 fois"], ["Volume total", "5 ml"]],
      conf: "2A et 2E : aérosols de 20 min, M5 : 15 min. 2E prévoit 3 aérosols avec ipratropium, M5 « renouvelable 1 fois ».",
    }],
  };

  P.M6 = {
    pres: "Flacon de poudre 1 g",
    dessin: { f: ["flacon", "ROCÉPHINE\n1 g", { poudre: true, capColor: "#1f5f99" }], y: 30 },
    variantes: [{
      nom: "Reconstitution 1 g + 9 ml NaCl 0,9 %",
      src: "Fiche M6, p.123",
      objets: { f: { f: ["flacon", "ROCÉPHINE\n1 g", { poudre: true, capColor: "#1f5f99", max: 12 }], x: 100, y: 420 }, n: nacl(220), s: ser(10), dasri: DASRI },
      etapes: [
        VERIF,
        { t: "Retirer l'opercule du flacon.", a: [["ouvrir", "f"]] },
        { t: "Prélever 9 ml de NaCl 0,9 %.", a: [["casser", "n"], ["aspirer", "s", "n", 9]] },
        { t: "Les injecter dans le flacon, dissoudre.", a: [["injecter", "s", "f", "tout"], ["dissoudre", "f"]] },
        { t: "Prélever : 1 g/10 ml.", a: [["aspirer", "s", "f", 10]] },
        { t: "Purger, étiqueter.", a: [...purge(), ...retour(), ["etiqueter", "s", "ROCÉPHINE 1 g/10 ml"]] },
        { t: "Ne pas mélanger avec d'autres médicaments ou des solutions contenant du calcium. Flacon et ampoule au collecteur.", a: [["jeter", "n"], ["jeter", "f"]] },
      ],
      resultat: [["Concentration obtenue", "1 g/10 ml"], ["Adulte", "1 g en IVL"], ["Enfant et nourrisson", "100 mg/kg sans dépasser 1 g ; poids (kg) = (âge en années x 2) + 9"]],
    }],
  };

  P.M7 = {
    pres: "Ampoule 10 mg/1 ml",
    dessin: { f: ["ampoule", "MORPHINE\n10 mg/1 ml", 1, {}] },
    variantes: [{
      nom: "Adulte, enfant ≥ 40 kg : 10 mg/10 ml", prod: { nom: "MORPHINE", conc: 1, u: "mg", vol: 10, cap: 10, voie: "IVL", liq: "#d6ecf8" },
      src: "Fiche M7, p.125",
      objets: { m: amp("MORPHINE\n10 mg/1 ml", 1, 90, C.morph, { bande: "#9cc9f0", point: "#111" }), n: nacl(200), s: ser(10), dasri: DASRI, sac: SAC },
      etapes: [
        VERIF,
        { t: `${G("ampoule", "Casser l'ampoule")} de morphine ; seule la tête va au collecteur.`, a: [["casser", "m"]] },
        { t: "Prélever 1 ml : 10 mg.", a: [["aspirer", "s", "m", 1, { liq: C.morph }]] },
        { t: "Ouvrir le NaCl 0,9 %, ramener à 10 ml (9 ml).", a: [["casser", "n"], ["aspirer", "s", "n", 9]] },
        { t: `${G("purge", "Purger")} la seringue.`, a: purge() },
        { t: `${G("etiquetage", "Étiqueter")} : morphine 1 mg/ml.`, a: [...retour(), ["etiqueter", "s", "MORPHINE 1 mg/ml"]] },
        { t: `Ampoule vide de morphine rangée dans la sacoche, côté vides, pour être rendue à la pharmacie. L'ampoule de NaCl va au ${G("elimination", "collecteur")}.`, a: [["ranger", "m"], ["jeter", "n"]] },
      ],
      resultat: [["Concentration obtenue", "10 mg/10 ml (1 mg/ml)"], ["Adulte et enfant ≥ 15 ans", "≥ 60 kg et < 75 ans = 3 mg en titration ; < 60 kg ou ≥ 75 ans = 2 mg en titration"], ["Enfant < 15 ans et ≥ 40 kg", "2 mg en titration"]],
    }, {
      nom: "Enfant < 40 kg : double dilution 0,5 mg/ml", prod: { nom: "MORPHINE", conc: 0.5, u: "mg", vol: 10, cap: 10, voie: "IVL", liq: "#d6ecf8" },
      src: "Fiche M7, p.125-126",
      objets: { m: amp("MORPHINE\n10 mg/1 ml", 1, 70, C.morph, { bande: "#9cc9f0", point: "#111" }), n: nacl(170), n2: nacl(250, 10), s: ser(10, 400, 330), s2: ser(10, 330, 330, { op: 1 }), dasri: DASRI, sac: SAC },
      etapes: [
        VERIF,
        { t: "Première dilution : 1 ampoule (10 mg) ramenée à 10 ml avec NaCl 0,9 % = 1 mg/ml.", a: [["casser", "m"], ["aspirer", "s", "m", 1, { liq: C.morph }], ["casser", "n"], ["aspirer", "s", "n", 9], ...purge(), ...retour(), ["etiqueter", "s", "1 mg/ml"]] },
        { t: "Prélever 5 ml de la première dilution (5 mg).", a: [["aspirer", "s2", "s", 5, { par: "dessous" }], ["aller", "s2", 330, 330, 0]] },
        { t: "Ramener à 10 ml avec 5 ml de NaCl 0,9 % : 0,5 mg/ml.", a: [["casser", "n2"], ["aspirer", "s2", "n2", 5]] },
        { t: "Purger, étiqueter : morphine 0,5 mg/ml.", a: [...purge("s2", 330, 85), ...retour("s2", 330, 330), ["etiqueter", "s2", "MORPHINE 0,5 mg/ml"]] },
        { t: "Ampoule vide de morphine dans la sacoche, côté vides ; ampoules de NaCl au collecteur. Il reste 5 ml de la première dilution : le PISU ne dit pas qu'en faire.", a: [["ranger", "m"], ["jeter", "n"], ["jeter", "n2"]] },
      ],
      resultat: [["Concentration obtenue", "5 mg/10 ml (0,5 mg/ml)"], ["Enfant < 40 kg", "0,05 mg/kg (tableau poids/dose/volume de la fiche)"]],
      conf: "La fiche ne donne pas d'indication « douleur thoracique » alors que le 1AT l'utilise.",
    }],
  };

  P.M8 = {
    pres: "Ampoule 1 mg/1 ml + solvant",
    dessin: { f: ["ampoule", "RIVOTRIL\n1 mg/1 ml", 1, {}] },
    variantes: [{
      nom: "Reconstitution 1 mg/2 ml", prod: { nom: "CLONAZÉPAM", conc: 0.5, u: "mg", vol: 2, cap: 2, voie: "IVL" },
      src: "Fiche M8, p.127",
      objets: { a: amp("RIVOTRIL\n1 mg/1 ml", 1, 90, C.clair), e: amp("SOLVANT\nEPPI 1 ml", 1, 200, C.clair, { plastique: true }), s: ser(2), dasri: DASRI },
      etapes: [
        VERIF,
        { t: "Reconstitution obligatoire avec son solvant avant administration. Casser l'ampoule, prélever 1 ml.", a: [["casser", "a"], ["aspirer", "s", "a", 1]] },
        { t: "Ajouter 1 ml de solvant (EPPI) : 2 ml.", a: [["casser", "e"], ["aspirer", "s", "e", 1]] },
        { t: "Purger, étiqueter : 0,5 mg/ml.", a: [...purge(), ...retour(), ["etiqueter", "s", "RIVOTRIL 0,5 mg/ml"]] },
        { t: `Injection en ${G("ivl", "IV lente")}. Avoir le matériel de réanimation et d'aspiration à disposition.`, a: [["bulle", 400, 80, "IVL"]] },
        { t: "Ampoules au collecteur.", a: [["jeter", "a"], ["jeter", "e"]] },
      ],
      resultat: [["Concentration obtenue", "1 mg/2 ml (0,5 mg/ml)"], ["Adulte et enfant ≥ 15 ans", "1 mg"], ["Enfant < 15 ans", "0,05 mg/kg (max 1,5 mg)"]],
      conf: "5A dit « IVD », M8 « IVL » et « injection en IV lente » (5E dit IVL).",
    }],
  };

  P.M9 = {
    pres: "Ampoule 3 g/10 ml",
    dessin: { f: ["ampoule", "GLUCOSE 30 %\n3 g/10 ml", 10, { liq: "#f1e6b8" }] },
    variantes: [{
      nom: "Adulte : 6 g = 2 dosettes de 10 ml", prod: { nom: "GLUCOSE 30 %", conc: 0.3, u: "g", vol: 20, cap: 20, voie: "IVL", liq: "#f1e6b8" },
      src: "Fiche M9, p.129",
      objets: { a1: amp("G 30 %\n3 g/10 ml", 10, 80, C.g30, { plastique: true }), a2: amp("G 30 %\n3 g/10 ml", 10, 190, C.g30, { plastique: true }), s: ser(20, 400, 330), dasri: DASRI },
      etapes: [
        VERIF,
        { t: "Ouvrir les 2 dosettes de 10 ml à 3 g.", a: [["casser", "a1"], ["casser", "a2"]] },
        { t: "Prélever 20 ml : 6 g.", a: [["aspirer", "s", "a1", 10, { liq: C.g30 }], ["aspirer", "s", "a2", 10]] },
        { t: "Purger, étiqueter.", a: [...purge(), ...retour(), ["etiqueter", "s", "G 30 % 6 g"]] },
        { t: "Produit hypertonique (risque de nécrose tissulaire) : injecter très lentement sur une voie veineuse périphérique fiable.", a: [["bulle", 400, 80, "LENT"]] },
        { t: "Dosettes au collecteur.", a: [["jeter", "a1"], ["jeter", "a2"]] },
      ],
      resultat: [["Adulte", "6 g IVD soit 2 dosettes de 10 ml à 3 g"], ["Enfant < 15 ans", "1 ml/kg (max 30 ml)"], ["Délai", "IV = délai d'action immédiat"]],
      conf: "9A dit « 6 g IVL » ; M9 dit « IVL » puis « 6 g IVD ». Resucrage 9E « 15 g » fixe, M9 « 1 sucre pour 20 kg ».",
    }],
  };

  P.M10 = {
    pres: "Flacon de poudre 5 g, kit",
    dessin: { f: ["flacon", "CYANOKIT\n5 g", { poudre: true, capColor: "#c62828", coulPoudre: "#c0392b" }], y: 30 },
    variantes: [{
      nom: "5 g dilués dans 200 ml de NaCl 0,9 %",
      src: "Fiche M10, p.131-132",
      objets: { f: { f: ["flacon", "CYANOKIT\n5 g", { poudre: true, capColor: "#c62828", coulPoudre: "#c0392b", max: 200, liq: "#c0392b" }], x: 120, y: 420 }, p: { f: ["poche", "NaCl 0,9 %\n200 ml", 200, { max: 210, entree: 190 }], x: 330, y: 20 }, dasri: DASRI, t: { f: ["minuteur"], x: 500, y: 80 } },
      etapes: [
        VERIF,
        { t: "Kit complet permettant l'administration d'urgence. Retirer l'opercule du flacon.", a: [["ouvrir", "f"]] },
        { t: "Diluer le flacon de poudre avec 200 ml de NaCl 0,9 %.", a: [["regler", "p", "vol", 0], ["regler", "f", "vol", 200], ["dissoudre", "f"]] },
        { t: "Concentration obtenue : 5 g/200 ml (25 mg/ml). Perfusion.", a: [["bulle", 120, 230, "25 mg/ml"]] },
        { t: "Enfant < 15 ans : 70 mg/kg sans excéder 5 g ; prélever dans le perfuseur pédiatrique la dose en ml selon le poids (tableau de la fiche).", a: [["pause", 400]] },
      ],
      resultat: [["Concentration obtenue", "5 g/200 ml (25 mg/ml)"], ["Adulte et enfant ≥ 15 ans", "5 g, renouvelable si besoin"], ["Enfant < 15 ans", "70 mg/kg sans excéder 5 g"]],
    }],
  };

  P.M11 = {
    pres: "Ampoule 5 mg/1 ml",
    dessin: { f: ["ampoule", "POLARAMINE\n5 mg/1 ml", 1, {}] },
    variantes: [{
      nom: "1 ampoule IVD",
      src: "Fiche M11, p.133",
      objets: { a: amp("POLARAMINE\n5 mg/1 ml", 1, 110, C.clair), s: ser(2), dasri: DASRI },
      etapes: [
        VERIF,
        { t: "Casser l'ampoule, prélever 1 ml.", a: [["casser", "a"], ["aspirer", "s", "a", 1]] },
        { t: "Purger, étiqueter.", a: [...purge(), ...retour(), ["etiqueter", "s", "POLARAMINE 5 mg"]] },
        { t: "Adulte et enfant > 30 mois : 1 ampoule en IVD. Surveillance PA et FC toutes les 15 minutes après l'administration.", a: [["bulle", 400, 80, "IVD"]] },
        { t: "Ampoule au collecteur.", a: [["jeter", "a"]] },
      ],
      resultat: [["Posologie", "Adulte et enfant > 30 mois : 1 ampoule en IVD"], ["Durée", "1 à 2 heures"]],
      conf: "La fiche donne la voie « IVL » en tête puis « Administration IVD ». 4A : « en IVD » repris du logigramme (écart E-07 au PDF).",
    }],
  };

  P.M12 = {
    pres: "Poudre lyophilisée 40 mg et 120 mg",
    dessin: { f: ["flacon", "SOLUMÉDROL\n40 mg", { poudre: true, capColor: "#e0b000" }], y: 30 },
    variantes: [{
      nom: "Flacon 40 mg + 2 ml EPPI (enfant)",
      src: "Fiche M12, p.135",
      objets: { f: { f: ["flacon", "SOLUMÉDROL\n40 mg", { poudre: true, capColor: "#e0b000", max: 4 }], x: 80, y: 420 }, e: amp("EPPI\n2 ml", 2, 180, C.clair, { plastique: true }), s: ser(5, 300, 330), p: { f: ["poche", "NaCl 0,9 %\n100 ml", 100, { max: 110, entree: 190 }], x: 430, y: 20 }, dasri: DASRI },
      etapes: [
        VERIF,
        { t: "Retirer l'opercule ; prélever 2 ml d'EPPI.", a: [["ouvrir", "f"], ["casser", "e"], ["aspirer", "s", "e", 2]] },
        { t: "Injecter dans le flacon, dissoudre : 40 mg/2 ml (20 mg/ml).", a: [["injecter", "s", "f", "tout"], ["dissoudre", "f"]] },
        { t: "Prélever la dose prescrite (tableau de la fiche : 1 mg/kg, max 50 mg).", a: [["aspirer", "s", "f", 2]] },
        { t: "Diluer la dose prescrite dans 100 ml de NaCl 0,9 %. Administration en perfusion stricte.", a: [["injecter", "s", "p", "tout", { par: "dessous" }]] },
        { t: "Seringue, flacon et ampoule au collecteur.", a: [["jeter", "s"], ["jeter", "f"], ["jeter", "e"]] },
      ],
      resultat: [["Concentration obtenue", "40 mg/2 ml (20 mg/ml)"], ["Anaphylaxie enfant < 15 ans", "1 mg/kg max 50 mg"], ["Administration", "perfusion stricte, dans 100 ml de NaCl 0,9 %"]],
      conf: "4E dilue dans 50 ml ; M12 et 4A dans 100 ml.",
    }, {
      nom: "Flacon 120 mg + 12 ml EPPI (adulte)",
      src: "Fiche M12, p.135-136",
      objets: { f: { f: ["flacon", "SOLUMÉDROL\n120 mg", { poudre: true, capColor: "#e0b000", max: 14 }], x: 80, y: 420 }, e: amp("EPPI\n", 12, 180, C.clair, { plastique: true }), s: ser(20, 300, 330), p: { f: ["poche", "NaCl 0,9 %\n100 ml", 100, { max: 120, entree: 190 }], x: 430, y: 20 }, dasri: DASRI },
      etapes: [
        VERIF,
        { t: "Retirer l'opercule ; prélever 12 ml d'EPPI.", a: [["ouvrir", "f"], ["casser", "e"], ["aspirer", "s", "e", 12]] },
        { t: "Injecter dans le flacon, dissoudre : 120 mg/12 ml (10 mg/ml).", a: [["injecter", "s", "f", "tout"], ["dissoudre", "f"]] },
        { t: "Prélever la dose prescrite : 1 mg/kg (asthme max 80 mg ; anaphylaxie max 120 mg).", a: [["aspirer", "s", "f", 12]] },
        { t: "Diluer dans 100 ml de NaCl 0,9 %. Perfusion stricte.", a: [["injecter", "s", "p", "tout", { par: "dessous" }]] },
        { t: "Seringue, flacon et ampoule au collecteur.", a: [["jeter", "s"], ["jeter", "f"], ["jeter", "e"]] },
      ],
      resultat: [["Concentration obtenue", "120 mg/12 ml (10 mg/ml)"], ["Adulte et enfant ≥ 15 ans", "1 mg/kg ; asthme max 80 mg ; anaphylaxie max 120 mg"]],
      conf: "La fiche écrit la présentation « 120 mg/2 ml » puis la reconstitution « 120 mg + 12 ml ». 2A dit « IVL », M12 « perfusion stricte ».",
    }],
  };

  P.M13 = {
    pres: "Gaz médicinal comprimé, bouteille",
    dessin: { f: ["bouteilleMeopa"], x: -50, y: 20, s: .9 },
    variantes: [{
      nom: "Inhalation au masque",
      src: "Fiche M13, p.137",
      objets: { b: { f: ["bouteilleMeopa"], x: 160, y: 380 }, t: { f: ["minuteur"], x: 470, y: 130 } },
      etapes: [
        { t: "Positionner la bouteille en position debout.", a: [["bulle", 160, 120, "DEBOUT"]] },
        { t: "Le mélange est administré uniquement chez les patients en respiration spontanée. L'auto-administration doit être privilégiée.", a: [["pause", 300]] },
        { t: "Avant l'acte douloureux, maintenir le masque au moins 3 minutes, en gardant le contact verbal.", a: [["minuteur", "t", "≥ 3 min"]] },
        { t: "L'inhalation se poursuit pendant l'acte ; le patient respire normalement. Éviter l'hyperventilation.", a: [["pause", 300]] },
      ],
      resultat: [["Composition", "50 % protoxyde d'azote, 50 % oxygène"], ["Antalgie 8A et 8E", "max 20 min ; arrêt si inefficace après 10 min, cyanose, perte de contact, excitation paradoxale, vomissements"]],
      conf: "8A et 8E excluent la femme enceinte alors que M13 autorise le MÉOPA pendant la grossesse.",
    }],
  };

  P.M14 = {
    pres: "Seringue orale préremplie",
    dessin: { f: ["seringueOrale", "BUCCOLAM 5 mg", "#4a90d9"], x: 0, y: -120 },
    variantes: [{
      nom: "Voie buccale (entre gencive et joue)",
      src: "Fiche M14, p.139",
      objets: { b: { f: ["seringueOrale", "5 mg (bleu) : ≥ 1 an < 5 ans", "#4a90d9"], x: 260, y: 120 }, m: { f: ["seringueOrale", "7,5 mg (mauve) : ≥ 5 ans < 10 ans", "#9b59b6"], x: 260, y: 220 }, o: { f: ["seringueOrale", "10 mg (orange) : ≥ 10 ans < 15 ans", "#e67e22"], x: 260, y: 320 } },
      etapes: [
        { t: "Choisir la seringue selon l'âge : 5 mg (bleu), 7,5 mg (mauve), 10 mg (orange).", a: [["bulle", 420, 110, "ÂGE"]] },
        { t: "Administrer lentement la dose complète entre la gencive et la joue.", a: [["aller", "b", 300, 120, -8]] },
        { t: "Si la dose est importante, administrer la moitié de la dose d'un côté de la bouche et l'autre moitié de l'autre côté.", a: [["aller", "b", 260, 120, 8]] },
        { t: "Seringue vide au collecteur.", a: [["pause", 200]] },
      ],
      resultat: [["≥ 1 an < 5 ans", "5 mg (bleu)"], ["≥ 5 ans < 10 ans", "7,5 mg (mauve)"], ["≥ 10 ans < 15 ans", "10 mg (orange)"]],
      conf: "5E écrit « Per Os » ; M14 décrit la voie buccale (en-tête « VO »).",
    }],
  };

  P.M15 = {
    pres: "Ampoule 0,4 mg/1 ml",
    dessin: { f: ["ampoule", "NARCAN\n0,4 mg/1 ml", 1, {}] },
    variantes: [{
      nom: "0,4 mg ramenés à 10 ml : 0,04 mg/ml",
      src: "Fiche M15, p.141",
      objets: { a: amp("NARCAN\n0,4 mg/1 ml", 1, 90, C.clair), n: nacl(200), s: ser(10), dasri: DASRI },
      etapes: [
        VERIF,
        { t: "Casser l'ampoule, prélever 1 ml (0,4 mg).", a: [["casser", "a"], ["aspirer", "s", "a", 1]] },
        { t: "Ramener à 10 ml avec 9 ml de NaCl 0,9 %.", a: [["casser", "n"], ["aspirer", "s", "n", 9]] },
        { t: "Purger, étiqueter : 0,04 mg/ml.", a: [...purge(), ...retour(), ["etiqueter", "s", "NALOXONE 0,04 mg/ml"]] },
        { t: "Bolus itératifs de 0,04 mg (1 ml) toutes les 2 min selon les signes de surdosage. Risque d'effet rebond.", a: [["bulle", 400, 80, "1 ml / 2 min"]] },
        { t: "Ampoules au collecteur.", a: [["jeter", "a"], ["jeter", "n"]] },
      ],
      resultat: [["Concentration obtenue", "0,4 mg/10 ml (0,04 mg/ml)"], ["Adulte et enfant", "bolus itératifs toutes les 2 min de 0,04 mg"], ["Délai IV", "1 à 2 min, durée 20 à 30 min"]],
    }],
  };

  P.M16 = {
    pres: "Perfusion 1000 mg/100 ml et 500 mg/50 ml ; per os",
    dessin: { f: ["poche", "PARACÉTAMOL\n1000 mg/100 ml", 100, {}], y: -240, s: 1 },
    variantes: [{
      nom: "IV adulte et enfant ≥ 15 ans : 1 g",
      src: "Fiche M16, p.143",
      objets: { p: { f: ["poche", "PARACÉTAMOL\n1000 mg/100 ml", 100, {}], x: 220, y: 30 }, t: { f: ["minuteur"], x: 440, y: 120 } },
      etapes: [
        VERIF,
        { t: "Adulte et enfant ≥ 15 ans : utiliser la forme 1000 mg/100 ml.", a: [["bulle", 220, 20, "1 g"]] },
        { t: "8A : 1000 mg IV en 10 min si ≥ 50 kg ; 500 mg en 10 min si < 50 kg.", a: [["minuteur", "t", "10 min"]] },
      ],
      resultat: [["Adulte et enfant ≥ 15 ans", "dose 1 g"], ["Forme", "1000 mg/100 ml"]],
      conf: "8A : palier « < 50 kg = 500 mg » (IV et per os) absent de M16 pour l'adulte. 8E : « ≥ 50 kg = 1000 mg », M16 enfant : « ≥ 33 kg = 500 mg ». Tableau p.143 : « 31 kg → 435 mg » (15 mg/kg × 31 = 465 mg).",
    }, {
      nom: "IV enfant ≥ 12 kg et < 33 kg : 15 mg/kg",
      src: "Fiche M16, p.143",
      objets: { p: { f: ["poche", "PARACÉTAMOL\n500 mg/50 ml", 50, {}], x: 220, y: 30 }, t: { f: ["minuteur"], x: 440, y: 120 } },
      etapes: [
        VERIF,
        { t: "Enfant < 15 ans : utiliser la forme 500 mg/50 ml.", a: [["bulle", 220, 20, "500 mg"]] },
        { t: "15 mg/kg sur perfuseur pédiatrique : lire le volume à injecter dans le tableau (ex. : 20 kg = 300 mg = 30 ml).", a: [["regler", "p", "vol", 20]] },
        { t: "Enfant ≥ 33 kg = 500 mg.", a: [["pause", 300]] },
      ],
      resultat: [["Enfant ≥ 12 kg < 33 kg", "15 mg/kg sur perfuseur pédiatrique"], ["Enfant ≥ 33 kg", "500 mg"]],
    }, {
      nom: "Per os (Lyoc)",
      src: "Fiche M16, p.144",
      objets: { c: { f: ["comprimes", "paracétamol per os", 2, {}], x: 300, y: 260 } },
      etapes: [
        { t: "Adulte et enfant ≥ 15 ans = dose 1 g per os.", a: [["bulle", 300, 160, "1 g"]] },
        { t: "Enfant de 3 à 15 ans : ≥ 11 kg et < 16 kg : 200 mg ; ≥ 16 kg et < 27 kg : 300 mg ; ≥ 27 kg et < 50 kg : 500 mg ; ≥ 50 kg : 1 g.", a: [["pause", 300]] },
      ],
      resultat: [["Adulte et enfant ≥ 15 ans", "1 g per os"], ["Présentations PO", "Adulte : 500 mg ; Enfant : 200 mg / 300 mg / 500 mg"]],
    }],
  };

  P.M17 = {
    pres: "Comprimés de 20 mg sécables",
    dessin: { f: ["comprimes", "SOLUPRED 20 mg", 2, { secable: true }], y: -100 },
    variantes: [{
      nom: "Per os, enfant de 2 à 15 ans",
      src: "Fiche M17, p.145",
      objets: { c: { f: ["comprimes", "SOLUPRED 20 mg sécables", 3, { secable: true }], x: 300, y: 250 } },
      etapes: [
        { t: "Administrer en per os.", a: [["bulle", 300, 160, "PO"]] },
        { t: "≥ 10 et < 15 kg : 20 mg = 1 comprimé.", a: [["pause", 200]] },
        { t: "≥ 15 à < 20 kg : 30 mg = 1,5 comprimé.", a: [["pause", 200]] },
        { t: "≥ 20 kg : 40 mg = 2 comprimés.", a: [["pause", 200]] },
      ],
      resultat: [["Posologie", "1 à 2 mg/kg max 40 mg"]],
      conf: "La fiche prednisolone donne en contre-indication « allergie connue à la méthylprednisolone ».",
    }],
  };

  P.M18 = {
    pres: "Dosette 10 mg/5 ml",
    dessin: { f: ["unidose", "ORAMORPH\n10 mg/5 ml", 5, {}] },
    variantes: [{
      nom: "Per os",
      src: "Fiche M18, p.147",
      objets: { u: { f: ["unidose", "ORAMORPH\n10 mg/5 ml", 5, {}], x: 120, y: 420 }, s: ser(10, 380, 330, { orale: true, cone: "#7b3fa0" }), dasri: DASRI },
      etapes: [
        VERIF,
        { t: "Adulte et enfant ≥ 15 ans : si < 75 ans 10 mg (toute la dosette) ; si ≥ 75 ans 5 mg.", a: [["ouvrir", "u"]] },
        { t: "Enfant de 3 ans à < 15 ans : 0,5 mg/kg soit 0,25 ml/kg (max 20 mg) : volume lu dans le tableau.", a: [["aiguille", "s", "none"], ["aspirer", "s", "u", 5]] },
        { t: "Avoir le matériel de réanimation et d'aspiration. Surveillance des fonctions vitales.", a: [["pause", 300]] },
      ],
      resultat: [["Adulte et enfant ≥ 15 ans", "si < 75 ans : 10 mg ; si ≥ 75 ans : 5 mg"], ["Enfant 3 à < 15 ans", "0,5 mg/kg soit 0,25 ml/kg (max 20 mg)"]],
      conf: "Tableau p.147 : la ligne « 16 kg → 13 mg » est à lire 26 kg (la ligne 16 kg existe déjà avec 8 mg).",
    }],
  };

  P.M19 = {
    pres: "Unidoses 5 mg/2,5 ml et 2,5 mg/2,5 ml ; aérosol doseur",
    dessin: { f: ["unidose", "VENTOLINE\n5 mg/2,5 ml", 2.5, {}] },
    variantes: [{
      nom: "Aérosol sous oxygène",
      src: "Fiche M19, p.149",
      objets: { v: { f: ["unidose", "VENTOLINE\n5 mg/2,5 ml", 2.5, {}], x: 120, y: 420 }, s: ser(5), neb: { f: ["nebuliseur", {}], x: 330, y: 330 }, dasri: DASRI },
      etapes: [
        VERIF,
        { t: "Ouvrir l'unidose de salbutamol 5 mg/2,5 ml (ou 2,5 mg/2,5 ml).", a: [["ouvrir", "v"]] },
        { t: "Verser dans le réservoir. Volume total de 4 à 5 ml (association possible avec l'ipratropium).", a: [["aspirer", "s", "v", 2.5], ["injecter", "s", "neb", "tout"]] },
        { t: "Sous oxygène 6 à 9 l/min. Durée de l'aérosol : 15 à 20 minutes.", a: [["regler", "neb", "marche", true], ["bulle", 520, 330, "6-9 l/min"]] },
        { t: "Unidose et seringue au collecteur.", a: [["jeter", "s"], ["jeter", "v"]] },
      ],
      resultat: [["Adulte et enfant ≥ 15 ans", "5 mg/2,5 ml"], ["Enfant < 15 ans", "< 16 kg : 2,5 mg/2,5 ml ; ≥ 16 kg : 5 mg/2,5 ml"], ["O₂", "6 à 9 l/min"]],
      conf: "M19 n'a pas l'anaphylaxie en indication alors que 4A et 4E prescrivent le salbutamol.",
    }],
  };

  P.M20 = {
    pres: "Spray 0,15 mg ou 0,30 mg par pulvérisation",
    dessin: { f: ["spray", "NATISPRAY\n0,30 mg"], y: 20 },
    variantes: [{
      nom: "Pulvérisation sublinguale",
      src: "Fiche M20, p.151",
      objets: { sp: { f: ["spray", "NATISPRAY\n0,30 mg"], x: 200, y: 360 }, t: { f: ["minuteur"], x: 470, y: 130 } },
      etapes: [
        { t: "Avant la première utilisation, actionner 5 fois la pompe pour l'amorcer.", a: [["regler", "sp", "bouffee", true], ["pause", 300], ["regler", "sp", "bouffee", false], ["pause", 200], ["regler", "sp", "bouffee", true], ["pause", 300], ["regler", "sp", "bouffee", false]] },
        { t: "Patient assis : 1 pulvérisation sublinguale.", a: [["regler", "sp", "bouffee", true], ["bulle", 330, 150, "1 dose"]] },
        { t: "À renouveler une ou deux fois avec un intervalle de 2 à 3 minutes, si la crise persiste.", a: [["regler", "sp", "bouffee", false], ["minuteur", "t", "2 à 3 min"]] },
      ],
      resultat: [["Douleur thoracique", "1 pulvérisation sublinguale"], ["Action", "2 à 3 min, durée 1 à 2 heures"], ["Flacon", "18 ml (300 doses)"]],
      conf: "La fiche écrit la voie « Inhalation », le 1AT « sublinguale » ; « renouvelable une fois » (1AT) contre « une ou deux fois » (M20).",
    }],
  };

  // Teinte « témoin » par médicament : sert à repérer le produit dans la seringue, ce n'est pas sa couleur réelle.
  const TEINTE = { M1: "#d9c6f2", M2: "#f2dfb8", M3: "#f7c2cf", M4: "#f3e08f", M5: "#c9ead9", M6: "#f5cfa8", M7: "#b9dcf5", M8: "#bfe8e0",
    M9: "#ecd9a0", M10: "#d9534f", M11: "#d6cdf5", M12: "#f7d3b5", M13: "#cfe3f7", M14: "#c7d7f2", M15: "#c3efc3", M16: "#dde3ea", M17: "#f2e6c2", M18: "#a9cdee", M19: "#cde6f7", M20: "#f2c4c4" };
  const NEUTRE = /NaCl|EPPI|SOLVANT|GLUCOSE 5|UNIDOSE$/;
  for (const [code, med] of Object.entries(P)) {
    med.teinte = TEINTE[code];
    med.variantes.forEach(v => {
      if (v.prod) v.prod.liq = TEINTE[code];
      Object.values(v.objets).forEach(o => {
        const [type, lab] = o.f;
        if (!["ampoule", "flacon", "unidose", "poche"].includes(type)) return;
        const opt = o.f.find((x, i) => i > 0 && x && typeof x === "object") || (o.f.push({}), o.f[o.f.length - 1]);
        if (NEUTRE.test(String(lab)) || (type === "poche" && /NaCl/.test(lab))) opt.neutre = true;
        else opt.liq = /VENTOLINE/.test(lab) ? TEINTE.M19 : /ATROVENT/.test(lab) ? TEINTE.M5 : TEINTE[code];
      });
    });
  }
  // Fin du prélèvement : le trocart rose (aiguille 18G, code couleur ISO 6009) est dévissé et jeté au collecteur, la seringue est fermée par un bouchon.
  for (const med of Object.values(P)) med.variantes.forEach(v => {
    if (!v.objets.dasri) return;
    let k = -1, id = null;
    v.etapes.forEach((e, i) => (e.a || []).forEach(a => { if (a[0] === "etiqueter") { k = i; id = a[1]; } }));
    if (k < 0) return;
    v.etapes.splice(k + 1, 0, { t: `Dévisser le trocart rose (aiguille 18G) : il va directement au ${G("elimination", "collecteur")}, sans être recapuchonné. Fermer la seringue par un bouchon.`, a: [["trocart", id]] });
  });
  window.PISU_TEINTES = TEINTE;
  window.PISU_PREP = P;
})();
