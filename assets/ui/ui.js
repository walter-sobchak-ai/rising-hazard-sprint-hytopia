// Hytopia UI bridge: server uses player.ui.sendData({type:'state', ...})

const $ = (id) => document.getElementById(id);
const questPanel = $('questPanel');
const questList = $('questList');
const toggleBtn = $('toggleQuests');

let questsVisible = true;

function renderQuests(quests){
  questList.innerHTML = '';
  for(const q of (quests||[])){
    const pct = Math.max(0, Math.min(1, Number(q.progress ?? 0)));
    const el = document.createElement('div');
    el.className = 'quest';
    el.innerHTML = `
      <div class="questTitle">${escapeHtml(q.title || 'Quest')}</div>
      <div class="questMeta"><span>${Math.round(pct*100)}%</span><span>Weekly</span></div>
      <div class="questBar"><div class="questFill" style="width:${Math.round(pct*100)}%"></div></div>
    `;
    questList.appendChild(el);
  }
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
}

function onState(d){
  $('altitude').textContent = d.currentY ?? 0;
  $('bestRun').textContent = d.bestThisRun ?? 0;
  $('bestAll').textContent = d.bestAllTime ?? 0;
  $('lavaY').textContent = d.lavaY ?? 0;

  // Lava fill: compare current altitude relative to lava height (simple heuristic)
  const cur = Number(d.currentY ?? 0);
  const lava = Number(d.lavaY ?? 0);
  const danger = Math.max(0, Math.min(1, (lava - (cur - 20)) / 40));
  $('lavaFill').style.width = `${Math.round(danger*100)}%`;

  renderQuests(d.quests);
}

// Toggle quest panel
if(toggleBtn){
  toggleBtn.addEventListener('click', () => {
    questsVisible = !questsVisible;
    questList.classList.toggle('hidden', !questsVisible);
    toggleBtn.textContent = questsVisible ? 'Hide' : 'Show';
  });
}

// Hytopia UI data hook: many examples receive messages via window message.
// Preferred hook in HYTOPIA UI is usually `hytopia.onData(...)`.
window.hytopia = window.hytopia || {};
window.hytopia.onData = (d) => {
  if (d?.type === 'state') onState(d);
  if (d?.type === 'ping') console.log('[UI] ping', d.t);
};

// Fallback: some client versions deliver data via postMessage
window.addEventListener('message', (ev) => {
  const d = ev.data;
  if (!d) return;
  if (d.type === 'state') onState(d);
  if (d.type === 'ping') console.log('[UI] ping (postMessage)', d.t);
});
