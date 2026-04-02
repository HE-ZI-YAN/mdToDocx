import { create } from "zustand";
import { cloneStyleConfig, defaultTemplates } from "../lib/defaultTemplates";

const initialTemplate = defaultTemplates[0];

const initialMarkdown = `# Markdown 转 Word 标准化工具\n\n请在左侧编辑 Markdown，或上传 *.md 文件。\n\n## 功能列表\n\n- 标题样式统一\n- 正文行距与缩进可控\n- 表格样式可视化配置\n\n### 示例表格\n\n| 字段 | 说明 |\n| --- | --- |\n| 标题1 | 支持字体/字号/段距 |\n| 正文 | 支持行距/缩进/对齐 |\n\n\`\`\`js\nconsole.log(\"export docx\");\n\`\`\``;

export const useEditorStore = create((set, get) => ({
  markdown: initialMarkdown,
  fileName: "converted-document",
  astSummary: null,
  styleConfig: cloneStyleConfig(initialTemplate.config),
  templates: defaultTemplates,
  selectedTemplateId: initialTemplate.id,
  exporting: false,

  setMarkdown: (markdown) => set({ markdown }),
  setFileName: (fileName) => set({ fileName }),
  setAstSummary: (astSummary) => set({ astSummary }),
  setTemplates: (templates) => {
    const previous = get().templates;
    const merged = templates?.length ? templates : previous;
    set({ templates: merged });
  },
  setSelectedTemplateId: (selectedTemplateId) => set({ selectedTemplateId }),
  replaceStyleConfig: (styleConfig) => set({ styleConfig: cloneStyleConfig(styleConfig) }),
  setExporting: (exporting) => set({ exporting }),

  updateStyleField: (section, field, value) => {
    const next = cloneStyleConfig(get().styleConfig);
    next[section][field] = value;
    set({ styleConfig: next });
  }
}));
