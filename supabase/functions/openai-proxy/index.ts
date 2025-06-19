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
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a grammar and spelling correction assistant. Analyze the user's text and provide corrections. Return a JSON object with a single key "suggestions" that contains an array of objects. Each object in the array should have the following schema: { "start": number, "end": number, "original": string, "suggestion": string, "explanation": string }. "start" and "end" are the character indices of the error in the original text. "original" is the incorrect text fragment. "suggestion" is the corrected version. "explanation" is a brief reason for the correction. If there are no errors, return an empty array for the "suggestions" key.`,
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
    
    // The response from OpenAI is a JSON string, so we parse it.
    const suggestions = JSON.parse(responseContent);

    return new Response(JSON.stringify(suggestions), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in OpenAI proxy function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 