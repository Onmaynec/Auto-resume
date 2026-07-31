export function encodeSharePayload(payload) {
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const base64 = typeof btoa === 'function'
    ? btoa(binary)
    : Buffer.from(bytes).toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function decodeSharePayload(encoded) {
  if (!encoded || encoded.length > 24_000) throw new Error('Ссылка резюме повреждена или слишком длинная.');
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(encoded.length / 4) * 4, '=');
  let bytes;
  if (typeof atob === 'function') {
    const binary = atob(base64);
    bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  } else {
    bytes = Uint8Array.from(Buffer.from(base64, 'base64'));
  }
  const payload = JSON.parse(new TextDecoder().decode(bytes));
  validateSharePayload(payload);
  return payload;
}

export function buildSharePayload(state) {
  return {
    version: 2,
    createdAt: new Date().toISOString(),
    user: {
      login: state.user?.login || '',
      avatar_url: state.user?.avatar_url || '',
      html_url: state.user?.html_url || '',
      location: state.user?.location || '',
    },
    draft: state.resumeDraft,
    template: state.resumeTemplate || 'visual',
    skills: state.resumeDraft?.skills || [],
  };
}

function validateSharePayload(payload) {
  if (!payload || payload.version !== 2 || typeof payload.draft !== 'object') {
    throw new Error('Неподдерживаемая версия публичного резюме.');
  }
  const text = JSON.stringify(payload);
  if (text.length > 18_000) throw new Error('Публичное резюме слишком большое.');
}
