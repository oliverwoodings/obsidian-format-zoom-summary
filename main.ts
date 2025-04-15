// main.ts

import { App, Plugin, PluginManifest, Notice } from 'obsidian';

export default class ZoomSummaryFormatterPlugin extends Plugin {
  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest);
  }

  async onload() {
    this.addCommand({
      id: 'format-zoom-summary',
      name: 'Format Highlighted Zoom Summary',
      editorCallback: (editor) => {
        const selectedText = editor.getSelection();
        if (!selectedText.trim()) {
          new Notice('⚠️ Please highlight the unformatted Zoom summary.');
          return;
        }

        const formatted = this.formatZoomSummary(selectedText);
        if (!formatted) {
          new Notice('⚠️ Highlighted text does not match expected Zoom summary format.');
          return;
        }

        editor.replaceSelection(formatted);
      },
    });
  }

  formatZoomSummary(text: string): string | null {
    const quickRecapMatch = text.match(/Quick recap\s+([\s\S]*?)\n(?=Next steps)/i);
    const nextStepsMatch = text.match(/Next steps\s+([\s\S]*?)\n(?=Summary)/i);
    const summaryMatch = text.match(/Summary\s+([\s\S]*)$/i);
  
    if (!quickRecapMatch || !nextStepsMatch || !summaryMatch) {
      return null;
    }
  
    const quickRecap = quickRecapMatch[1].trim();
  
    const nextSteps = nextStepsMatch[1]
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => `- ${line.trim()}`)
      .join('\n');
  
    const summaryRaw = summaryMatch[1].trim();
  
    const summarySections = summaryRaw
      .split(/\n\s*\n+/)
      .map((block) => block.trim())
      .filter((block) => block.length > 0);
  
    const formattedSummary: string[] = [];
    let i = 0;
  
    while (i < summarySections.length) {
      const maybeTitle = summarySections[i];
      const maybeBody = summarySections[i + 1];
  
      const looksLikeTitle = maybeTitle && !maybeTitle.endsWith('.');
  
      if (looksLikeTitle) {
        const title = `**${maybeTitle}**`;
        const body = maybeBody && maybeBody.endsWith('.') ? maybeBody : '';
  
        const formattedBlock = body
          ? `${title}\n${body}`
          : `${title}`;
  
        formattedSummary.push(formattedBlock);
        i += body ? 2 : 1;
      } else {
        formattedSummary.push(maybeTitle);
        i += 1;
      }
    }
  
    const summaryWithSpacing = formattedSummary
      .map((section, index) => (index === 0 ? section : `\n${section}`))
      .join('\n');
  
    return `### AI Notes

#### Quick Recap
${quickRecap}
#### Next Steps
${nextSteps}
#### Summary
${summaryWithSpacing}`;
  }
}