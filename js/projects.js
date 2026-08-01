import { els, state } from './config.js';
import { PROJECT_LIMIT, moveSelection, reorderSelection, resolveSelectedRepos, toggleSelection } from './project-selection.mjs';
import { t } from './i18n.mjs';
import { escapeHtml, score } from './utils.js';
let draggedId = null;
export function renderProjectBuilder() {
  const selectedSet = new Set(state.selectedProjects);
  const sorted = [...state.repos].sort((a, b) => { const aIndex = state.selectedProjects.indexOf(a.full_name || a.name); const bIndex = state.selectedProjects.indexOf(b.full_name || b.name); if (aIndex >= 0 && bIndex >= 0) return aIndex - bIndex; if (aIndex >= 0) return -1; if (bIndex >= 0) return 1; return score(b) - score(a); });
  els.projectSelectionCount.textContent = t('projects.selected', { count: state.selectedProjects.length, limit: PROJECT_LIMIT });
  els.projectBuilder.innerHTML = sorted.map((repo) => {
    const id = repo.full_name || repo.name; const selected = selectedSet.has(id); const order = state.selectedProjects.indexOf(id);
    return `<article class="project-picker ${selected ? 'selected' : ''}" draggable="${selected}" data-project-id="${escapeHtml(id)}"><label class="project-check"><input type="checkbox" ${selected ? 'checked' : ''} data-project-toggle="${escapeHtml(id)}" ${!selected && state.selectedProjects.length >= PROJECT_LIMIT ? 'disabled' : ''}><span>${selected ? order + 1 : '—'}</span></label><div class="project-picker-copy"><strong>${escapeHtml(repo.name)}</strong><small>${escapeHtml(repo.description || t('projects.noDescription'))}</small><span>${escapeHtml(repo.language || 'Other')} · ★ ${repo.stargazers_count || 0} · ⑂ ${repo.forks_count || 0}</span></div><div class="project-order-actions ${selected ? '' : 'hidden'}"><button type="button" aria-label="${t('projects.up')}" data-move-project="-1" data-project-id="${escapeHtml(id)}" ${order <= 0 ? 'disabled' : ''}>↑</button><button type="button" aria-label="${t('projects.down')}" data-move-project="1" data-project-id="${escapeHtml(id)}" ${order < 0 || order >= state.selectedProjects.length - 1 ? 'disabled' : ''}>↓</button><span class="drag-handle" title="${t('projects.drag')}">⋮⋮</span></div></article>`;
  }).join('');
}
export function bindProjectBuilder() {
  els.projectBuilder.addEventListener('change', (event) => { const input = event.target.closest('[data-project-toggle]'); if (!input) return; state.selectedProjects = toggleSelection(state.selectedProjects, input.dataset.projectToggle, input.checked, state.repos); renderProjectBuilder(); });
  els.projectBuilder.addEventListener('click', (event) => { const button = event.target.closest('[data-move-project]'); if (!button) return; state.selectedProjects = moveSelection(state.selectedProjects, button.dataset.projectId, Number(button.dataset.moveProject)); renderProjectBuilder(); });
  els.projectBuilder.addEventListener('dragstart', (event) => { const item = event.target.closest('[data-project-id]'); if (!item || !state.selectedProjects.includes(item.dataset.projectId)) return; draggedId = item.dataset.projectId; item.classList.add('dragging'); event.dataTransfer.effectAllowed = 'move'; });
  els.projectBuilder.addEventListener('dragover', (event) => { const item = event.target.closest('[data-project-id]'); if (!item || !draggedId || !state.selectedProjects.includes(item.dataset.projectId)) return; event.preventDefault(); item.classList.add('drag-target'); });
  els.projectBuilder.addEventListener('dragleave', (event) => event.target.closest('[data-project-id]')?.classList.remove('drag-target'));
  els.projectBuilder.addEventListener('drop', (event) => { const item = event.target.closest('[data-project-id]'); if (!item || !draggedId) return; event.preventDefault(); state.selectedProjects = reorderSelection(state.selectedProjects, draggedId, item.dataset.projectId); draggedId = null; renderProjectBuilder(); });
  els.projectBuilder.addEventListener('dragend', () => { draggedId = null; renderProjectBuilder(); });
}
export function selectedRepos() { return resolveSelectedRepos(state.repos, state.selectedProjects); }
