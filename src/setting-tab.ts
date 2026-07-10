import { App, PluginSettingTab, Setting } from 'obsidian';
import { RedNoteSettingsManager } from './rednote/settings-manager';
import { getRedNoteTemplateOptions } from './rednote/template-presets';
import { clampRedNoteFontSize, REDNOTE_LAYOUT_MODE_OPTIONS, RedNoteAssetField } from './rednote/types';
import MDFlowPlugin from './main';

export class MDFlowSettingTab extends PluginSettingTab {
  constructor(
    app: App,
    private plugin: MDFlowPlugin,
    private redNoteSettings: RedNoteSettingsManager
  ) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    const settings = this.redNoteSettings.getSettings();
    const fontOptions = this.redNoteSettings.getFontOptions();

    containerEl.empty();
    containerEl.createEl('p', {
      text: '这里管理小红书模板、账号信息和导流素材。顶部工具栏负责快速切换，设置页负责长期保存。',
    });

    new Setting(containerEl).setName('模板与排版').setHeading();

    new Setting(containerEl)
      .setName('默认排版')
      .setDesc('二级标题分页适合章节卡片，正文卡片流适合正文连续排版')
      .addDropdown((dropdown) => {
        REDNOTE_LAYOUT_MODE_OPTIONS.forEach((option) => {
          dropdown.addOption(option.value, option.label);
        });
        dropdown.setValue(settings.layoutMode);
        dropdown.onChange((value) => {
          void this.redNoteSettings.update({
            layoutMode: value === 'obsidian-flow' ? value : 'heading-sections',
          });
        });
      });

    new Setting(containerEl)
      .setName('默认模板')
      .setDesc('切换小红书图文的整体视觉风格')
      .addDropdown((dropdown) => {
        getRedNoteTemplateOptions().forEach((option) => {
          dropdown.addOption(option.value, option.label);
        });
        dropdown.setValue(settings.templateId);
        dropdown.onChange((value) => {
          void this.redNoteSettings.update({ templateId: value });
        });
      });

    new Setting(containerEl)
      .setName('默认字体')
      .setDesc('影响小红书图文的正文与标题字体')
      .addDropdown((dropdown) => {
        fontOptions.forEach((option) => {
          dropdown.addOption(option.value, option.label);
        });
        dropdown.setValue(settings.fontFamily);
        dropdown.onChange((value) => {
          void this.redNoteSettings.update({ fontFamily: value });
        });
      });

    new Setting(containerEl)
      .setName('默认字号')
      .setDesc('建议在 14-18 之间')
      .addText((text) => {
        text.setValue(String(settings.fontSize));
        text.onChange((value) => {
          const parsed = Number.parseInt(value, 10);
          void this.redNoteSettings.update({ fontSize: clampRedNoteFontSize(parsed) });
        });
      });

    new Setting(containerEl).setName('账号信息').setHeading();

    new Setting(containerEl)
      .setName('用户名')
      .addText((text) => {
        text.setPlaceholder('例如：Jacky无限生长');
        text.setValue(settings.userName);
        text.onChange((value) => {
          void this.redNoteSettings.update({ userName: value.trim() || settings.userName });
        });
      });

    new Setting(containerEl)
      .setName('账号 ID')
      .addText((text) => {
        text.setPlaceholder('例如：@Jack');
        text.setValue(settings.userId);
        text.onChange((value) => {
          void this.redNoteSettings.update({ userId: value.trim() || settings.userId });
        });
      });

    new Setting(containerEl)
      .setName('显示发布时间')
      .setDesc('在卡片右上角展示当前日期')
      .addToggle((toggle) => {
        toggle.setValue(settings.showTime);
        toggle.onChange((value) => {
          void this.redNoteSettings.update({ showTime: value });
        });
      });

    new Setting(containerEl)
      .setName('时间格式')
      .setDesc('控制日期语言环境')
      .addDropdown((dropdown) => {
        dropdown.addOption('zh-CN', '中文');
        dropdown.addOption('en-US', 'English');
        dropdown.setValue(settings.timeFormat);
        dropdown.onChange((value) => {
          void this.redNoteSettings.update({ timeFormat: value });
        });
      });

    this.addImageSetting(
      containerEl,
      '头像图片',
      '显示在小红书卡片头部与作者介绍里',
      'userAvatar'
    );

    this.addImageSetting(
      containerEl,
      '封面图片',
      '优先用于带封面的模板首页',
      'coverImage'
    );

    new Setting(containerEl).setName('品牌文案').setHeading();

    new Setting(containerEl)
      .setName('顶部标签')
      .setDesc('显示在头部右侧的小标签上')
      .addText((text) => {
        text.setValue(settings.notesTitle);
        text.onChange((value) => {
          void this.redNoteSettings.update({ notesTitle: value.trim() || settings.notesTitle });
        });
      });

    new Setting(containerEl)
      .setName('品牌标语')
      .setDesc('显示在封面占位区和作者介绍中')
      .addText((text) => {
        text.setValue(settings.brandTagline);
        text.onChange((value) => {
          void this.redNoteSettings.update({ brandTagline: value.trim() || settings.brandTagline });
        });
      });

    new Setting(containerEl)
      .setName('页脚左侧文案')
      .addText((text) => {
        text.setValue(settings.footerLeftText);
        text.onChange((value) => {
          void this.redNoteSettings.update({ footerLeftText: value.trim() || settings.footerLeftText });
        });
      });

    new Setting(containerEl)
      .setName('页脚右侧文案')
      .addText((text) => {
        text.setValue(settings.footerRightText);
        text.onChange((value) => {
          void this.redNoteSettings.update({ footerRightText: value.trim() || settings.footerRightText });
        });
      });
  }

  private addImageSetting(
    containerEl: HTMLElement,
    name: string,
    desc: string,
    field: RedNoteAssetField
  ): void {
    const hasImage = Boolean(this.redNoteSettings.getSettings()[field]);

    new Setting(containerEl)
      .setName(name)
      .setDesc(`${desc}${hasImage ? '，当前已上传。' : '，当前未上传。'}`)
      .addButton((button) => {
        button.setButtonText(hasImage ? '替换' : '上传');
        button.onClick(() => {
          void this.pickAndStoreImage(field).then(() => this.display());
        });
      })
      .addButton((button) => {
        button.setButtonText('清空');
        button.setDisabled(!hasImage);
        button.onClick(() => {
          void this.redNoteSettings.resetAsset(field).then(() => this.display());
        });
      });
  }

  private async pickAndStoreImage(field: RedNoteAssetField): Promise<void> {
    const input = createEl('input');
    input.type = 'file';
    input.accept = 'image/*';

    await new Promise<void>((resolve) => {
      input.addEventListener('change', () => {
        const file = input.files?.[0];
        if (!file) {
          resolve();
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          const result = typeof reader.result === 'string' ? reader.result : '';
          if (result) {
            void this.redNoteSettings.update({ [field]: result }).then(() => resolve());
            return;
          }
          resolve();
        };
        reader.readAsDataURL(file);
      });

      input.click();
    });
  }
}
