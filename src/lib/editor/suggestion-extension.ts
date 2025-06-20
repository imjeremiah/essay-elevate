/**
 * @file This file contains a custom Tiptap mark extension for highlighting
 * writing suggestions within the editor.
 */
import { Mark, mergeAttributes } from '@tiptap/core';

export interface SuggestionOptions {
  HTMLAttributes: Record<string, unknown>;
}

export type SuggestionCategory = 'grammar' | 'academic_voice' | 'evidence' | 'argument';

export interface SuggestionAttributes {
  suggestion?: string;
  explanation?: string;
  original?: string;
  category?: SuggestionCategory;
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
      category: {
        default: 'grammar',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-suggestion]',
        getAttrs: node => {
          if (typeof node === 'string') return false;
          const element = node as HTMLElement;
          return {
            suggestion: element.getAttribute('data-suggestion'),
            explanation: element.getAttribute('data-explanation'),
            original: element.getAttribute('data-original'),
            category: element.getAttribute('data-category') as SuggestionCategory,
          };
        },
      },
    ];
  },

  renderHTML({ mark, HTMLAttributes }) {
    // Dynamically set class based on category
    const categoryClass = `suggestion-${mark.attrs.category || 'grammar'}`;
    
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: categoryClass,
        'data-suggestion': mark.attrs.suggestion,
        'data-explanation': mark.attrs.explanation,
        'data-original': mark.attrs.original,
        'data-category': mark.attrs.category,
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