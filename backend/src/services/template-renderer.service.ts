import { sanitize } from 'isomorphic-dompurify';
import { convert } from 'html-to-text';

export interface RenderOptions {
  sanitizeHtml?: boolean;
  generatePlainText?: boolean;
}

export class TemplateRendererService {
  /**
   * Render template with variable substitution
   * Uses handlebars/mustache syntax: {{variableName}}
   */
  renderTemplate(
    template: string,
    variables: Record<string, any>,
    options: RenderOptions = {}
  ): string {
    let rendered = template;

    // Replace all variables in the format {{variableName}}
    Object.keys(variables).forEach((key) => {
      const value = variables[key] || '';
      // Escape special regex characters in the key
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\{\\{${escapedKey}\\}\\}`, 'g');
      rendered = rendered.replace(regex, String(value));
    });

    // Sanitize HTML if requested
    if (options.sanitizeHtml !== false) {
      rendered = sanitize(rendered, {
        ALLOWED_TAGS: [
          'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'a', 'img', 'ul', 'ol', 'li', 'div', 'span', 'table', 'thead', 'tbody',
          'tr', 'td', 'th', 'blockquote', 'hr', 'pre', 'code',
        ],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'style', 'target'],
        ALLOW_DATA_ATTR: false,
      });
    }

    return rendered;
  }

  /**
   * Render subject line with variables
   */
  renderSubject(subject: string, variables: Record<string, any>): string {
    return this.renderTemplate(subject, variables, { sanitizeHtml: false });
  }

  /**
   * Render HTML body with variables
   */
  renderHtmlBody(html: string, variables: Record<string, any>): string {
    return this.renderTemplate(html, variables, { sanitizeHtml: true });
  }

  /**
   * Generate plain text from HTML
   */
  generatePlainText(html: string, variables: Record<string, any>): string {
    const renderedHtml = this.renderHtmlBody(html, variables);

    return convert(renderedHtml, {
      wordwrap: 80,
      preserveNewlines: true,
      selectors: [
        { selector: 'a', options: { ignoreHref: false } },
        { selector: 'img', format: 'skip' },
      ],
    });
  }

  /**
   * Extract variables from template
   * Returns array of variable names found in template
   */
  extractVariables(template: string): string[] {
    const regex = /\{\{(\w+)\}\}/g;
    const variables: string[] = [];
    let match;

    while ((match = regex.exec(template)) !== null) {
      const varName = match[1];
      if (!variables.includes(varName)) {
        variables.push(varName);
      }
    }

    return variables;
  }

  /**
   * Validate template syntax
   */
  validateTemplate(template: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const openBraces = (template.match(/\{\{/g) || []).length;
    const closeBraces = (template.match(/\}\}/g) || []).length;

    if (openBraces !== closeBraces) {
      errors.push('Mismatched variable braces: {{ and }} must be paired');
    }

    // Check for unclosed variables
    const unclosedRegex = /\{\{[^}]*(?!\}\})/g;
    if (unclosedRegex.test(template)) {
      errors.push('Unclosed variable braces found');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const templateRendererService = new TemplateRendererService();

