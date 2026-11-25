/* Gestes techniques. Le PISU ne les détaille pas : chaque geste cite ses sources (consultées le 24/11/2026).
   Ce que dit le PISU lui-même est marqué « PISU ». Quand aucune source fiable n'a été trouvée, la page le dit. */
(() => {
  const S = {
    sf2h2017: { niveau: "institutionnel", titre: "Actualisation des précautions standard", editeur: "SF2H, Hygiènes vol. XXV, hors-série", date: "juin 2017", url: "https://www.sf2h.net/k-stock/data/uploads/2017/06/HY_XXV_PS_versionSF2H.pdf" },
    oms2010: { niveau: "institutionnel", titre: "WHO best practices for injections and related procedures toolkit (WHO/EHT/10.02)", editeur: "OMS", date: "mars 2010", url: "https://www.who.int/publications/i/item/9789241599252", remarque: "Guide de pratique, pas une revue systématique." },
    has2013: { niveau: "institutionnel", titre: "Outils de sécurisation et d'auto-évaluation de l'administration des médicaments", editeur: "HAS", date: "mise à jour mai 2013", url: "https://www.has-sante.fr/jcms/c_946211/fr/outils-de-securisation-et-d-autoevaluation-de-l-administration-des-medicaments", remarque: "Guide qualité pour les établissements de santé, pas une recommandation gradée." },
    sf2h2019: { niveau: "institutionnel", titre: "Prévention des infections liées aux cathéters périphériques vasculaires et sous-cutanés", editeur: "SF2H, Hygiènes vol. XXVII n° 2", date: "mai 2019", url: "https://www.sf2h.net/k-stock/data/uploads/2019/05/HY_XXVII_SF2H_CATHETERS-2019.pdf" },
    sfmu2016: { niveau: "professionnel", titre: "Prise en charge de l'anaphylaxie en médecine d'urgence (RFE SFMU, SFA, GFRUP, SP2A)", editeur: "Ann Fr Med Urgence 2016;6:342-364", date: "2016", url: "https://doi.org/10.1007/s13341-016-0668-2", remarque: "Recommandations formalisées d'experts ; pas de mise à jour française trouvée depuis." },
    teleflex: { niveau: "fabricant", titre: "Arrow EZ-IO Intraosseous Vascular Access System, Procedure Template (MCI-2019-0395)", editeur: "Teleflex", date: "2020", url: "https://www.teleflex.com/global/clinical-resources/documents/MCI-2019-0395_Arrow_EZ-IO_Intraosseous_Procedure_Template_LR.pdf", remarque: "Document du fabricant, pas la notice officielle (IFU) ni une recommandation. Suivre la notice du kit en service." },
    splf2024: { niveau: "professionnel", titre: "Procédure de mise en œuvre d'une aérosolthérapie par nébulisation (Pocket Guidelines)", editeur: "SPLF, groupe infirmier", date: "mai 2024", url: "https://cdn2.splf.fr/wp-content/uploads/2024/09/PocketGuidelines_PdS_Nebulisation_HD.pdf", remarque: "Procédure de groupe infirmier : niveau de preuve faible." },
    arr2013: { niveau: "reglementaire", titre: "Arrêté du 10 juillet 2013 relatif à la prévention des risques biologiques auxquels sont soumis certains travailleurs susceptibles d'être en contact avec des objets perforants", editeur: "Légifrance (JORF du 31/08/2013)", date: "2013", url: "https://www.legifrance.gouv.fr/loda/id/JORFTEXT000027914606" },
    arr2003: { niveau: "reglementaire", titre: "Arrêté du 24 novembre 2003 modifié relatif aux emballages des DASRI", editeur: "Légifrance", date: "version en vigueur depuis le 01/01/2021", url: "https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000416613" },
    csp: { niveau: "reglementaire", titre: "Code de la santé publique, articles R1335-1 à R1335-8 (déchets d'activités de soins)", editeur: "Légifrance", date: "version en vigueur au 24/11/2026", url: "https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006072665/LEGISCTA000022958420/" },
    dgs2025: { niveau: "institutionnel", titre: "Déchets d'activités de soins : comment les éliminer ? Tome 1 : les DASRI", editeur: "DGS et DGOS (copie ARS Nouvelle-Aquitaine)", date: "mai 2025", url: "https://www.nouvelle-aquitaine.ars.sante.fr/media/23532/download?inline" },
    inrs6535: { niveau: "institutionnel", titre: "Élimination des Dasri et pièces anatomiques humaines (ED 6535)", editeur: "INRS", date: "juillet 2024", url: "https://inrs.fr/dms/inrs/CataloguePapier/ED/TI-ED-6535/ed6535.pdf" },
    inrsAes: { niveau: "institutionnel", titre: "Conduite à tenir en cas d'accident avec exposition au sang (affiche AA 775)", editeur: "INRS", date: "sans date imprimée (métadonnées : janvier 2020)", url: "https://inrs.fr/dam/inrs/CatalogueAffiche/TI-A-775.pdf" },
    quebec: { niveau: "institutionnel", titre: "Aiguilles filtrantes (rapport de veille RVS 07-19)", editeur: "UETMIS, CHU de Québec", date: "vers 2019", url: "https://www.chudequebec.ca/getattachment/Professionnels-de-la-sante/Evaluation/Publications/RVS_07_19_aiguilles-filtrantes-2.pdf.aspx?lang=fr-CA", remarque: "Source étrangère, preuve faible." },
    iso6009: { niveau: "réglementaire", titre: "ISO 6009:2016, aiguilles hypodermiques, code couleur (tableau 1)", editeur: "ISO (aperçu public)", date: "2016", url: "https://cdn.standards.iteh.ai/samples/63277/1a6f149bb0c8466f834702affa19c63b/ISO-6009-2016.pdf" },
    pisu: { niveau: "pisu", titre: "PISU 2024, SSSM 44", editeur: "SDIS 44", date: "2024" },
    sf2h2005: { niveau: "institutionnel", titre: "Prévention des infections liées aux cathéters veineux périphériques", editeur: "SFHH et HAS", date: "novembre 2005", url: "https://has-sante.fr/upload/docs/application/pdf/Catheters_veineux_2005_recos.pdf", remarque: "Ancien ; non repris en 2019 pour le choix du site (la SF2H 2019 dit que certaines recommandations non reprises « peuvent s'avérer obsolètes »)." },
    sf2h2016: { niveau: "institutionnel", titre: "Antisepsie de la peau saine avant un geste invasif chez l'adulte", editeur: "SF2H, Hygiènes vol. XXIV n° 2", date: "mai 2016", url: "https://www.sf2h.net/k-stock/data/uploads/2016/05/Recos-Antisepsie-SF2H-2016.pdf" },
    iso10555: { niveau: "réglementaire", titre: "ISO 10555-5:1996, cathéters périphériques sur aiguille, tableau 1 (code couleur)", editeur: "ISO (édition retirée ; l'édition 2013 en vigueur n'a pas pu être consultée)", date: "1996", url: "https://cdn.standards.iteh.ai/samples/23063/2825b939df2e473f96d2abeda9fc8299/ISO-10555-5-1996.pdf" },
    bdVenflon: { niveau: "fabricant", titre: "BD Venflon Pro Safety, fiche technique V201-057 Rev. 03", editeur: "Becton Dickinson", date: "avril 2026", url: "https://www.medisave.co.uk/cdn/shop/files/2_BD-134334_V201-057_Venflon_ProSafety_TDS_Rev03.pdf", remarque: "Débits propres à ce produit." },
    rch: { niveau: "institutionnel", titre: "Intravenous access - Peripheral (Clinical Practice Guidelines)", editeur: "The Royal Children's Hospital Melbourne", date: "novembre 2025", url: "https://www.rch.org.au/clinicalguide/guideline_index/Intravenous_access_Peripheral/", remarque: "Guide étranger, sans cotation." },
    ifuIO: { niveau: "fabricant", titre: "EZ-IO Intraosseous Vascular Access Needles, Instructions for Use 8087A Rev. 04", editeur: "Teleflex", date: "janvier 2021", url: "https://www.teleflexvascular.com/files/ifu/8087A.pdf" },
    ercALS: { niveau: "professionnel", titre: "ERC Guidelines 2025 Adult Advanced Life Support (version Resuscitation Council UK)", editeur: "ERC / Resuscitation Council UK", date: "27/10/2025", url: "https://www.resus.org.uk/professional-library/2025-resuscitation-guidelines/adult-advanced-life-support-guidelines" },
    pse: { niveau: "institutionnel", titre: "Recommandations Premiers secours en équipe, fiche 08FT01 « Contention pelvienne »", editeur: "DGSCGC, ministère de l'Intérieur (copie sécurité civile de Nouvelle-Calédonie)", date: "fiche mise à jour 06-2018, recueil 2021 V2", url: "https://securite-civile.gouv.nc/sites/default/files/documents/recommandations%20Premiers%20secours%20en%20e%CC%81quipe%202021_V2.pdf", remarque: "L'édition de décembre 2023 n'a pas pu être ouverte." },
    sam: { niveau: "fabricant", titre: "SAM Pelvic Sling II, notice", editeur: "SAM Medical (copie distributeur)", date: "2012-2018", url: "https://www.performancehealth.com/amfile/file/download/file/3760/product/132463/" },
    rcpKalinox: { niveau: "réglementaire", titre: "Kalinox 50 %/50 %, RCP (CIS 67577233)", editeur: "ANSM, base de données publique des médicaments", date: "mis à jour le 05/09/2024", url: "https://base-donnees-publique.medicaments.gouv.fr/medicament/67577233/extrait" },
    omedit: { niveau: "institutionnel", titre: "Fiche réflexe MEOPA (ESMS)", editeur: "OMEDIT Île-de-France", date: "06/2026", url: "https://www.omedit-idf.fr/wp-content/uploads/MAJ-fiche-reflexe-MEOPA.pptx.pdf", remarque: "Vise les établissements médico-sociaux." },
    vygon: { niveau: "fabricant", titre: "Octopus with Bionector (1-5 lumen)", editeur: "Vygon", date: "sans date", url: "https://www.vygon.com/en/products/vascular/infusion-therapy/single-multi-lumen-extension-lines-uni-bidirectional-valves/octopus-bionector-1-5-lumen" },
    connecta: { niveau: "fabricant", titre: "BD Connecta, notice d'utilisation", editeur: "Becton Dickinson (copie distributeur)", date: "01/03/2024", url: "https://www.rocialleacutecare.com/wp-content/uploads/sites/2/2025/01/RT99-013.BD-BD-Stopcock-Exacta-Viggo-3-Way-rotating-LL-1-red-1-blu-pegs.pdf" },
  };
  const src = (k, cite) => Object.assign({}, S[k], cite ? { cite } : {});
  const DASRI = { f: ["collecteur"], x: 575, y: 395 };
  const SANS = "<b>Aucune source fiable trouvée</b> pour ce point : ";

  window.PISU_GESTES = [
    {
      id: "mains", titre: "Hygiène des mains", sous: "avant de préparer et d'injecter",
      objets: { m: { f: ["mains"], x: 320, y: 300, s: 1.3 } },
      etapes: [
        { t: "Avant de préparer les injectables et avant tout geste aseptique : friction hydroalcoolique.", a: [["regler", "m", "frotte", true], ["aller", "m", 320, 300, 4], ["aller", "m", 320, 300, -4], ["aller", "m", 320, 300, 0]] },
        { t: "Mains visiblement souillées : eau et savon d'abord.", a: [["regler", "m", "frotte", false]] },
      ],
      sources: [
        src("sf2h2017", "La désinfection par friction avec un produit hydro-alcoolique est la technique de référence dans toutes les indications d'hygiène de mains en l'absence de souillure visible. (R8)"),
        src("oms2010", "Perform hand hygiene BEFORE: starting an injection session (i.e. preparing injection material and giving injections)"),
      ],
    },
    {
      id: "etiquetage", titre: "Préparer et étiqueter", sous: "5 B, une préparation à la fois",
      objets: { s: { f: ["seringue", 10, {}], x: 320, y: 360 } },
      etapes: [
        { t: "Règle des 5 B : bon patient, bon médicament, bonne dose, bonne voie, bon moment.", a: [["bulle", 320, 80, "5 B"]] },
        { t: "Préparer au plus près de l'administration, une seule préparation à la fois.", a: [["air", "s", 0], ["regler", "s", "vol", 10]] },
        { t: "Étiqueter en temps réel : nom, dosage, dilution, heure de préparation. Une seringue sans étiquette se jette.", a: [["etiqueter", "s", "NOM · mg/ml · heure"]] },
      ],
      note: "Le code couleur international des étiquettes de seringues (norme ISO 26825) est cité par l'ANSM et la SFAR. Le texte intégral des recommandations SFAR-SFPC (2017, mise à jour 2026) n'est pas en accès libre.",
      sources: [
        src("has2013", "Assurer la préparation le plus près possible de l'administration, selon le RCP. Réaliser une seule préparation à la fois pour un patient donné. Étiqueter la préparation en temps réel. Jeter tout médicament sans étiquette."),
        { niveau: "institutionnel", titre: "Étiquetage des ampoules et autres petits conditionnements de solutions injectables", editeur: "ANSM", date: "20/12/2022, mis à jour le 13/04/2023", url: "https://ansm.sante.fr/actualites/impression/3911", cite: "identique à la couleur déjà utilisée pour la préparation des seringues dans les services d'anesthésie-réanimation, en application de la norme ISO 26825:2020" },
      ],
    },
    {
      id: "ampoule", titre: "Ouvrir une ampoule et prélever", sous: "compresse, tête au collecteur",
      objets: { c: { f: ["compresse"], x: 220, y: 300 }, a: { f: ["ampoule", "PRODUIT\nx mg/1 ml", 1, {}], x: 130, y: 420 }, s: { f: ["seringue", 5, {}], x: 400, y: 330 }, dasri: DASRI },
      etapes: [
        { t: "Faire descendre le liquide de la tête de l'ampoule.", a: [["aller", "a", 130, 420, 10], ["aller", "a", 130, 420, -10], ["aller", "a", 130, 420, 0]] },
        { t: "Protéger les doigts avec une compresse, casser la tête.", a: [["aller", "c", 130, 260], ["casser", "a"], ["aller", "c", 220, 300]] },
        { t: "La tête va directement au collecteur.", a: [["pause", 300]] },
        { t: "Retourner l'ampoule ouverte, partie cassée vers le bas, un peu inclinée ; seringue dessous, aiguille vers le haut. Seule la pointe de l'aiguille (trocart rose 18G) entre par l'ouverture et reste dans le liquide, qui ne coule pas. Aspirer en suivant la graduation. Pratique décrite par l'équipe : pas de source écrite trouvée.", a: [["aspirer", "s", "a", 1]] },
        { t: "Dévisser le trocart : il va directement au collecteur. Fermer la seringue par un bouchon.", a: [["trocart", "s"]] },
        { t: "<b class=\"interdit\">Pratique observée, non recommandée :</b> garder le trocart recapuchonné comme bouchon. Le recapuchonnage expose à l'accident d'exposition au sang ; la réglementation l'interdit.", a: [["aiguille", "s", "aiguille"], ["trocart", "s", "capuchon"]] },
      ],
      note: `${SANS}repérage du point de rupture et sens de cassure. L'aiguille filtre n'a pas de recommandation française ; une source québécoise ne la justifie pas en routine.`,
      sources: [
        src("oms2010", "protect your fingers with a clean barrier (e.g. a small gauze pad) when opening the ampoule"),
        src("arr2013", "jeter immédiatement sans manipulation les aiguilles et autres instruments piquants ou coupants dans un conteneur adapté"),
        src("quebec", "il ne semble pas justifié d'étendre l'utilisation des aiguilles filtrantes à l'ensemble des unités de soins"),
        src("iso6009", "1,2 18 Pink : The colour shall indicate the nominal outer diameter of the tube of the needle"),
        src("sf2h2017", "ne pas recapuchonner, ne pas plier ou casser, ne pas désadapter à la main (R23)"),
      ],
    },
    {
      id: "reconstitution", titre: "Reconstituer une poudre", sous: "flacon + solvant",
      objets: { f: { f: ["flacon", "POUDRE\nflacon", { poudre: true, max: 6 }], x: 130, y: 420 }, e: { f: ["ampoule", "SOLVANT", 5, { plastique: true }], x: 250, y: 420 }, s: { f: ["seringue", 5, {}], x: 400, y: 330 }, dasri: DASRI },
      etapes: [
        { t: "Retirer l'opercule, désinfecter le bouchon à l'alcool à 70 % et laisser sécher.", a: [["ouvrir", "f"], ["bulle", 130, 260, "ALCOOL"]] },
        { t: "Prélever le solvant prévu par la fiche du PISU.", a: [["casser", "e"], ["aspirer", "s", "e", 5]] },
        { t: "Piquer le bouchon, injecter le solvant.", a: [["injecter", "s", "f", "tout"]] },
        { t: "Mélanger jusqu'à dissolution complète. Secouer ou non : suivre le RCP du produit.", a: [["dissoudre", "f"]] },
        { t: "Prélever la dose.", a: [["aspirer", "s", "f", 3]] },
      ],
      note: `Le PISU donne pour chaque produit le solvant et le volume (Aspégic, Rivotril, Rocéphine, Solumédrol, Cyanokit). ${SANS}la consigne « ne pas secouer » en général : elle dépend du RCP de chaque spécialité.`,
      sources: [
        src("oms2010", "Wipe the access diaphragm (septum) with 70% alcohol […] and allow to air dry before inserting a device into the bottle. […] Mix the contents of the vial thoroughly until all visible particles have dissolved."),
        src("has2013", "selon les bonnes règles d'hygiène et le Résumé des Caractéristiques du Produit (RCP)"),
      ],
    },
    {
      id: "purge", titre: "Purger la seringue", sous: "chasser l'air",
      objets: { s: { f: ["seringue", 10, {}], x: 320, y: 340 } },
      etapes: [
        { t: "Après le prélèvement, il reste de l'air dans la seringue.", a: [["regler", "s", "vol", 6], ["regler", "s", "air", 1]] },
        { t: "Tenir la seringue verticale, aiguille ou embout vers le haut. Tapoter le corps pour faire monter les bulles, puis pousser doucement le piston jusqu'à chasser l'air et s'arrêter au trait du volume prescrit. Le piston ne se tire pas pendant la purge.", a: [["purger", "s", 320, 85]] },
        { t: "Vérifier le volume sur la graduation.", a: [["pause", 400]] },
      ],
      note: `${SANS}ce geste. Ni le guide de l'OMS (2010), ni la HAS, ni la SF2H ne décrivent la purge d'une seringue. L'animation montre la pratique courante ; à faire valider par le SSSM 44.`,
      sources: [],
    },
    {
      id: "ivd", titre: "Injection IV sur la VVP", sous: "octopus, robinet trois voies, rinçage",
      objets: { b: { f: ["bras"], x: 300, y: 380 }, s: { f: ["seringue", 10, {}], x: 540, y: 330 }, r: { f: ["seringue", 10, { liq: "#e3f1f8", pisu: "seringue de rinçage : la SF2H dit « volume minimum de 10 ml »" }], x: 600, y: 330 }, dasri: { f: ["collecteur"], x: 90, y: 150 } },
      etapes: [
        { t: "La ligne : cathéter, prolongateur multivoies (« octopus ») avec un clamp par voie, robinet trois voies.", a: [["regler", "s", "vol", 5], ["regler", "r", "vol", 10], ["phase", "MONTAGE"]] },
        { t: "Désinfecter le septum et le pas de vis : friction à l'alcool à 70 % pendant au moins 15 secondes.", a: [["bulle", 370, 230, "15 s"]] },
        { t: "Visser la seringue sans aiguille sur le robinet (Luer-lock, quart de tour, sans serrer exagérément).", a: [["aiguille", "s", "none"], ["connecter", "s", "b"]] },
        { t: "Ouvrir le clamp de la voie, tourner la manette du robinet vers la voie à ouvrir.", a: [["clamp", "b", false], ["robinet", "b", true]] },
        { t: "Injecter (IVD : en bolus) en suivant la graduation.", a: [["injecter", "s", "b", "tout", { site: true }]] },
        { t: "Rinçage pulsé avec 10 ml de NaCl 0,9 %. Le PISU le demande après chaque bolus d'adrénaline et d'amiodarone (1A, 1E, M3).", a: [["robinet", "b", false], ["deconnecter", "s", 540, 330], ["aiguille", "r", "none"], ["connecter", "r", "b"], ["robinet", "b", true], ["injecter", "r", "b", "tout", { site: true }]] },
        { t: "Refermer le robinet avant de dévisser, remettre un bouchon stérile neuf. Seringues au collecteur.", a: [["robinet", "b", false], ["deconnecter", "r", 600, 330], ["aiguille", "s", "aiguille"], ["jeter", "s"], ["aiguille", "r", "aiguille"], ["jeter", "r"]] },
      ],
      note: "Le PISU ne dit pas sur quelle voie de l'octopus injecter. Les couleurs des clamps varient selon les références (vert, orange, blanc chez Vygon) : pas de convention générale. Selon le modèle, la manette du robinet montre les voies ouvertes (Discofix, flèches) ou la voie fermée (BD Connecta, « off »).",
      sources: [
        src("sf2h2019", "désinfection du septum et du pas de vis de la valve avant son utilisation, par mouvement de friction avec de l'alcool à 70% pendant au minimum 15 secondes (R19) ; rinçage par poussées successives, dit « rinçage pulsé », après chaque injection/perfusion médicamenteuse (R21) ; nouveau bouchon obturateur stérile chaque fois que l'accès ou le robinet est ouvert (R22)"),
        src("pisu", "En IVD avec rinçage de la voie de perfusion après chaque bolus et surélévation du membre perfusé (M3, p.115)"),
        src("connecta", "Tourner la poignée dans la position appropriée pour obtenir le circuit liquidien souhaité. […] Fermer le robinet d'arrêt BD Connecta™ avant la déconnexion du dispositif pour minimiser le reflux de sang."),
        src("vygon", "each line has a hub or a clamp of a different colour"),
      ],
    },
    {
      id: "ivl", titre: "Injection IV lente", sous: "IVL, G30 %",
      objets: { b: { f: ["bras"], x: 300, y: 380 }, s: { f: ["seringue", 20, { liq: "#f1e6b8" }], x: 540, y: 370 }, t: { f: ["minuteur"], x: 560, y: 80 }, dasri: { f: ["collecteur"], x: 90, y: 150 } },
      etapes: [
        { t: "Même préparation du site que pour l'IVD (alcool à 70 %, 15 s).", a: [["regler", "s", "vol", 20], ["bulle", 370, 270, "15 s"]] },
        { t: "Injecter lentement. Le PISU précise pour le G30 % : très lentement sur une voie veineuse périphérique fiable (risque de nécrose tissulaire).", a: [["aiguille", "s", "none"], ["injecter", "s", "b", "tout", { site: true, enfonce: 0, lent: true }]] },
        { t: "Rinçage, puis seringue au collecteur.", a: [["aller", "s", 540, 370, 0], ["jeter", "s"]] },
      ],
      note: "Le PISU ne donne pas de durée chiffrée pour l'IVL.",
      sources: [src("sf2h2019"), src("pisu", "le G30 % doit être injecté très lentement sur une voie veineuse périphérique fiable (M9, p.129)")],
    },
    {
      id: "perfusion", titre: "Diluer dans une poche", sous: "acide tranéxamique, méthylprednisolone",
      objets: { p: { f: ["poche", "NaCl 0,9 %\n100 ml", 100, { max: 110, entree: 190 }], x: 220, y: 20 }, s: { f: ["seringue", 10, {}], x: 420, y: 330 }, t: { f: ["minuteur"], x: 470, y: 80 }, dasri: DASRI },
      etapes: [
        { t: "Désinfecter le site d'injection de la poche.", a: [["regler", "s", "vol", 10], ["bulle", 220, 250, "ALCOOL"]] },
        { t: "Injecter la dose préparée dans la poche.", a: [["injecter", "s", "p", "tout", { par: "dessous" }]] },
        { t: "Étiqueter la poche, régler la durée donnée par le PISU (ex. : acide tranéxamique 1 g sur 10 min).", a: [["minuteur", "t", "10 min"]] },
        { t: "Seringue au collecteur.", a: [["jeter", "s"]] },
      ],
      sources: [src("sf2h2019", "désinfecter les embouts et les robinets avant leur manipulation à l'aide d'une compresse stérile imprégnée avec de l'alcool à 70% (R20)"), src("pisu", "2 ampoules de 0,5 g/5 ml dans 100 ml de NaCl 0,9 % (M2, p.113)")],
    },
    {
      id: "im", titre: "Injection intramusculaire", sous: "adrénaline, anaphylaxie",
      objets: { c: { f: ["cuisse"], x: 330, y: 280 }, s: { f: ["seringue", 2, {}], x: 560, y: 200 }, dasri: { f: ["collecteur"], x: 80, y: 140 } },
      etapes: [
        { t: "Site : face latéro-externe du tiers moyen de la cuisse.", a: [["regler", "s", "vol", .4], ["bulle", 305, 170, "ICI"]] },
        { t: "Piquer perpendiculaire à la peau, injecter la dose (4A, 4E : 0,01 mg/kg, max 0,5 mg).", a: [["injecter", "s", "c", "tout", { site: true, enfonce: 30 }]] },
        { t: "Retirer, aiguille directement au collecteur sans la recapuchonner.", a: [["jeter", "s"]] },
        { t: "Le PISU prévoit une réévaluation à T + 5 min de l'injection d'adrénaline (logigrammes 4A, 4E).", a: [["pause", 300]] },
      ],
      note: "L'angle d'injection n'est pas précisé dans les sources lues ; « perpendiculaire » est la pratique courante.",
      sources: [
        src("sfmu2016", "Le site d'injection recommandé est la face latéroexterne du tiers moyen de la cuisse, y compris chez les patients traités par antithrombotiques. (p.350)"),
        src("arr2013", "ne jamais recapuchonner les aiguilles"),
      ],
    },
    {
      id: "io", titre: "Voie intra-osseuse EZ-IO", sous: "1A, 1E : si 1 échec de VVP",
      tableau: `<table class="tab-mat"><tr><th>Aiguille EZ-IO (fabricant)</th><th>Embase</th><th>Indication du fabricant</th></tr>
        <tr><td>15 mm</td><td><span class="pastille-c" style="background:#f48fb1"></span> rose</td><td>environ 3 à 39 kg</td></tr>
        <tr><td>25 mm</td><td><span class="pastille-c" style="background:#1e88e5"></span> bleue</td><td>3 kg et plus</td></tr>
        <tr><td>45 mm</td><td><span class="pastille-c" style="background:#fdd835"></span> jaune</td><td>humérus proximal si 40 kg et plus, ou tissus épais sur le site</td></tr></table>
        <p class="note">Le choix final se fait sur le repère : au moins 5 mm de cathéter (une ligne noire) visibles hors de la peau, pointe au contact de l'os.</p>
        <table class="tab-mat"><tr><th>Site</th><th>Repère (document du fabricant)</th></tr>
        <tr><td>Tibia proximal adulte</td><td>environ 2 cm en dedans de la tubérosité tibiale, ou 3 cm sous la rotule et 2 cm en dedans, sur la face plate</td></tr>
        <tr><td>Tibia proximal enfant</td><td>environ 1 cm en dedans de la tubérosité tibiale, ou juste sous la rotule et un peu en dedans</td></tr>
        <tr><td>Tête humérale</td><td>main sur l'abdomen, bras contre le corps ; 1 à 2 cm au-dessus du col chirurgical, sur la partie la plus saillante du tubercule majeur ; angle 45°</td></tr>
        <tr><td>Tibia distal</td><td>adulte : environ 3 cm au-dessus de la malléole interne ; enfant : 1 à 2 cm</td></tr>
        <tr><td>Fémur distal (enfant)</td><td>juste au-dessus de la rotule (1 cm au plus), 1 à 2 cm en dedans de la ligne médiane</td></tr></table>`,
      objets: { j: { f: ["jambeIO2", "#1e88e5", "25 mm"], x: 380, y: 300 }, d: { f: ["ezio"], x: 180, y: 80 }, s: { f: ["seringue", 10, { liq: "#e3f1f8", pisu: "rinçage : 5 à 10 ml adulte, 2 à 5 ml enfant (notice)" }], x: 560, y: 330 } },
      etapes: [
        { t: "Le PISU (1A, 1E) : si 1 échec de VVP, pose EZ-IO. Repérer le site : tibia proximal, environ 2 cm en dedans de la tubérosité tibiale (adulte).", a: [["phase", "REPÉRAGE"], ["regler", "j", "repere", true], ["regler", "s", "vol", 10]] },
        { t: "Antisepsie du site selon le protocole du service (la notice ne précise pas le produit).", a: [["phase", "ANTISEPSIE"], ["fondu", "j", "antisepsie", 1]] },
        { t: "Choisir l'aiguille (tableau) ; amorcer la rallonge EZ-Connect au NaCl 0,9 %.", a: [["phase", "MATÉRIEL"], ["fondu", "j", "antisepsie", .3, 400]] },
        { t: "Piquer jusqu'au contact de l'os, à 90° : au moins 5 mm de cathéter (une ligne noire) restent visibles.", a: [["phase", "PERÇAGE"], ["aller", "d", 180, 170, 0], ["fondu", "j", "aig", .6, 700]] },
        { t: "Percer sans force excessive : relâcher la gâchette au ressaut (enfant) ; chez l'adulte, avancer d'environ 1 cm après l'entrée dans la cavité médullaire.", a: [["bulle", 300, 150, "BZZZ"], ["fondu", "j", "aig", 1, 1400], ["aller", "d", 180, 80, 0]] },
        { t: "Tenir l'embase, retirer le mandrin.", a: [["phase", "MANDRIN"], ["regler", "j", "mandrin", false], ["bulle", 180, 170, "CLIC"]] },
        { t: "Poser le stabilisateur EZ-Stabilizer, visser la rallonge amorcée (sens horaire, clamp ouvert).", a: [["phase", "FIXATION"], ["regler", "j", "stab", true], ["regler", "j", "connect", true], ["bulle", 320, 160, "CLIC"]] },
        { t: "Aspirer légèrement (moelle visible), puis rincer : 5 à 10 ml chez l'adulte, 2 à 5 ml chez l'enfant.", a: [["phase", "RINÇAGE"], ["injecter", "s", "j", 10, { site: true, enfonce: -36 }]] },
        { t: "Vérifier : cathéter stable, aspiration possible après rinçage, débit correct. Noter date et heure.", a: [["phase", "VÉRIFICATION"], ["aller", "s", 560, 330, 0]] },
      ],
      note: "Document du fabricant : il ne remplace ni la formation ni la notice du kit en service ; le PISU du SDIS fait foi. La lidocaïne IO décrite par le fabricant n'est pas dans le PISU : elle n'est pas montrée ici. Aucun seuil d'âge ou de poids du fabricant pour choisir entre les sites pédiatriques.",
      sources: [
        src("pisu", "(Si 1 échec : Pose EZ-IO) (logigrammes 1A p.19 et 1E p.57)"),
        src("ifuIO", "Au moins une partie du cathéter mesurant 5 mm (au moins une ligne noire) doit être visible à l'extérieur de la peau. […] Rincer le cathéter EZ-IO® avec une solution saline normale (chlorure de sodium à 0,9 %) (5 à 10 ml pour les adultes; 2 à 5 ml pour les nourrissons/enfants). a. Avant de rincer, aspirer légèrement pour obtenir une confirmation visuelle de la moelle osseuse."),
        src("teleflex", "EZ-IO 45 mm Needle Set (yellow hub) […] EZ-IO 25 mm Needle Set (blue hub) should be considered for patients 3 kg and greater […] EZ-IO 15 mm Needle Set (pink hub) should be considered for patients approximately 3-39 kg"),
        src("ercALS", "If IV access cannot be rapidly achieved within two attempts, it is reasonable to consider IO access as an alternative route for vascular access during adult cardiac arrest."),
      ],
    },
    {
      id: "vvp", titre: "Poser une voie veineuse périphérique", sous: "site, calibre, antisepsie, fixation",
      tableau: `<table class="tab-mat"><tr><th>Calibre</th><th>Couleur</th><th>Diamètre externe</th><th>Débit (BD Venflon Pro Safety)</th></tr>
        <tr><td>14G</td><td><span class="pastille-c" style="background:#ef6c00"></span> orange</td><td>2,0 mm</td><td>270 ml/min</td></tr>
        <tr><td>16G</td><td><span class="pastille-c" style="background:#9e9e9e"></span> gris</td><td>1,8 mm</td><td>236 ml/min</td></tr>
        <tr><td>17G</td><td><span class="pastille-c" style="background:#ffffff"></span> blanc</td><td>1,5 mm</td><td>133 ml/min</td></tr>
        <tr><td>18G</td><td><span class="pastille-c" style="background:#2e7d32"></span> vert</td><td>1,3 mm</td><td>103 ml/min</td></tr>
        <tr><td>20G</td><td><span class="pastille-c" style="background:#ec407a"></span> rose</td><td>1,1 mm</td><td>67 ml/min</td></tr>
        <tr><td>22G</td><td><span class="pastille-c" style="background:#1565c0"></span> bleu</td><td>0,9 mm</td><td>42 ml/min</td></tr>
        <tr><td>24G</td><td><span class="pastille-c" style="background:#fdd835"></span> jaune</td><td>0,7 mm (ISO 1996)</td><td>pas de source fabricant ouverte</td></tr>
        <tr><td>26G</td><td><span class="pastille-c" style="background:#7e57c2"></span> violet</td><td>0,6 mm (ISO 1996)</td><td>pas de source fabricant ouverte</td></tr></table>
        <p class="note">Couleurs : norme ISO 10555-5 (tableau de l'édition 1996, la seule consultée). Débits propres à un produit, pas des valeurs normatives.</p>`,
      objets: { b: { f: ["brasPose", "#2e7d32", "18G"], x: 330, y: 290 } },
      etapes: [
        { t: "Friction hydroalcoolique, gants. Choisir le site : chez l'adulte, membre supérieur plutôt qu'inférieur, pas en regard d'une articulation. Chez l'enfant : aussi la main, le dessus du pied (ou le cuir chevelu).", a: [["phase", "SITE"]] },
        { t: "Poser le garrot : la veine se gonfle. Aucune recommandation trouvée sur la pose du garrot (pression, durée).", a: [["phase", "GARROT"], ["regler", "b", "garrot", true]] },
        { t: "Antisepsie : au moins une application d'antiseptique alcoolique (chlorhexidine alcoolique à 2 % recommandée par la SF2H), séchage spontané complet. Nettoyage préalable seulement si la peau est souillée.", a: [["phase", "ANTISEPSIE"], ["fondu", "b", "antisepsie", 1, 1200]] },
        { t: "Piquer, voir le reflux de sang dans la chambre, avancer le cathéter sur le mandrin.", a: [["phase", "POSE"], ["fondu", "b", "cath", .7, 1200], ["regler", "b", "reflux", true], ["fondu", "b", "cath", 1, 600]] },
        { t: "Desserrer le garrot, retirer le mandrin : il va directement au collecteur.", a: [["regler", "b", "garrot", false], ["regler", "b", "mandrin", false], ["bulle", 470, 220, "CLIC"]] },
        { t: "Raccorder le prolongateur court (octopus), puis le robinet trois voies, vissés (Luer-lock).", a: [["phase", "RACCORD"], ["regler", "b", "prolong", true], ["bulle", 520, 170, "CLIC"]] },
        { t: "Pansement stérile transparent ; fixer avec des bandelettes adhésives stériles, posées sur l'embase. Tracer : calibre, site, date, opérateur.", a: [["phase", "FIXATION"], ["regler", "b", "pansement", true]] },
      ],
      note: "Calibre « le plus petit adapté » et calibre par âge chez l'enfant : aucune recommandation trouvée.",
      sources: [
        src("sf2h2005", "Il est recommandé, chez l'adulte, de choisir un site d'insertion au membre supérieur plutôt qu'au membre inférieur (B1). Il est recommandé de ne pas insérer un cathéter en regard d'une articulation (D2). Chez l'enfant, il est possible d'utiliser également la main, le dessus du pied ou le cuir chevelu (C2)."),
        src("sf2h2019", "Avant l'insertion d'un cathéter périphérique, il est fortement recommandé de réaliser au moins une application avec une solution antiseptique alcoolique (A-1) ; […] attendre le séchage spontané complet de l'antiseptique (A-3) ; pansement stérile (B-1) transparent en polyuréthane (B-3) ; fixer le CVP avec des bandelettes adhésives stériles (B-3) ; prolongateur court (B-3)"),
        src("sf2h2016", "il est fortement recommandé d'utiliser une solution alcoolique de chlorhexidine à 2 % plutôt qu'une solution alcoolique de povidone iodée en réanimation (A-1) ainsi que dans tous les autres secteurs (A-3)."),
        src("iso10555"), src("bdVenflon", "22G (0.9 mm) = Blue, 20G (1.1 mm) = Pink, 18G (1.3 mm) = Green, 17G (1.5 mm) = White, 16G (1.8 mm) = Grey, 14G (2.0 mm) = Orange"),
        src("rch", "Dorsum of the non-dominant hand is preferred"),
      ],
    },
    {
      id: "ceinture", titre: "Ceinture pelvienne", sous: "3A, 3E : suspicion de traumatisme du bassin",
      objets: { p: { f: ["bassin"], x: 320, y: 150 } },
      etapes: [
        { t: "PISU 3A : pose de ceinture pelvienne si suspicion de traumatisme du bassin. La fiche dit « PAS ≤ 80 mmHg », le texte « sans condition de PAS » : à confirmer par le SSSM 44. 3E : si suspicion et PAS ≤ valeur de référence pour l'âge.", a: [["phase", "INDICATION"]] },
        { t: "Vider les poches. Glisser la ceinture sous les genoux de la victime.", a: [["phase", "MISE EN PLACE"], ["regler", "p", "pos", 0]] },
        { t: "Relever légèrement la victime (pont à plusieurs sauveteurs), glisser la ceinture sous les fesses et la centrer sur les grands trochanters, puis reposer la victime.", a: [["fondu", "p", "pos", 1, 1600]] },
        { t: "Ramener les deux extrémités sur la symphyse pubienne, serrer avec le dispositif prévu jusqu'au clic, puis sécuriser la fermeture.", a: [["phase", "SERRAGE"], ["regler", "p", "ferme", true], ["bulle", 320, 90, "CLIC"]] },
        { t: "Vérifier : appui sur les grands trochanters, passage sur la symphyse, fermeture qui ne lâche pas. La ceinture reste en place jusqu'à l'hôpital.", a: [["phase", "VÉRIFICATION"]] },
      ],
      note: "Pose « sans soulever » ou pendant un retournement : aucune source ; un consensus canadien conseille même d'éviter de rouler la victime. Rapprochement des genoux ou des pieds : aucune source trouvée.",
      sources: [
        src("pisu", "Pose de ceinture pelvienne si suspicion de traumatisme du bassin (logigramme 3A p.27) ; voir l'onglet « À confirmer » du 3A pour l'écart PAS."),
        src("pse", "glisser la ceinture sous les genoux de la victime ; relever légèrement la victime (pont à plusieurs sauveteurs) pour décoller ses fesses du sol ; glisser la ceinture sous les fesses, la centrer au niveau des grands trochanters ; reposer la victime au sol ; ramener les deux extrémités de la ceinture au niveau de la symphyse."),
        src("sam", "Place SAM Pelvic Sling™ II white side up beneath patient at level of trochanters (hips). […] pull BLACK STRAP in opposite direction until you hear and feel the buckle click."),
      ],
    },
    {
      id: "aerosol", titre: "Aérosol (nébulisation)", sous: "salbutamol, ipratropium, adrénaline",
      objets: { u: { f: ["unidose", "UNIDOSE", 2.5, {}], x: 110, y: 420 }, s: { f: ["seringue", 5, {}], x: 220, y: 330 }, neb: { f: ["nebuliseur", {}], x: 380, y: 330 }, t: { f: ["minuteur"], x: 560, y: 90 } },
      etapes: [
        { t: "Verser les produits dans le réservoir : volume total de 4 à 5 ml (PISU, M3, M5, M19).", a: [["ouvrir", "u"], ["aspirer", "s", "u", 2.5], ["injecter", "s", "neb", "tout"]] },
        { t: "Masque sur le visage, oxygène 6 à 9 l/min (M19).", a: [["regler", "neb", "marche", true], ["bulle", 590, 380, "O₂"]] },
        { t: "Durée : 15 à 20 minutes (M19) ; 15 min (M5) ; 20 min (2A, 2E).", a: [["minuteur", "t", "15-20 min"]] },
      ],
      sources: [
        src("pisu", "Administrer un aérosol de salbutamol 2,5 mg/2,5 ml ou 5 mg/2,5 ml sous oxygène 6 à 9 l/min […] Volume total dans le réservoir de la chambre d'inhalation de 4 à 5 ml. Durée de l'aérosol : 15 à 20 minutes (M19, p.149)"),
        src("splf2024", "Régler le débit conformément aux recommandations du fabriquant (6 litres par minute par défaut) […] La nébulisation dure environ 15 minutes"),
      ],
    },
    {
      id: "orale", titre: "Voies orale, buccale, sublinguale", sous: "Lyoc, Oramorph, Buccolam, Natispray",
      objets: { b: { f: ["seringueOrale", "Buccolam : gencive et joue", "#4a90d9"], x: 220, y: 120 }, sp: { f: ["spray", "NATISPRAY"], x: 470, y: 390 }, c: { f: ["comprimes", "per os", 2, {}], x: 190, y: 330 } },
      etapes: [
        { t: "Buccolam : administrer lentement la dose complète entre la gencive et la joue ; dose importante : moitié de chaque côté (M14).", a: [["aller", "b", 250, 120, -6], ["aller", "b", 220, 120, 0]] },
        { t: "Natispray : amorcer 5 fois avant la première utilisation ; patient assis, 1 pulvérisation sublinguale (M20).", a: [["regler", "sp", "bouffee", true], ["bulle", 520, 230, "1 dose"]] },
        { t: "Per os : paracétamol, prednisolone, sulfate de morphine selon les fiches M16, M17, M18.", a: [["regler", "sp", "bouffee", false]] },
      ],
      sources: [src("pisu", "Administrer lentement la dose complète entre la gencive et la joue (M14, p.139) ; Avant la première utilisation, il faut actionner 5 fois la pompe pour l'amorcer (M20, p.151)")],
    },
    {
      id: "meopa", titre: "MÉOPA : montage et administration", sous: "Kalinox, valve à la demande",
      objets: { k: { f: ["meopaKit"], x: 220, y: 380 }, t: { f: ["minuteur"], x: 520, y: 60 } },
      etapes: [
        { t: "Contrôler la bouteille : étiquette et ogive blanche à bande bleue, intégrité, scellé intact, autonomie suffisante. Ne pas utiliser une bouteille qui a pu geler (sous 0 °C) ou qui porte du givre.", a: [["phase", "CONTRÔLE"]] },
        { t: "Bouteille debout et arrimée. Raccorder le tuyau de la valve à la demande sur le manodétendeur (raccord spécifique bleu et blanc), sans raccord intermédiaire.", a: [["phase", "MONTAGE"], ["regler", "k", "valve", true], ["bulle", 330, 110, "CLIC"]] },
        { t: "Filtre antibactérien et masque à usage unique (fiche OMEDIT ; le RCP ne cite pas de filtre).", a: [["regler", "k", "filtre", true], ["regler", "k", "masque", true]] },
        { t: "Ouvrir le robinet doucement, sans forcer ni l'ouvrir en butée ; ne jamais se placer face à la sortie.", a: [["phase", "OUVERTURE"], ["regler", "k", "ouvert", true], ["bulle", 220, 60, "PSSHIT"]] },
        { t: "Patient en respiration spontanée, auto-administration de préférence. Masque au moins 3 minutes avant l'acte, contact verbal maintenu.", a: [["phase", "ADMINISTRATION"], ["minuteur", "t", "≥ 3 min"]] },
        { t: "8A, 8E : max 20 min ; arrêt si inefficace après 10 min, cyanose, perte de contact, excitation paradoxale, vomissements. Le RCP : arrêt immédiat en cas de perte du contact verbal.", a: [["pause", 300]] },
        { t: "Fin : fermer le robinet de la bouteille, laisser chuter la pression, puis fermer.", a: [["phase", "FERMETURE"], ["regler", "k", "ouvert", false]] },
      ],
      note: "Seuil de pression pour changer de bouteille : aucune source française (un protocole du fabricant en Espagne dit 10 bar). Retourner la bouteille : aucune source.",
      sources: [
        src("pisu", "Positionner la bouteille en position debout. […] le masque doit être maintenu pendant une période d'au moins 3 minutes (M13, p.137) ; MÉOPA max 20 min, arrêt si inefficace après 10 min (8A, 8E)"),
        src("rcpKalinox", "Le mélange doit être stocké et administré à une température supérieure à 0°C ; à une température inférieure, il peut apparaître une séparation des deux gaz exposant au risque d'hypoxie. […] Lors de l'utilisation d'un masque facial, une valve à la demande est recommandée. […] Toujours ouvrir progressivement et légèrement le robinet afin d'éviter le refroidissement source de dé-mélange. […] L'administration du mélange doit être immédiatement interrompue en cas de perte du contact verbal."),
        src("omedit", "Masque à USAGE UNIQUE (UU) / Filtre antibactérien à USAGE UNIQUE (UU) / Système de valve à la demande"),
      ],
    },
    {
      id: "elimination", titre: "Éliminer les déchets", sous: "collecteur, DASRI",
      objets: { s: { f: ["seringue", 5, {}], x: 120, y: 330 }, a: { f: ["ampoule", "VIDE", 0, { max: 1 }], x: 230, y: 420 }, c: { f: ["compresse"], x: 330, y: 400 }, dasri: { f: ["collecteur"], x: 470, y: 395 }, sac: { f: ["sacDasri"], x: 590, y: 380 } },
      etapes: [
        { t: "Collecteur ouvert, à portée de main, au plus près du soin.", a: [["bulle", 470, 290, "À PORTÉE"]] },
        { t: "Aiguille : jamais recapuchonnée, jamais désadaptée à la main. Directement au collecteur.", a: [["jeter", "s"]] },
        { t: "Ampoules et têtes cassées : au collecteur à objets perforants.", a: [["jeter", "a"]] },
        { t: "Compresses souillées et emballages souillés : sac DASRI jaune.", a: [["jeter", "c", "sac"]] },
        { t: "Ne pas dépasser la limite de remplissage, ne jamais forcer. Fermeture définitive, avec la date de fermeture.", a: [["regler", "dasri", "verrou", true], ["bulle", 470, 290, "FERMÉ"]] },
      ],
      note: "L'OMS parle de remplacer le collecteur aux trois quarts ; les textes français renvoient à la limite de remplissage imprimée sur le collecteur.",
      sources: [
        src("arr2013", "ne jamais recapuchonner les aiguilles ; jeter immédiatement sans manipulation les aiguilles et autres instruments piquants ou coupants dans un conteneur adapté, situé au plus près du soin, dont l'ouverture est facilement accessible et en ne dépassant pas le niveau maximal de remplissage (annexe I, point 6)"),
        src("sf2h2017", "ne pas recapuchonner, ne pas plier ou casser, ne pas désadapter à la main ; jeter immédiatement après usage dans un conteneur pour objets perforants adapté, situé au plus près du soin, sans dépose intermédiaire (R23)"),
        src("csp", "Les déchets d'activités de soins et assimilés sont collectés dans des emballages à usage unique. (R1335-6)"),
        src("arr2003", "Les boîtes et minicollecteurs pour déchets perforants sont à usage unique (article 6)"),
        src("dgs2025", "ne pas dépasser la limite de remplissage ; ne jamais forcer l'introduction des déchets ; disposer d'un collecteur à proximité immédiate des soins (§ 1.9) ; Il est également recommandé d'indiquer la date de fermeture définitive sur l'emballage."),
        src("inrs6535", "À chaque poste générant des Dasri, l'opérateur doit avoir à sa disposition et à portée de main, les emballages adaptés"),
      ],
    },
    {
      id: "aes", titre: "Accident d'exposition au sang", sous: "piqûre, projection",
      objets: { m: { f: ["mains"], x: 320, y: 300, s: 1.3 }, t: { f: ["minuteur"], x: 540, y: 110 } },
      etapes: [
        { t: "Ne pas faire saigner. Nettoyer immédiatement à l'eau et au savon, puis rincer.", a: [["regler", "m", "frotte", true]] },
        { t: "Désinfecter au moins 5 minutes : Dakin, eau de Javel à 2,6 % diluée au 1/5e, ou à défaut polyvidone iodée dermique, alcool à 70°.", a: [["minuteur", "t", "5 min"]] },
        { t: "Projection sur les muqueuses : rincer abondamment au moins 5 minutes au sérum physiologique ou à l'eau.", a: [["pause", 300]] },
        { t: "Dans l'heure : avis médical.", a: [["regler", "m", "frotte", false]] },
      ],
      note: "Le guide de l'OMS (2010) dit l'inverse sur deux points (laisser saigner, pas de désinfectant sur peau lésée) ; le carnet suit l'INRS.",
      sources: [src("inrsAes", "Ne pas faire saigner. Nettoyer immédiatement la zone cutanée à l'eau et au savon puis rincer. Désinfecter pendant au moins 5 minutes […] Dans l'heure : prendre un avis médical")],
    },
  ];
})();
