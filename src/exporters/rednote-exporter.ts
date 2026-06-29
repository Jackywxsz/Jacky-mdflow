import { Notice } from 'obsidian';
import { toBlob } from 'html-to-image';
import JSZip from 'jszip';
import { ImageResolver } from '../images/image-resolver';
import { RedNoteSettingsManager } from '../rednote/settings-manager';
import { RedNoteSettings } from '../rednote/types';
import { RedNoteTemplatePreset } from '../rednote/types';
import { writeImageToClipboard } from './clipboard';
import {
  getPlainText,
  parseHtml,
  sanitizeFileName,
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

interface RedNoteCard {
  title: string;
  kind: 'cover' | 'content';
  bodyHtml?: string;
  summary?: string;
  coverImageSrc?: string | null;
  fileName: string;
}

interface RedNotePreparedData {
  cards: RedNoteCard[];
  settings: RedNoteSettings;
  template: RedNoteTemplatePreset;
}

interface PaginationEntry {
  node: Element | null;
  sectionTitle?: string;
  forceBreakBefore?: boolean;
}

interface PageMeasurer {
  canFit: (title: string, nodes: Element[]) => boolean;
  destroy: () => void;
}

const IMAGE_PLACEHOLDER =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const VERIFIED_BADGE_IMAGE_SRC =
  'data:image/png;base64,' +
  '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';

export class RedNoteExporter implements PlatformExporter<RedNotePreparedData> {
  readonly id = 'rednote';
  readonly name = '小红书';
  readonly icon = '📕';

  constructor(
    private imageResolver: ImageResolver,
    private redNoteSettings: RedNoteSettingsManager
  ) {}

  async prepare(
    renderedHtml: string,
    context: PlatformRenderContext
  ): Promise<PreparedPlatformContent<RedNotePreparedData>> {
    const settings = this.redNoteSettings.getSettings();
    const template = this.redNoteSettings.getTemplate(settings.templateId);
    const htmlWithImages = await this.imageResolver.resolveImagesToBase64(
      renderedHtml,
      context.sourceFile
    );
    const doc = parseHtml(htmlWithImages);

    stripObsidianArtifacts(doc);
    transformTaskLists(doc);
    unwrapListParagraphs(doc);
    await this.preloadDocumentImages(doc);

    const cards = await this.buildCards(doc, context, settings, template);

    return {
      previewHtml: this.renderPreview(cards, settings, template),
      plainText: getPlainText(doc.body.innerHTML),
      data: { cards, settings, template },
    };
  }

  private async preloadDocumentImages(doc: Document): Promise<void> {
    const sources = Array.from(doc.querySelectorAll('img'))
      .map((image) => image.getAttribute('src') || '')
      .filter(Boolean);

    await Promise.all(
      sources.map((src) => this.preloadImage(src))
    );
  }

  private async preloadImage(src: string): Promise<void> {
    await new Promise<void>((resolve) => {
      const image = new Image();
      image.onload = () => resolve();
      image.onerror = () => resolve();
      image.src = src;

      if (image.complete) {
        resolve();
      }
    });
  }

  mountPreview(
    container: HTMLElement,
    content: PreparedPlatformContent<RedNotePreparedData>
  ): void {
    const wrapper = container.querySelector('.red-preview-wrapper') as HTMLElement | null;
    if (!wrapper) return;

    const imagePreview = wrapper.querySelector('.red-image-preview') as HTMLElement | null;
    const copyButton = wrapper.querySelector('.red-copy-button') as HTMLButtonElement | null;
    const prevButton = wrapper.querySelector('[data-rednote-nav="prev"]') as HTMLButtonElement | null;
    const nextButton = wrapper.querySelector('[data-rednote-nav="next"]') as HTMLButtonElement | null;
    const indicator = wrapper.querySelector('.red-page-indicator') as HTMLElement | null;
    const sections = Array.from(wrapper.querySelectorAll('.red-content-section')) as HTMLElement[];

    if (!imagePreview || !prevButton || !nextButton || !indicator || sections.length === 0) {
      return;
    }

    let currentIndex = 0;

    const updateNavigation = () => {
      this.updatePreviewState(wrapper, currentIndex);
      indicator.textContent = `${currentIndex + 1}/${sections.length}`;
      prevButton.classList.toggle('red-nav-hidden', currentIndex === 0);
      nextButton.classList.toggle('red-nav-hidden', currentIndex === sections.length - 1);
      imagePreview.classList.toggle(
        'jacky-cover-active',
        sections[currentIndex].classList.contains('jacky-cover-section')
      );
    };

    prevButton.addEventListener('click', () => {
      if (currentIndex === 0) return;
      currentIndex -= 1;
      updateNavigation();
    });

    nextButton.addEventListener('click', () => {
      if (currentIndex >= sections.length - 1) return;
      currentIndex += 1;
      updateNavigation();
    });

    copyButton?.addEventListener('click', async () => {
      copyButton.disabled = true;
      try {
        const blob = await this.capturePreview(imagePreview);
        await writeImageToClipboard(blob);
        new Notice('当前页已复制到剪贴板');
      } catch (error) {
        console.error('Copy rednote image failed:', error);
        new Notice('复制当前页失败');
      } finally {
        window.setTimeout(() => {
          copyButton.disabled = false;
        }, 800);
      }
    });

    updateNavigation();
  }

  async export(
    content: PreparedPlatformContent<RedNotePreparedData>,
    context: PlatformRenderContext
  ): Promise<ExportResult> {
    const cards = content.data?.cards || [];
    if (cards.length === 0) {
      return { success: false, message: '没有可导出的内容' };
    }

    const exportSurface = document.createElement('div');
    exportSurface.className = 'mdflow-rednote-export-surface';
    exportSurface.innerHTML = content.previewHtml;
    document.body.appendChild(exportSurface);

    try {
      const imagePreview = exportSurface.querySelector('.red-image-preview') as HTMLElement | null;
      if (!imagePreview) {
        throw new Error('未找到小红书预览区域');
      }

      const snapshots: Array<{ fileName: string; blob: Blob }> = [];

      for (let i = 0; i < cards.length; i++) {
        this.updatePreviewState(exportSurface, i);
        imagePreview.classList.toggle('jacky-cover-active', cards[i].kind === 'cover');
        await this.delay(120);
        const blob = await this.capturePreview(imagePreview);
        snapshots.push({ fileName: cards[i].fileName, blob });
      }

      if (snapshots.length === 1) {
        this.downloadBlob(snapshots[0].blob, snapshots[0].fileName);
        return { success: true, message: '已导出当前图片' };
      }

      const zip = new JSZip();
      snapshots.forEach((snapshot) => {
        zip.file(snapshot.fileName, snapshot.blob);
      });

      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 9 },
      });

      this.downloadBlob(
        zipBlob,
        `${sanitizeFileName(context.title || context.sourceFile.basename)}-小红书图文.zip`
      );

      return {
        success: true,
        message: `已导出 ${snapshots.length} 页小红书图文`,
      };
    } catch (error) {
      console.error('RedNote export failed:', error);
      return { success: false, message: `导出失败: ${error}` };
    } finally {
      exportSurface.remove();
    }
  }

  private async buildCards(
    doc: Document,
    context: PlatformRenderContext,
    settings: RedNoteSettings,
    template: RedNoteTemplatePreset
  ): Promise<RedNoteCard[]> {
    const metadata = context.app.metadataCache.getFileCache(context.sourceFile)?.frontmatter || {};
    const title = this.pickDocumentTitle(doc, context, metadata);
    const isObsidianFlow = settings.layoutMode === 'obsidian-flow';
    const sections = isObsidianFlow
      ? [{ title, nodes: this.extractObsidianFlowNodes(doc, title) }]
      : this.extractSections(doc, title, 'h2');
    const summary =
      this.pickSummary(metadata) ||
      this.buildSummary(sections) ||
      '在 Obsidian 中完成写作、排版与分发。';
    const coverImageSrc = await this.pickCoverImage(doc, context, metadata, settings);

    const cards: RedNoteCard[] = [];

    if (template.showCover && !isObsidianFlow) {
      cards.push({
        kind: 'cover',
        title,
        summary,
        coverImageSrc,
        fileName: `${sanitizeFileName(title)}-01-封面.png`,
      });
    }

    const contentCards = this.paginateSections(sections, settings, template);

    if (contentCards.length === 0) {
      contentCards.push({
        kind: 'content',
        title,
        bodyHtml: `<p>${this.escapeHtml(summary)}</p>`,
        fileName: '',
      });
    }

    const pageOffset = cards.length;
    contentCards.forEach((card, index) => {
      cards.push({
        ...card,
        fileName: `${sanitizeFileName(title)}-${String(index + pageOffset + 1).padStart(2, '0')}-${sanitizeFileName(card.title)}.png`,
      });
    });

    return cards;
  }

  private pickDocumentTitle(
    doc: Document,
    context: PlatformRenderContext,
    metadata: Record<string, unknown>
  ): string {
    const frontmatterTitle = this.pickString(metadata, ['cover_title', 'title']);
    const firstHeading = doc.querySelector('h1, h2, h3')?.textContent?.trim();
    return frontmatterTitle || firstHeading || context.title || context.sourceFile.basename;
  }

  private pickSummary(metadata: Record<string, unknown>): string {
    return this.pickString(metadata, ['summary', 'description']);
  }

  private pickString(source: Record<string, unknown>, keys: string[]): string {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    return '';
  }

  private async pickCoverImage(
    doc: Document,
    context: PlatformRenderContext,
    metadata: Record<string, unknown>,
    settings: RedNoteSettings
  ): Promise<string | null> {
    if (settings.coverImage) {
      return settings.coverImage;
    }

    const configuredImage = this.pickString(metadata, ['cover_image', 'cover', 'image']);
    if (configuredImage) {
      return this.imageResolver.resolveImageSrc(configuredImage, context.sourceFile);
    }

    const firstImage = doc.querySelector('img');
    return firstImage?.getAttribute('src') || null;
  }

  private extractSections(
    doc: Document,
    fallbackTitle: string,
    headingLevel: 'h1' | 'h2' | 'h3'
  ): Array<{ title: string; nodes: Element[] }> {
    const sections: Array<{ title: string; nodes: Element[] }> = [];
    let currentTitle = fallbackTitle;
    let currentNodes: Element[] = [];
    let hasSplitHeading = false;

    Array.from(doc.body.children).forEach((child, index) => {
      const tag = child.tagName.toLowerCase();
      const text = child.textContent?.trim() || '';

      if (tag === headingLevel) {
        if (currentNodes.length > 0) {
          sections.push({ title: currentTitle, nodes: currentNodes });
          currentNodes = [];
        }

        currentTitle = text || currentTitle;
        hasSplitHeading = true;
        return;
      }

      if (
        index === 0 &&
        ['h1', 'h2', 'h3'].includes(tag) &&
        text === fallbackTitle
      ) {
        return;
      }

      currentNodes.push(child.cloneNode(true) as Element);
    });

    if (currentNodes.length > 0) {
      sections.push({ title: currentTitle, nodes: currentNodes });
    }

    if (sections.length === 0 && hasSplitHeading) {
      sections.push({ title: currentTitle, nodes: [] });
    }

    return sections;
  }

  private extractObsidianFlowNodes(doc: Document, fallbackTitle: string): Element[] {
    return Array.from(doc.body.children)
      .filter((child, index) => {
        const tag = child.tagName.toLowerCase();
        const text = child.textContent?.trim() || '';
        return !(index === 0 && tag === 'h1' && text === fallbackTitle);
      })
      .map((child) => child.cloneNode(true) as Element);
  }

  private buildSummary(sections: Array<{ title: string; nodes: Element[] }>): string {
    const text = sections
      .flatMap((section) => section.nodes)
      .map((node) => node.textContent?.trim() || '')
      .find(Boolean);

    if (!text) return '';
    return text.length > 96 ? `${text.slice(0, 96)}…` : text;
  }

  private paginateSections(
    sections: Array<{ title: string; nodes: Element[] }>,
    settings: RedNoteSettings,
    template: RedNoteTemplatePreset
  ): RedNoteCard[] {
    const firstSection = sections.find((section) => section.nodes.length > 0) || sections[0];
    if (!firstSection) return [];

    const doc = document.implementation.createHTMLDocument('');
    const entries: PaginationEntry[] = [];

    sections.forEach((section, sectionIndex) => {
      if (sectionIndex > 0) {
        entries.push({
          node: this.createSectionHeading(doc, section.title),
          sectionTitle: section.title,
        });
      }

      section.nodes.forEach((node) => {
        if (node.tagName.toLowerCase() === 'hr') {
          entries.push({ node: null, forceBreakBefore: true });
          return;
        }

        entries.push({ node: node.cloneNode(true) as Element });
      });
    });

    return this.paginateEntries(firstSection.title, entries, settings, template);
  }

  private createSectionHeading(doc: Document, title: string): Element {
    const heading = doc.createElement('h2');
    heading.textContent = title;
    return heading;
  }

  private paginateEntries(
    initialTitle: string,
    entries: PaginationEntry[],
    settings: RedNoteSettings,
    template: RedNoteTemplatePreset
  ): RedNoteCard[] {
    const cards: RedNoteCard[] = [];
    const normalizedEntries = this.normalizePaginationEntries(entries, settings);
    const measurer = this.createPageMeasurer(settings, template);
    let currentSectionTitle = initialTitle;
    let currentPageTitle = initialTitle;
    let currentNodes: Element[] = [];

    const flush = () => {
      if (currentNodes.length === 0) return;

      cards.push({
        kind: 'content',
        title: currentPageTitle,
        bodyHtml: this.buildCardBody(currentNodes),
        fileName: '',
      });

      currentNodes = [];
      currentPageTitle = currentSectionTitle;
    };

    const appendNode = (node: Element) => {
      const safeNodes = this.splitOversizedNode(node, currentPageTitle, measurer, settings);

      safeNodes.forEach((safeNode) => {
        if (currentNodes.length > 0 && !measurer.canFit(currentPageTitle, [...currentNodes, safeNode])) {
          flush();
        }

        currentNodes.push(safeNode);
      });
    };

    try {
      normalizedEntries.forEach((entry) => {
        if (entry.forceBreakBefore) {
          flush();
          currentPageTitle = currentSectionTitle;
          return;
        }

        if (!entry.node) return;

        if (entry.sectionTitle) {
          currentSectionTitle = entry.sectionTitle;

          if (currentNodes.length === 0) {
            currentPageTitle = currentSectionTitle;
            return;
          }

          if (measurer.canFit(currentPageTitle, [...currentNodes, entry.node])) {
            currentNodes.push(entry.node);
            return;
          }

          flush();
          currentPageTitle = currentSectionTitle;
          return;
        }

        appendNode(entry.node);
      });
    } finally {
      measurer.destroy();
    }

    flush();
    return cards;
  }

  private createPageMeasurer(
    settings: RedNoteSettings,
    template: RedNoteTemplatePreset
  ): PageMeasurer {
    if (!document.body) {
      return {
        canFit: () => true,
        destroy: () => undefined,
      };
    }

    const root = document.createElement('div');
    root.style.position = 'fixed';
    root.style.left = '-10000px';
    root.style.top = '0';
    root.style.width = '450px';
    root.style.height = '600px';
    root.style.visibility = 'hidden';
    root.style.pointerEvents = 'none';
    root.style.zIndex = '-1';

    const imagePreview = document.createElement('div');
    imagePreview.className = 'red-image-preview';
    imagePreview.setAttribute('data-template-id', template.id);
    imagePreview.setAttribute('data-rednote-layout', settings.layoutMode);
    imagePreview.setAttribute('style', this.buildPreviewStyle(settings, template));
    imagePreview.style.width = '450px';
    imagePreview.style.maxWidth = 'none';
    imagePreview.style.height = '600px';
    imagePreview.style.aspectRatio = 'auto';

    const header = document.createElement('div');
    header.className = 'red-preview-header';
    header.innerHTML = this.renderHeader(settings);

    const content = document.createElement('div');
    content.className = 'red-preview-content';

    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'red-content-wrapper';

    const contentContainer = document.createElement('div');
    contentContainer.className = 'red-content-container';

    const section = document.createElement('section');
    section.className = 'red-content-section red-section-active red-section-visible';

    const footer = document.createElement('div');
    footer.className = 'red-preview-footer';
    footer.innerHTML = this.renderFooter(settings);

    contentContainer.appendChild(section);
    contentWrapper.appendChild(contentContainer);
    content.appendChild(contentWrapper);
    imagePreview.appendChild(header);
    imagePreview.appendChild(content);
    imagePreview.appendChild(footer);
    root.appendChild(imagePreview);
    document.body.appendChild(root);

    return {
      canFit: (title: string, nodes: Element[]) => {
        section.innerHTML = this.renderContentSection(
          {
            kind: 'content',
            title,
            bodyHtml: this.buildCardBody(nodes),
            fileName: '',
          },
          settings
        );

        return this.contentFitsMeasuredSection(imagePreview, section);
      },
      destroy: () => {
        root.remove();
      },
    };
  }

  private contentFitsMeasuredSection(imagePreview: HTMLElement, section: HTMLElement): boolean {
    const shell = section.querySelector('.mdflow-rednote-section-shell') as HTMLElement | null;
    const title = section.querySelector('.mdflow-rednote-section-title') as HTMLElement | null;
    const body = section.querySelector('.mdflow-rednote-section-body') as HTMLElement | null;
    const tolerance = 0;

    this.reserveImageSlotsForMeasure(section);

    if (!shell || !title || !body) {
      const flowShell = section.querySelector('.mdflow-rednote-flow-shell') as HTMLElement | null;
      const flowBody = section.querySelector('.mdflow-rednote-flow-body') as HTMLElement | null;

      if (!flowShell || !flowBody) {
        return imagePreview.scrollHeight <= imagePreview.clientHeight + tolerance;
      }

      const shellStyle = window.getComputedStyle(flowShell);
      const shellPaddingBottom = Number.parseFloat(shellStyle.paddingBottom || '0') || 0;
      const shellLimit = flowShell.getBoundingClientRect().bottom - shellPaddingBottom;
      const bodyLastChild = flowBody.lastElementChild as HTMLElement | null;
      const bodyBottom = bodyLastChild
        ? bodyLastChild.getBoundingClientRect().bottom
        : flowBody.getBoundingClientRect().bottom;

      return bodyBottom <= shellLimit + tolerance;
    }

    const shellStyle = window.getComputedStyle(shell);
    const shellPaddingBottom = Number.parseFloat(shellStyle.paddingBottom || '0') || 0;
    const shellLimit = shell.getBoundingClientRect().bottom - shellPaddingBottom;
    const titleBottom = title.getBoundingClientRect().bottom;
    const bodyLastChild = body.lastElementChild as HTMLElement | null;
    const bodyBottom = bodyLastChild
      ? bodyLastChild.getBoundingClientRect().bottom
      : body.getBoundingClientRect().bottom;
    const contentBottom = Math.max(titleBottom, bodyBottom);

    return contentBottom <= shellLimit + tolerance;
  }

  private reserveImageSlotsForMeasure(section: HTMLElement): void {
    section.querySelectorAll('img').forEach((image) => {
      if (image.complete && image.naturalWidth > 0) {
        return;
      }

      image.style.width = '100%';
      image.style.height = 'auto';
      image.style.aspectRatio = '16 / 9';
      image.style.objectFit = 'cover';
    });
  }

  private splitOversizedNode(
    node: Element,
    title: string,
    measurer: PageMeasurer,
    settings: RedNoteSettings
  ): Element[] {
    if (measurer.canFit(title, [node])) {
      return [node];
    }

    const tag = node.tagName.toLowerCase();

    if (tag === 'img') {
      const fittedImage = node.cloneNode(true) as Element;
      fittedImage.classList.add('red-image-fit-page');
      return [fittedImage];
    }

    if (['p', 'blockquote'].includes(tag)) {
      return this.splitTextBlockToFit(node, title, measurer, settings);
    }

    if (['ul', 'ol'].includes(tag)) {
      return this.splitListFragmentToFit(node, title, measurer, settings);
    }

    if (tag === 'pre') {
      return this.splitPreBlockToFit(node, title, measurer);
    }

    return [node];
  }

  private splitTextBlockToFit(
    node: Element,
    title: string,
    measurer: PageMeasurer,
    settings: RedNoteSettings
  ): Element[] {
    let maxChars = Math.max(18, Math.floor(this.getMaxTextBlockChars(settings) / 2));

    while (maxChars >= 18) {
      const chunks = this.splitTextBlock(node, maxChars);
      if (chunks.every((chunk) => measurer.canFit(title, [chunk]))) {
        return chunks;
      }

      maxChars = Math.floor(maxChars * 0.65);
    }

    return this.splitPlainTextElement(node, 18);
  }

  private splitListFragmentToFit(
    node: Element,
    title: string,
    measurer: PageMeasurer,
    settings: RedNoteSettings
  ): Element[] {
    const item = Array.from(node.children).find((child) => child.tagName.toLowerCase() === 'li');
    if (!item) return [node];

    let maxChars = Math.max(18, Math.floor(this.getMaxTextBlockChars(settings) / 2));

    while (maxChars >= 18) {
      const itemChunks = this.splitTextBlock(item, maxChars);
      const listChunks = itemChunks.map((itemChunk, index) =>
        this.createListFragmentFromItem(node, itemChunk, index > 0)
      );

      if (listChunks.every((chunk) => measurer.canFit(title, [chunk]))) {
        return listChunks;
      }

      maxChars = Math.floor(maxChars * 0.65);
    }

    return [node];
  }

  private splitPreBlockToFit(node: Element, title: string, measurer: PageMeasurer): Element[] {
    const code = node.querySelector('code');
    const text = code?.textContent || node.textContent || '';
    const lines = text.split('\n');

    for (let maxLines = 4; maxLines >= 1; maxLines -= 1) {
      const chunks = this.createPreChunks(node, lines, maxLines);
      if (chunks.every((chunk) => measurer.canFit(title, [chunk]))) {
        return chunks;
      }
    }

    return [node];
  }

  private splitPlainTextElement(node: Element, maxChars: number): Element[] {
    const text = node.textContent || '';
    const chunks: Element[] = [];

    for (let index = 0; index < text.length; index += maxChars) {
      const clone = node.cloneNode(false) as Element;
      clone.textContent = text.slice(index, index + maxChars);
      chunks.push(clone);
    }

    return chunks.length > 0 ? chunks : [node];
  }

  private normalizePaginationEntries(
    entries: PaginationEntry[],
    settings: RedNoteSettings
  ): PaginationEntry[] {
    const maxChars = this.getMaxTextBlockChars(settings);

    return entries.flatMap((entry) => {
      if (!entry.node || entry.forceBreakBefore || entry.sectionTitle) {
        return [entry];
      }

      const node = entry.node;
      const tag = node.tagName.toLowerCase();
      if (['ul', 'ol'].includes(tag)) {
        return this.splitListBlock(node).map((splitNode) => ({ node: splitNode }));
      }

      if (tag === 'table') {
        return this.splitTableBlock(node).map((splitNode) => ({ node: splitNode }));
      }

      if (tag === 'pre') {
        return this.splitPreBlock(node, settings).map((splitNode) => ({ node: splitNode }));
      }

      if (!['p', 'blockquote'].includes(tag)) {
        return [entry];
      }

      const textLength = node.textContent?.trim().length || 0;
      if (textLength <= maxChars) {
        return [entry];
      }

      return this.splitTextBlock(node, maxChars).map((splitNode) => ({ node: splitNode }));
    });
  }

  private splitTableBlock(node: Element): Element[] {
    const rows = Array.from(node.querySelectorAll('tr')).filter(
      (row) => row.closest('table') === node
    );

    if (rows.length <= 2) {
      return [node];
    }

    const headerRows = rows.filter((row, index) => index === 0 && Boolean(row.querySelector('th')));
    const bodyRows = rows.slice(headerRows.length);

    if (bodyRows.length <= 1) {
      return [node];
    }

    return bodyRows.map((row) => {
      const table = node.cloneNode(false) as Element;
      table.classList.add('red-table-fragment');
      headerRows.forEach((headerRow) => table.appendChild(headerRow.cloneNode(true)));
      table.appendChild(row.cloneNode(true));
      return table;
    });
  }

  private splitPreBlock(node: Element, settings: RedNoteSettings): Element[] {
    const text = node.querySelector('code')?.textContent || node.textContent || '';
    const lines = text.split('\n');
    const maxLines = settings.fontSize >= 18 ? 6 : settings.fontSize <= 14 ? 10 : 8;

    if (lines.length <= maxLines) {
      return [node];
    }

    return this.createPreChunks(node, lines, maxLines);
  }

  private createPreChunks(node: Element, lines: string[], maxLines: number): Element[] {
    const code = node.querySelector('code');
    const chunks: Element[] = [];

    for (let index = 0; index < lines.length; index += maxLines) {
      const pre = node.cloneNode(false) as Element;
      pre.classList.add('red-pre-fragment');

      if (code) {
        const codeClone = code.cloneNode(false) as Element;
        codeClone.textContent = lines.slice(index, index + maxLines).join('\n');
        pre.appendChild(codeClone);
      } else {
        pre.textContent = lines.slice(index, index + maxLines).join('\n');
      }

      chunks.push(pre);
    }

    return chunks;
  }

  private splitListBlock(node: Element): Element[] {
    const items = Array.from(node.children).filter(
      (child) => child.tagName.toLowerCase() === 'li'
    );

    if (items.length <= 1) {
      return [node];
    }

    const tag = node.tagName.toLowerCase();
    const baseStart = Number.parseInt(node.getAttribute('start') || '1', 10);
    const startNumber = Number.isNaN(baseStart) ? 1 : baseStart;

    return items.map((item, index) => {
      const itemValue = Number.parseInt(item.getAttribute('value') || '', 10);
      const listStart = Number.isNaN(itemValue) ? startNumber + index : itemValue;
      return this.createListFragmentFromItem(node, item, false, tag === 'ol' ? listStart : undefined);
    });
  }

  private createListFragmentFromItem(
    sourceList: Element,
    item: Element,
    isContinuation: boolean,
    start?: number
  ): Element {
    const list = sourceList.cloneNode(false) as Element;
    const tag = sourceList.tagName.toLowerCase();
    list.classList.add('red-list-fragment');

    if (tag === 'ol') {
      const fallbackStart = Number.parseInt(sourceList.getAttribute('start') || '1', 10);
      list.setAttribute('start', String(start ?? (Number.isNaN(fallbackStart) ? 1 : fallbackStart)));
    }

    const itemClone = item.cloneNode(true) as Element;
    if (isContinuation) {
      itemClone.classList.add('red-list-continuation');
    }

    list.appendChild(itemClone);
    return list;
  }

  private getMaxTextBlockChars(settings: RedNoteSettings): number {
    if (settings.fontSize >= 18) return 105;
    if (settings.fontSize <= 14) return 170;
    return 130;
  }

  private splitTextBlock(node: Element, maxChars: number): Element[] {
    const textNodes = this.collectTextNodes(node);
    const fullText = node.textContent || '';
    if (textNodes.length === 0 || fullText.trim().length <= maxChars) {
      return [node];
    }

    return this.getTextChunkRanges(fullText, maxChars)
      .map(({ start, end }) => {
        const range = node.ownerDocument.createRange();
        const startPosition = this.resolveTextPosition(textNodes, start);
        const endPosition = this.resolveTextPosition(textNodes, end);
        const clone = node.cloneNode(false) as Element;

        range.setStart(startPosition.node, startPosition.offset);
        range.setEnd(endPosition.node, endPosition.offset);
        clone.appendChild(range.cloneContents());
        range.detach();

        return clone;
      })
      .filter((clone) => Boolean(clone.textContent?.trim()));
  }

  private collectTextNodes(node: Element): Text[] {
    const textNodes: Text[] = [];
    const walker = node.ownerDocument.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    let current = walker.nextNode();

    while (current) {
      textNodes.push(current as Text);
      current = walker.nextNode();
    }

    return textNodes;
  }

  private getTextChunkRanges(text: string, maxChars: number): Array<{ start: number; end: number }> {
    const ranges: Array<{ start: number; end: number }> = [];
    let start = 0;

    while (start < text.length) {
      while (start < text.length && /\s/.test(text[start])) {
        start += 1;
      }

      if (start >= text.length) break;

      const hardEnd = Math.min(start + maxChars, text.length);
      let end = hardEnd;

      if (hardEnd < text.length) {
        const slice = text.slice(start, hardEnd);
        const breakIndex = this.findNaturalBreakIndex(slice, maxChars);
        if (breakIndex > -1) {
          end = start + breakIndex + 1;
        }
      }

      ranges.push({ start, end });
      start = end;
    }

    return ranges;
  }

  private findNaturalBreakIndex(text: string, maxChars: number): number {
    const minBreakIndex = Math.floor(maxChars * 0.45);
    const breakChars = ['。', '！', '？', '；', ';', '.', '!', '?', '，', ',', '、', ' '];

    for (const breakChar of breakChars) {
      const index = text.lastIndexOf(breakChar);
      if (index >= minBreakIndex) {
        return index;
      }
    }

    return -1;
  }

  private resolveTextPosition(
    textNodes: Text[],
    absoluteOffset: number
  ): { node: Text; offset: number } {
    let cursor = 0;

    for (const node of textNodes) {
      const length = node.textContent?.length || 0;
      if (absoluteOffset <= cursor + length) {
        return { node, offset: Math.max(0, absoluteOffset - cursor) };
      }
      cursor += length;
    }

    const lastNode = textNodes[textNodes.length - 1];
    return { node: lastNode, offset: lastNode.textContent?.length || 0 };
  }

  private buildCardBody(nodes: Element[]): string {
    const doc = document.implementation.createHTMLDocument('');
    const container = doc.createElement('div');

    nodes.forEach((node) => {
      container.appendChild(node.cloneNode(true));
    });

    this.decorateContent(container);
    return container.innerHTML;
  }

  private decorateContent(container: HTMLElement): void {
    container.querySelectorAll('strong, em, mark').forEach((element) => {
      element.classList.add('red-emphasis');
    });

    container.querySelectorAll('a').forEach((element) => {
      element.classList.add('red-link');
    });

    container.querySelectorAll('table').forEach((element) => {
      element.classList.add('red-table');
    });

    container.querySelectorAll('hr').forEach((element) => {
      element.classList.add('red-hr');
    });

    container.querySelectorAll('del').forEach((element) => {
      element.classList.add('red-del');
    });

    container.querySelectorAll('.task-list-item').forEach((element) => {
      element.classList.add('red-task-list-item');
    });

    container.querySelectorAll('.footnote-ref, .footnote-backref').forEach((element) => {
      element.classList.add('red-footnote');
    });

    container.querySelectorAll('h1, h2, h3').forEach((heading) => {
      heading.classList.add('red-subheading');
    });

    container.querySelectorAll('pre').forEach((pre) => {
      pre.classList.add('red-pre');
      if (pre.querySelector('.red-code-dots')) return;

      const dots = container.ownerDocument.createElement('div');
      dots.className = 'red-code-dots';

      ['red', 'yellow', 'green'].forEach((color) => {
        const dot = container.ownerDocument.createElement('span');
        dot.className = `red-code-dot red-code-dot-${color}`;
        dots.appendChild(dot);
      });

      pre.insertBefore(dots, pre.firstChild);
    });

    container.querySelectorAll('blockquote').forEach((blockquote) => {
      blockquote.classList.add('red-blockquote');
      blockquote.querySelectorAll('p').forEach((paragraph) => {
        paragraph.classList.add('red-blockquote-p');
      });
    });

    container.querySelectorAll('img').forEach((img) => {
      img.classList.add('red-image');
      img.removeAttribute('width');
      img.removeAttribute('height');
      img.setAttribute('loading', 'eager');
    });
  }

  private renderPreview(
    cards: RedNoteCard[],
    settings: RedNoteSettings,
    template: RedNoteTemplatePreset
  ): string {
    const doc = document.implementation.createHTMLDocument('');
    const wrapper = doc.createElement('div');
    wrapper.className = 'red-preview-wrapper';

    const previewContainer = doc.createElement('div');
    previewContainer.className = 'red-preview-container';

    const copyButton = doc.createElement('button');
    copyButton.className = 'red-copy-button';
    copyButton.type = 'button';
    copyButton.title = '复制当前图片';
    copyButton.textContent = '复制';

    const imagePreview = doc.createElement('div');
    imagePreview.className = 'red-image-preview';
    imagePreview.setAttribute('data-template-id', template.id);
    imagePreview.setAttribute('data-rednote-layout', settings.layoutMode);
    imagePreview.setAttribute('style', this.buildPreviewStyle(settings, template));

    const header = doc.createElement('div');
    header.className = 'red-preview-header';
    header.innerHTML = this.renderHeader(settings);

    const content = doc.createElement('div');
    content.className = 'red-preview-content';

    const contentWrapper = doc.createElement('div');
    contentWrapper.className = 'red-content-wrapper';

    const contentContainer = doc.createElement('div');
    contentContainer.className = 'red-content-container';

    cards.forEach((card, index) => {
      const section = doc.createElement('section');
      section.className = 'red-content-section';
      section.setAttribute('data-index', card.kind === 'cover' ? 'cover' : String(index));

      if (card.kind === 'cover') {
        section.classList.add('jacky-cover-section');
        section.innerHTML = this.renderCoverSection(card, settings);
      } else {
        section.innerHTML = this.renderContentSection(card, settings);
      }

      contentContainer.appendChild(section);
    });

    contentWrapper.appendChild(contentContainer);
    content.appendChild(contentWrapper);

    const footer = doc.createElement('div');
    footer.className = 'red-preview-footer';
    footer.innerHTML = this.renderFooter(settings);

    imagePreview.appendChild(header);
    imagePreview.appendChild(content);
    imagePreview.appendChild(footer);

    previewContainer.appendChild(copyButton);
    previewContainer.appendChild(imagePreview);

    const nav = doc.createElement('div');
    nav.className = 'red-nav-container';
    nav.innerHTML = `
      <button class="red-nav-button" data-rednote-nav="prev" type="button">←</button>
      <span class="red-page-indicator">1/${cards.length}</span>
      <button class="red-nav-button" data-rednote-nav="next" type="button">→</button>
    `;

    wrapper.appendChild(previewContainer);
    wrapper.appendChild(nav);

    return wrapper.outerHTML;
  }

  private renderHeader(settings: RedNoteSettings): string {
    const timeHtml = settings.showTime
      ? `<div class="red-post-time">${this.escapeHtml(this.formatPostTime(settings))}</div>`
      : '';

    return `
      <div class="red-user-info">
        <div class="red-user-left">
          <div class="red-user-avatar">${this.renderAvatar(settings)}</div>
          <div class="red-user-meta">
            <div class="red-user-name-container">
              <div class="red-user-name">${this.escapeHtml(settings.userName)}</div>
              <span class="red-verified-icon">
                <img class="red-verified-icon-image" src="${VERIFIED_BADGE_IMAGE_SRC}" alt="认证">
              </span>
            </div>
            <div class="red-user-id">${this.escapeHtml(settings.userId)}</div>
          </div>
        </div>
        <div class="red-user-right">
          <div class="red-preview-badge">${this.escapeHtml(settings.notesTitle)}</div>
          ${timeHtml}
        </div>
      </div>
    `;
  }

  private renderFooter(settings: RedNoteSettings): string {
    return `
      <div class="red-footer-text">${this.escapeHtml(settings.footerLeftText)}</div>
      <div class="red-footer-separator">|</div>
      <div class="red-footer-text">${this.escapeHtml(settings.footerRightText)}</div>
    `;
  }

  private renderAvatar(settings: RedNoteSettings): string {
    if (settings.userAvatar) {
      return `<img class="red-avatar-image" src="${settings.userAvatar}" alt="${this.escapeHtml(settings.userName)}">`;
    }

    const initial = settings.userName.trim().slice(0, 1) || 'J';
    return `<div class="red-avatar-placeholder">${this.escapeHtml(initial)}</div>`;
  }

  private renderCoverSection(card: RedNoteCard, settings: RedNoteSettings): string {
    const portrait = card.coverImageSrc
      ? `<div class="jacky-cover-portrait"><img src="${card.coverImageSrc}" alt="${this.escapeHtml(card.title)}"></div>`
      : `
        <div class="jacky-cover-portrait">
          <div class="jacky-cover-upload-placeholder">
            <div class="jacky-cover-upload-icon">✦</div>
            <div class="jacky-cover-upload-text">${this.escapeHtml(settings.brandTagline)}</div>
          </div>
        </div>
      `;

    return `
      <div class="jacky-cover-container">
        ${portrait}
        <div class="jacky-cover-content">
          <div class="jacky-cover-badge">${this.escapeHtml(settings.notesTitle)}</div>
          <h1 class="jacky-cover-title">${this.escapeHtml(card.title)}</h1>
          <div class="jacky-cover-summary-container">
            <div class="jacky-cover-summary-line"></div>
            <p class="jacky-cover-summary-text">${this.escapeHtml(card.summary || '')}</p>
          </div>
        </div>
      </div>
    `;
  }

  private renderContentSection(card: RedNoteCard, settings: RedNoteSettings): string {
    if (settings.layoutMode === 'obsidian-flow') {
      return `
        <div class="mdflow-rednote-flow-shell">
          <div class="mdflow-rednote-flow-body">${card.bodyHtml || ''}</div>
        </div>
      `;
    }

    return `
      <div class="mdflow-rednote-section-shell">
        <h2 class="mdflow-rednote-section-title">${this.escapeHtml(card.title)}</h2>
        <div class="mdflow-rednote-section-body">${card.bodyHtml || ''}</div>
      </div>
    `;
  }

  private buildPreviewStyle(settings: RedNoteSettings, template: RedNoteTemplatePreset): string {
    const variables: Record<string, string> = {
      ...template.variables,
      '--rn-font-family': settings.fontFamily,
      '--rn-base-font-size': `${settings.fontSize}px`,
      '--rn-title-size': `${Math.round(settings.fontSize * 1.76)}px`,
      '--rn-kicker-size': `${Math.max(12, settings.fontSize - 3)}px`,
      '--rn-meta-size': `${Math.max(12, settings.fontSize - 2)}px`,
      '--rn-footer-size': `${Math.max(11, settings.fontSize - 3)}px`,
      '--rn-cover-title-size': `${Math.round(settings.fontSize * 2.15)}px`,
      '--rn-cover-summary-size': `${Math.max(15, settings.fontSize)}px`,
    };

    return Object.entries(variables)
      .map(([key, value]) => `${key}: ${value}`)
      .join('; ');
  }

  private formatPostTime(settings: RedNoteSettings): string {
    try {
      return new Intl.DateTimeFormat(settings.timeFormat, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());
    } catch (error) {
      return new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());
    }
  }

  private updatePreviewState(root: ParentNode, activeIndex: number): void {
    const sections = Array.from(root.querySelectorAll('.red-content-section')) as HTMLElement[];

    sections.forEach((section, index) => {
      const isActive = index === activeIndex;
      section.classList.toggle('red-section-active', isActive);
      section.classList.toggle('red-section-visible', isActive);
      section.classList.toggle('red-section-hidden', !isActive);
    });
  }

  async downloadSinglePage(imagePreview: HTMLElement, title: string, pageNum: string): Promise<void> {
    const blob = await this.capturePreview(imagePreview);
    const fileName = `${sanitizeFileName(title)}-第${pageNum}页.png`;
    this.downloadBlob(blob, fileName);
  }

  private async capturePreview(imagePreview: HTMLElement): Promise<Blob> {
    await this.waitForImages(imagePreview);
    await this.rasterizeImagesForCapture(imagePreview);

    const originalBackground = imagePreview.style.background;
    const originalBackgroundColor = imagePreview.style.backgroundColor;
    const frameBackground = this.getFrameBackgroundForCapture(imagePreview);
    const fallbackBackgroundColor = this.getFallbackBackgroundColor(frameBackground);

    imagePreview.style.background = frameBackground;
    imagePreview.style.backgroundColor = fallbackBackgroundColor;

    let blob: Blob | null = null;
    try {
      blob = await toBlob(imagePreview, {
        cacheBust: true,
        quality: 1,
        pixelRatio: 4,
        skipFonts: false,
        imagePlaceholder: IMAGE_PLACEHOLDER,
        backgroundColor: fallbackBackgroundColor,
      });
    } finally {
      imagePreview.style.background = originalBackground;
      imagePreview.style.backgroundColor = originalBackgroundColor;
    }

    if (!blob) {
      throw new Error('生成图片失败');
    }

    return blob;
  }

  private getFrameBackgroundForCapture(imagePreview: HTMLElement): string {
    const inlineFrameBg = imagePreview.style.getPropertyValue('--rn-frame-bg').trim();
    if (inlineFrameBg) return inlineFrameBg;

    const computedStyle = window.getComputedStyle(imagePreview);
    const computedBackground = computedStyle.backgroundImage && computedStyle.backgroundImage !== 'none'
      ? computedStyle.backgroundImage
      : computedStyle.backgroundColor;

    return computedBackground || '#ffffff';
  }

  private getFallbackBackgroundColor(background: string): string {
    const normalized = background.trim();
    if (!normalized) return '#ffffff';
    if (normalized.startsWith('#') || normalized.startsWith('rgb')) return normalized;

    const firstHex = normalized.match(/#[0-9a-fA-F]{3,8}/)?.[0];
    if (firstHex) return firstHex;

    const firstRgb = normalized.match(/rgba?\([^)]+\)/)?.[0];
    if (firstRgb) return firstRgb;

    return '#ffffff';
  }

  private async waitForImages(root: HTMLElement): Promise<void> {
    const images = Array.from(root.querySelectorAll('img'));

    await Promise.all(
      images.map(async (image) => {
        if (image.complete && image.naturalWidth > 0) {
          if (typeof image.decode === 'function') {
            try {
              await image.decode();
            } catch (error) {
              // Ignore decode failures and allow fallback handling later.
            }
          }
          return;
        }

        return new Promise<void>((resolve) => {
          image.onload = () => resolve();
          image.onerror = () => resolve();
        });
      })
    );
  }

  private async rasterizeImagesForCapture(root: HTMLElement): Promise<void> {
    const images = Array.from(root.querySelectorAll('img'));

    await Promise.all(
      images.map(async (image) => {
        const src = image.currentSrc || image.getAttribute('src') || '';
        if (!src || src.startsWith('data:image/png')) {
          return;
        }

        const width = image.naturalWidth;
        const height = image.naturalHeight;
        if (!width || !height) {
          return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext('2d');
        if (!context) {
          return;
        }

        try {
          context.drawImage(image, 0, 0, width, height);
          image.setAttribute('src', canvas.toDataURL('image/png'));
          image.removeAttribute('srcset');
        } catch (error) {
          console.warn('MDFlow: Failed to rasterize image for capture', src, error);
        }
      })
    );
  }

  private downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
