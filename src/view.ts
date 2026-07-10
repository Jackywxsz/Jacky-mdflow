import { ItemView, MarkdownView, Notice, setIcon, TFile, WorkspaceLeaf } from 'obsidian';
import { MarkdownConverter } from './converter';
import { ThemeManager } from './themes/theme-manager';
import { ImageResolver } from './images/image-resolver';
import { WeChatExporter } from './exporters/wechat-exporter';
import { XArticlesExporter } from './exporters/x-exporter';
import { RedNoteExporter } from './exporters/rednote-exporter';
import {
  PlatformExporter,
  PlatformId,
  PlatformRenderContext,
  PreparedPlatformContent,
} from './exporters/types';
import { RedNoteSettingsManager } from './rednote/settings-manager';
import { RedNoteAboutModal } from './rednote/about-modal';
import { getRedNoteTemplateOptions } from './rednote/template-presets';
import { clampRedNoteFontSize, REDNOTE_LAYOUT_MODE_OPTIONS, RedNoteAssetField } from './rednote/types';

export const VIEW_TYPE_MDFLOW = 'mdflow-publisher-view';

export class MDFlowView extends ItemView {
  private converter: MarkdownConverter;
  private themeManager: ThemeManager;
  private imageResolver: ImageResolver;
  private exporters: Map<PlatformId, PlatformExporter>;
  private redNoteExporter: RedNoteExporter;

  private currentPlatform: PlatformId = 'wechat';
  private renderedHtml = '';
  private preparedContent: PreparedPlatformContent | null = null;
  private activeFile: TFile | null = null;

  private themeSelector!: HTMLElement;
  private previewEl!: HTMLElement;
  private exportBtnContainerEl!: HTMLElement;
  private exportBtnEl!: HTMLButtonElement;
  private redNoteControlsEl!: HTMLElement;
  private redNoteBottomBarEl!: HTMLElement;
  private globalBottomBarEl!: HTMLElement;
  private redNoteLayoutModeSelectEl!: HTMLSelectElement;
  private redNoteTemplateSelectEl!: HTMLSelectElement;
  private redNoteFontSelectEl!: HTMLSelectElement;
  private redNoteFontSizeInputEl!: HTMLInputElement;
  private redNoteCoverUploadBtnEl!: HTMLButtonElement;
  private redNoteDownloadBtnEl!: HTMLButtonElement;
  private redNoteExportAllBtnEl!: HTMLButtonElement;
  private redNoteGuidePopoverEl: HTMLElement | null = null;
  private previewRunId = 0;
  private editorPreviewDebounce: number | null = null;
  private activeLeafPreviewDebounce: number | null = null;

  constructor(
    leaf: WorkspaceLeaf,
    private redNoteSettings: RedNoteSettingsManager,
    private openSettingsTab: () => void
  ) {
    super(leaf);
    this.converter = new MarkdownConverter(this.app);
    this.themeManager = new ThemeManager();
    this.imageResolver = new ImageResolver(this.app);
    this.redNoteExporter = new RedNoteExporter(this.imageResolver, this.redNoteSettings);

    this.exporters = new Map<PlatformId, PlatformExporter>([
      ['wechat', new WeChatExporter(this.themeManager, this.imageResolver)],
      ['x', new XArticlesExporter()],
      ['rednote', this.redNoteExporter],
    ]);
  }

  getViewType(): string {
    return VIEW_TYPE_MDFLOW;
  }

  getDisplayText(): string {
    return 'Jacky-mdflow';
  }

  getIcon(): string {
    return 'share-2';
  }

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass('mdflow-view');

    this.renderUI(container);
    this.registerEvents();
    this.syncRedNoteControls();
    await this.updatePreview();
  }

  private renderUI(container: Element): void {
    const toolbar = container.createDiv({ cls: 'mdflow-toolbar' });

    const tabs = toolbar.createDiv({ cls: 'mdflow-tabs' });
    this.createTab(tabs, 'wechat', '📱 微信公众号');
    this.createTab(tabs, 'x', '𝕏 X Articles');
    this.createTab(tabs, 'rednote', '📕 小红书');

    this.themeSelector = toolbar.createDiv({ cls: 'mdflow-theme-selector' });
    this.themeSelector.createSpan({ text: '主题: ' });
    const themeSelect = this.themeSelector.createEl('select', { cls: 'mdflow-theme-select' });

    this.themeManager.getThemeIds().forEach((id) => {
      const theme = this.themeManager.getTheme(id);
      if (!theme) return;

      const option = themeSelect.createEl('option', { value: id, text: theme.name });
      if (id === this.themeManager.getCurrentThemeId()) {
        option.selected = true;
      }
    });

    themeSelect.addEventListener('change', () => {
      this.themeManager.setCurrentTheme(themeSelect.value);
      void this.refreshPreview();
    });

    this.redNoteControlsEl = toolbar.createDiv({ cls: 'mdflow-rednote-controls' });
    this.renderRedNoteControls(this.redNoteControlsEl);

    const previewContainer = container.createDiv({ cls: 'mdflow-preview-container' });
    this.previewEl = previewContainer.createDiv({ cls: 'mdflow-preview' });
    this.previewEl.setAttribute('data-platform', this.currentPlatform);

    this.exportBtnContainerEl = container.createDiv({ cls: 'mdflow-export-btn' });
    this.exportBtnEl = this.exportBtnContainerEl.createEl('button', {
      text: '复制到剪贴板',
      cls: 'mod-cta',
    });
    this.exportBtnEl.addEventListener('click', () => void this.handleExport());

    this.redNoteBottomBarEl = container.createDiv({ cls: 'mdflow-rednote-bottom-bar' });
    this.renderRedNoteBottomBar(this.redNoteBottomBarEl);

    this.globalBottomBarEl = container.createDiv({ cls: 'mdflow-global-bottom-bar' });
    this.renderGlobalBottomBar(this.globalBottomBarEl);

    this.updateToolbarForPlatform();
  }

  private renderRedNoteControls(container: HTMLElement): void {
    container.empty();

    const controlsRow = container.createDiv({ cls: 'mdflow-rednote-controls-row' });

    this.redNoteLayoutModeSelectEl = this.createControlSelect(
      controlsRow,
      '排版',
      REDNOTE_LAYOUT_MODE_OPTIONS,
      async (value) => {
        await this.redNoteSettings.update({ layoutMode: value === 'obsidian-flow' ? value : 'heading-sections' });
      }
    );

    this.redNoteTemplateSelectEl = this.createControlSelect(
      controlsRow,
      '模板',
      getRedNoteTemplateOptions(),
      async (value) => {
        await this.redNoteSettings.update({ templateId: value });
      }
    );

    this.redNoteFontSelectEl = this.createControlSelect(
      controlsRow,
      '字体',
      this.redNoteSettings.getFontOptions().map((font) => ({
        label: font.label,
        value: font.value,
      })),
      async (value) => {
        await this.redNoteSettings.update({ fontFamily: value });
      }
    );

    this.redNoteFontSizeInputEl = this.createControlNumber(controlsRow, '字号', async (value) => {
      await this.redNoteSettings.update({
        fontSize: clampRedNoteFontSize(Number.parseInt(value, 10)),
      });
    });

    const actionsRow = container.createDiv({ cls: 'mdflow-rednote-actions-row' });
    this.createCompactAction(actionsRow, '上传头像', async () => {
      await this.handleRedNoteImageUpload('userAvatar');
    });
    this.redNoteCoverUploadBtnEl = this.createCompactAction(actionsRow, '上传封面', async () => {
      await this.handleRedNoteImageUpload('coverImage');
    });
    this.createCompactAction(actionsRow, '更多设置', () => {
      this.openSettingsTab();
    });
  }

  private renderRedNoteBottomBar(container: HTMLElement): void {
    container.empty();

    const rightGroup = container.createDiv({ cls: 'mdflow-rn-bar-right' });

    const downloadBtn = rightGroup.createEl('button', {
      cls: 'mdflow-rn-bar-primary-btn',
      type: 'button',
      text: '下载当前页',
    });
    this.redNoteDownloadBtnEl = downloadBtn;
    downloadBtn.addEventListener('click', () => void this.handleDownloadCurrentPage());

    const exportAllBtn = rightGroup.createEl('button', {
      cls: 'mdflow-rn-bar-primary-btn',
      type: 'button',
      text: '导出全部页',
    });
    this.redNoteExportAllBtnEl = exportAllBtn;
    exportAllBtn.addEventListener('click', () => void this.handleExport());
  }

  private renderGlobalBottomBar(container: HTMLElement): void {
    container.empty();

    const leftGroup = container.createDiv({ cls: 'mdflow-rn-bar-left' });

    const guideBtn = leftGroup.createEl('button', {
      cls: 'mdflow-rn-bar-icon-btn',
      type: 'button',
    });
    guideBtn.setAttribute('aria-label', '使用指南');
    setIcon(guideBtn, 'circle-help');
    guideBtn.addEventListener('click', (e) => this.toggleUsageGuide(e));

    const aboutBtn = leftGroup.createEl('button', {
      cls: 'mdflow-rn-bar-about-btn',
      type: 'button',
      text: '关于作者',
    });
    aboutBtn.addEventListener('click', () => {
      new RedNoteAboutModal(this.app).open();
    });
  }

  private toggleUsageGuide(e: MouseEvent): void {
    if (this.redNoteGuidePopoverEl) {
      this.redNoteGuidePopoverEl.remove();
      this.redNoteGuidePopoverEl = null;
      return;
    }

    const popover = createDiv({ cls: 'mdflow-rn-guide-popover' });
    popover.createDiv({ cls: 'mdflow-rn-guide-title', text: '使用指南' });
    const guideContent = popover.createDiv({ cls: 'mdflow-rn-guide-content' });
    const guideItems: Array<[string, string]> = [
      ['核心用法', '用二级标题(##)标记分节，内容会自动排满页面'],
      ['排版模式', '切到正文卡片流后，二级标题会作为正文小标题，不再强制分页'],
      ['内容分页', '需要固定换页时使用 ---，否则会根据文字、图片和代码块自动分页'],
      ['首图制作', '单独调整首节字号至 20-24px，使用【下载当前页】导出'],
      ['长文优化', '内容较多的章节可调小字号至 14-16px 后单独导出'],
      ['批量操作', '保持统一字号时，用【导出全部页】批量生成'],
      ['模板切换', '顶部选择器可切换不同视觉风格'],
    ];

    guideItems.forEach(([title, description], index) => {
      const item = guideContent.createDiv({ cls: 'mdflow-rn-guide-item' });
      item.appendText(`${index + 1}. `);
      item.createEl('b', { text: title });
      item.appendText(`：${description}`);
    });

    const bar = this.globalBottomBarEl;
    const barRect = bar.getBoundingClientRect();
    popover.setCssProps({
      position: 'fixed',
      bottom: `${window.innerHeight - barRect.top + 8}px`,
      left: `${barRect.left + 12}px`,
      width: `${barRect.width - 24}px`,
    });
    const doc = this.containerEl.ownerDocument;
    doc.body.appendChild(popover);
    this.redNoteGuidePopoverEl = popover;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!popover.contains(event.target as Node) && event.target !== (e.target as Node)) {
        popover.remove();
        this.redNoteGuidePopoverEl = null;
        doc.removeEventListener('click', closeOnOutsideClick);
      }
    };
    window.setTimeout(() => doc.addEventListener('click', closeOnOutsideClick), 0);
  }

  private createControlSelect(
    container: HTMLElement,
    label: string,
    options: Array<{ label: string; value: string }>,
    onChange: (value: string) => Promise<void>
  ): HTMLSelectElement {
    const control = container.createDiv({ cls: 'mdflow-rednote-control' });
    control.createSpan({ cls: 'mdflow-rednote-control-label', text: label });
    const select = control.createEl('select', { cls: 'mdflow-rednote-control-select' });

    options.forEach((option) => {
      select.createEl('option', { value: option.value, text: option.label });
    });

    select.addEventListener('change', () => void onChange(select.value));
    return select;
  }

  private createControlNumber(
    container: HTMLElement,
    label: string,
    onChange: (value: string) => Promise<void>
  ): HTMLInputElement {
    const control = container.createDiv({ cls: 'mdflow-rednote-control' });
    control.createSpan({ cls: 'mdflow-rednote-control-label', text: label });
    const input = control.createEl('input', {
      cls: 'mdflow-rednote-control-input',
      type: 'number',
    });
    input.min = '12';
    input.max = '28';
    input.step = '1';

    let debounceTimer: number | null = null;
    const debouncedOnChange = () => {
      if (debounceTimer) window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(() => {
        const parsed = Number.parseInt(input.value, 10);
        if (!Number.isNaN(parsed) && parsed >= 12 && parsed <= 28) {
          void onChange(input.value);
        }
      }, 160);
    };

    input.addEventListener('change', () => {
      if (debounceTimer) window.clearTimeout(debounceTimer);
      const parsed = Number.parseInt(input.value, 10);
      if (!Number.isNaN(parsed)) {
        void onChange(input.value);
      }
    });
    input.addEventListener('input', debouncedOnChange);
    return input;
  }

  private createCompactAction(
    container: HTMLElement,
    label: string,
    onClick: () => void | Promise<void>
  ): HTMLButtonElement {
    const button = container.createEl('button', {
      cls: 'mdflow-rednote-compact-action',
      text: label,
      type: 'button',
    });
    button.addEventListener('click', () => void onClick());
    return button;
  }

  private createTab(container: Element, platform: PlatformId, label: string): void {
    const tab = container.createDiv({ cls: 'mdflow-tab' });
    if (platform === this.currentPlatform) tab.addClass('active');

    tab.setText(label);

    tab.addEventListener('click', () => {
      this.currentPlatform = platform;
      container.querySelectorAll('.mdflow-tab').forEach((currentTab) => currentTab.removeClass('active'));
      tab.addClass('active');
      this.updateToolbarForPlatform();
      void this.refreshPreview();
    });
  }

  private updateToolbarForPlatform(): void {
    this.previewEl?.setAttribute('data-platform', this.currentPlatform);
    const isWeChat = this.currentPlatform === 'wechat';
    const isX = this.currentPlatform === 'x';
    const isRedNote = this.currentPlatform === 'rednote';

    this.themeSelector.toggleClass('mdflow-is-hidden', !isWeChat);
    this.redNoteControlsEl.toggleClass('mdflow-is-hidden', !isRedNote);
    this.exportBtnContainerEl.toggleClass('mdflow-is-hidden', isRedNote);
    this.redNoteBottomBarEl.toggleClass('mdflow-is-hidden', !isRedNote);
    this.exportBtnEl.textContent = isX ? '复制 X Articles 格式' : '复制到剪贴板';

    if (isRedNote) this.syncRedNoteControls();
  }

  private registerEvents(): void {
    this.registerEvent(
      this.app.workspace.on('file-open', (file) => {
        this.cancelEditorPreviewDebounce();

        if (file && file.extension === 'md') {
          void this.updatePreviewForOpenedFile(file);
          return;
        }

        this.previewRunId += 1;
        this.activeFile = null;
        this.renderedHtml = '';
        this.showPlaceholder();
      })
    );

    this.registerEvent(
      this.app.workspace.on('editor-change', (editor, info) => {
        const file = info.file;
        if (!file || file.extension !== 'md') {
          return;
        }

        const activeFile = this.app.workspace.getActiveFile();
        if (activeFile && activeFile.path !== file.path) {
          return;
        }

        this.activeFile = file;

        this.cancelEditorPreviewDebounce();

        const liveMarkdown = editor.getValue();
        this.editorPreviewDebounce = window.setTimeout(() => {
          this.editorPreviewDebounce = null;
          void this.updatePreview(liveMarkdown, file);
        }, this.currentPlatform === 'rednote' ? 80 : 120);
      })
    );

    this.registerEvent(
      this.app.workspace.on('active-leaf-change', () => {
        const file = this.app.workspace.getActiveFile();
        if (!file || file.extension !== 'md' || file.path === this.activeFile?.path) {
          return;
        }

        this.cancelActiveLeafPreviewDebounce();
        this.activeLeafPreviewDebounce = window.setTimeout(() => {
          this.activeLeafPreviewDebounce = null;
          void this.updatePreviewForOpenedFile(file);
        }, 50);
      })
    );

    this.registerEvent(
      this.redNoteSettings.on('change', () => {
        this.syncRedNoteControls();

        if (this.currentPlatform === 'rednote' && this.activeFile) {
          void this.refreshPreview();
        }
      })
    );
  }

  private syncRedNoteControls(): void {
    const settings = this.redNoteSettings.getSettings();
    const template = this.redNoteSettings.getTemplate(settings.templateId);

    this.redNoteLayoutModeSelectEl.value = settings.layoutMode;
    this.redNoteTemplateSelectEl.value = settings.templateId;
    this.redNoteFontSizeInputEl.value = String(settings.fontSize);
    this.redNoteCoverUploadBtnEl.toggleClass('mdflow-is-hidden', !template.showCover);

    const fontValue = settings.fontFamily;
    const hasFontOption = Array.from(this.redNoteFontSelectEl.options).some(
      (option) => option.value === fontValue
    );

    if (!hasFontOption) {
      const option = createEl('option');
      option.value = fontValue;
      option.text = '当前自定义字体';
      this.redNoteFontSelectEl.appendChild(option);
    }

    this.redNoteFontSelectEl.value = fontValue;
  }

  private async handleRedNoteImageUpload(field: RedNoteAssetField): Promise<void> {
    const input = createEl('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === 'string' ? reader.result : '';
        if (!result) return;

        if (field === 'userAvatar') {
          void this.redNoteSettings.update({ userAvatar: result }).then(() => {
            new Notice('头像已更新');
          });
          return;
        }

        if (field === 'coverImage') {
          void this.redNoteSettings.update({ coverImage: result }).then(() => {
            new Notice('封面已更新');
          });
          return;
        }

        void this.redNoteSettings.update({ [field]: result }).then(() => {
          new Notice('图片已更新');
        });
      };
      reader.readAsDataURL(file);
    });

    input.click();
  }

  private async updatePreviewForOpenedFile(file: TFile): Promise<void> {
    this.previewRunId += 1;
    this.activeFile = file;
    this.renderedHtml = '';
    this.showLoading('正在生成排版预览...');
    await this.updatePreview(undefined, file, false);
  }

  private async updatePreview(
    markdownOverride?: string,
    fileOverride?: TFile,
    preferLiveMarkdown = true
  ): Promise<void> {
    const activeFile = fileOverride || this.app.workspace.getActiveFile();
    if (!activeFile || activeFile.extension !== 'md') {
      this.activeFile = null;
      this.renderedHtml = '';
      this.showPlaceholder();
      return;
    }

    const runId = ++this.previewRunId;
    this.activeFile = activeFile;

    try {
      const markdown = markdownOverride ?? await this.readCurrentMarkdown(activeFile, preferLiveMarkdown);
      if (runId !== this.previewRunId) return;

      const renderedHtml = await this.converter.convertToHtml(markdown, activeFile);
      if (runId !== this.previewRunId) return;

      this.renderedHtml = renderedHtml;
      await this.refreshPreview(runId);
    } catch (error) {
      console.error('MDFlow: Preview update failed', error);
      new Notice('预览更新失败');
    }
  }

  private async refreshPreview(runId = ++this.previewRunId): Promise<void> {
    if (!this.renderedHtml || !this.activeFile) {
      this.showPlaceholder();
      return;
    }

    const exporter = this.exporters.get(this.currentPlatform);
    if (!exporter) return;

    const context = this.createContext();
    const preparedContent = await exporter.prepare(this.renderedHtml, context);
    if (runId !== this.previewRunId) return;

    this.preparedContent = preparedContent;
    this.replacePreviewHtml(preparedContent.previewHtml);
    await exporter.mountPreview?.(this.previewEl, preparedContent, context);
  }

  private showPlaceholder(): void {
    this.preparedContent = null;
    this.showPreviewMessage('打开一个 Markdown 文件开始预览');
  }

  private showLoading(message: string): void {
    this.preparedContent = null;
    this.showPreviewMessage(message);
  }

  private showPreviewMessage(message: string): void {
    this.previewEl.empty();
    this.previewEl.createDiv({ cls: 'mdflow-placeholder', text: message });
  }

  private replacePreviewHtml(html: string): void {
    const parsed = new DOMParser().parseFromString(html, 'text/html');
    parsed.querySelectorAll('script, iframe, object, embed').forEach((element) => element.remove());
    parsed.querySelectorAll('*').forEach((element) => {
      Array.from(element.attributes).forEach((attribute) => {
        const name = attribute.name.toLowerCase();
        const value = attribute.value.trim().toLowerCase();
        if (name.startsWith('on') || ((name === 'href' || name === 'src') && value.startsWith('javascript:'))) {
          element.removeAttribute(attribute.name);
        }
      });
    });

    this.previewEl.empty();
    Array.from(parsed.body.childNodes).forEach((node) => {
      this.previewEl.appendChild(this.previewEl.ownerDocument.importNode(node, true));
    });
  }

  private async handleDownloadCurrentPage(): Promise<void> {
    if (!this.renderedHtml || !this.activeFile) {
      new Notice('没有内容可导出');
      return;
    }

    const imagePreview = this.previewEl.querySelector<HTMLElement>('.red-image-preview');
    if (!imagePreview) {
      new Notice('没有预览内容');
      return;
    }

    try {
      this.setButtonLoading(this.redNoteDownloadBtnEl, '下载中...');
      const title = this.activeFile.basename;
      const indicator = this.previewEl.querySelector('.red-page-indicator');
      const pageNum = indicator?.textContent?.split('/')[0] || '1';
      await this.redNoteExporter.downloadSinglePage(imagePreview, title, pageNum);
      new Notice('当前页已下载');
    } catch (error) {
      console.error('Download current page failed:', error);
      new Notice('下载失败');
    } finally {
      this.resetButtonLoading(this.redNoteDownloadBtnEl, '下载当前页');
    }
  }

  private async handleExport(): Promise<void> {
    if (!this.renderedHtml || !this.activeFile) {
      new Notice('没有内容可导出');
      return;
    }

    const exporter = this.exporters.get(this.currentPlatform);
    if (!exporter) {
      new Notice('该平台暂未实现');
      return;
    }

    if (!this.preparedContent) {
      await this.refreshPreview();
    }

    if (!this.preparedContent) {
      new Notice('没有内容可导出');
      return;
    }

    const actionButton =
      this.currentPlatform === 'rednote' ? this.redNoteExportAllBtnEl : this.exportBtnEl;
    const pendingText =
      this.currentPlatform === 'rednote' ? '导出中...' : '处理中...';
    const idleText =
      this.currentPlatform === 'rednote' ? '导出全部页' : this.exportBtnEl.textContent || '导出';

    try {
      this.setButtonLoading(actionButton, pendingText);
      if (this.currentPlatform === 'rednote') {
        new Notice('正在导出全部页，请稍候');
      }

      const result = await exporter.export(this.preparedContent, this.createContext());
      if (result.success) {
        new Notice(result.message);
      } else {
        new Notice(result.message, 5000);
      }
    } catch (error) {
      console.error('Export failed:', error);
      new Notice('导出失败', 5000);
    } finally {
      this.resetButtonLoading(actionButton, idleText);
    }
  }

  private setButtonLoading(button: HTMLButtonElement | undefined, text: string): void {
    if (!button) return;
    button.disabled = true;
    button.textContent = text;
  }

  private resetButtonLoading(button: HTMLButtonElement | undefined, text: string): void {
    if (!button) return;
    button.disabled = false;
    button.textContent = text;
  }

  private createContext(): PlatformRenderContext {
    if (!this.activeFile) {
      throw new Error('No active file');
    }

    return {
      app: this.app,
      sourceFile: this.activeFile,
      title: this.activeFile.basename,
    };
  }

  private async readCurrentMarkdown(file: TFile, preferLiveMarkdown = true): Promise<string> {
    const liveMarkdown = preferLiveMarkdown ? this.getLiveMarkdownContent(file) : null;
    if (liveMarkdown !== null) {
      return liveMarkdown;
    }

    return this.app.vault.read(file);
  }

  private getLiveMarkdownContent(file: TFile): string | null {
    const activeMarkdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (activeMarkdownView?.file?.path === file.path) {
      return activeMarkdownView.editor.getValue();
    }

    const markdownLeaves = this.app.workspace.getLeavesOfType('markdown');
    for (const leaf of markdownLeaves) {
      const view = leaf.view;
      if (view instanceof MarkdownView && view.file?.path === file.path) {
        return view.editor.getValue();
      }
    }

    return null;
  }

  private cancelEditorPreviewDebounce(): void {
    if (this.editorPreviewDebounce !== null) {
      window.clearTimeout(this.editorPreviewDebounce);
      this.editorPreviewDebounce = null;
    }
  }

  private cancelActiveLeafPreviewDebounce(): void {
    if (this.activeLeafPreviewDebounce !== null) {
      window.clearTimeout(this.activeLeafPreviewDebounce);
      this.activeLeafPreviewDebounce = null;
    }
  }

  async onClose(): Promise<void> {
    this.cancelEditorPreviewDebounce();
    this.cancelActiveLeafPreviewDebounce();
    this.converter.dispose();
  }
}
