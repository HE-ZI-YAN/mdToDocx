export const defaultTemplates = [
  {
    id: "paper-template",
    name: "论文模板",
    readonly: true,
    description: "适合学术论文与课程报告，正文宋体两端对齐，标题层级清晰。",
    config: {
      heading1: {
        fontFamily: "黑体",
        chineseFontFamily: "黑体",
        englishFontFamily: "Times New Roman",
        fontSize: 18,
        bold: true,
        color: "000000",
        spacingBefore: 12,
        spacingAfter: 6,
        align: "center"
      },
      heading2: {
        fontFamily: "黑体",
        chineseFontFamily: "黑体",
        englishFontFamily: "Times New Roman",
        fontSize: 16,
        bold: true,
        color: "000000",
        spacingBefore: 10,
        spacingAfter: 6,
        align: "left"
      },
      heading3: {
        fontFamily: "黑体",
        chineseFontFamily: "黑体",
        englishFontFamily: "Times New Roman",
        fontSize: 14,
        bold: true,
        color: "000000",
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
    }
  },
  {
    id: "report-template",
    name: "报告模板",
    readonly: true,
    description: "适合商务报告与项目文档，正文更疏朗，表格全边框。",
    config: {
      heading1: {
        fontFamily: "黑体",
        chineseFontFamily: "黑体",
        englishFontFamily: "Times New Roman",
        fontSize: 20,
        bold: true,
        color: "000000",
        spacingBefore: 14,
        spacingAfter: 8,
        align: "left"
      },
      heading2: {
        fontFamily: "黑体",
        chineseFontFamily: "黑体",
        englishFontFamily: "Times New Roman",
        fontSize: 16,
        bold: true,
        color: "000000",
        spacingBefore: 12,
        spacingAfter: 6,
        align: "left"
      },
      heading3: {
        fontFamily: "黑体",
        chineseFontFamily: "黑体",
        englishFontFamily: "Times New Roman",
        fontSize: 14,
        bold: true,
        color: "000000",
        spacingBefore: 10,
        spacingAfter: 6,
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
        lineSpacingType: "single",
        lineSpacingValue: 18,
        firstLineIndentChars: 0,
        spacingBefore: 0,
        spacingAfter: 8,
        align: "justify"
      },
      table: {
        align: "center",
        borderType: "full",
        headerBold: true,
        cellPadding: 4,
        autoColumnWidth: false
      },
      list: {
        fontFamily: "Times New Roman",
        fontSize: 12,
        spacingBefore: 0,
        spacingAfter: 4,
        indentLeft: 0.75,
        align: "left"
      },
      code: {
        fontFamily: "Consolas",
        fontSize: 10,
        spacingBefore: 6,
        spacingAfter: 6,
        backgroundColor: "F0F4F8"
      }
    }
  }
];

export function cloneStyleConfig(config) {
  return JSON.parse(JSON.stringify(config));
}
