/**
 * @file This Edge Function analyzes a quote and its surrounding text to
 * determine if it has been properly introduced and followed by analysis.
 * It is designed to detect "quote-dropping" and provide coaching to the user.
 */

import { corsHeaders } from '../_shared/cors.ts';
import { OpenAI } from 'https://deno.land/x/openai/mod.ts';

// Initialize the OpenAI client with the API key from environment variables.
const openAI = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
});

Deno.serve(async req => {
  // Handle CORS preflight requests.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Ensure the OpenAI API key is set.
    if (!Deno.env.get('OPENAI_API_KEY')) {
      throw new Error('OPENAI_API_KEY is not set in environment variables.');
    }

    const { surroundingText, quote } = await req.json();

    if (!surroundingText || !quote) {
      return new Response(JSON.stringify({ error: 'Missing surroundingText or quote.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Call the OpenAI API to check for proper evidence integration.
    const completion = await openAI.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a writing tutor. Check if a quote is properly integrated into the text.

Check for:
1. **Introduction**: Is the quote introduced? (e.g., "Smith argues...", "The author states...")
2. **Analysis**: Is there explanation after the quote?

Return JSON format:
- Well-integrated: { "isDropped": false }
- Dropped quote: { "isDropped": true, "explanation": "brief helpful tip" }

Explanation tips:
- No introduction: "Try introducing this quote so readers know who is speaking."
- No analysis: "Explain what this quote means for your argument."
- Both missing: "Introduce this quote and explain its importance."`,
        },
        {
          role: 'user',
          content: JSON.stringify({ surroundingText, quote }),
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
      max_tokens: 200,
    });

    const responseContent = completion.choices[0].message.content;
    if (!responseContent) {
      throw new Error('No content in OpenAI response.');
    }

    // The response from OpenAI is a JSON string, so we parse it and pass it through.
    const analysisResult = JSON.parse(responseContent);

    // We will transform this into the standard "suggestion" format for the client.
    let suggestions = [];
    if (analysisResult.isDropped) {
      suggestions.push({
        original: quote,
        suggestion: '', // No text change, just a flag
        explanation: analysisResult.explanation,
        category: 'evidence',
      });
    }

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in evidence-mentor function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 