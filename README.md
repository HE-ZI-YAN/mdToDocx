# Markdown 转 Word（.docx）格式标准化工具

这是一个可直接运行的完整应用（Web 版，React + Node.js），用于把 Markdown 转换为排版一致、样式可控的 Word 文档。

## 核心能力

- Markdown 文件导入：拖拽上传 + 选择文件
- 实时解析：上传后返回 AST 摘要（标题/段落/表格/列表/代码块统计）
- 可视化样式配置：
  - 标题 1/2/3：字体、字号、加粗、段前段后、对齐
  - 正文：字体、字号、行距（单倍/1.5/固定值）、首行缩进、段距、对齐
  - 表格：对齐、边框（三线表/全边框）、表头加粗、单元格内边距、自动列宽
  - 列表样式
  - 代码块样式
- 实时预览：左侧 Markdown / 中间样式 / 右侧 Word 风格预览
- 模板系统：
  - 内置模板：论文模板、报告模板
  - 支持保存自定义模板并加载
- 导出 Word：根据配置生成 `.docx`

## 技术选型

- 前端：React + Vite + Zustand + markdown-it
- 后端：Node.js + Express
- Markdown 解析：remark（`remark-parse` + `remark-gfm`）
- Word 生成：`docx`（Node）

选择 `docx` 的理由：
- 不依赖本机 Pandoc 安装，跨环境部署更轻量
- 便于直接把 AST 与样式 JSON 做程序化映射
- 适合在服务端按用户配置动态生成文档

## Markdown -> Word 转换流程

1. 前端配置样式，得到 JSON（`styleConfig`）
2. 后端用 remark 解析 Markdown 为 AST
3. 后端把 AST 节点映射为 docx 块级/行内元素
4. 将样式 JSON 映射到段落、标题、表格、列表、代码块
5. 输出 `.docx` 二进制并下载

## 项目结构

```text
mdToDocx/
  backend/
    src/
      data/
        builtinTemplates.js
        templates/
      services/
        docxGenerator.js
        markdownParser.js
        styleSchema.js
        templateStore.js
      index.js
    package.json
  frontend/
    src/
      components/
        UploadPanel.jsx
        StylePanel.jsx
        TemplatePanel.jsx
        PreviewPanel.jsx
      lib/
        api.js
        defaultTemplates.js
        markdown.js
      store/
        useEditorStore.js
      App.jsx
      main.jsx
      styles.css
    index.html
    vite.config.js
    package.json
  package.json
```

## API 设计

- `POST /api/upload`
  - 入参：`multipart/form-data`，字段 `file`
  - 出参：`{ fileName, markdown, astSummary }`
- `GET /api/templates`
  - 出参：`{ templates }`
- `GET /api/templates/:name`
  - 出参：`{ template }`
- `POST /api/templates`
  - 入参：`{ name, description, config }`
  - 出参：`{ template }`
- `POST /api/convert`
  - 入参：`{ markdown, styleConfig, fileName }`
  - 出参：`.docx` 文件流

## 运行步骤

1. 安装依赖（根目录执行）：

```bash
npm install
```

2. 启动前后端（根目录执行）：

```bash
npm run dev
```

3. 打开浏览器：

- 前端：`http://localhost:5173`
- 后端：`http://localhost:4000`

4. 使用流程：

- 上传 Markdown 文件或直接编辑
- 在中间面板配置样式
- 观察右侧预览
- 点击“导出 Word”下载 `.docx`

## 构建

```bash
npm run build
```

## 备注

- 自定义模板保存路径：`backend/src/data/templates/*.json`
- 如果需要团队统一样式，可直接把模板 JSON 版本化管理

## 桌面可执行版（Windows）

项目已集成 Electron 打包。

1. 安装依赖：

```bash
cmd /c npm install
```

2. 生成安装包（`exe`）：

```bash
cmd /c npm run pack:win
```

3. 生成免安装便携版（`exe`）：

```bash
cmd /c npm run pack:portable
```

4. 产物目录：

- `release/`（例如 `MarkdownToDocx Setup x.x.x.exe`、`MarkdownToDocx x.x.x.exe`）

说明：
- 桌面版启动后会自动在本地启动内置后端服务并加载界面。
- 桌面版自定义模板默认保存在用户目录，不会写入安装目录。
