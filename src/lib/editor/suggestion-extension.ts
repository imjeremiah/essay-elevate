/**
 * @file This file contains a custom Tiptap mark extension for highlighting
 * grammar and spelling suggestions within the editor.
 */
import { Mark, mergeAttributes } from '@tiptap/core';

export interface SuggestionOptions {
  HTMLAttributes: Record<string, unknown>;
}

export interface SuggestionAttributes {
  suggestion?: string;
  explanation?: string;
  original?: string;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    suggestion: {
      /**
       * Set a suggestion mark
       */
      setSuggestion: (attributes: SuggestionAttributes) => ReturnType;
      /**
       * Toggle a suggestion mark
       */
      toggleSuggestion: (attributes: SuggestionAttributes) => ReturnType;
      /**
       * Unset a suggestion mark
       */
      unsetSuggestion: () => ReturnType;
    };
  }
}

export const Suggestion = Mark.create<SuggestionOptions, SuggestionAttributes>({
  name: 'suggestion',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      suggestion: {
        default: null,
      },
      explanation: {
        default: null,
      },
      original: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-suggestion]',
        getAttrs: node => {
          if (typeof node === 'string') return false;
          const suggestion = (node as HTMLElement).getAttribute('data-suggestion');
          const explanation = (node as HTMLElement).getAttribute('data-explanation');
          const original = (node as HTMLElement).getAttribute('data-original');
          return { suggestion, explanation, original };
        },
      },
    ];
  },

  renderHTML({ mark, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-suggestion': mark.attrs.suggestion,
        'data-explanation': mark.attrs.explanation,
        'data-original': mark.attrs.original,
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setSuggestion: attributes => ({ commands }) => {
        return commands.setMark(this.name, attributes);
      },
      toggleSuggestion: attributes => ({ commands }) => {
        return commands.toggleMark(this.name, attributes);
      },
      unsetSuggestion: () => ({ commands }) => {
        return commands.unsetMark(this.name);
      },
    };
  },
}); 