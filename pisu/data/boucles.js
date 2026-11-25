/* Répétitions prévues par le PISU 2024 sur une étape du logigramme.
   rythme et arret : recopiés du PDF (logigramme ou texte). max : nombre de passages permis par le PDF, null s'il n'en fixe pas.
   maxTotal : plafond d'injections d'un médicament sur toute l'intervention, quand le PDF le donne. */
(() => {
  const ACR = (avec, p) => ({
    bouton: "Injection suivante",
    rythme: `toutes les 2 analyses ${avec} choc (4 min)`,
    arret: `jusqu'à l'obtention d'une reprise d'activité circulatoire spontanée (texte ${p}). Le PDF ne fixe pas de nombre maximal d'injections.`,
    max: null,
  });
  window.PISU_BOUCLES = {
    "1A": { c3: ACR("avec", "p.20"), b2: ACR("sans", "p.20") },
    "1E": { c3: ACR("avec", "p.58"), b2: ACR("sans", "p.58") },
    "8A": {
      titr: {
        bouton: "Titration suivante",
        rythme: "titration supplémentaire maximum espacée de 5 min, si le MRU reste injoignable",
        arret: "Logigramme p.47 : une titration supplémentaire. Texte p.48-49 : une seconde titration, puis une dernière si le MRU est toujours injoignable à 10 min. À confirmer par le SSSM 44. Titration interrompue en cas de somnolence ou de bradypnée inférieure à 10.",
        max: 2,
      },
    },
    "8E": {
      morph: {
        bouton: "Titration suivante",
        rythme: "si le MRU reste injoignable plus de 5 min et la victime n'est pas soulagée",
        arret: "Branche IV (EN ≥ 5) : « Maximum deux injections de chlorhydrate de morphine au total » (texte p.87). Branche EN < 5 : le PDF ne fixe pas de plafond (à confirmer par le SSSM 44). Titration interrompue en cas de somnolence ou de bradypnée inférieure à 10.",
        max: null, maxTotal: { m: "M7", n: 2, si: "chlor" },
      },
    },
  };
})();
