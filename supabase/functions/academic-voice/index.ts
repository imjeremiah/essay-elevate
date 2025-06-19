/**
 * @file This Edge Function identifies casual language in academic writing
 * and provides more sophisticated, academic alternatives. It focuses on
 * elevating informal phrases to maintain scholarly tone.
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

    // Call the OpenAI API to get academic voice suggestions.
    const completion = await openAI.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a friendly writing coach helping high school students write more formally for school essays. Your job is to spot casual language and suggest more formal alternatives.

LOOK FOR THESE CASUAL PHRASES:
1. **Contractions:** "don't" → "do not", "can't" → "cannot", "it's" → "it is"
2. **Casual connectors:** "but" → "however", "so" → "therefore"
3. **Informal phrases:** "a lot of" → "many", "really good" → "effective"
4. **Personal opinions:** "I think" → "This suggests", "I believe" → "The evidence shows"
5. **Casual words:** "stuff" → "things", "guys" → "people", "totally" → "completely"

KEEP IT STUDENT-FRIENDLY:
- Only suggest changes that make writing sound more formal for school
- Use simple explanations a high schooler would understand
- Don't make it sound like a college textbook
- If the writing is already appropriately formal, suggest nothing

JSON-ONLY OUTPUT:
Return ONLY a valid JSON object: { "suggestions": [...] }
Each suggestion needs: { "original": string, "suggestion": string, "explanation": string }
If no casual language found, return: { "suggestions": [] }

Example:
Text: "There's a lot of evidence that shows this theory is pretty good."
Response:
{
  "suggestions": [
    {
      "original": "There's",
      "suggestion": "There is",
      "explanation": "Avoid contractions in formal school writing."
    },
    {
      "original": "a lot of",
      "suggestion": "much",
      "explanation": "Use more formal language instead of casual phrases."
    },
    {
      "original": "pretty good",
      "suggestion": "effective",
      "explanation": "Choose more specific words instead of casual descriptors."
    }
  ]
}`,
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
    console.error('Error in academic-voice function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 