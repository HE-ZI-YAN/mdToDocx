import fs from "node:fs/promises";
import path from "node:path";
import sanitize from "sanitize-filename";
import { builtinTemplates } from "../data/builtinTemplates.js";
import { normalizeStyleConfig, normalizeTemplateName } from "./styleSchema.js";

function resolveTemplatesDir() {
  const customDir = process.env.TEMPLATE_STORAGE_DIR;
  if (customDir) {
    return path.resolve(customDir);
  }

  return path.resolve(process.cwd(), "backend", "src", "data", "templates");
}

async function ensureTemplateDirectory() {
  const templatesDir = resolveTemplatesDir();
  await fs.mkdir(templatesDir, { recursive: true });
  return templatesDir;
}

function fileNameToTemplateName(fileName) {
  return fileName.replace(/\.json$/i, "").replace(/_/g, " ").trim();
}

export async function listTemplates() {
  const templatesDir = await ensureTemplateDirectory();

  const customFiles = await fs.readdir(templatesDir);
  const customTemplates = [];

  for (const file of customFiles) {
    if (!file.endsWith(".json")) {
      continue;
    }

    const fullPath = path.join(templatesDir, file);
    const raw = await fs.readFile(fullPath, "utf-8");
    const json = JSON.parse(raw);
    customTemplates.push({
      id: json.id ?? `custom-${fileNameToTemplateName(file)}`,
      name: json.name ?? fileNameToTemplateName(file),
      description: json.description ?? "自定义模板",
      readonly: false,
      config: normalizeStyleConfig(json.config)
    });
  }

  return [...builtinTemplates, ...customTemplates];
}

export async function getTemplateByName(name) {
  const normalizedName = normalizeTemplateName(name);
  const templates = await listTemplates();
  return templates.find((template) => template.name === normalizedName || template.id === normalizedName) ?? null;
}

export async function saveTemplate({ name, description, config }) {
  const normalizedName = normalizeTemplateName(name);

  if (!normalizedName) {
    throw new Error("模板名称不能为空");
  }

  const templatesDir = await ensureTemplateDirectory();

  const safeName = sanitize(normalizedName).replace(/\s+/g, "_");
  if (!safeName) {
    throw new Error("模板名称包含非法字符");
  }

  const normalizedConfig = normalizeStyleConfig(config);

  const payload = {
    id: `custom-${safeName.toLowerCase()}`,
    name: normalizedName,
    description: description?.trim() || "用户保存模板",
    config: normalizedConfig
  };

  const fullPath = path.join(templatesDir, `${safeName}.json`);
  await fs.writeFile(fullPath, JSON.stringify(payload, null, 2), "utf-8");

  return payload;
}
