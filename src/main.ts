import { Plugin } from 'obsidian';
import { MDFlowView, VIEW_TYPE_MDFLOW } from './view';
import { RedNoteSettingsManager } from './rednote/settings-manager';
import { MDFlowSettingTab } from './setting-tab';

export default class MDFlowPlugin extends Plugin {
  redNoteSettings!: RedNoteSettingsManager;

  async onload() {
    this.redNoteSettings = new RedNoteSettingsManager(this);
    await this.redNoteSettings.load();

    this.registerView(
      VIEW_TYPE_MDFLOW,
      (leaf) => new MDFlowView(
        leaf,
        this.redNoteSettings,
        () => this.openSettingsTab()
      )
    );

    this.addRibbonIcon('share-2', 'Jacky-mdflow', () => {
      void this.activateView();
    });

    this.addCommand({
      id: 'open-mdflow-view',
      name: '打开内容分发面板',
      callback: () => {
        void this.activateView();
      }
    });

    this.addSettingTab(new MDFlowSettingTab(this.app, this, this.redNoteSettings));
  }

  async activateView(): Promise<void> {
    const { workspace } = this.app;

    let leaf = workspace.getLeavesOfType(VIEW_TYPE_MDFLOW)[0];

    if (!leaf) {
      // Create new leaf in right sidebar
      const rightLeaf = workspace.getRightLeaf(false);
      if (rightLeaf) {
        leaf = rightLeaf;
        await leaf.setViewState({
          type: VIEW_TYPE_MDFLOW,
          active: true,
        });
      }
    }

    if (leaf) {
      await workspace.revealLeaf(leaf);
    }
  }

  openSettingsTab(): void {
    const settingManager = (this.app as unknown as {
      setting?: {
        open?: () => void;
        openTabById?: (id: string) => void;
      };
    }).setting;

    settingManager?.open?.();
    settingManager?.openTabById?.(this.manifest.id);
  }
}
