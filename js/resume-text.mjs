export function buildResumeText(draft) {
  const projects = (draft.projects || []).map((project) => [
    project.name,
    project.description,
    project.url ? `Ссылка: ${project.url}` : '',
  ].filter(Boolean).join('\n')).join('\n\n');
  const skills = (draft.skills || []).map((item) => typeof item === 'string' ? item : `${item.name} — ${item.percent}%`).join(', ');
  return [
    draft.name,
    draft.headline,
    draft.contact,
    '',
    'О СЕБЕ',
    draft.about,
    '',
    'ПРОЕКТЫ',
    projects || 'Не указаны',
    '',
    'НАВЫКИ',
    skills || 'Не указаны',
  ].filter((line) => line !== undefined && line !== null).join('\n').trim();
}

export function safeFilename(value, fallback = 'resume') {
  const result = String(value || '')
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9а-яА-ЯёЁ_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
  return result || fallback;
}
