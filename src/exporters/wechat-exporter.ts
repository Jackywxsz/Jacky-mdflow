import { ImageResolver } from '../images/image-resolver';
import { ThemeManager } from '../themes/theme-manager';
import { writeHtmlToClipboard } from './clipboard';
import {
  getPlainText,
  parseHtml,
  replaceTag,
  stripObsidianArtifacts,
  transformTaskLists,
  unwrapListParagraphs,
} from './dom-utils';
import {
  ExportResult,
  PlatformExporter,
  PlatformRenderContext,
  PreparedPlatformContent,
} from './types';

/**
 * WeChat Public Account Exporter
 * Produces inline-styled HTML that survives direct paste into the WeChat editor.
 */
export class WeChatExporter implements PlatformExporter {
  readonly id = 'wechat';
  readonly name = '微信公众号';
  readonly icon = '📱';

  constructor(
    private themeManager: ThemeManager,
    private imageResolver: ImageResolver
  ) {}

  async prepare(renderedHtml: string, context: PlatformRenderContext): Promise<PreparedPlatformContent> {
    const htmlWithImages = await this.imageResolver.resolveImagesToBase64(renderedHtml, context.sourceFile);
    const doc = parseHtml(htmlWithImages);

    stripObsidianArtifacts(doc);
    transformTaskLists(doc);
    unwrapListParagraphs(doc);

    const styledHtml = this.themeManager.applyInlineStyles(doc.body.innerHTML);
    const finalHtml = this.finalizeHtml(styledHtml);

    return {
      previewHtml: finalHtml,
      exportHtml: finalHtml,
      plainText: getPlainText(doc.body.innerHTML),
    };
  }

  async export(content: PreparedPlatformContent): Promise<ExportResult> {
    try {
      const html = content.exportHtml || content.previewHtml;
      await writeHtmlToClipboard(html, content.plainText || getPlainText(html));

      return { success: true, message: '已复制到剪贴板，可直接粘贴到微信公众号编辑器' };
    } catch (error) {
      console.error('WeChat export failed:', error);
      return { success: false, message: `复制失败: ${error}` };
    }
  }

  private finalizeHtml(sourceHtml: string): string {
    const doc = parseHtml(sourceHtml);

    this.convertGridToTable(doc);
    this.processImages(doc);
    this.rebuildCodeBlocks(doc);
    this.replaceDivsWithSections(doc);
    this.cleanupAttributes(doc);
    this.wrapTextNodesWithLeaf(doc);

    const html = doc.body.innerHTML;
    this.assertWechatCompliance(html);
    return html;
  }

  private convertGridToTable(doc: Document): void {
    const grids = doc.querySelectorAll('.image-grid');
    grids.forEach((grid) => {
      const images = grid.querySelectorAll('img');
      if (images.length === 0) return;

      const table = doc.createElement('table');
      table.setCssStyles({
        width: '100%',
        borderCollapse: 'collapse',
        margin: '20px 0',
      });

      const row = doc.createElement('tr');
      images.forEach((img) => {
        const td = doc.createElement('td');
        td.setCssStyles({ padding: '4px', border: 'none' });
        td.appendChild(img.cloneNode(true));
        row.appendChild(td);
      });
      table.appendChild(row);

      grid.parentNode?.replaceChild(table, grid);
    });
  }

  private processImages(doc: Document): void {
    doc.querySelectorAll('img').forEach((img) => {
      const src = img.getAttribute('src') || '';

      if (src.startsWith('data:image/gif') || src.toLowerCase().includes('.gif')) {
        const placeholder = doc.createElement('p');
        const theme = this.themeManager.getCurrentTheme();
        const placeholderStyle = theme.enhanced?.note || [
          'background-color:#fff7ed',
          'border-left:4px solid #fdba74',
          'padding:12px 16px',
          'color:#9a3412',
          'font-size:14px',
          'text-align:center',
          'margin:16px 0',
          'line-height:1.6',
        ].join(';');
        placeholder.setAttribute('style', placeholderStyle);
        placeholder.textContent = '此处为 GIF 动图，公众号请手动重新上传。';
        img.parentNode?.replaceChild(placeholder, img);
      }
    });
  }

  private rebuildCodeBlocks(doc: Document): void {
    doc.querySelectorAll('pre').forEach((block) => {
      const codeElement = block.querySelector('code');
      const codeText = codeElement?.textContent || block.textContent || '';
      if (!codeText.trim()) return;

      const theme = this.themeManager.getCurrentTheme();
      const frame = doc.createElement('section');
      frame.setAttribute(
        'style',
        theme.enhanced?.codeFrame || [
          'margin:24px 0',
          'padding:18px 20px',
          'background:#2d2d2d',
          'border-radius:6px',
          'overflow-x:auto',
          'box-sizing:border-box',
        ].join(';')
      );

      const lineStyle = theme.enhanced?.codeLine || [
        'margin:0',
        'color:#e5e7eb',
        'font-family:"SF Mono",Consolas,Monaco,"Courier New",monospace',
        'font-size:13px',
        'line-height:1.75',
      ].join(';');

      codeText.replace(/\n$/, '').split('\n').forEach((line) => {
        const lineElement = doc.createElement('p');
        lineElement.setAttribute('style', lineStyle);
        if (line.length === 0) {
          lineElement.appendChild(doc.createElement('br'));
        } else {
          lineElement.textContent = line.replace(/\t/g, '    ').replace(/ /g, '\u00a0');
        }
        frame.appendChild(lineElement);
      });

      block.parentNode?.replaceChild(frame, block);
    });
  }

  private replaceDivsWithSections(doc: Document): void {
    doc.querySelectorAll('div').forEach((element) => {
      replaceTag(element, 'section');
    });
  }

  private cleanupAttributes(doc: Document): void {
    doc.querySelectorAll('*').forEach((element) => {
      Array.from(element.attributes).forEach((attr) => {
        const keep =
          attr.name === 'style' ||
          attr.name === 'href' ||
          attr.name === 'src' ||
          attr.name === 'alt' ||
          attr.name === 'leaf' ||
          attr.name === 'colspan' ||
          attr.name === 'rowspan';

        if (!keep || attr.name.startsWith('data-') || attr.name.startsWith('aria-')) {
          element.removeAttribute(attr.name);
        }
      });

      const style = element.getAttribute('style');
      if (style) {
        const sanitizedStyle = this.sanitizeInlineStyle(style);
        if (sanitizedStyle) {
          element.setAttribute('style', sanitizedStyle);
        } else {
          element.removeAttribute('style');
        }
      }

      const href = element.getAttribute('href');
      if (href && !/^(https?:|mailto:|#)/i.test(href)) {
        element.removeAttribute('href');
      }

      const src = element.getAttribute('src');
      if (src && !/^(https?:|data:image\/)/i.test(src)) {
        element.removeAttribute('src');
      }
    });
  }

  private sanitizeInlineStyle(style: string): string {
    return style
      .split(';')
      .map((declaration) => declaration.trim())
      .filter(Boolean)
      .filter((declaration) => {
        const [property = '', ...valueParts] = declaration.split(':');
        const normalizedProperty = property.trim().toLowerCase();
        const value = valueParts.join(':').trim().toLowerCase();

        if (normalizedProperty === 'float') return false;
        if (normalizedProperty === 'position' && /^(fixed|absolute|sticky)$/.test(value)) return false;
        if (normalizedProperty === 'display' && value === 'grid') return false;
        if (value.includes('var(--')) return false;
        if (/^@(media|keyframes|import)/.test(normalizedProperty)) return false;
        return true;
      })
      .join(';');
  }

  private wrapTextNodesWithLeaf(doc: Document): void {
    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];
    let current = walker.nextNode();

    while (current) {
      const textNode = current as Text;
      const parent = textNode.parentElement;
      if (parent && !parent.closest('span[leaf]') && !parent.closest('script, style')) {
        textNodes.push(textNode);
      }
      current = walker.nextNode();
    }

    textNodes.forEach((textNode) => {
      const leaf = doc.createElement('span');
      leaf.setAttribute('leaf', '');
      leaf.textContent = textNode.data;
      textNode.parentNode?.replaceChild(leaf, textNode);
    });
  }

  private assertWechatCompliance(html: string): void {
    const forbidden: Array<[RegExp, string]> = [
      [/<(?:style|script|div|link)\b/i, '包含公众号不兼容标签'],
      [/\s(?:class|id)\s*=/i, '包含会被公众号清除的 class/id'],
      [/position\s*:\s*(?:fixed|absolute|sticky)/i, '包含不兼容定位'],
      [/float\s*:/i, '包含不兼容 float'],
      [/display\s*:\s*grid/i, '包含不兼容 grid'],
      [/var\s*\(\s*--/i, '包含不兼容 CSS 变量'],
    ];

    const failure = forbidden.find(([pattern]) => pattern.test(html));
    if (failure) {
      throw new Error(`公众号 HTML 合规检查失败：${failure[1]}`);
    }
  }
}
