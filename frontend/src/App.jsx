import { useEffect, useMemo, useState } from "react";
import { UploadPanel } from "./components/UploadPanel";
import { StylePanel } from "./components/StylePanel";
import { PreviewPanel } from "./components/PreviewPanel";
import { convertMarkdownToDocx, fetchTemplates, saveTemplate, uploadMarkdownFile } from "./lib/api";
import { markdownToHtml } from "./lib/markdown";
import { cloneStyleConfig } from "./lib/defaultTemplates";
import { useEditorStore } from "./store/useEditorStore";

function baseFileName(name) {
  if (!name) {
    return "converted-document";
  }

  const withoutExt = name.replace(/\.[^.]+$/, "").trim();
  return withoutExt || "converted-document";
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export default function App() {
  const {
    markdown,
    fileName,
    astSummary,
    styleConfig,
    templates,
    selectedTemplateId,
    exporting,
    setMarkdown,
    setFileName,
    setAstSummary,
    setTemplates,
    setSelectedTemplateId,
    replaceStyleConfig,
    updateStyleField,
    setExporting
  } = useEditorStore();

  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadTemplates = async () => {
      setLoadingTemplates(true);
      try {
        const result = await fetchTemplates();
        if (result.templates?.length) {
          setTemplates(result.templates);
          const selectedExists = result.templates.some((item) => item.id === selectedTemplateId);
          if (!selectedExists) {
            setSelectedTemplateId(result.templates[0].id);
            replaceStyleConfig(cloneStyleConfig(result.templates[0].config));
          }
        }
      } catch (error) {
        setMessage(`\u6a21\u677f\u52a0\u8f7d\u5931\u8d25\uff1a${error.message}`);
      } finally {
        setLoadingTemplates(false);
      }
    };

    loadTemplates();
  }, [replaceStyleConfig, selectedTemplateId, setSelectedTemplateId, setTemplates]);

  const previewHtml = useMemo(() => markdownToHtml(markdown), [markdown]);

  const handleUpload = async (file) => {
    setUploading(true);
    setMessage("");

    try {
      const result = await uploadMarkdownFile(file);
      const uploadName = String(file?.name || result.fileName || "");

      setMarkdown(result.markdown || "");
      setFileName(baseFileName(uploadName));
      setAstSummary(result.astSummary || null);
      setMessage(`\u5df2\u4e0a\u4f20\uff1a${uploadName || "\u672a\u77e5\u6587\u4ef6"}`);
    } catch (error) {
      setMessage(`\u4e0a\u4f20\u5931\u8d25\uff1a${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleTemplateApply = () => {
    const template = templates.find((item) => item.id === selectedTemplateId);
    if (!template) {
      setMessage("\u672a\u627e\u5230\u6a21\u677f");
      return;
    }

    replaceStyleConfig(cloneStyleConfig(template.config));
    setMessage(`\u5df2\u52a0\u8f7d\u6a21\u677f\uff1a${template.name}`);
  };

  const handleSaveTemplate = async () => {
    const name = window.prompt("\u8bf7\u8f93\u5165\u6a21\u677f\u540d\u79f0");
    if (!name) {
      return;
    }

    const description = window.prompt("\u8bf7\u8f93\u5165\u6a21\u677f\u63cf\u8ff0\uff08\u53ef\u9009\uff09") || "";

    try {
      await saveTemplate({
        name,
        description,
        config: styleConfig
      });

      const result = await fetchTemplates();
      setTemplates(result.templates || []);

      const created = result.templates?.find((item) => item.name === name.trim());
      if (created) {
        setSelectedTemplateId(created.id);
      }

      setMessage(`\u6a21\u677f\u5df2\u4fdd\u5b58\uff1a${name}`);
    } catch (error) {
      setMessage(`\u6a21\u677f\u4fdd\u5b58\u5931\u8d25\uff1a${error.message}`);
    }
  };

  const handleExport = async () => {
    if (!markdown.trim()) {
      setMessage("Markdown \u4e3a\u7a7a\uff0c\u65e0\u6cd5\u5bfc\u51fa");
      return;
    }

    setExporting(true);
    setMessage("");

    try {
      const blob = await convertMarkdownToDocx({
        markdown,
        styleConfig,
        fileName: baseFileName(fileName)
      });

      downloadBlob(blob, `${baseFileName(fileName)}.docx`);
      setMessage("\u5bfc\u51fa\u6210\u529f");
    } catch (error) {
      setMessage(`\u5bfc\u51fa\u5931\u8d25\uff1a${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  const handleStyleChange = (section, field, value) => {
    if (typeof value === "number" && Number.isNaN(value)) {
      return;
    }

    let nextValue = value;

    if (section === "headingNumbering" && field.endsWith("Start") && typeof nextValue === "number") {
      nextValue = Math.max(1, Math.floor(nextValue || 1));
    }

    if (section === "paragraph" && field === "chineseFontFamily") {
      updateStyleField("paragraph", "fontFamily", nextValue);
    }

    updateStyleField(section, field, nextValue);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1>{"Markdown \u8f6c Word \u683c\u5f0f\u6807\u51c6\u5316\u5de5\u5177"}</h1>
          <p>{"\u4e0a\u4f20 -\u003e \u914d\u7f6e -\u003e \u9884\u89c8 -\u003e \u5bfc\u51fa (.docx)"}</p>
        </div>
        <button type="button" onClick={handleExport} disabled={exporting || uploading}>
          {exporting ? "\u5bfc\u51fa\u4e2d..." : "\u5bfc\u51fa Word"}
        </button>
      </header>

      {message && <div className="toast-message">{message}</div>}

      <main className="workspace-grid">
        <UploadPanel
          markdown={markdown}
          fileName={fileName}
          astSummary={astSummary}
          onMarkdownChange={setMarkdown}
          onFileNameChange={setFileName}
          onFileUpload={handleUpload}
          uploading={uploading}
        />

        <StylePanel
          styleConfig={styleConfig}
          onStyleChange={handleStyleChange}
          templates={templates}
          selectedTemplateId={selectedTemplateId}
          onTemplateChange={setSelectedTemplateId}
          onTemplateApply={handleTemplateApply}
          onTemplateSave={handleSaveTemplate}
          loading={loadingTemplates}
        />

        <PreviewPanel markdownHtml={previewHtml} styleConfig={styleConfig} />
      </main>
    </div>
  );
}




