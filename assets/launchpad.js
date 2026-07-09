
async function loadCatalog(){
  const res = await fetch('./tools.json');
  if(!res.ok) throw new Error('Could not load tools.json');
  return await res.json();
}

function statusClass(status){
  return status === 'live' ? 'live' : 'migrating';
}

function statusLabel(status){
  if(status === 'live') return 'Live';
  return 'Migrating';
}

function renderCards(tools){
  const mount = document.getElementById('workspace-grid');
  mount.innerHTML = tools.map(t => `
    <article class="workspace-card">
      <div class="workspace-card-top">
        <div class="workspace-icon"><i class="ti ${t.icon || 'ti-tool'}"></i></div>
        <span class="workspace-status ${statusClass(t.status)}">${statusLabel(t.status)}</span>
      </div>
      <div>
        <h3>${t.name}</h3>
      </div>
      <p>${t.summary || ''}</p>
      <div class="workspace-meta">
        ${(t.tags || []).slice(0,3).map(tag => `<span class="workspace-pill">${tag}</span>`).join('')}
      </div>
      <div class="workspace-actions">
        <a class="btn btn-primary" href="${t.path}"><i class="ti ti-arrow-right"></i>Open Workspace</a>
        ${t.legacyPath ? `<a class="btn btn-secondary" href="${t.legacyPath}"><i class="ti ti-history"></i>Legacy</a>` : ''}
      </div>
    </article>
  `).join('');
}

(async function init(){
  const tools = await loadCatalog();
  renderCards(tools);
  document.getElementById('tool-count').textContent = tools.length;
})();
