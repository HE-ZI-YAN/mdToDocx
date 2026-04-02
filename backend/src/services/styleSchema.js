import { z } from "zod";

const headingNumberFormats = [
  "DECIMAL",
  "CHINESE_COUNTING",
  "UPPER_ROMAN",
  "LOWER_ROMAN",
  "UPPER_LETTER",
  "LOWER_LETTER"
];

export const defaultStyleConfig = {
  heading1: {
    fontFamily: "Times New Roman",
    fontSize: 18,
    bold: true,
    spacingBefore: 12,
    spacingAfter: 6,
    align: "center"
  },
  heading2: {
    fontFamily: "Times New Roman",
    fontSize: 16,
    bold: true,
    spacingBefore: 10,
    spacingAfter: 6,
    align: "left"
  },
  heading3: {
    fontFamily: "Times New Roman",
    fontSize: 14,
    bold: true,
    spacingBefore: 8,
    spacingAfter: 4,
    align: "left"
  },
  headingNumbering: {
    enabled: true,
    level1Format: "CHINESE_COUNTING",
    level1Text: "第%1章",
    level1Start: 1,
    level2Format: "DECIMAL",
    level2Text: "%1.%2",
    level2Start: 1,
    level3Format: "DECIMAL",
    level3Text: "%1.%2.%3",
    level3Start: 1
  },
  paragraph: {
    fontFamily: "宋体",
    chineseFontFamily: "宋体",
    englishFontFamily: "Times New Roman",
    fontSize: 12,
    lineSpacingType: "oneHalf",
    lineSpacingValue: 20,
    firstLineIndentChars: 2,
    spacingBefore: 0,
    spacingAfter: 6,
    align: "justify"
  },
  table: {
    align: "center",
    borderType: "threeLine",
    headerBold: true,
    cellPadding: 4,
    autoColumnWidth: true
  },
  list: {
    fontFamily: "宋体",
    fontSize: 12,
    spacingBefore: 0,
    spacingAfter: 4,
    indentLeft: 0.75,
    align: "left"
  },
  code: {
    fontFamily: "Consolas",
    fontSize: 10.5,
    spacingBefore: 6,
    spacingAfter: 6,
    backgroundColor: "F5F5F5"
  }
};

const positiveNumber = z.coerce.number().finite().nonnegative();
const positiveInt = z.coerce.number().int().positive();

const textStyleSchema = z.object({
  fontFamily: z.string().min(1),
  fontSize: positiveNumber,
  spacingBefore: positiveNumber,
  spacingAfter: positiveNumber,
  align: z.enum(["left", "center", "right", "justify"])
});

const headingSchema = textStyleSchema.extend({
  bold: z.boolean()
});

const headingNumberingSchema = z.object({
  enabled: z.boolean(),
  level1Format: z.enum(headingNumberFormats),
  level1Text: z.string().min(1),
  level1Start: positiveInt,
  level2Format: z.enum(headingNumberFormats),
  level2Text: z.string().min(1),
  level2Start: positiveInt,
  level3Format: z.enum(headingNumberFormats),
  level3Text: z.string().min(1),
  level3Start: positiveInt
});

const paragraphSchema = textStyleSchema.extend({
  chineseFontFamily: z.string().min(1),
  englishFontFamily: z.string().min(1),
  lineSpacingType: z.enum(["single", "oneHalf", "fixed"]),
  lineSpacingValue: positiveNumber,
  firstLineIndentChars: positiveNumber
});

const tableSchema = z.object({
  align: z.enum(["left", "center", "right"]),
  borderType: z.enum(["threeLine", "full"]),
  headerBold: z.boolean(),
  cellPadding: positiveNumber,
  autoColumnWidth: z.boolean()
});

const listSchema = textStyleSchema.extend({
  indentLeft: positiveNumber
});

const codeSchema = z.object({
  fontFamily: z.string().min(1),
  fontSize: positiveNumber,
  spacingBefore: positiveNumber,
  spacingAfter: positiveNumber,
  backgroundColor: z.string().min(3)
});

const fullStyleSchema = z.object({
  heading1: headingSchema,
  heading2: headingSchema,
  heading3: headingSchema,
  headingNumbering: headingNumberingSchema,
  paragraph: paragraphSchema,
  table: tableSchema,
  list: listSchema,
  code: codeSchema
});

const partialStyleSchema = fullStyleSchema.partial().extend({
  heading1: headingSchema.partial().optional(),
  heading2: headingSchema.partial().optional(),
  heading3: headingSchema.partial().optional(),
  headingNumbering: headingNumberingSchema.partial().optional(),
  paragraph: paragraphSchema.partial().optional(),
  table: tableSchema.partial().optional(),
  list: listSchema.partial().optional(),
  code: codeSchema.partial().optional()
});

function deepMerge(base, patch) {
  if (Array.isArray(base)) {
    return patch ?? base;
  }

  if (typeof base !== "object" || base === null) {
    return patch ?? base;
  }

  const merged = { ...base };
  Object.keys(patch ?? {}).forEach((key) => {
    const nextValue = patch[key];
    if (nextValue !== undefined) {
      merged[key] = deepMerge(base[key], nextValue);
    }
  });

  return merged;
}

export function normalizeStyleConfig(inputConfig) {
  const candidate = partialStyleSchema.parse(inputConfig ?? {});
  const merged = deepMerge(defaultStyleConfig, candidate);

  if (!merged.paragraph.chineseFontFamily) {
    merged.paragraph.chineseFontFamily = merged.paragraph.fontFamily;
  }

  if (!merged.paragraph.englishFontFamily) {
    merged.paragraph.englishFontFamily = "Times New Roman";
  }

  if (!merged.paragraph.fontFamily) {
    merged.paragraph.fontFamily = merged.paragraph.chineseFontFamily;
  }

  return fullStyleSchema.parse(merged);
}

export function normalizeTemplateName(name) {
  return String(name ?? "").trim();
}
