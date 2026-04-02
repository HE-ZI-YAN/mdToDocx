export function TemplatePanel({
  templates,
  selectedTemplateId,
  onTemplateChange,
  onTemplateApply,
  onTemplateSave,
  loading
}) {
  const activeTemplate = templates.find((item) => item.id === selectedTemplateId);

  return (
    <div className="template-panel">
      <h3>模板系统</h3>
      <label>
        选择模板
        <select value={selectedTemplateId} onChange={(event) => onTemplateChange(event.target.value)}>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
              {template.readonly ? "（内置）" : "（自定义）"}
            </option>
          ))}
        </select>
      </label>

      <p className="template-desc">{activeTemplate?.description || "无描述"}</p>

      <div className="template-actions">
        <button type="button" onClick={onTemplateApply} disabled={loading}>
          加载模板
        </button>
        <button type="button" className="ghost-btn" onClick={onTemplateSave} disabled={loading}>
          保存为模板
        </button>
      </div>
    </div>
  );
}
