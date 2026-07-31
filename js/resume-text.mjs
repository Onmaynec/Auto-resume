function clean(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

export function buildResumeText(model) {
  const lines = [];
  const name = clean(model.name);
  const headline = clean(model.headline);

  if (name) lines.push(name);
  if (headline) lines.push(headline);

  const contacts = (model.contacts || []).map(clean).filter(Boolean);
  if (contacts.length) lines.push('', contacts.join(' | '));

  if (clean(model.about)) lines.push('', 'О СЕБЕ', clean(model.about));

  const projects = (model.projects || []).filter((project) => clean(project.name) || clean(project.description));
  if (projects.length) {
    lines.push('', 'ПРОЕКТЫ');
    projects.forEach((project) => {
      const title = clean(project.name);
      const url = clean(project.url);
      const description = clean(project.description);
      lines.push('', [title, url].filter(Boolean).join(' — '));
      if (description) lines.push(description);
    });
  }

  const skills = (model.skills || []).map(clean).filter(Boolean);
  if (skills.length) lines.push('', 'НАВЫКИ', skills.join(', '));

  return `${lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()}\n`;
}

export function safeFilename(value, fallback = 'github-resume') {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-zа-яё0-9_-]+/gi, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || fallback;
}
