async function loadCatalog(){
  const res = await fetch('./tools.json');
  if(!res.ok) throw new Error('Could not load tools.json');
  return await res.json();
}

function statusClass(status){ return status === 'live' ? 'live' : 'migrating'; }
function statusLabel(status){ return status === 'live' ? 'Live' : 'Migrating'; }

function cardMarkup(t, i){
  const search = (t.name + ' ' + (t.tags || []).join(' ') + ' ' + (t.summary || '')).toLowerCase();
  return `
    <article class="workspace-card" data-search="${search}" style="animation-delay:${i * 45}ms">
      <div class="workspace-card-top">
        <div class="workspace-icon"><i class="ti ${t.icon || 'ti-tool'}"></i></div>
        <span class="workspace-status ${statusClass(t.status)}"><span class="pulse"></span>${statusLabel(t.status)}</span>
      </div>
      <h3>${t.name}</h3>
      <p>${t.summary || ''}</p>
      <div class="workspace-meta">
        ${(t.tags || []).slice(0, 3).map(tag => `<span class="workspace-pill">${tag}</span>`).join('')}
      </div>
      <div class="workspace-actions">
        <a class="btn btn-primary" href="${t.path}">Open Module<i class="ti ti-arrow-right arrow"></i></a>
        ${t.legacyPath ? `<a class="btn btn-secondary" href="${t.legacyPath}"><i class="ti ti-history"></i>Legacy</a>` : ''}
      </div>
    </article>`;
}

function renderCards(tools){
  const mount = document.getElementById('workspace-grid');
  if(!tools.length){
    mount.innerHTML = '<div class="empty-state"><strong>No modules found</strong>Add entries to tools.json to populate this page.</div>';
    return;
  }
  mount.innerHTML = tools.map(cardMarkup).join('');
}

function initSearch(){
  const input = document.getElementById('search-input');
  const grid = document.getElementById('workspace-grid');
  if(!input) return;
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    let visible = 0;
    grid.querySelectorAll('.workspace-card').forEach(card => {
      const match = !q || card.dataset.search.includes(q);
      card.classList.toggle('is-hidden', !match);
      if(match) visible++;
    });
    const existing = grid.querySelector('.empty-state');
    if(existing) existing.remove();
    if(!visible){
      const el = document.createElement('div');
      el.className = 'empty-state';
      el.innerHTML = '<strong>No modules match your search</strong>Try a different name or tag.';
      grid.appendChild(el);
    }
  });
}

(async function init(){
  const mount = document.getElementById('workspace-grid');
  try {
    const tools = await loadCatalog();
    renderCards(tools);
    initSearch();
  } catch (err){
    mount.innerHTML = '<div class="empty-state"><strong>Could not load modules</strong>' + err.message + '</div>';
  }
})();
