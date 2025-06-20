/**
 * @file This Edge Function provides an on-demand analysis of an entire text,
 * acting as an argument coach to identify logical fallacies, unsupported claims,
 * and weak reasoning.
 */

import { corsHeaders } from '../_shared/cors.ts';
import { OpenAI } from 'https://deno.land/x/openai/mod.ts';

const openAI = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
});

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!Deno.env.get('OPENAI_API_KEY')) {
      throw new Error('OPENAI_API_KEY is not set.');
    }

    const { text } = await req.json();

    if (!text) {
      return new Response(JSON.stringify({ error: 'No text provided.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const completion = await openAI.chat.completions.create({
      model: 'gpt-4o-mini', // Faster model for sub-2-second performance
      messages: [
        {
          role: 'system',
          content: `You are a writing tutor. Analyze the text for logical fallacies, unsupported claims, and weak reasoning. Find the problematic sentences.

Identify these issues:
- **Unsupported Claim**: Statement without evidence
- **Logical Fallacy**: Flawed reasoning (ad hominem, straw man, etc.)
- **Weak Reasoning**: Poor connection between claim and evidence
- **Hasty Generalization**: Conclusion from insufficient evidence

Return your response as a JSON object with this format: { "suggestions": [...] }
Each suggestion: { "original": "exact sentence", "suggestion": "", "explanation": "Issue type: brief explanation" }
IMPORTANT: Always leave "suggestion" as an empty string "".

If no issues: { "suggestions": [] }`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
      max_tokens: 800,
    });

    const responseContent = completion.choices[0].message.content;
    if (!responseContent) {
      throw new Error('No content in OpenAI response.');
    }

    // The response from OpenAI is a JSON string, so we parse it and return.
    const suggestions = JSON.parse(responseContent);

    // We need to add the 'category' to each suggestion for the client
    const typedSuggestions = suggestions.suggestions.map(s => ({
      ...s,
      category: 'argument', // A new category for these suggestions
    }));

    return new Response(JSON.stringify({ suggestions: typedSuggestions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in argument-coach function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 