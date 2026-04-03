import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  LevelFormat,
  LineRuleType,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType
} from "docx";
import { parseMarkdownToAst } from "./markdownParser.js";
import { normalizeStyleConfig } from "./styleSchema.js";

const HEADING_MAP = {
  1: HeadingLevel.HEADING_1,
  2: HeadingLevel.HEADING_2,
  3: HeadingLevel.HEADING_3,
  4: HeadingLevel.HEADING_3,
  5: HeadingLevel.HEADING_3,
  6: HeadingLevel.HEADING_3
};

const BULLET_SYMBOLS = ["•", "◦", "▪", "▫", "◽", "▹", "▸", "◆", "◇"];

function ptToTwip(pt) {
  return Math.round(Number(pt || 0) * 20);
}

function ptToHalfPoint(pt) {
  return Math.round(Number(pt || 0) * 2);
}

function charsToTwip(chars) {
  return Math.round(Number(chars || 0) * 420);
}

function inchToTwip(inch) {
  return Math.round(Number(inch || 0) * 1440);
}

function normalizeHexColor(value, fallback = "000000") {
  const normalized = String(value ?? "")
    .trim()
    .replace(/^#/, "")
    .toUpperCase();

  return /^[0-9A-F]{6}$/.test(normalized) ? normalized : fallback;
}

function mapAlignment(align) {
  if (align === "center") return AlignmentType.CENTER;
  if (align === "right") return AlignmentType.RIGHT;
  if (align === "justify") return AlignmentType.JUSTIFIED;
  return AlignmentType.LEFT;
}

function resolveParagraphLineSpacing(style) {
  if (style.lineSpacingType === "fixed") {
    return {
      line: ptToTwip(style.lineSpacingValue),
      lineRule: LineRuleType.EXACT
    };
  }

  if (style.lineSpacingType === "oneHalf") {
    return {
      line: 360,
      lineRule: LineRuleType.AUTO
    };
  }

  return {
    line: 240,
    lineRule: LineRuleType.AUTO
  };
}


function resolveRunFont(style, overrides = {}) {
  if (overrides.fontFamily) {
    return overrides.fontFamily;
  }

  const chineseFont = overrides.chineseFontFamily ?? style.chineseFontFamily;
  const englishFont = overrides.englishFontFamily ?? style.englishFontFamily;

  if (chineseFont || englishFont) {
    const latin = englishFont || style.fontFamily || chineseFont;
    const eastAsia = chineseFont || style.fontFamily || latin;

    return {
      ascii: latin,
      hAnsi: latin,
      cs: latin,
      eastAsia
    };
  }

  return style.fontFamily;
}
function createTextRun(value, style, overrides = {}) {
  const text = value ?? "";
  return new TextRun({
    text,
    font: resolveRunFont(style, overrides),
    size: ptToHalfPoint(overrides.fontSize ?? style.fontSize),
    bold: overrides.bold,
    italics: overrides.italics,
    underline: overrides.underline ? {} : undefined,
    strike: overrides.strike,
    color: overrides.color,
    highlight: overrides.highlight
  });
}

function inlineToRuns(nodes, style, marks = {}) {
  const runs = [];

  for (const node of nodes ?? []) {
    if (!node) {
      continue;
    }

    if (node.type === "text") {
      runs.push(createTextRun(node.value, style, marks));
      continue;
    }

    if (node.type === "strong") {
      runs.push(...inlineToRuns(node.children, style, { ...marks, bold: true }));
      continue;
    }

    if (node.type === "emphasis") {
      runs.push(...inlineToRuns(node.children, style, { ...marks, italics: true }));
      continue;
    }

    if (node.type === "delete") {
      runs.push(...inlineToRuns(node.children, style, { ...marks, strike: true }));
      continue;
    }

    if (node.type === "inlineCode") {
      runs.push(
        createTextRun(node.value, style, {
          ...marks,
          fontFamily: "Consolas",
          highlight: "lightGray"
        })
      );
      continue;
    }

    if (node.type === "break") {
      runs.push(new TextRun({ break: 1 }));
      continue;
    }

    if (node.type === "link") {
      runs.push(...inlineToRuns(node.children, style, { ...marks, color: "0563C1", underline: true }));
      continue;
    }

    if (node.type === "image") {
      const alt = node.alt ? `Image: ${node.alt}` : "Image";
      runs.push(createTextRun(`[${alt}]`, style, { ...marks, italics: true }));
      continue;
    }

    if (Array.isArray(node.children)) {
      runs.push(...inlineToRuns(node.children, style, marks));
    }
  }

  if (runs.length === 0) {
    runs.push(createTextRun("", style, marks));
  }

  return runs;
}

function paragraphCommon(style, withIndent = true) {
  const lineSpacing = style.lineSpacingType ? resolveParagraphLineSpacing(style) : {};

  return {
    alignment: mapAlignment(style.align),
    spacing: {
      before: ptToTwip(style.spacingBefore),
      after: ptToTwip(style.spacingAfter),
      ...lineSpacing
    },
    indent: withIndent
      ? {
          firstLine: charsToTwip(style.firstLineIndentChars)
        }
      : undefined
  };
}

function buildHeading(node, style, headingNumbering) {
  const level = Math.min(Math.max(node.depth || 1, 1), 3) - 1;
  const paragraphOptions = {
    ...paragraphCommon(style, false),
    heading: HEADING_MAP[node.depth] ?? HeadingLevel.HEADING_3,
    children: inlineToRuns(
      node.children,
      {
        ...style,
        lineSpacingType: "single"
      },
      { bold: style.bold, color: normalizeHexColor(style.color) }
    )
  };

  if (headingNumbering?.enabled && level <= 2) {
    paragraphOptions.numbering = {
      reference: "heading-numbering",
      level
    };
  }

  return new Paragraph(paragraphOptions);
}

function buildParagraph(node, style) {
  return new Paragraph({
    ...paragraphCommon(style, true),
    children: inlineToRuns(node.children, style)
  });
}

function buildCodeBlock(node, style) {
  const lines = String(node.value ?? "").split(/\r?\n/);
  const runs = [];

  lines.forEach((line, idx) => {
    runs.push(
      createTextRun(line, {
        fontFamily: style.fontFamily,
        fontSize: style.fontSize
      })
    );
    if (idx < lines.length - 1) {
      runs.push(new TextRun({ break: 1 }));
    }
  });

  return new Paragraph({
    spacing: {
      before: ptToTwip(style.spacingBefore),
      after: ptToTwip(style.spacingAfter),
      line: 240,
      lineRule: LineRuleType.AUTO
    },
    shading: {
      type: ShadingType.CLEAR,
      fill: style.backgroundColor || "F5F5F5",
      color: "auto"
    },
    children: runs
  });
}

function collectInlinePlainText(node) {
  if (!node) {
    return "";
  }

  if (node.type === "text" || node.type === "inlineCode") {
    return node.value ?? "";
  }

  if (Array.isArray(node.children)) {
    return node.children.map((child) => collectInlinePlainText(child)).join("");
  }

  return "";
}

function tableBorders(borderType) {
  if (borderType === "full") {
    const full = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
    return {
      top: full,
      left: full,
      right: full,
      bottom: full,
      insideHorizontal: full,
      insideVertical: full
    };
  }

  const single = { style: BorderStyle.SINGLE, size: 8, color: "000000" };
  const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };

  return {
    top: single,
    left: none,
    right: none,
    bottom: single,
    insideHorizontal: none,
    insideVertical: none
  };
}

function buildTable(node, config) {
  const tableStyle = config.table;
  const paragraphStyle = config.paragraph;

  const rowCount = node.children?.length ?? 0;
  const colCount = node.children?.[0]?.children?.length ?? 1;

  const rows = (node.children ?? []).map((rowNode, rowIndex) => {
    const cells = (rowNode.children ?? []).map((cellNode) => {
      const cellParagraphs = (cellNode.children ?? []).map((block) => {
        if (block.type === "paragraph") {
          return new Paragraph({
            ...paragraphCommon(paragraphStyle, false),
            alignment: mapAlignment("left"),
            children: inlineToRuns(block.children, paragraphStyle, {
              bold: tableStyle.headerBold && rowIndex === 0
            })
          });
        }

        return new Paragraph({
          ...paragraphCommon(paragraphStyle, false),
          alignment: mapAlignment("left"),
          children: [
            createTextRun(collectInlinePlainText(block), {
              fontFamily: paragraphStyle.fontFamily,
              fontSize: paragraphStyle.fontSize
            })
          ]
        });
      });

      if (cellParagraphs.length === 0) {
        cellParagraphs.push(new Paragraph(""));
      }

      const isThreeLine = tableStyle.borderType === "threeLine";
      const isHeaderRow = rowIndex === 0;
      const isLastRow = rowIndex === rowCount - 1;

      let cellBorders;
      if (isThreeLine) {
        const borderStrong = { style: BorderStyle.SINGLE, size: 8, color: "000000" };
        const borderMiddle = { style: BorderStyle.SINGLE, size: 4, color: "000000" };

        const nextBorders = {};

        // Fallback top border for the first row in Word/WPS variants.
        if (isHeaderRow) {
          nextBorders.top = borderStrong;
        }

        // Three-line table middle border (header separator).
        if (isHeaderRow && rowCount > 1) {
          nextBorders.bottom = borderMiddle;
        }

        // Fallback bottom border for the last row in Word/WPS variants.
        if (isLastRow) {
          nextBorders.bottom = borderStrong;
        }

        if (Object.keys(nextBorders).length > 0) {
          cellBorders = nextBorders;
        }
      }

      return new TableCell({
        children: cellParagraphs,
        margins: {
          top: ptToTwip(tableStyle.cellPadding),
          bottom: ptToTwip(tableStyle.cellPadding),
          left: ptToTwip(tableStyle.cellPadding),
          right: ptToTwip(tableStyle.cellPadding)
        },
        borders: cellBorders,
        width: tableStyle.autoColumnWidth
          ? undefined
          : {
              size: Math.max(Math.floor(100 / colCount), 1),
              type: WidthType.PERCENTAGE
            }
      });
    });

    return new TableRow({
      children: cells,
      cantSplit: false,
      tableHeader: rowIndex === 0 && rowCount > 1
    });
  });

  return new Table({
    rows,
    width: {
      size: 100,
      type: WidthType.PERCENTAGE
    },
    alignment: mapAlignment(tableStyle.align),
    borders: tableBorders(tableStyle.borderType)
  });
}

function buildListParagraph(node, listStyle, numbering, level, firstLine) {
  const indentLeft = inchToTwip(listStyle.indentLeft) * (level + 1);

  return new Paragraph({
    alignment: mapAlignment(listStyle.align),
    spacing: {
      before: ptToTwip(listStyle.spacingBefore),
      after: ptToTwip(listStyle.spacingAfter),
      line: 240,
      lineRule: LineRuleType.AUTO
    },
    indent: {
      left: indentLeft,
      hanging: firstLine ? 360 : 0
    },
    numbering: firstLine ? numbering : undefined,
    children: inlineToRuns(node.children, listStyle)
  });
}

function buildList(node, config, level = 0) {
  const listStyle = config.list;
  const numberingRef = node.ordered ? "ordered-list" : "unordered-list";
  const blocks = [];

  for (const itemNode of node.children ?? []) {
    let hasMainLine = false;

    for (const child of itemNode.children ?? []) {
      if (child.type === "paragraph") {
        blocks.push(
          buildListParagraph(
            child,
            listStyle,
            {
              reference: numberingRef,
              level: Math.min(level, 8)
            },
            level,
            !hasMainLine
          )
        );
        hasMainLine = true;
        continue;
      }

      if (child.type === "list") {
        blocks.push(...buildList(child, config, level + 1));
        continue;
      }

      blocks.push(...convertNode(child, config));
    }

    if (!hasMainLine) {
      blocks.push(
        new Paragraph({
          numbering: {
            reference: numberingRef,
            level: Math.min(level, 8)
          },
          children: [createTextRun("", listStyle)]
        })
      );
    }
  }

  return blocks;
}

function buildBlockquote(node, config) {
  const lines = [];

  for (const child of node.children ?? []) {
    if (child.type === "paragraph") {
      lines.push(
        new Paragraph({
          ...paragraphCommon(config.paragraph, true),
          indent: {
            left: 480,
            firstLine: charsToTwip(config.paragraph.firstLineIndentChars)
          },
          children: inlineToRuns(child.children, config.paragraph, { italics: true })
        })
      );
    } else {
      lines.push(...convertNode(child, config));
    }
  }

  return lines;
}

function convertNode(node, config) {
  if (!node) {
    return [];
  }

  switch (node.type) {
    case "heading": {
      const headingStyle = config[`heading${Math.min(node.depth, 3)}`] ?? config.heading3;
      return [buildHeading(node, headingStyle, config.headingNumbering)];
    }
    case "paragraph":
      return [buildParagraph(node, config.paragraph)];
    case "code":
      return [buildCodeBlock(node, config.code)];
    case "table":
      return [buildTable(node, config)];
    case "list":
      return buildList(node, config);
    case "blockquote":
      return buildBlockquote(node, config);
    case "thematicBreak":
      return [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [createTextRun("--------------------------------------------------", config.paragraph)]
        })
      ];
    default: {
      const children = [];
      for (const child of node.children ?? []) {
        children.push(...convertNode(child, config));
      }
      return children;
    }
  }
}

function createNumberingLevel(format, text, level) {
  return {
    level,
    format,
    text,
    alignment: AlignmentType.LEFT,
    style: {
      paragraph: {
        indent: {
          left: (level + 1) * 720,
          hanging: 260
        }
      }
    }
  };
}

function resolveHeadingLevelFormat(formatName) {
  if (!formatName) {
    return LevelFormat.DECIMAL;
  }

  return LevelFormat[formatName] ?? LevelFormat.DECIMAL;
}

function createHeadingNumberingLevel(level, format, text, start) {
  return {
    level,
    format,
    text,
    start: Math.max(1, Math.floor(Number(start || 1))),
    alignment: AlignmentType.LEFT,
    style: {
      paragraph: {
        indent: {
          left: 0,
          hanging: 0
        }
      }
    }
  };
}

function numberingConfig(styleConfig) {
  const orderedLevels = Array.from({ length: 9 }, (_, level) => {
    const tokens = ["%1", "%2", "%3", "%4", "%5", "%6", "%7", "%8", "%9"];
    return createNumberingLevel(LevelFormat.DECIMAL, `${tokens[level]}.`, level);
  });

  const unorderedLevels = Array.from({ length: 9 }, (_, level) => {
    const symbol = BULLET_SYMBOLS[level] ?? "•";
    return createNumberingLevel(LevelFormat.BULLET, symbol, level);
  });

  const headingNumbering = styleConfig.headingNumbering ?? {};
  const headingLevels = [
    createHeadingNumberingLevel(
      0,
      resolveHeadingLevelFormat(headingNumbering.level1Format),
      headingNumbering.level1Text || "第%1章",
      headingNumbering.level1Start
    ),
    createHeadingNumberingLevel(
      1,
      resolveHeadingLevelFormat(headingNumbering.level2Format),
      headingNumbering.level2Text || "%1.%2",
      headingNumbering.level2Start
    ),
    createHeadingNumberingLevel(
      2,
      resolveHeadingLevelFormat(headingNumbering.level3Format),
      headingNumbering.level3Text || "%1.%2.%3",
      headingNumbering.level3Start
    )
  ];

  return [
    {
      reference: "ordered-list",
      levels: orderedLevels
    },
    {
      reference: "unordered-list",
      levels: unorderedLevels
    },
    {
      reference: "heading-numbering",
      levels: headingLevels
    }
  ];
}

export async function generateDocxBuffer({ markdown, styleConfig }) {
  const normalizedStyle = normalizeStyleConfig(styleConfig);
  const ast = parseMarkdownToAst(markdown ?? "");

  const children = [];
  for (const node of ast.children ?? []) {
    children.push(...convertNode(node, normalizedStyle));
  }

  if (children.length === 0) {
    children.push(new Paragraph(""));
  }

  const doc = new Document({
    numbering: {
      config: numberingConfig(normalizedStyle)
    },
    sections: [
      {
        properties: {},
        children
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  return {
    buffer,
    ast,
    styleConfig: normalizedStyle
  };
}








