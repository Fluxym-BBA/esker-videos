/* Langue (FR par défaut, EN si ?lang=en ou choix mémorisé), textes de l'interface, vidéos disponibles par langue. */
let LANG = "fr";
try {
  const q = new URLSearchParams(location.search).get("lang");
  const s = q || localStorage.getItem("ev-lang");
  if (s === "en" || s === "fr") LANG = s;
} catch (e) { /* stockage indisponible : on reste en français */ }

const TXT = {
  fr: {
    wheelAria: "Roue des modules Esker : choisissez un module pour voir sa vidéo",
    synergy: "Synergy AI, le moteur d'intelligence artificielle d'Esker",
    band: "Socle plateforme Esker",
    hint: "Choisissez un module",
    cta: "VOIR LA VIDÉO", ctas: "VOIR LES VIDÉOS", soonCta: "BIENTÔT DISPONIBLE",
    s2p: "SOURCE-TO-PAY", o2c: "ORDER-TO-CASH",
    title: "Les vidéos de démonstration Esker", sub: "Cliquez sur un module de la roue pour lancer sa vidéo.",
    back: "La roue", other: "Autres modules", play: "Lancer la vidéo", list: "Vidéos de ce module", chap: "Chapitres",
    soonT: "Vidéo bientôt disponible", soonP: "La vidéo de ce module est en cours de préparation.",
    prev: "Module précédent", next: "Module suivant", list2: "Ou choisissez dans la liste",
    page: "Esker × Fluxym | Vidéos de démonstration", err: "La vidéo n'a pas pu être chargée. Vérifiez votre connexion et réessayez."
  },
  en: {
    wheelAria: "Esker module wheel: pick a module to watch its video",
    synergy: "Synergy AI, Esker's artificial intelligence engine",
    band: "Esker platform foundation",
    hint: "Pick a module",
    cta: "WATCH THE VIDEO", ctas: "WATCH THE VIDEOS", soonCta: "COMING SOON",
    s2p: "SOURCE-TO-PAY", o2c: "ORDER-TO-CASH",
    title: "Esker demo videos", sub: "Click a module on the wheel to watch its video.",
    back: "The wheel", other: "Other modules", play: "Play the video", list: "Videos for this module", chap: "Chapters",
    soonT: "Video coming soon", soonP: "The video for this module is being prepared.",
    prev: "Previous module", next: "Next module", list2: "Or pick from the list",
    page: "Esker × Fluxym | Demo videos", err: "The video could not be loaded. Check your connection and try again."
  }
};
const tx = k => TXT[LANG][k];

/* Vidéos d'un module dans la langue courante. En EN, seules les vidéos doublées sont proposées. */
function vids(m) {
  if (LANG === "en") {
    return m.videos.filter(v => v.ue).map(v => ({t: v.te || v.t, u: v.ue, d: v.de || "", dur: v.dure || v.dur || "", ch: v.che || v.ch || []}));
  }
  return m.videos.map(v => ({t: v.t, u: v.u, d: v.d || "", dur: v.dur || "", ch: v.ch || []}));
}
function totalVids() { return M.reduce((a, m) => a + vids(m).length, 0); }
function vidNote(m) {
  const n = vids(m).length;
  if (!n) return LANG === "en" ? "Soon" : "Bientôt";
  return LANG === "en" ? n + " video" + (n > 1 ? "s" : "") : n + " vidéo" + (n > 1 ? "s" : "");
}
/* texte de la roue (appelé par wheel.js) */
function I(k) {
  if (k === "count") return LANG === "en" ? totalVids() + " VIDEOS · " + M.length + " MODULES" : totalVids() + " VIDÉOS · " + M.length + " MODULES";
  return tx(k);
}
