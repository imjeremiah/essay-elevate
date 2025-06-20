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
          content: `You are an expert writing tutor. Your task is to analyze a quote and its surrounding text to see if the student has integrated the evidence properly. The user will provide a JSON object with "surroundingText" and "quote".

You must check for two things:
1.  **Introduction:** Is there a phrase in "surroundingText" that introduces the "quote"? (e.g., "As Dr. Smith argues...", "The author states that...").
2.  **Analysis:** Is there a sentence in "surroundingText" *after* the "quote" that explains, analyzes, or comments on its significance?

A "dropped quote" is one missing either a clear introduction or analysis.

Your response MUST be in JSON format.
- If the quote is well-integrated, return: { "isDropped": false }
- If the quote is "dropped", return: { "isDropped": true, "explanation": "A helpful, concise explanation for the student." }

**Explanation Guidelines:**
- No introduction: "This quote feels a bit disconnected. Try introducing it first so the reader knows who is speaking."
- No analysis: "Don't forget to explain what this quote means or why it's important for your argument."
- Both missing: "This quote seems disconnected. Introduce it and then explain its importance to your argument."`,
        },
        {
          role: 'user',
          content: JSON.stringify({ surroundingText, quote }),
        },
      ],
      response_format: { type: 'json_object' },
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
        type: 'evidence',
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