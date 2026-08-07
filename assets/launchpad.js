function loadCatalog(){
  return fetch('./tools.json')
    .then(function(res) {
      if (!res.ok) {
        throw new Error('Could not load tools.json');
      }
      return res.json();
    });
}

function statusClass(status){
  return status === 'live' ? 'live' : 'migrating';
}

function statusLabel(status){
  return status === 'live' ? 'Live' : 'Migrating';
}

function linkAttributes(path){
  var value = String(path || '');

  if (/^https?:\/\//i.test(value)) {
    return ' target="_top" rel="noopener noreferrer"';
  }

  return '';
}

function cardMarkup(t, i){
  var search = (
    t.name + ' ' +
    (t.tags || []).join(' ') + ' ' +
    (t.summary || '')
  ).toLowerCase();

  var modulePath = t.path;
  var moduleLinkAttrs = linkAttributes(modulePath);
  var legacyLinkAttrs = linkAttributes(t.legacyPath);

  return `
    <article class="workspace-card"
      data-search="${search}"
      style="animation-delay:${i * 45}ms">

      <div class="workspace-card-top">
        <div class="workspace-icon">
          <i class="ti ${t.icon || 'ti-tool'}"></i>
        </div>

        <span class="workspace-status ${statusClass(t.status)}">
          <span class="pulse"></span>
          ${statusLabel(t.status)}
        </span>
      </div>

      <h3>${t.name}</h3>

      <p>${t.summary || ''}</p>

      <div class="workspace-meta">
        ${(t.tags || [])
          .slice(0, 3)
          .map(function(tag) {
            return `<span class="workspace-pill">${tag}</span>`;
          })
          .join('')}
      </div>

      <div class="workspace-actions">
        <a
          class="btn btn-primary"
          href="${modulePath}"${moduleLinkAttrs}>
          Open Module
          <i class="ti ti-arrow-right arrow"></i>
        </a>

        ${t.legacyPath ? `
          <a
            class="btn btn-secondary"
            href="${t.legacyPath}"${legacyLinkAttrs}>
            <i class="ti ti-history"></i>
            Legacy
          </a>
        ` : ''}
      </div>
    </article>
  `;
}

function renderCards(tools){
  var mount = document.getElementById('workspace-grid');

  if (!tools.length) {
    mount.innerHTML =
      '<div class="empty-state">' +
      '<strong>No modules found</strong>' +
      'Add entries to tools.json to populate this page.' +
      '</div>';
    return;
  }

  mount.innerHTML = tools.map(cardMarkup).join('');
}

function initSearch(){
  var input = document.getElementById('search-input');
  var grid = document.getElementById('workspace-grid');

  if (!input) {
    return;
  }

  input.addEventListener('input', function(){
    var q = input.value.trim().toLowerCase();
    var visible = 0;

    grid.querySelectorAll('.workspace-card').forEach(function(card){
      var match = !q || card.dataset.search.includes(q);

      card.classList.toggle('is-hidden', !match);

      if (match) {
        visible++;
      }
    });

    var existing = grid.querySelector('.empty-state');

    if (existing) {
      existing.remove();
    }

    if (!visible) {
      var el = document.createElement('div');

      el.className = 'empty-state';

      el.innerHTML =
        '<strong>No modules match your search</strong>' +
        'Try a different name or tag.';

      grid.appendChild(el);
    }
  });
}

(function init(){
  var mount = document.getElementById('workspace-grid');

  loadCatalog()
    .then(function(tools){
      renderCards(tools);
      initSearch();
    })
    .catch(function(err){
      mount.innerHTML =
        '<div class="empty-state">' +
        '<strong>Could not load modules</strong>' +
        err.message +
        '</div>';
    });
})();
