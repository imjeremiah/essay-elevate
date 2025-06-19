/**
 * @file This file contains the client-side logic for the document editor,
 * powered by Tiptap. It handles real-time collaboration, grammar suggestions,
 * and auto-saving.
 */
'use client';

import { Button } from '@/components/ui/button';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { createClient } from '@/lib/supabase/client';
import { type Document, type Suggestion as SuggestionType } from '@/lib/types';
import { EditorContent, useEditor, BubbleMenu } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { useCallback, useEffect, useState, useRef } from 'react';
import { Suggestion } from '@/lib/editor/suggestion-extension';
import './editor-styles.css';

interface EditorClientProps {
  initialDocument: Document;
}

/**
 * The main client component for the text editor.
 * @param {EditorClientProps} props - The properties for the component.
 * @returns The rendered editor component.
 */
export function EditorClient({ initialDocument }: EditorClientProps) {
  const supabase = createClient();
  const [title, setTitle] = useState<string>(initialDocument.title);
  const debouncedTitle = useDebounce(title, 500);

  const [isSaving, setIsSaving] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkGrammar = useCallback(async (editorInstance: any) => {
    const text = editorInstance.getText();
    if (!text.trim()) {
      editorInstance.chain().focus().unsetSuggestion().run();
      return;
    }

    setIsChecking(true);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        'openai-proxy',
        { body: { text } },
      );

      if (invokeError) throw invokeError;

      if (data.suggestions) {
        const { tr } = editorInstance.state;
        tr.removeMark(0, editorInstance.state.doc.content.size, editorInstance.schema.marks.suggestion);
        
        data.suggestions.forEach((s: SuggestionType) => {
            tr.addMark(s.start, s.end, editorInstance.schema.marks.suggestion.create({
                suggestion: s.suggestion,
                original: s.original,
                explanation: s.explanation,
            }));
        });
        editorInstance.view.dispatch(tr);
      }
    } catch (e) {
      console.error('Error checking grammar:', e);
      setError('Could not check grammar.');
    } finally {
      setIsChecking(false);
    }
  }, [supabase.functions]);

  const debouncedGrammarCheck = useDebounce(checkGrammar, 2000);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Suggestion.configure({
        HTMLAttributes: {
          class: 'suggestion-mark',
        },
      }),
    ],
    content: initialDocument.content || '',
    onUpdate: ({ editor: editorInstance }) => {
      debouncedGrammarCheck(editorInstance);
    },
    onCreate: ({ editor: editorInstance }) => {
      checkGrammar(editorInstance);
    },
  });

  const saveDocument = useCallback(async () => {
    if (!editor) return;

    setIsSaving(true);
    const contentJSON = editor.getJSON();

    const { error: updateError } = await supabase
      .from('documents')
      .update({ title: debouncedTitle, content: contentJSON })
      .eq('id', initialDocument.id);

    if (updateError) {
      console.error('Error saving document:', updateError);
      setError('Could not save changes.');
    } else {
      setError(null);
    }
    setIsSaving(false);
  }, [editor, supabase, debouncedTitle, initialDocument.id]);

  const debouncedEditorState = useDebounce(editor?.state.doc.toJSON(), 500);

  useEffect(() => {
    if (debouncedEditorState) {
      saveDocument();
    }
  }, [debouncedEditorState, debouncedTitle, saveDocument]);
  
  const acceptSuggestion = () => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const attrs = editor.getAttributes('suggestion');
    if (attrs.suggestion) {
        editor.chain().focus().insertContentAt({ from, to }, attrs.suggestion).run();
    }
  };

  if (!editor) {
    return <div>Loading Editor...</div>;
  }

  return (
    <div className="flex flex-col w-full max-w-4xl gap-4 p-8 mx-auto">
      <div className="flex items-center justify-between">
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full text-4xl font-bold bg-transparent focus:outline-none"
          placeholder="Untitled Document"
        />
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {isChecking && <div>Checking...</div>}
          {isSaving ? <div>Saving...</div> : <div>Saved</div>}
          {error && <div className="text-destructive">{error}</div>}
        </div>
      </div>

      {editor && (
        <BubbleMenu
          editor={editor}
          shouldShow={({ editor: editorInstance, from, to }) => {
            return from !== to && editorInstance.isActive('suggestion');
          }}
          tippyOptions={{
            placement: 'bottom-start',
          }}
          className="p-2 bg-background border border-border rounded-md shadow-lg flex flex-col gap-2"
        >
          {(props) => {
             const attrs = props.editor.getAttributes('suggestion');
             return (
                <>
                    <p className="text-sm">{attrs.explanation}</p>
                    <Button onClick={acceptSuggestion} size="sm">
                        Accept: &quot;{attrs.suggestion}&quot;
                    </Button>
                </>
             )
          }}
        </BubbleMenu>
      )}

      <EditorContent editor={editor} className="prose dark:prose-invert max-w-none" />
    </div>
  );
} 