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
    // Clean up the input text - remove consecutive empty lines and standalone markdown headers
    let cleanedText = text
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^##\s*$\n+/gm, '')
      .replace(/^###\s*$\n+/gm, '')
      .trim();
      
    // Match sections with optional markdown headers
    const quickRecapMatch = cleanedText.match(/(?:##\s*)?\s*Quick recap\s+([\s\S]*?)(?=(?:##\s*)?\s*Next steps)/i);
    const nextStepsMatch = cleanedText.match(/(?:##\s*)?\s*Next steps\s+([\s\S]*?)(?=(?:##\s*)?\s*Summary)/i);
    const summaryMatch = cleanedText.match(/(?:##\s*)?\s*Summary\s+([\s\S]*)$/i);
  
    if (!quickRecapMatch || !nextStepsMatch || !summaryMatch) {
      return null;
    }
  
    const quickRecap = quickRecapMatch[1].trim();
  
    // Process next steps - preserve existing bullets, add them if missing
    const nextSteps = nextStepsMatch[1]
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => {
        // If line already has a bullet point, keep it as is
        if (line.trim().startsWith('-')) {
          return line.trim();
        }
        return `- ${line.trim()}`;
      })
      .join('\n');
  
    const summaryRaw = summaryMatch[1].trim();
  
    // Process the summary, handling the new markdown headers format
    // First, clean up any empty markdown header lines
    const cleanSummaryRaw = summaryRaw
      .replace(/^###\s*$\n+/gm, '')
      .trim();
    
    // Split sections by empty lines or ### headers
    const summarySections = cleanSummaryRaw
      .split(/(?:\n\s*\n+)|(?=###\s+)/g)
      .map((block) => block.trim())
      .filter((block) => block.length > 0);
  
    const formattedSummary: string[] = [];
    let i = 0;
  
    while (i < summarySections.length) {
      let section = summarySections[i];
      
      // Check if this section starts with a ### heading
      if (section.startsWith('### ')) {
        // Extract the heading text
        const headingMatch = section.match(/^### (.*?)(?:\n|$)/);
        if (headingMatch) {
          const headingTitle = headingMatch[1].trim();
          // Get the content after the heading
          const content = section.substring(headingMatch[0].length).trim();
          
          if (content) {
            // Format with heading and content
            formattedSummary.push(`**${headingTitle}**\n${content}`);
          } else {
            // If heading with no content
            formattedSummary.push(`**${headingTitle}**`);
          }
        }
      } else {
        // Handle regular sections as before
        const looksLikeTitle = section && !section.endsWith('.');
        
        if (looksLikeTitle && i + 1 < summarySections.length) {
          const maybeBody = summarySections[i + 1];
          
          if (maybeBody && !maybeBody.startsWith('### ') && maybeBody.endsWith('.')) {
            formattedSummary.push(`**${section}**\n${maybeBody}`);
            i += 2;
            continue;
          }
        }
        
        formattedSummary.push(section);
      }
      
      i++;
    }
  
    const summaryWithSpacing = formattedSummary
      .map((section, index) => (index === 0 ? section : `\n${section}`))
      .join('\n');
  
    return `#### Quick Recap
${quickRecap}
#### Next Steps
${nextSteps}
#### Summary
${summaryWithSpacing}`;
  }
}