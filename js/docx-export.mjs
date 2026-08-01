import { normalizeLocale, t } from './i18n.mjs';

export const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const encoder = new TextEncoder();

export function buildResumeMarkdown(draft, locale = draft?.locale || 'ru', options = {}) {
  const lang = normalizeLocale(locale);
  const generatedAt = normalizeDate(options.generatedAt || new Date());
  const title = `${draft?.name || 'Resume'} — ${draft?.headline || ''}`.replace(/\s+—\s*$/, '');
  const projects = Array.isArray(draft?.projects) ? draft.projects : [];
  const skills = Array.isArray(draft?.skills) ? draft.skills : [];

  const lines = [
    '---',
    `title: "${escapeYaml(title)}"`,
    `lang: ${lang}`,
    'generator: Auto Resume v2.4',
    `generated_at: ${generatedAt.toISOString()}`,
    '---',
    '',
    `# ${escapeMarkdown(draft?.name || '')}`,
    '',
    draft?.headline ? `**${escapeMarkdown(draft.headline)}**` : '',
    draft?.contact ? escapeMarkdown(draft.contact) : '',
    '',
    `## ${t('resume.about', {}, lang)}`,
    '',
    escapeMarkdown(draft?.about || t('resume.text.notSpecified', {}, lang)),
    '',
    `## ${t('resume.projects', {}, lang)}`,
    '',
  ];

  if (projects.length) {
    for (const project of projects) {
      lines.push(`### ${escapeMarkdown(project?.name || t('resume.text.notSpecified', {}, lang))}`, '');
      if (project?.description) lines.push(escapeMarkdown(project.description), '');
      if (isHttpUrl(project?.url)) lines.push(`[${t('resume.text.link', {}, lang)}](${escapeMarkdownUrl(project.url)})`, '');
    }
  } else {
    lines.push(t('resume.text.notSpecified', {}, lang), '');
  }

  lines.push(`## ${t('resume.skills', {}, lang)}`, '');
  if (skills.length) {
    for (const skill of skills) {
      const name = typeof skill === 'string' ? skill : skill?.name;
      const percent = typeof skill === 'object' && Number.isFinite(skill?.percent) ? ` — ${skill.percent}%` : '';
      lines.push(`- ${escapeMarkdown(name || '')}${percent}`);
    }
  } else {
    lines.push(t('resume.text.notSpecified', {}, lang));
  }

  return lines.filter((line, index, all) => !(line === '' && all[index - 1] === '')).join('\n').trim() + '\n';
}

export function buildResumeDocx(draft, options = {}) {
  if (!draft || typeof draft !== 'object') throw new TypeError('Resume draft is required.');
  const locale = normalizeLocale(options.locale || draft.locale || 'ru');
  const createdAt = normalizeDate(options.createdAt || new Date());
  const title = options.title || `${draft.name || 'Resume'} — ${draft.headline || ''}`.replace(/\s+—\s*$/, '');
  const metadata = {
    creator: options.creator || 'Auto Resume',
    title,
    subject: options.subject || t('export.docxSubject', {}, locale),
    description: options.description || t('export.docxDescription', {}, locale),
    keywords: options.keywords || 'resume, github, portfolio, ATS',
    createdAt,
  };
  const hyperlinks = [];
  const documentXml = buildDocumentXml(draft, locale, hyperlinks);
  const relationshipXml = buildDocumentRelationships(hyperlinks);
  const files = [
    ['[Content_Types].xml', contentTypesXml()],
    ['_rels/.rels', packageRelationshipsXml()],
    ['docProps/core.xml', corePropertiesXml(metadata)],
    ['docProps/app.xml', appPropertiesXml()],
    ['word/document.xml', documentXml],
    ['word/styles.xml', stylesXml()],
    ['word/_rels/document.xml.rels', relationshipXml],
  ];
  return createZip(files, createdAt);
}

function buildDocumentXml(draft, locale, hyperlinks) {
  const projects = Array.isArray(draft.projects) ? draft.projects : [];
  const skills = Array.isArray(draft.skills) ? draft.skills : [];
  const body = [
    paragraph(draft.name || '', 'Title'),
    paragraph(draft.headline || '', 'Subtitle'),
    paragraph(draft.contact || '', 'Contact'),
    paragraph(t('resume.about', {}, locale), 'Heading1'),
    paragraph(draft.about || t('resume.text.notSpecified', {}, locale), 'Normal'),
    paragraph(t('resume.projects', {}, locale), 'Heading1'),
  ];

  if (projects.length) {
    projects.forEach((project) => {
      body.push(paragraph(project?.name || t('resume.text.notSpecified', {}, locale), 'Heading2'));
      body.push(paragraph(project?.description || '', 'Normal'));
      if (isHttpUrl(project?.url)) {
        const id = `rId${hyperlinks.length + 1}`;
        hyperlinks.push({ id, url: project.url });
        body.push(hyperlinkParagraph(project.url, id));
      }
    });
  } else {
    body.push(paragraph(t('resume.text.notSpecified', {}, locale), 'Normal'));
  }

  body.push(paragraph(t('resume.skills', {}, locale), 'Heading1'));
  const skillsText = skills.length
    ? skills.map((skill) => typeof skill === 'string'
      ? skill
      : `${skill?.name || ''}${Number.isFinite(skill?.percent) ? ` — ${skill.percent}%` : ''}`)
      .filter(Boolean)
      .join(', ')
    : t('resume.text.notSpecified', {}, locale);
  body.push(paragraph(skillsText, 'Normal'));

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    ${body.join('\n    ')}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/>
      <w:cols w:space="708"/>
      <w:docGrid w:linePitch="360"/>
    </w:sectPr>
  </w:body>
</w:document>`;
}

function paragraph(text, style = 'Normal') {
  return `<w:p><w:pPr><w:pStyle w:val="${style}"/></w:pPr>${textRuns(text)}</w:p>`;
}

function hyperlinkParagraph(url, relationshipId) {
  return `<w:p><w:pPr><w:pStyle w:val="Normal"/></w:pPr><w:hyperlink r:id="${relationshipId}" w:history="1"><w:r><w:rPr><w:rStyle w:val="Hyperlink"/><w:color w:val="2563EB"/><w:u w:val="single"/></w:rPr><w:t xml:space="preserve">${escapeXml(url)}</w:t></w:r></w:hyperlink></w:p>`;
}

function textRuns(value) {
  const parts = String(value ?? '').replace(/\r\n?/g, '\n').split('\n');
  return parts.map((part, index) => `${index ? '<w:r><w:br/></w:r>' : ''}<w:r><w:t xml:space="preserve">${escapeXml(part)}</w:t></w:r>`).join('');
}

function contentTypesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`;
}

function packageRelationshipsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;
}

function buildDocumentRelationships(hyperlinks) {
  const items = hyperlinks.map(({ id, url }) => `  <Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${escapeXml(url)}" TargetMode="External"/>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${items}
</Relationships>`;
}

function corePropertiesXml(metadata) {
  const timestamp = metadata.createdAt.toISOString();
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>${escapeXml(metadata.title)}</dc:title>
  <dc:subject>${escapeXml(metadata.subject)}</dc:subject>
  <dc:creator>${escapeXml(metadata.creator)}</dc:creator>
  <cp:lastModifiedBy>${escapeXml(metadata.creator)}</cp:lastModifiedBy>
  <cp:keywords>${escapeXml(metadata.keywords)}</cp:keywords>
  <dc:description>${escapeXml(metadata.description)}</dc:description>
  <dcterms:created xsi:type="dcterms:W3CDTF">${timestamp}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${timestamp}</dcterms:modified>
</cp:coreProperties>`;
}

function appPropertiesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Auto Resume</Application>
  <AppVersion>2.4</AppVersion>
  <Company></Company>
  <LinksUpToDate>false</LinksUpToDate>
  <SharedDoc>false</SharedDoc>
  <HyperlinksChanged>false</HyperlinksChanged>
</Properties>`;
}

function stylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:eastAsia="Arial" w:cs="Arial"/><w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="en-US" w:eastAsia="en-US" w:bidi="ar-SA"/></w:rPr></w:rPrDefault>
    <w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="120"/></w:pPr></w:style>
  <w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:next w:val="Subtitle"/><w:qFormat/><w:pPr><w:spacing w:before="0" w:after="80"/></w:pPr><w:rPr><w:b/><w:sz w:val="36"/><w:szCs w:val="36"/><w:color w:val="1F2937"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:basedOn w:val="Normal"/><w:next w:val="Contact"/><w:qFormat/><w:pPr><w:spacing w:after="80"/></w:pPr><w:rPr><w:b/><w:sz w:val="26"/><w:szCs w:val="26"/><w:color w:val="4F46E5"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Contact"><w:name w:val="Contact"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="220"/></w:pPr><w:rPr><w:sz w:val="19"/><w:szCs w:val="19"/><w:color w:val="4B5563"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:keepLines/><w:spacing w:before="260" w:after="100"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:sz w:val="26"/><w:szCs w:val="26"/><w:color w:val="111827"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="160" w:after="60"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:sz w:val="23"/><w:szCs w:val="23"/><w:color w:val="1F2937"/></w:rPr></w:style>
  <w:style w:type="character" w:styleId="Hyperlink"><w:name w:val="Hyperlink"/><w:basedOn w:val="DefaultParagraphFont"/><w:unhideWhenUsed/><w:rPr><w:color w:val="2563EB"/><w:u w:val="single"/></w:rPr></w:style>
  <w:style w:type="character" w:default="1" w:styleId="DefaultParagraphFont"><w:name w:val="Default Paragraph Font"/><w:uiPriority w:val="1"/><w:semiHidden/><w:unhideWhenUsed/></w:style>
</w:styles>`;
}

function createZip(files, date) {
  const records = [];
  const localChunks = [];
  let localOffset = 0;
  const { dosTime, dosDate } = toDosDateTime(date);

  for (const [name, content] of files) {
    const nameBytes = encoder.encode(name);
    const data = content instanceof Uint8Array ? content : encoder.encode(String(content));
    const crc = crc32(data);
    const header = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(header.buffer);
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 0x0800, true);
    view.setUint16(8, 0, true);
    view.setUint16(10, dosTime, true);
    view.setUint16(12, dosDate, true);
    view.setUint32(14, crc, true);
    view.setUint32(18, data.length, true);
    view.setUint32(22, data.length, true);
    view.setUint16(26, nameBytes.length, true);
    view.setUint16(28, 0, true);
    header.set(nameBytes, 30);
    localChunks.push(header, data);
    records.push({ nameBytes, dataLength: data.length, crc, offset: localOffset, dosTime, dosDate });
    localOffset += header.length + data.length;
  }

  const centralChunks = [];
  let centralSize = 0;
  for (const record of records) {
    const header = new Uint8Array(46 + record.nameBytes.length);
    const view = new DataView(header.buffer);
    view.setUint32(0, 0x02014b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 20, true);
    view.setUint16(8, 0x0800, true);
    view.setUint16(10, 0, true);
    view.setUint16(12, record.dosTime, true);
    view.setUint16(14, record.dosDate, true);
    view.setUint32(16, record.crc, true);
    view.setUint32(20, record.dataLength, true);
    view.setUint32(24, record.dataLength, true);
    view.setUint16(28, record.nameBytes.length, true);
    view.setUint16(30, 0, true);
    view.setUint16(32, 0, true);
    view.setUint16(34, 0, true);
    view.setUint16(36, 0, true);
    view.setUint32(38, 0, true);
    view.setUint32(42, record.offset, true);
    header.set(record.nameBytes, 46);
    centralChunks.push(header);
    centralSize += header.length;
  }

  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(4, 0, true);
  endView.setUint16(6, 0, true);
  endView.setUint16(8, records.length, true);
  endView.setUint16(10, records.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, localOffset, true);
  endView.setUint16(20, 0, true);
  return concatBytes([...localChunks, ...centralChunks, end]);
}

function concatBytes(chunks) {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    table[index] = value >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function toDosDateTime(value) {
  const date = normalizeDate(value);
  const year = Math.max(1980, Math.min(2107, date.getUTCFullYear()));
  return {
    dosTime: (date.getUTCHours() << 11) | (date.getUTCMinutes() << 5) | Math.floor(date.getUTCSeconds() / 2),
    dosDate: ((year - 1980) << 9) | ((date.getUTCMonth() + 1) << 5) | date.getUTCDate(),
  };
}

function normalizeDate(value) {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return Number.isFinite(date.getTime()) ? date : new Date(0);
}

function escapeXml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&apos;', '"': '&quot;' }[character]));
}

function escapeMarkdown(value) {
  return String(value ?? '').replace(/([\\`*_[\]{}<>#+.!|-])/g, '\\$1');
}

function escapeMarkdownUrl(value) {
  return String(value ?? '').replace(/\s/g, '%20').replace(/\)/g, '%29').replace(/\(/g, '%28');
}

function escapeYaml(value) {
  return String(value ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, ' ');
}

function isHttpUrl(value) {
  try {
    const url = new URL(String(value || ''));
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
