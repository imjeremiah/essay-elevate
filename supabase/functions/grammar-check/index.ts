/**
 * @file This Edge Function acts as a proxy to the OpenAI API for grammar checking.
 * It takes a text input, sends it to OpenAI with a specific prompt for
 * grammar and spelling correction, and returns a structured JSON response
 * with suggestions.
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

    const { text } = await req.json();

    if (!text) {
      return new Response(JSON.stringify({ error: 'No text provided.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Call the OpenAI API to get grammar and spelling suggestions.
    const completion = await openAI.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert grammar correction assistant. Your task is to identify and correct ONLY clear, objective grammatical errors in the user's text. You must be extremely precise and return a structured JSON object.

Your core responsibility is to ensure that your suggested correction is a "drop-in" replacement that makes grammatical sense in the context of the sentence. This means you must identify the ENTIRE incorrect phrase.

For example, if the user writes "I have gone to the store yesterday," the simple past tense is required.
- BAD: Correcting only "gone" to "went" would result in "I have went...", which is still incorrect.
- GOOD: You must identify "have gone" as the incorrect phrase and suggest replacing it with "went". The final sentence should be "I went to the store yesterday."

CRITICAL RULES:
1.  **Identify the Full Phrase:** Always expand your selection to include all parts of the incorrect grammatical phrase (e.g., auxiliary verbs like "have").
2.  **Be Conservative:** When in doubt, DO NOT suggest a change. Only flag clear, unambiguous errors.
3.  **Do Not Flag Punctuation:** Never flag correct punctuation like periods or standard commas. A period at the end of a sentence is always correct.
4.  **Handle Homophones:** Correctly identify and fix misuse of homophones (e.g., "to" vs. "too", "their" vs. "there").

JSON-ONLY OUTPUT:
Return ONLY a valid JSON object with a single key, "suggestions", which is an array of suggestion objects.
Each suggestion object must have these keys: { "original": string, "suggestion": string, "explanation": string }.
If there are no errors, return { "suggestions": [] }.

Example of a good suggestion:
User text: "He have went to the park."
Your JSON output:
{
  "suggestions": [
    {
      "original": "have went",
      "suggestion": "has gone",
      "explanation": "The correct present perfect form is 'has gone'."
    }
  ]
}
`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const responseContent = completion.choices[0].message.content;
    if (!responseContent) {
      throw new Error('No content in OpenAI response.');
    }

    try {
      // The response from OpenAI is a JSON string, so we parse it.
      const suggestions = JSON.parse(responseContent);

      return new Response(JSON.stringify(suggestions), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } catch (parseError) {
      console.error('Error parsing OpenAI JSON response:', parseError);
      throw new Error('Could not parse response from AI.');
    }
  } catch (error) {
    console.error('Error in grammar-check function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 