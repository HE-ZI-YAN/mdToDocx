import MarkdownIt from "markdown-it";
import DOMPurify from "dompurify";

const md = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true,
  typographer: true
});

const originalFence = md.renderer.rules.fence;
md.renderer.rules.fence = (tokens, idx, options, env, self) => {
  const raw = originalFence ? originalFence(tokens, idx, options, env, self) : self.renderToken(tokens, idx, options);
  return raw.replace("<pre", '<pre class="preview-code"');
};

md.renderer.rules.table_open = () => '<table class="preview-table">';

export function markdownToHtml(markdown) {
  const unsafe = md.render(markdown || "");
  return DOMPurify.sanitize(unsafe);
}
