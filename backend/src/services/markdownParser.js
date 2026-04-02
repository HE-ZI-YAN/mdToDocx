import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";

const parser = unified().use(remarkParse).use(remarkGfm);

export function parseMarkdownToAst(markdown) {
  return parser.parse(markdown ?? "");
}

export function summarizeAst(ast) {
  const summary = {
    headings: 0,
    paragraphs: 0,
    tables: 0,
    lists: 0,
    codeBlocks: 0
  };

  function walk(node) {
    if (!node || typeof node !== "object") {
      return;
    }

    switch (node.type) {
      case "heading":
        summary.headings += 1;
        break;
      case "paragraph":
        summary.paragraphs += 1;
        break;
      case "table":
        summary.tables += 1;
        break;
      case "list":
        summary.lists += 1;
        break;
      case "code":
        summary.codeBlocks += 1;
        break;
      default:
        break;
    }

    if (Array.isArray(node.children)) {
      node.children.forEach(walk);
    }
  }

  walk(ast);
  return summary;
}
