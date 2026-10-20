// Orfini Math Quest — avvio e navigazione.
import * as G from './game/game.js';
import { app } from './app.js';
import { loadCAS } from './engine/cas.js';
import { viewOnboarding } from './screens/onboarding.js';
import { viewHome } from './screens/home.js';
import { startLesson, startReview, startTestOut } from './screens/play.js';
import { viewChallenges, startLampo, viewEnigma, startSimulation } from './screens/challenges.js';
import { viewLeague } from './screens/league.js';
import { viewRewards } from './screens/rewards.js';
import { viewProfile } from './screens/profile.js';
import { viewTeacher } from './screens/teacher.js';
import { INDIRIZZI_BY_ID } from '../activities/contesti.js';
import { toast } from './ui/dom.js';

app.state = G.load(app.store, app.today());
// ?indirizzo=<id> (link dalle pagine del sito): preimposta l'indirizzo, anche per il primo avvio
const params = new URLSearchParams(location.search);
const indParam = params.get('indirizzo');
if (indParam === 'vita' || INDIRIZZI_BY_ID[indParam]) {
  app.state.profile.indirizzo = indParam === 'vita' ? null : indParam;
  params.delete('indirizzo');
  history.replaceState(null, '', location.pathname + (params.toString() ? `?${params}` : '') + location.hash);
  if (app.state.onboarded) setTimeout(() => toast(indParam === 'vita' ? 'Problemi di vita quotidiana.' : `Indirizzo: ${INDIRIZZI_BY_ID[indParam].name}.`), 400);
}
app.applySettings();
const startEvents = G.rollover(app.state, app.today());
app.save();

// i motori simbolici si caricano dopo la prima schermata, senza rallentarla
setTimeout(() => loadCAS(), 1200);

function route() {
  app.stopLesson?.();
  app.stopLesson = null;
  document.body.classList.remove('in-lesson');
  document.querySelectorAll('.sheet-backdrop').forEach((n) => n.remove());
  // cambio di giorno con la pagina aperta
  app.handle(G.rollover(app.state, app.today()));
  app.save();
  const [view, a, b] = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (!app.state.onboarded && view !== 'docente') {
    viewOnboarding(app);
    app.chrome();
    return;
  }
  app.chrome();
  switch (view) {
    case 'lezione': startLesson(app, a, +b || 1); break;
    case 'ripasso': startReview(app); break;
    case 'prova': startTestOut(app, a, +b || 2); break;
    case 'sfide': viewChallenges(app); break;
    case 'lampo': startLampo(app); break;
    case 'enigma': viewEnigma(app); break;
    case 'simulazione': startSimulation(app, +a === 13 ? 13 : 10); break;
    case 'lega': viewLeague(app); break;
    case 'premi': viewRewards(app, a || 'pass'); break;
    case 'profilo': viewProfile(app, a); break;
    case 'docente': viewTeacher(app); break;
    case 'benvenuto': app.state.onboarded = false; app.save(); viewOnboarding(app); break;
    default: viewHome(app);
  }
  if (!document.body.classList.contains('in-lesson')) { window.scrollTo({ top: 0 }); setTimeout(() => { if (!app._modalBusy && !document.body.classList.contains('in-lesson')) app.flushModals(); }, 300); }
  app.main.focus({ preventScroll: true });
}

// funzionamento offline (dalla seconda visita): il service worker ha come ambito solo /allenamento/
if ('serviceWorker' in navigator && (location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname))) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

window.addEventListener('hashchange', route);
route();
app.handle(startEvents);
