import { Modal } from 'obsidian';

export class RedNoteAboutModal extends Modal {
  constructor(app: Modal['app']) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('mdflow-about-modal');

    const card = contentEl.createDiv({ cls: 'mdflow-about-card' });
    const body = card.createDiv({ cls: 'mdflow-about-body' });

    body.createEl('h2', { cls: 'mdflow-about-title', text: '关于 Jacky' });

    const pluginIntro = [
      'Jacky-mdflow 是一款 Obsidian 排版分发插件，让 Markdown 内容快速适配微信公众号、X Articles 和小红书。',
      '我是 Jacky，内容营销负责人、AI 自媒体博主，也是文科生转型 AI FDE 的实践者。半年积累 3 万粉，正在 Build in Public，持续无限生长。',
    ];
    pluginIntro.forEach((line) => body.createEl('p', { text: line }));

    const socialSection = body.createDiv({ cls: 'mdflow-about-section' });
    socialSection.createEl('h3', { cls: 'mdflow-about-section-title', text: '找到我' });

    const contactList = socialSection.createDiv({ cls: 'mdflow-about-contact-list' });
    const channelItem = contactList.createDiv({ cls: 'mdflow-about-contact-item' });
    channelItem.createDiv({ cls: 'mdflow-about-contact-label', text: '个人频道' });
    const channelLink = channelItem.createEl('a', {
      cls: 'mdflow-about-contact-value mdflow-about-link',
      text: 'jackywxsz.club',
      href: 'https://www.jackywxsz.club/',
    });
    channelLink.setAttr('target', '_blank');
    channelLink.setAttr('rel', 'noopener noreferrer');

    this.renderContactItem(
      contactList,
      '同名账号',
      '小红书、抖音、视频号、公众号、X：Jacky无限生长'
    );
    this.renderContactItem(contactList, '联系本人', '微信搜索：Jackywxsz');

    const footer = card.createDiv({ cls: 'mdflow-about-footer' });
    footer.createDiv({ text: 'Build in Public' });
    footer.createDiv({ cls: 'mdflow-about-footer-separator', text: '•' });
    footer.createDiv({ text: '无限生长中' });
  }

  private renderContactItem(container: HTMLElement, label: string, value: string): void {
    const item = container.createDiv({ cls: 'mdflow-about-contact-item' });
    item.createDiv({ cls: 'mdflow-about-contact-label', text: label });
    item.createDiv({ cls: 'mdflow-about-contact-value', text: value });
  }
}
