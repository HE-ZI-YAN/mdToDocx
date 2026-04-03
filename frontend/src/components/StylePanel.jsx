import { TemplatePanel } from "./TemplatePanel";

const fontOptions = ["宋体", "黑体", "仿宋", "楷体", "Times New Roman", "Calibri", "Arial", "Consolas"];
const fontSizeOptions = [
  { label: "六号 (7.5 pt)", value: 7.5 },
  { label: "小五 (9 pt)", value: 9 },
  { label: "10 pt", value: 10 },
  { label: "五号 (10.5 pt)", value: 10.5 },
  { label: "11 pt", value: 11 },
  { label: "小四 (12 pt)", value: 12 },
  { label: "四号 (14 pt)", value: 14 },
  { label: "小三 (15 pt)", value: 15 },
  { label: "三号 (16 pt)", value: 16 },
  { label: "小二 (18 pt)", value: 18 },
  { label: "20 pt", value: 20 },
  { label: "二号 (22 pt)", value: 22 },
  { label: "小一 (24 pt)", value: 24 },
  { label: "一号 (26 pt)", value: 26 },
  { label: "28 pt", value: 28 },
  { label: "小初 (36 pt)", value: 36 },
  { label: "初号 (42 pt)", value: 42 }
];

const alignOptions = [
  { label: "左对齐", value: "left" },
  { label: "居中", value: "center" },
  { label: "右对齐", value: "right" },
  { label: "两端对齐", value: "justify" }
];

const headingNumberFormatOptions = [
  { label: "中文数字（一、二、三）", value: "CHINESE_COUNTING" },
  { label: "阿拉伯数字（1,2,3）", value: "DECIMAL" },
  { label: "大写罗马（I,II,III）", value: "UPPER_ROMAN" },
  { label: "小写罗马（i,ii,iii）", value: "LOWER_ROMAN" },
  { label: "大写字母（A,B,C）", value: "UPPER_LETTER" },
  { label: "小写字母（a,b,c）", value: "LOWER_LETTER" }
];

function normalizeColorValue(value) {
  const normalized = String(value ?? "")
    .trim()
    .replace(/^#/, "")
    .toUpperCase();

  return /^[0-9A-F]{6}$/.test(normalized) ? normalized : "000000";
}

function NumberInput({ value, onChange, step = "1", min = "0" }) {
  return (
    <input
      type="number"
      min={min}
      step={step}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
    />
  );
}

function FontSelect({ value, onChange }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)}>
      {fontOptions.map((font) => (
        <option key={font} value={font}>
          {font}
        </option>
      ))}
    </select>
  );
}

function FontSizeSelect({ value, onChange }) {
  return (
    <select value={value} onChange={(event) => onChange(Number(event.target.value))}>
      {fontSizeOptions.map((size) => (
        <option key={size.value} value={size.value}>
          {size.label}
        </option>
      ))}
    </select>
  );
}

function ColorInput({ value, onChange }) {
  const normalized = normalizeColorValue(value);

  return <input type="color" value={`#${normalized}`} onChange={(event) => onChange(event.target.value.replace(/^#/, ""))} />;
}

function AlignSelect({ value, onChange, options = alignOptions }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)}>
      {options.map((item) => (
        <option key={item.value} value={item.value}>
          {item.label}
        </option>
      ))}
    </select>
  );
}

function HeadingNumberFormatSelect({ value, onChange }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)}>
      {headingNumberFormatOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function TextStyleFields({
  title,
  style,
  onChange,
  allowBold = false,
  allowIndent = false,
  showLineSpacing = false,
  splitBodyFonts = false,
  splitHeadingFonts = false,
  allowColor = false
}) {
  const useSplitFonts = splitBodyFonts || splitHeadingFonts;

  return (
    <details open className="style-group">
      <summary>{title}</summary>
      <div className="field-grid">
        {useSplitFonts ? (
          <>
            <label>
              中文字体
              <FontSelect
                value={style.chineseFontFamily || style.fontFamily}
                onChange={(value) => onChange("chineseFontFamily", value)}
              />
            </label>

            <label>
              英文字体
              <FontSelect
                value={style.englishFontFamily || "Times New Roman"}
                onChange={(value) => onChange("englishFontFamily", value)}
              />
            </label>
          </>
        ) : (
          <label>
            字体
            <FontSelect value={style.fontFamily} onChange={(value) => onChange("fontFamily", value)} />
          </label>
        )}

        <label>
          字号
          <FontSizeSelect value={style.fontSize} onChange={(value) => onChange("fontSize", value)} />
        </label>

        {allowBold && (
          <label className="switch-row">
            <span>加粗</span>
            <input type="checkbox" checked={style.bold} onChange={(event) => onChange("bold", event.target.checked)} />
          </label>
        )}

        {allowColor && (
          <label>
            标题颜色
            <ColorInput value={style.color} onChange={(value) => onChange("color", value)} />
          </label>
        )}

        <label>
          段前间距(pt)
          <NumberInput value={style.spacingBefore} onChange={(value) => onChange("spacingBefore", value)} step="0.5" />
        </label>

        <label>
          段后间距(pt)
          <NumberInput value={style.spacingAfter} onChange={(value) => onChange("spacingAfter", value)} step="0.5" />
        </label>

        <label>
          对齐方式
          <AlignSelect value={style.align} onChange={(value) => onChange("align", value)} />
        </label>

        {showLineSpacing && (
          <>
            <label>
              行距
              <select value={style.lineSpacingType} onChange={(event) => onChange("lineSpacingType", event.target.value)}>
                <option value="single">单倍</option>
                <option value="oneHalf">1.5 倍</option>
                <option value="fixed">固定值</option>
              </select>
            </label>

            {style.lineSpacingType === "fixed" && (
              <label>
                固定值(pt)
                <NumberInput
                  value={style.lineSpacingValue}
                  onChange={(value) => onChange("lineSpacingValue", value)}
                  step="0.5"
                />
              </label>
            )}
          </>
        )}

        {allowIndent && (
          <label>
            首行缩进(字符)
            <NumberInput
              value={style.firstLineIndentChars}
              onChange={(value) => onChange("firstLineIndentChars", value)}
              step="0.5"
            />
          </label>
        )}
      </div>
    </details>
  );
}

function HeadingNumberingFields({ value, onChange }) {
  return (
    <details open className="style-group">
      <summary>标题自动编号（Word可识别）</summary>
      <div className="field-grid">
        <label className="switch-row">
          <span>启用自动编号</span>
          <input type="checkbox" checked={value.enabled} onChange={(event) => onChange("enabled", event.target.checked)} />
        </label>

        <label>
          一级编号格式
          <HeadingNumberFormatSelect value={value.level1Format} onChange={(next) => onChange("level1Format", next)} />
        </label>

        <label>
          一级显示模板
          <input type="text" value={value.level1Text} onChange={(event) => onChange("level1Text", event.target.value)} />
        </label>

        <label>
          一级起始值
          <NumberInput value={value.level1Start} min="1" onChange={(next) => onChange("level1Start", next)} />
        </label>

        <label>
          二级编号格式
          <HeadingNumberFormatSelect value={value.level2Format} onChange={(next) => onChange("level2Format", next)} />
        </label>

        <label>
          二级显示模板
          <input type="text" value={value.level2Text} onChange={(event) => onChange("level2Text", event.target.value)} />
        </label>

        <label>
          二级起始值
          <NumberInput value={value.level2Start} min="1" onChange={(next) => onChange("level2Start", next)} />
        </label>

        <label>
          三级编号格式
          <HeadingNumberFormatSelect value={value.level3Format} onChange={(next) => onChange("level3Format", next)} />
        </label>

        <label>
          三级显示模板
          <input type="text" value={value.level3Text} onChange={(event) => onChange("level3Text", event.target.value)} />
        </label>

        <label>
          三级起始值
          <NumberInput value={value.level3Start} min="1" onChange={(next) => onChange("level3Start", next)} />
        </label>
      </div>

      <p className="numbering-hint">模板可用占位符：`%1`、`%2`、`%3`。例如：一级 `第%1章`，二级 `%1.%2`，三级 `%1.%2.%3`。</p>
    </details>
  );
}

export function StylePanel({
  styleConfig,
  onStyleChange,
  templates,
  selectedTemplateId,
  onTemplateChange,
  onTemplateApply,
  onTemplateSave,
  loading
}) {
  return (
    <section className="panel panel-style">
      <header className="panel-header">
        <h2>样式配置</h2>
      </header>

      <TemplatePanel
        templates={templates}
        selectedTemplateId={selectedTemplateId}
        onTemplateChange={onTemplateChange}
        onTemplateApply={onTemplateApply}
        onTemplateSave={onTemplateSave}
        loading={loading}
      />

      <TextStyleFields
        title="一级标题（Heading 1）"
        style={styleConfig.heading1}
        allowBold
        allowColor
        splitHeadingFonts
        onChange={(field, value) => onStyleChange("heading1", field, value)}
      />

      <TextStyleFields
        title="二级标题（Heading 2）"
        style={styleConfig.heading2}
        allowBold
        allowColor
        splitHeadingFonts
        onChange={(field, value) => onStyleChange("heading2", field, value)}
      />

      <TextStyleFields
        title="三级标题（Heading 3）"
        style={styleConfig.heading3}
        allowBold
        allowColor
        splitHeadingFonts
        onChange={(field, value) => onStyleChange("heading3", field, value)}
      />

      <HeadingNumberingFields
        value={styleConfig.headingNumbering}
        onChange={(field, value) => onStyleChange("headingNumbering", field, value)}
      />

      <TextStyleFields
        title="正文样式"
        style={styleConfig.paragraph}
        allowIndent
        showLineSpacing
        splitBodyFonts
        onChange={(field, value) => onStyleChange("paragraph", field, value)}
      />

      <details open className="style-group">
        <summary>表格样式</summary>
        <div className="field-grid">
          <label>
            表格对齐
            <AlignSelect
              value={styleConfig.table.align}
              onChange={(value) => onStyleChange("table", "align", value)}
              options={alignOptions.filter((item) => item.value !== "justify")}
            />
          </label>

          <label>
            边框类型
            <select
              value={styleConfig.table.borderType}
              onChange={(event) => onStyleChange("table", "borderType", event.target.value)}
            >
              <option value="threeLine">三线表</option>
              <option value="full">全边框</option>
            </select>
          </label>

          <label className="switch-row">
            <span>表头加粗</span>
            <input
              type="checkbox"
              checked={styleConfig.table.headerBold}
              onChange={(event) => onStyleChange("table", "headerBold", event.target.checked)}
            />
          </label>

          <label>
            单元格内边距(pt)
            <NumberInput
              value={styleConfig.table.cellPadding}
              onChange={(value) => onStyleChange("table", "cellPadding", value)}
              step="0.5"
            />
          </label>

          <label className="switch-row">
            <span>自动列宽</span>
            <input
              type="checkbox"
              checked={styleConfig.table.autoColumnWidth}
              onChange={(event) => onStyleChange("table", "autoColumnWidth", event.target.checked)}
            />
          </label>
        </div>
      </details>

      <details open className="style-group">
        <summary>列表样式</summary>
        <div className="field-grid">
          <label>
            字体
            <FontSelect
              value={styleConfig.list.fontFamily}
              onChange={(value) => onStyleChange("list", "fontFamily", value)}
            />
          </label>

          <label>
            字号
            <FontSizeSelect
              value={styleConfig.list.fontSize}
              onChange={(value) => onStyleChange("list", "fontSize", value)}
            />
          </label>

          <label>
            左缩进(in)
            <NumberInput
              value={styleConfig.list.indentLeft}
              onChange={(value) => onStyleChange("list", "indentLeft", value)}
              step="0.05"
            />
          </label>

          <label>
            段前间距(pt)
            <NumberInput
              value={styleConfig.list.spacingBefore}
              onChange={(value) => onStyleChange("list", "spacingBefore", value)}
              step="0.5"
            />
          </label>

          <label>
            段后间距(pt)
            <NumberInput
              value={styleConfig.list.spacingAfter}
              onChange={(value) => onStyleChange("list", "spacingAfter", value)}
              step="0.5"
            />
          </label>

          <label>
            对齐方式
            <AlignSelect value={styleConfig.list.align} onChange={(value) => onStyleChange("list", "align", value)} />
          </label>
        </div>
      </details>

      <details className="style-group">
        <summary>代码块样式（可选）</summary>
        <div className="field-grid">
          <label>
            字体
            <FontSelect
              value={styleConfig.code.fontFamily}
              onChange={(value) => onStyleChange("code", "fontFamily", value)}
            />
          </label>

          <label>
            字号
            <FontSizeSelect
              value={styleConfig.code.fontSize}
              onChange={(value) => onStyleChange("code", "fontSize", value)}
            />
          </label>

          <label>
            段前间距(pt)
            <NumberInput
              value={styleConfig.code.spacingBefore}
              onChange={(value) => onStyleChange("code", "spacingBefore", value)}
              step="0.5"
            />
          </label>

          <label>
            段后间距(pt)
            <NumberInput
              value={styleConfig.code.spacingAfter}
              onChange={(value) => onStyleChange("code", "spacingAfter", value)}
              step="0.5"
            />
          </label>

          <label>
            背景色(HEX)
            <input
              type="text"
              value={styleConfig.code.backgroundColor}
              onChange={(event) => onStyleChange("code", "backgroundColor", event.target.value)}
            />
          </label>
        </div>
      </details>
    </section>
  );
}
