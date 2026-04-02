import express from "express";
import cors from "cors";
import multer from "multer";
import sanitize from "sanitize-filename";
import { generateDocxBuffer } from "./services/docxGenerator.js";
import { parseMarkdownToAst, summarizeAst } from "./services/markdownParser.js";
import { normalizeStyleConfig, normalizeTemplateName } from "./services/styleSchema.js";
import { getTemplateByName, listTemplates, saveTemplate } from "./services/templateStore.js";

const app = express();
const port = Number(process.env.PORT || 4000);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

function decodeUploadFileName(name) {
  const original = String(name ?? "");
  if (!original) {
    return "";
  }

  const decoded = Buffer.from(original, "latin1").toString("utf8");
  if (!decoded || decoded.includes("\uFFFD")) {
    return original;
  }

  const originalHasCjk = /[\u4e00-\u9fff]/.test(original);
  const decodedHasCjk = /[\u4e00-\u9fff]/.test(decoded);
  const originalHasLatin1Noise = /[\u00c0-\u00ff]/.test(original);

  if (decodedHasCjk && !originalHasCjk) {
    return decoded;
  }

  if (originalHasLatin1Noise && !/[\u00c0-\u00ff]/.test(decoded)) {
    return decoded;
  }

  return original;
}

function buildContentDisposition(fileName) {
  const safeAscii = fileName
    .replace(/[\r\n]/g, "")
    .replace(/[^\x20-\x7e]/g, "_")
    .replace(/"/g, "'")
    .trim();

  const fallbackName = safeAscii || "converted-document.docx";
  const encoded = encodeURIComponent(fileName);
  return `attachment; filename="${fallbackName}"; filename*=UTF-8''${encoded}`;
}

app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (_, res) => {
  res.json({ ok: true, service: "md-to-docx-backend" });
});

app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Please upload a Markdown file" });
  }

  const markdown = req.file.buffer.toString("utf-8");
  const ast = parseMarkdownToAst(markdown);

  return res.json({
    fileName: decodeUploadFileName(req.file.originalname),
    markdown,
    astSummary: summarizeAst(ast)
  });
});

app.get("/api/templates", async (_, res) => {
  const templates = await listTemplates();
  res.json({ templates });
});

app.get("/api/templates/:name", async (req, res) => {
  const template = await getTemplateByName(req.params.name);
  if (!template) {
    return res.status(404).json({ message: "Template not found" });
  }

  res.json({ template });
});

app.post("/api/templates", async (req, res) => {
  try {
    const name = normalizeTemplateName(req.body.name);
    const description = req.body.description;
    const config = normalizeStyleConfig(req.body.config);

    const template = await saveTemplate({ name, description, config });
    res.status(201).json({ template });
  } catch (error) {
    res.status(400).json({ message: error.message || "Failed to save template" });
  }
});

app.post("/api/convert", async (req, res) => {
  try {
    const markdown = String(req.body.markdown ?? "");
    const styleConfig = normalizeStyleConfig(req.body.styleConfig);
    const baseName = sanitize(String(req.body.fileName ?? "converted-document")).trim() || "converted-document";

    const { buffer } = await generateDocxBuffer({ markdown, styleConfig });
    const outputName = `${baseName}.docx`;

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", buildContentDisposition(outputName));
    res.send(buffer);
  } catch (error) {
    res.status(500).json({
      message: "Word export failed",
      detail: error.message
    });
  }
});

app.use((error, _req, res, _next) => {
  res.status(500).json({ message: error.message || "Server error" });
});

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
