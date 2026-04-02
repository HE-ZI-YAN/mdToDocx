import { useRef, useState } from "react";

function StatBadge({ label, value }) {
  return (
    <div className="stat-badge">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function UploadPanel({
  markdown,
  fileName,
  astSummary,
  onMarkdownChange,
  onFileNameChange,
  onFileUpload,
  uploading
}) {
  const fileInputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = async (files) => {
    const target = files?.[0];
    if (!target) {
      return;
    }

    await onFileUpload(target);
  };

  const onDrop = async (event) => {
    event.preventDefault();
    setDragging(false);
    await handleFiles(event.dataTransfer.files);
  };

  return (
    <section className="panel panel-upload">
      <header className="panel-header">
        <h2>Markdown 输入</h2>
        <label className="filename-input">
          输出文件名
          <input
            type="text"
            value={fileName}
            onChange={(event) => onFileNameChange(event.target.value)}
            placeholder="converted-document"
          />
        </label>
      </header>

      <div
        className={`dropzone ${dragging ? "is-dragging" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <div>
          <p>{uploading ? "上传并解析中..." : "拖拽 Markdown 文件到这里"}</p>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            选择文件
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.markdown,.txt"
            style={{ display: "none" }}
            onChange={(event) => handleFiles(event.target.files)}
          />
        </div>
      </div>

      {astSummary && (
        <div className="stats-grid">
          <StatBadge label="标题" value={astSummary.headings} />
          <StatBadge label="段落" value={astSummary.paragraphs} />
          <StatBadge label="表格" value={astSummary.tables} />
          <StatBadge label="列表" value={astSummary.lists} />
          <StatBadge label="代码块" value={astSummary.codeBlocks} />
        </div>
      )}

      <label className="editor-label">
        Markdown 编辑器
        <textarea
          className="markdown-editor"
          value={markdown}
          onChange={(event) => onMarkdownChange(event.target.value)}
          spellCheck={false}
        />
      </label>
    </section>
  );
}
