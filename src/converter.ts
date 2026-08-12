import { App, Component, MarkdownRenderer, TFile } from 'obsidian';
import { stripObsidianArtifacts } from './exporters/dom-utils';

/**
 * Markdown Converter
 * Renders Markdown through Obsidian itself so wiki links, embeds and task lists stay intact.
 */
export class MarkdownConverter {
  private renderComponent: Component | null = null;

  constructor(private app: App) {}

  async convertToHtml(
    markdown: string,
    sourceFile: TFile,
    preserveBlankLines = false
  ): Promise<string> {
    this.dispose();

    const container = createDiv();
    const component = new Component();
    this.renderComponent = component;
    const markdownWithSpacing = preserveBlankLines
      ? this.preserveExtraBlankLines(markdown)
      : markdown;

    await MarkdownRenderer.render(
      this.app,
      markdownWithSpacing,
      container,
      sourceFile.path,
      component
    );
    return this.normalizeHtml(container.innerHTML);
  }

  dispose(): void {
    this.renderComponent?.unload();
    this.renderComponent = null;
  }

  private normalizeHtml(html: string): string {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    stripObsidianArtifacts(doc);
    return doc.body.innerHTML;
  }

  private preserveExtraBlankLines(markdown: string): string {
    const lines = markdown.replace(/\r\n/g, '\n').split('\n');
    const output: string[] = [];
    let fenceMarker = '';
    let inFrontmatter = lines[0]?.trim() === '---';

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      const trimmed = line.trim();

      if (!trimmed) {
        let end = index;
        while (end + 1 < lines.length && !lines[end + 1].trim()) {
          end += 1;
        }

        const blankCount = end - index + 1;
        let previousLine = '';
        for (let outputIndex = output.length - 1; outputIndex >= 0; outputIndex -= 1) {
          if (output[outputIndex].trim()) {
            previousLine = output[outputIndex];
            break;
          }
        }
        const nextLine = lines.slice(end + 1).find((candidate) => Boolean(candidate.trim()));

        if (
          !fenceMarker &&
          !inFrontmatter &&
          previousLine &&
          nextLine &&
          blankCount > 1
        ) {
          output.push('');
          for (let spacerIndex = 1; spacerIndex < blankCount; spacerIndex += 1) {
            output.push('<div class="mdflow-source-spacer" aria-hidden="true"></div>', '');
          }
        } else {
          output.push(...lines.slice(index, end + 1));
        }

        index = end;
        continue;
      }

      output.push(line);

      if (inFrontmatter) {
        if (index > 0 && (trimmed === '---' || trimmed === '...')) {
          inFrontmatter = false;
        }
        continue;
      }

      const fenceMatch = trimmed.match(/^(`{3,}|~{3,})/);
      if (!fenceMatch) continue;

      if (!fenceMarker) {
        fenceMarker = fenceMatch[1][0];
      } else if (fenceMatch[1][0] === fenceMarker) {
        fenceMarker = '';
      }
    }

    return output.join('\n');
  }
}
