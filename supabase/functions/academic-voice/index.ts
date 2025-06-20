/**
 * @file Supabase Edge Function for elevating text to an academic voice.
 *
 * This function receives a block of text and uses the OpenAI API to identify
 * sentences that are too casual or informal, suggesting more sophisticated
 * alternatives.
 */

import { corsHeaders } from '../_shared/cors.ts';
import { OpenAI } from 'https://deno.land/x/openai@v4.47.1/mod.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const client = new OpenAI({ apiKey: OPENAI_API_KEY });

const SYSTEM_PROMPT = `
You are an expert academic editor. Your task is to identify and correct informal or casual language in a user's text to elevate it to a more sophisticated, academic tone.

Rules:
1.  You will be given a JSON object with a "text" field.
2.  Analyze the text and identify any phrases or sentences that are informal, conversational, or not suitable for a formal academic essay.
3.  For each identified phrase, you MUST return a suggestion object.
4.  Your response MUST be a JSON object with a single key: "suggestions". This key should hold an array of suggestion objects.
5.  Each suggestion object MUST have the following structure:
    {
      "original": "The original informal phrase from the text.",
      "suggestion": "Your improved, academic version of the phrase.",
      "explanation": "A brief, one-sentence explanation of why the change was made, focusing on academic writing principles."
    }
6.  If the text is already perfectly academic and no suggestions are needed, return an empty "suggestions" array: { "suggestions": [] }.
7.  Focus on clarity, precision, and formal tone. Avoid overly complex or archaic language. The goal is sophistication, not obfuscation.
8.  Do not correct grammar or spelling unless it is part of making the tone more academic. Another service handles grammar.
9.  Provide suggestions for phrases, not single words, unless a single word is clearly informal (e.g., "thing", "stuff").

Example:
User text: "This is a really big deal because it shows the author's main point. Also, I think the way she uses metaphors is cool."

Your JSON response:
{
  "suggestions": [
    {
      "original": "a really big deal",
      "suggestion": "highly significant",
      "explanation": "Replaces a casual idiom with more formal and precise academic language."
    },
    {
      "original": "Also, I think",
      "suggestion": "Furthermore,",
      "explanation": "Removes personal opinion ('I think') and uses a more appropriate transition word."
    },
    {
      "original": "is cool",
      "suggestion": "is effective",
      "explanation": "Substitutes a colloquial term with a more analytical and descriptive word."
    }
  ]
}
`;

Deno.serve(async (req) => {
  // Handle preflight CORS request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();

    if (!text || typeof text !== 'string') {
      return new Response(JSON.stringify({ error: 'Text input is required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const completion = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify({ text }) },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    const responseJson = completion.choices[0].message.content;

    if (!responseJson) {
      return new Response(JSON.stringify({ error: 'No response from AI.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // The response from the LLM is a stringified JSON. We need to parse it
    // before sending it back to the client.
    const suggestions = JSON.parse(responseJson);

    return new Response(JSON.stringify(suggestions), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error processing academic voice check:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 