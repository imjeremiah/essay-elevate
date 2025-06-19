/**
 * @file This file will contain core TypeScript types and interfaces
 * that are used in multiple places throughout the application.
 */

/**
 * Represents a document in the application.
 */
export type Document = {
  id: string;
  user_id: string;
  title: string;
  content: Record<string, unknown> | null; // JSON content from Tiptap editor
  created_at: string;
};

/**
 * Represents a single grammar or spelling suggestion from the AI.
 */
export type Suggestion = {
  start: number;
  end: number;
  original: string;
  suggestion: string;
  explanation: string;
}; 