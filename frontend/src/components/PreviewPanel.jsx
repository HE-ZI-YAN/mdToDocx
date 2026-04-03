import { useMemo } from "react";

function normalizeColorValue(value) {
  const normalized = String(value ?? "")
    .trim()
    .replace(/^#/, "")
    .toUpperCase();

  return /^[0-9A-F]{6}$/.test(normalized) ? normalized : "000000";
}

function paragraphLineHeight(paragraphStyle) {
  if (paragraphStyle.lineSpacingType === "fixed") {
    return `${Math.max(paragraphStyle.lineSpacingValue, 10) * 1.33}px`;
  }

  return paragraphStyle.lineSpacingType === "oneHalf" ? "1.5" : "1.2";
}

function toRoman(value) {
  let num = Math.max(1, Math.floor(Number(value) || 1));
  const map = [
    [1000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"]
  ];

  let out = "";
  for (const [base, ch] of map) {
    while (num >= base) {
      out += ch;
      num -= base;
    }
  }

  return out;
}

function toAlpha(value, upper = true) {
  let num = Math.max(1, Math.floor(Number(value) || 1));
  let out = "";

  while (num > 0) {
    const rem = (num - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    num = Math.floor((num - 1) / 26);
  }

  return upper ? out : out.toLowerCase();
}

function toChineseCounting(value) {
  const num = Math.max(1, Math.floor(Number(value) || 1));
  const digits = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
  const units = ["", "十", "百", "千"];

  if (num < 10) {
    return digits[num];
  }

  const chars = String(num).split("");
  let result = "";

  for (let i = 0; i < chars.length; i += 1) {
    const n = Number(chars[i]);
    const pos = chars.length - i - 1;

    if (n === 0) {
      if (!result.endsWith("零") && i < chars.length - 1) {
        result += "零";
      }
      continue;
    }

    if (n === 1 && pos === 1 && result === "") {
      result += units[pos];
      continue;
    }

    result += digits[n] + units[pos];
  }

  return result.replace(/零+$/g, "").replace(/零+/g, "零");
}

function formatHeadingNumber(value, format) {
  switch (format) {
    case "CHINESE_COUNTING":
      return toChineseCounting(value);
    case "UPPER_ROMAN":
      return toRoman(value);
    case "LOWER_ROMAN":
      return toRoman(value).toLowerCase();
    case "UPPER_LETTER":
      return toAlpha(value, true);
    case "LOWER_LETTER":
      return toAlpha(value, false);
    default:
      return String(Math.max(1, Math.floor(Number(value) || 1)));
  }
}

function headingPattern(level, cfg) {
  if (level === 1) {
    return cfg.level1Text || "第%1章";
  }

  if (level === 2) {
    return cfg.level2Text || "%1.%2";
  }

  return cfg.level3Text || "%1.%2.%3";
}

function headingFormat(level, cfg) {
  if (level === 1) {
    return cfg.level1Format || "CHINESE_COUNTING";
  }

  if (level === 2) {
    return cfg.level2Format || "DECIMAL";
  }

  return cfg.level3Format || "DECIMAL";
}

function applyHeadingNumbering(markdownHtml, headingNumbering) {
  if (!headingNumbering?.enabled || !markdownHtml || typeof document === "undefined") {
    return markdownHtml;
  }

  const wrapper = document.createElement("div");
  wrapper.innerHTML = markdownHtml;

  const starts = [
    Math.max(1, Number(headingNumbering.level1Start || 1)),
    Math.max(1, Number(headingNumbering.level2Start || 1)),
    Math.max(1, Number(headingNumbering.level3Start || 1))
  ];

  const counters = [starts[0] - 1, starts[1] - 1, starts[2] - 1];
  const headings = wrapper.querySelectorAll("h1, h2, h3");

  headings.forEach((heading) => {
    const level = Number(heading.tagName.replace("H", ""));
    if (level < 1 || level > 3) {
      return;
    }

    const index = level - 1;
    counters[index] += 1;

    for (let i = index + 1; i < counters.length; i += 1) {
      counters[i] = starts[i] - 1;
    }

    const formats = [
      headingFormat(1, headingNumbering),
      headingFormat(2, headingNumbering),
      headingFormat(3, headingNumbering)
    ];

    let prefix = headingPattern(level, headingNumbering);
    for (let tokenIndex = 0; tokenIndex < 3; tokenIndex += 1) {
      const token = `%${tokenIndex + 1}`;
      const formatted = formatHeadingNumber(counters[tokenIndex], formats[tokenIndex]);
      prefix = prefix.split(token).join(formatted);
    }

    const span = document.createElement("span");
    span.className = "preview-heading-number";
    span.textContent = `${prefix} `;

    heading.prepend(span);
  });

  return wrapper.innerHTML;
}

export function PreviewPanel({ markdownHtml, styleConfig }) {
  const numberedHtml = useMemo(
    () => applyHeadingNumbering(markdownHtml, styleConfig.headingNumbering),
    [markdownHtml, styleConfig.headingNumbering]
  );

  const previewStyle = {
    "--h1-font": styleConfig.heading1.fontFamily,
    "--h1-font-zh": styleConfig.heading1.chineseFontFamily || styleConfig.heading1.fontFamily,
    "--h1-font-en": styleConfig.heading1.englishFontFamily || "Times New Roman",
    "--h1-size": `${styleConfig.heading1.fontSize}pt`,
    "--h1-weight": styleConfig.heading1.bold ? "700" : "400",
    "--h1-color": `#${normalizeColorValue(styleConfig.heading1.color)}`,
    "--h1-before": `${styleConfig.heading1.spacingBefore}pt`,
    "--h1-after": `${styleConfig.heading1.spacingAfter}pt`,
    "--h1-align": styleConfig.heading1.align,

    "--h2-font": styleConfig.heading2.fontFamily,
    "--h2-font-zh": styleConfig.heading2.chineseFontFamily || styleConfig.heading2.fontFamily,
    "--h2-font-en": styleConfig.heading2.englishFontFamily || "Times New Roman",
    "--h2-size": `${styleConfig.heading2.fontSize}pt`,
    "--h2-weight": styleConfig.heading2.bold ? "700" : "400",
    "--h2-color": `#${normalizeColorValue(styleConfig.heading2.color)}`,
    "--h2-before": `${styleConfig.heading2.spacingBefore}pt`,
    "--h2-after": `${styleConfig.heading2.spacingAfter}pt`,
    "--h2-align": styleConfig.heading2.align,

    "--h3-font": styleConfig.heading3.fontFamily,
    "--h3-font-zh": styleConfig.heading3.chineseFontFamily || styleConfig.heading3.fontFamily,
    "--h3-font-en": styleConfig.heading3.englishFontFamily || "Times New Roman",
    "--h3-size": `${styleConfig.heading3.fontSize}pt`,
    "--h3-weight": styleConfig.heading3.bold ? "700" : "400",
    "--h3-color": `#${normalizeColorValue(styleConfig.heading3.color)}`,
    "--h3-before": `${styleConfig.heading3.spacingBefore}pt`,
    "--h3-after": `${styleConfig.heading3.spacingAfter}pt`,
    "--h3-align": styleConfig.heading3.align,

    "--p-font": styleConfig.paragraph.fontFamily,
    "--p-font-zh": styleConfig.paragraph.chineseFontFamily || styleConfig.paragraph.fontFamily,
    "--p-font-en": styleConfig.paragraph.englishFontFamily || "Times New Roman",
    "--p-size": `${styleConfig.paragraph.fontSize}pt`,
    "--p-before": `${styleConfig.paragraph.spacingBefore}pt`,
    "--p-after": `${styleConfig.paragraph.spacingAfter}pt`,
    "--p-align": styleConfig.paragraph.align,
    "--p-line-height": paragraphLineHeight(styleConfig.paragraph),
    "--p-indent": `${styleConfig.paragraph.firstLineIndentChars}em`,

    "--list-font": styleConfig.list.fontFamily,
    "--list-size": `${styleConfig.list.fontSize}pt`,
    "--list-align": styleConfig.list.align,
    "--list-indent": `${styleConfig.list.indentLeft}in`,

    "--code-font": styleConfig.code.fontFamily,
    "--code-size": `${styleConfig.code.fontSize}pt`,
    "--code-bg": `#${styleConfig.code.backgroundColor.replace("#", "")}`,

    "--table-align": styleConfig.table.align,
    "--table-padding": `${styleConfig.table.cellPadding}pt`
  };

  return (
    <section className="panel panel-preview">
      <header className="panel-header">
        <h2>预览区（模拟 Word）</h2>
      </header>

      <div className="preview-stage">
        <article
          className={`preview-page ${styleConfig.table.borderType === "threeLine" ? "table-three-line" : "table-full"}`}
          style={previewStyle}
          dangerouslySetInnerHTML={{ __html: numberedHtml }}
        />
      </div>
    </section>
  );
}
