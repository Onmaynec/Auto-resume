import { els, MAX_RESUME_PROJECTS, state } from './config.js';
import {
  createDefaultSelection, moveSelection, normalizeSelection, reorderSelection,
  repoKey, resolveSelectedProjects, toggleSelection,
} from './project-selection.mjs';
import { escapeHtml, score, showStatus } from './utils.js';

let draggedProjectKey = '';

export function initializeProjectSelection() {
  state.projectSelection = createDefaultSelection(state.repos, score, MAX_RESUME_PROJECTS);
  renderProjectSelector();
}

export function bindProjectSelector() {
  els.projectOptions.addEventListener('change', (event) => {
    const checkbox = event.target.closest('input[data-project-key]');
    if (!checkbox) return;

    const previous = state.projectSelection;
    const next = toggleSelection(previous, checkbox.dataset.projectKey, checkbox.checked, MAX_RESUME_PROJECTS);
    const rejected = checkbox.checked && next.length === previous.length && !previous.includes(checkbox.dataset.projectKey);

    if (rejected) {
      checkbox.checked = false;
      showStatus(`В резюме можно добавить не более ${MAX_RESUME_PROJECTS} проектов.`, 'warning');
      return;
    }

    state.projectSelection = normalizeSelection(next, state.repos, MAX_RESUME_PROJECTS);
    renderProjectSelector();
  });

  els.selectedProjects.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-project-key]');
    if (!button) return;

    const direction = Number(button.dataset.direction);
    if (Number.isFinite(direction)) {
      state.projectSelection = moveSelection(state.projectSelection, button.dataset.projectKey, direction);
      renderProjectSelector();
      return;
    }

    if (button.dataset.action === 'remove') {
      state.projectSelection = toggleSelection(
        state.projectSelection,
        button.dataset.projectKey,
        false,
        MAX_RESUME_PROJECTS,
      );
      renderProjectSelector();
    }
  });

  els.selectedProjects.addEventListener('dragstart', (event) => {
    const item = event.target.closest('[data-project-key]');
    if (!item) return;
    draggedProjectKey = item.dataset.projectKey;
    item.classList.add('is-dragging');
    event.dataTransfer.effectAllowed = 'move';
  });

  els.selectedProjects.addEventListener('dragend', (event) => {
    event.target.closest('[data-project-key]')?.classList.remove('is-dragging');
    draggedProjectKey = '';
  });

  els.selectedProjects.addEventListener('dragover', (event) => {
    if (draggedProjectKey) event.preventDefault();
  });

  els.selectedProjects.addEventListener('drop', (event) => {
    event.preventDefault();
    const target = event.target.closest('[data-project-key]');
    if (!target || !draggedProjectKey) return;
    state.projectSelection = reorderSelection(
      state.projectSelection,
      draggedProjectKey,
      target.dataset.projectKey,
    );
    renderProjectSelector();
  });
}

export function renderProjectSelector() {
  state.projectSelection = normalizeSelection(state.projectSelection, state.repos, MAX_RESUME_PROJECTS);
  const selected = new Set(state.projectSelection);
  const ranked = [...state.repos].sort((a, b) => score(b) - score(a));
  const atLimit = state.projectSelection.length >= MAX_RESUME_PROJECTS;

  els.projectOptions.innerHTML = ranked.map((repo) => {
    const key = repoKey(repo);
    const checked = selected.has(key);
    return `
      <label class="project-option ${checked ? 'is-selected' : ''}">
        <input type="checkbox" data-project-key="${escapeHtml(key)}" ${checked ? 'checked' : ''} ${atLimit && !checked ? 'disabled' : ''}>
        <span class="project-option-copy">
          <strong>${escapeHtml(repo.name)}</strong>
          <small>${escapeHtml(repo.description || 'Описание не добавлено.')}</small>
        </span>
        <span class="project-option-meta">★ ${Number(repo.stargazers_count || 0)}</span>
      </label>`;
  }).join('') || '<p class="empty-state">Нет доступных проектов.</p>';

  const selectedRepos = getSelectedProjects();
  els.selectedProjects.innerHTML = selectedRepos.map((repo, index) => {
    const key = repoKey(repo);
    return `
      <li class="selected-project" draggable="true" data-project-key="${escapeHtml(key)}">
        <span class="drag-handle" aria-hidden="true">⋮⋮</span>
        <span class="selected-project-copy"><strong>${index + 1}. ${escapeHtml(repo.name)}</strong><small>${escapeHtml(repo.language || 'Other')}</small></span>
        <span class="selected-project-actions">
          <button type="button" class="icon-button" data-project-key="${escapeHtml(key)}" data-direction="-1" ${index === 0 ? 'disabled' : ''} aria-label="Поднять проект">↑</button>
          <button type="button" class="icon-button" data-project-key="${escapeHtml(key)}" data-direction="1" ${index === selectedRepos.length - 1 ? 'disabled' : ''} aria-label="Опустить проект">↓</button>
          <button type="button" class="icon-button danger-button" data-project-key="${escapeHtml(key)}" data-action="remove" aria-label="Удалить проект из резюме">×</button>
        </span>
      </li>`;
  }).join('') || '<li class="empty-state">Выберите хотя бы один проект.</li>';

  els.selectedProjectCount.textContent = `${state.projectSelection.length} / ${MAX_RESUME_PROJECTS}`;
}

export function getSelectedProjects() {
  return resolveSelectedProjects(state.repos, state.projectSelection);
}
