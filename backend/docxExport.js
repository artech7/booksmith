const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, PageBreak, Footer, PageNumber, NumberFormat,
  LevelFormat, BorderStyle, WidthType, Table, TableRow, TableCell,
  ShadingType, VerticalAlign, UnderlineType,
} = require('docx');

// ── Constants ─────────────────────────────────────────────────────────────────

const FONT_BODY   = 'Georgia';
const FONT_HEAD   = 'Georgia';
const PAGE_W      = 12240; // US Letter
const PAGE_H      = 15840;
const MARGIN      = 1440;  // 1 inch

const ITEM_CATEGORIES = [
  { id: 'key',      label: 'Key Items'           },
  { id: 'weapon',   label: 'Weapons & Armaments'  },
  { id: 'artifact', label: 'Artifacts & Relics'   },
  { id: 'location', label: 'Locations & Places'   },
  { id: 'faction',  label: 'Factions & Groups'    },
  { id: 'creature', label: 'Creatures & Beasts'   },
  { id: 'other',    label: 'Other'                },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Split prose text into Paragraph elements. Handles double-newline paragraph breaks. */
function proseToParagraphs(text, opts = {}) {
  if (!text || !text.trim()) return [];
  const {
    font       = FONT_BODY,
    size       = 24,       // half-points, 24 = 12pt
    italic     = false,
    color      = '1a1a1a',
    spacing    = { after: 200, line: 336, lineRule: 'auto' }, // ~1.4 line height
    alignment  = AlignmentType.LEFT,
    indent     = {},
  } = opts;

  return text
    .split(/\n{2,}/)
    .map(block => block.trim())
    .filter(block => block.length > 0)
    .map(block =>
      new Paragraph({
        alignment,
        spacing,
        indent,
        children: [
          new TextRun({
            text: block.replace(/\n/g, ' '),
            font, size, italic, color,
          }),
        ],
      })
    );
}

function spacer(pt = 12) {
  return new Paragraph({
    children: [new TextRun('')],
    spacing:  { before: 0, after: pt * 20 },
  });
}

function rule() {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'cccccc', space: 1 } },
    spacing: { before: 160, after: 160 },
    children: [],
  });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function chapterLabel(index) {
  const romans = ['I','II','III','IV','V','VI','VII','VIII','IX','X',
                  'XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX'];
  return `Chapter ${romans[index] ?? index + 1}`;
}

// ── Section builders ──────────────────────────────────────────────────────────

function buildTitlePage(book, includePlot) {
  const els = [];

  // Large vertical spacing before title
  els.push(spacer(60));

  // Book title
  els.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 240 },
    children: [new TextRun({
      text: book.title || 'Untitled Book',
      font: FONT_HEAD, size: 72, bold: true, color: '111111',
    })],
  }));

  // Decorative rule
  els.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 80, after: 320 },
    children: [new TextRun({ text: '✦  ✦  ✦', font: FONT_BODY, size: 22, color: 'aaaaaa' })],
  }));

  if (includePlot && book.plot && book.plot.trim()) {
    els.push(spacer(20));
    els.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 120 },
      children: [new TextRun({
        text: 'Story Overview',
        font: FONT_HEAD, size: 26, bold: true, italics: true, color: '444444',
      })],
    }));

    // Plot as centered italics
    els.push(...proseToParagraphs(book.plot, {
      italic: true, color: '333333',
      alignment: AlignmentType.CENTER,
      spacing: { after: 160, line: 320, lineRule: 'auto' },
      indent: { left: 1440, right: 1440 },
    }));
  }

  return els;
}

function buildChapters(chapters, selectedIds, includePlots, chapterOffset = 0) {
  const els = [];
  let idx = 0;

  for (const ch of chapters) {
    if (!selectedIds.includes(ch.id)) continue;

    els.push(pageBreak());

    // Chapter eyebrow label
    els.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 80 },
      children: [new TextRun({
        text: chapterLabel(idx + chapterOffset),
        font: FONT_BODY, size: 20, italics: true, color: '888888',
      })],
    }));

    // Chapter title
    els.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 80, after: 320 },
      children: [new TextRun({
        text: ch.title || 'Untitled Chapter',
        font: FONT_HEAD, size: 48, bold: true, color: '111111',
      })],
    }));

    // Optional chapter plot notes
    if (includePlots && ch.plot && ch.plot.trim()) {
      els.push(new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { before: 0, after: 100 },
        border: { left: { style: BorderStyle.SINGLE, size: 8, color: 'cccccc', space: 12 } },
        indent: { left: 360 },
        children: [new TextRun({
          text: 'Chapter Notes',
          font: FONT_HEAD, size: 18, italics: true, color: '999999',
        })],
      }));

      els.push(...proseToParagraphs(ch.plot, {
        italic: true, color: '666666', size: 20,
        indent: { left: 360 },
        spacing: { after: 100, line: 300, lineRule: 'auto' },
      }));
      els.push(spacer(8));
    }

    // Decorative rule before body
    els.push(rule());

    // Body text
    if (ch.content && ch.content.trim()) {
      els.push(...proseToParagraphs(ch.content, {
        color: '1a1a1a', size: 24,
        spacing: { after: 200, line: 360, lineRule: 'auto' },
        indent: { firstLine: 720 }, // 0.5 inch first-line indent
      }));
    } else {
      els.push(new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ text: '[ No content yet ]', font: FONT_BODY, size: 22, italics: true, color: 'aaaaaa' })],
      }));
    }

    idx++;
  }

  return els;
}

function buildCharacters(characters) {
  if (!characters || characters.length === 0) return [];
  const els = [];

  els.push(pageBreak());
  els.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 80, after: 80 },
    children: [new TextRun({ text: 'APPENDIX A', font: FONT_HEAD, size: 22, bold: true, color: '888888' })],
  }));
  els.push(new Paragraph({
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    spacing: { before: 40, after: 400 },
    children: [new TextRun({ text: 'Dramatis Personae', font: FONT_HEAD, size: 48, bold: true, color: '111111' })],
  }));

  for (const char of characters) {
    // Name
    els.push(new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 320, after: 80 },
      children: [new TextRun({ text: char.name || 'Unknown', font: FONT_HEAD, size: 30, bold: true, color: '1a1a1a' })],
    }));

    // Role
    if (char.role && char.role.trim()) {
      els.push(new Paragraph({
        spacing: { before: 0, after: 120 },
        children: [new TextRun({ text: char.role.toUpperCase(), font: FONT_BODY, size: 18, italics: true, color: '888888' })],
      }));
    }

    // Description
    if (char.description && char.description.trim()) {
      els.push(...proseToParagraphs(char.description, {
        color: '333333', size: 22,
        spacing: { after: 140, line: 320, lineRule: 'auto' },
      }));
    }

    // Relationships
    const rels = typeof char.relationships === 'string'
      ? JSON.parse(char.relationships || '[]')
      : (char.relationships ?? []);

    const resolvedRels = rels
      .map(r => ({ ...r, targetName: characters.find(c => c.id === r.targetId)?.name }))
      .filter(r => r.targetName);

    if (resolvedRels.length > 0) {
      els.push(new Paragraph({
        spacing: { before: 100, after: 60 },
        children: [new TextRun({ text: 'Relationships', font: FONT_HEAD, size: 20, bold: true, color: '555555' })],
      }));
      for (const r of resolvedRels) {
        els.push(new Paragraph({
          spacing: { before: 0, after: 60 },
          indent: { left: 360 },
          children: [
            new TextRun({ text: '→  ', font: FONT_BODY, size: 20, color: '888888' }),
            new TextRun({ text: r.label, font: FONT_BODY, size: 20, italics: true, color: '666666' }),
            new TextRun({ text: '  ', font: FONT_BODY, size: 20 }),
            new TextRun({ text: r.targetName, font: FONT_BODY, size: 20, bold: true, color: '333333' }),
          ],
        }));
      }
    }

    els.push(rule());
  }

  return els;
}

function buildItems(items, itemCategories, characters) {
  const filtered = items.filter(i => itemCategories.includes(i.category));
  if (filtered.length === 0) return [];
  const els = [];

  els.push(pageBreak());
  els.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 80, after: 80 },
    children: [new TextRun({ text: 'APPENDIX B', font: FONT_HEAD, size: 22, bold: true, color: '888888' })],
  }));
  els.push(new Paragraph({
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    spacing: { before: 40, after: 200 },
    children: [new TextRun({ text: 'Bestiary & World Items', font: FONT_HEAD, size: 48, bold: true, color: '111111' })],
  }));
  els.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 400 },
    children: [new TextRun({
      text: 'A compendium of the significant artifacts, locations, factions, and creatures of this world.',
      font: FONT_BODY, size: 20, italics: true, color: '888888',
    })],
  }));

  for (const cat of ITEM_CATEGORIES) {
    const catItems = filtered.filter(i => i.category === cat.id);
    if (catItems.length === 0) continue;

    // Category heading
    els.push(new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 120 },
      children: [new TextRun({ text: cat.label, font: FONT_HEAD, size: 32, bold: true, color: '222222' })],
    }));
    els.push(rule());

    for (const item of catItems) {
      // Item name
      els.push(new Paragraph({
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 240, after: 80 },
        children: [new TextRun({ text: item.name || 'Unnamed', font: FONT_HEAD, size: 26, bold: true, color: '1a1a1a' })],
      }));

      // Description
      if (item.description && item.description.trim()) {
        els.push(...proseToParagraphs(item.description, {
          color: '333333', size: 22,
          spacing: { after: 120, line: 310, lineRule: 'auto' },
        }));
      }

      // Significance
      if (item.significance && item.significance.trim()) {
        els.push(new Paragraph({
          spacing: { before: 80, after: 60 },
          indent: { left: 360 },
          border: { left: { style: BorderStyle.SINGLE, size: 8, color: 'dddddd', space: 12 } },
          children: [
            new TextRun({ text: 'Story Significance:  ', font: FONT_BODY, size: 20, bold: true, color: '666666' }),
            new TextRun({ text: item.significance.replace(/\n/g, ' '), font: FONT_BODY, size: 20, italics: true, color: '555555' }),
          ],
        }));
      }

      // Associated characters
      const assoc = typeof item.associated === 'string'
        ? JSON.parse(item.associated || '[]')
        : (item.associated ?? []);
      const assocNames = assoc
        .map(id => characters.find(c => c.id === id)?.name)
        .filter(Boolean);

      if (assocNames.length > 0) {
        els.push(new Paragraph({
          spacing: { before: 60, after: 160 },
          children: [
            new TextRun({ text: 'Associated: ', font: FONT_BODY, size: 20, bold: true, color: '888888' }),
            new TextRun({ text: assocNames.join(', '), font: FONT_BODY, size: 20, italics: true, color: '555555' }),
          ],
        }));
      } else {
        els.push(spacer(8));
      }
    }
  }

  return els;
}

// ── Main export function ──────────────────────────────────────────────────────

async function generateDocx({ book, chapters, characters, items, options }) {
  const {
    bookTitle     = true,
    bookPlot      = true,
    chapterIds    = chapters.map(c => c.id),
    chapterPlots  = true,
    includeChars  = true,
    itemCategories = ['key','weapon','artifact','location','faction','creature','other'],
  } = options;

  const children = [];

  // Title page
  if (bookTitle || bookPlot) {
    children.push(...buildTitlePage(book, bookPlot));
  }

  // Chapters
  const selectedChapters = chapters.filter(c => chapterIds.includes(c.id));
  if (selectedChapters.length > 0) {
    children.push(...buildChapters(chapters, chapterIds, chapterPlots));
  }

  // Characters appendix
  if (includeChars && characters.length > 0) {
    children.push(...buildCharacters(characters));
  }

  // Items / Bestiary appendix
  const hasItems = items.some(i => itemCategories.includes(i.category));
  if (hasItems) {
    children.push(...buildItems(items, itemCategories, characters));
  }

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: FONT_BODY, size: 24, color: '1a1a1a' } },
      },
      paragraphStyles: [
        {
          id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run:       { font: FONT_HEAD, size: 48, bold: true, color: '111111' },
          paragraph: { spacing: { before: 240, after: 240 }, outlineLevel: 0 },
        },
        {
          id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run:       { font: FONT_HEAD, size: 32, bold: true, color: '222222' },
          paragraph: { spacing: { before: 200, after: 160 }, outlineLevel: 1 },
        },
        {
          id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run:       { font: FONT_HEAD, size: 26, bold: true, color: '333333' },
          paragraph: { spacing: { before: 160, after: 120 }, outlineLevel: 2 },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size:   { width: PAGE_W, height: PAGE_H },
            margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
          },
          titlePage: true,
        },
        footers: {
          // First page (title): no page number
          first: new Footer({ children: [new Paragraph({ children: [] })] }),
          // Subsequent pages: centered page number
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ children: [PageNumber.CURRENT], font: FONT_BODY, size: 18, color: '999999' }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}

module.exports = { generateDocx };
