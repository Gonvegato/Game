// ───────────────────────── Avisos de ayuda ─────────────────────────
// No es un tutorial: son avisos cortos que salen una sola vez cada uno, justo cuando hacen falta, y que se pueden ignorar.
// Los que se han visto se guardan en M.tips; Ajustes → «Volver a ver los avisos de ayuda» lo vacía.
// Hay dos formas de enseñarlos: en partida y en la plaza, un cartel arriba (tip), en el sitio de los mensajes de deidad,
// que esperan a que el aviso se vaya para no salir uno encima del otro (sysTick); dentro de un menú
// (puertas, reliquia, tienda), un recuadro en la cabecera de ese menú (tipTake + tipBox).
const tipEl = $('tip'); let tipQ = [], tipNow = null, tipT = 0, tipGap = 0, tipAge = 0;
const devKey = (pad, kb, touch) => (lastDev === 'pad' ? pad : lastDev === 'touch' ? touch : kb);
const TIPS = {
  shoot:   () => `Dispara con ${devKey('<b>A</b> o <b>RT</b>', '<b>Espacio</b>', 'el botón <b>Disparar</b>')}: Alec apunta solo al enemigo más cercano. Cada disparo te frena un instante, así que dispara, da un paso y vuelve a disparar.`,
  dodge:   () => `Esquiva con ${devKey('<b>B</b> o <b>RB</b>', '<b>Shift</b>', 'el botón <b>Esquivar</b>')}, hacia donde te estés moviendo. Mientras dura no te pueden dañar; luego tarda un segundo en recargarse.`,
  charge:  () => `Mantén ${devKey('<b>X</b> o <b>LT</b>', '<b>E</b>', 'el botón <b>Cargar</b>')} y suelta: el <b>disparo cargado</b> pega mucho más fuerte. Después tarda un par de segundos en volver.`,
  doors:   () => `Cada puerta dice lo que hay detrás. Tras la de una <b>deidad</b> espera su elegido: lo matas, quiebras su reliquia y le robas una técnica para este encargo. Las demás salas no tienen elegido y dan otra cosa: almas, oro, vida, hierro o un ajuste.`,
  relic:   () => `Solo cabe <b>una técnica por acción</b>: disparo, cargado, esquive y pasiva. Si eliges una que ya llevas, sube de nivel. El <b>Recetario</b> (botón de abajo) explica todas.`,
  status:  () => `Los iconos sobre un enemigo indican qué estados lleva encima (Ascuas, Escarcha, Veneno…). Qué hace cada uno lo dice el Glosario: Pausa → Recetario → Glosario.`,
  shop:    () => `Aquí se gasta el oro que has ido recogiendo; hay dos tiendas por encargo. La <b>Reliquia de contrabando</b> te da a elegir una técnica sin tener que matar a un elegido.`,
  defend:  () => `Protege la <b>campana</b> del centro de la aldea: su vida es la barra de abajo y, si llega a cero, pierdes el encargo.`,
  assault: () => `Busca los <b>estandartes</b> del campamento y derríbalos a disparos. Cada estandarte guarda a los suyos: no salen a por ti hasta que te acercas o les das. Cada baja da <b>experiencia</b>: al subir de nivel eliges un ajuste. Cuando caigan todos y no quede nadie, pasas al siguiente campamento.`,
  boss:    () => `Este es el <b>guardián</b> de la zona; su vida es la barra de abajo. Fíjate en sus ataques y esquívalos. Si caes, conservas lo ganado y puedes volver a intentarlo.`,
  souls:   () => { const min = Math.min(...TREE_NODES.map(n => n.cost[tr(n.id)]).filter(c => c > 0)); return `Traes <b>${M.souls} almas</b>. Se gastan en el <b>patio de armas</b>, en mejoras que valen para todos los encargos${M.souls >= min ? ': ya te llega para alguna' : ''}.`; },
  iron:    () => `Traes <b>Hierro Místico</b>. En la <b>forja</b>, cada pieza de guantelete que has encontrado dice lo que cuesta forjarla; una vez forjada, puedes montarla siempre.`,
};
const tipSeen = id => !!(M.tips || {})[id];
function tipMark(id) { M.tips = M.tips || {}; M.tips[id] = 1; save(); }
// Pide un aviso (o varios, en orden): se pone a la cola si no se ha visto ya. Se da por visto cuando llega a salir en pantalla.
function tip(...ids) { for (const id of ids) if (TIPS[id] && !tipSeen(id) && tipNow !== id && !tipQ.includes(id)) tipQ.push(id); }
// Para los avisos que van dentro de un menú: devuelve el id si toca enseñarlo (y lo da por visto), o null
function tipTake(id) { if (!TIPS[id] || tipSeen(id)) return null; tipMark(id); return id; }
const tipBox = id => (id && TIPS[id] ? `<div class="tipbox"><em>Ayuda</em><span>${TIPS[id]()}</span></div>` : '');
function tipClear() { tipQ = []; tipNow = null; tipT = 0; tipGap = 0; tipEl.hidden = true; }
function tipsReset() { M.tips = {}; save(); tipClear(); }
const statusOn = e => e.spawn <= 0 && (e.ember > 0 || e.venom > 0 || e.needles > 0 || e.mark > 0 || e.frost > 0 || e.frozen > 0 || e.bleed > 0 || !!e.doom || e.lit > 0 || e.sleep > 0 || e.seed > 0 || e.root > 0 || e.wet > 0);
function tipTick(dt) {
  const m = S.mode, live = (m === 'play' || m === 'town') && !S.dialog;
  if (m === 'play' && !tipSeen('status') && S.enemies.some(statusOn)) tip('status');
  if (!live) { tipEl.hidden = true; if (tipNow && tipAge > 4) tipNow = null; return; }   // en los menús no se ve ni corre el tiempo; si se abrió uno cuando apenas había salido, al volver sigue donde estaba
  if (tipNow) { tipT -= dt; tipAge += dt; if (tipT <= 0) { tipNow = null; tipGap = 0.8; } }
  else if ((tipGap -= dt) <= 0) {
    while (tipQ.length && !tipNow) { const id = tipQ.shift(); if (!tipSeen(id)) tipNow = id; }
    if (tipNow) { const h = TIPS[tipNow](); tipMark(tipNow); tipAge = 0; tipEl.innerHTML = '<em>Ayuda</em>' + h; tipT = clamp(h.replace(/<[^>]+>/g, '').length / 15, 7, 11); sfx('tick', 0.3, 0.8); }
  }
  tipEl.hidden = !tipNow;
}
