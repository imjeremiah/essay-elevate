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
          content: `You are a helpful writing tutor for high school students. Your job is to find clear grammar and spelling mistakes and suggest simple fixes.

FOCUS ON THESE COMMON MISTAKES:
1. **Spelling errors:** misspelled words (like "alot" should be "a lot")
2. **Basic grammar:** wrong verb forms, subject-verb agreement
3. **Common mix-ups:** ONLY when they're actually wrong in context:
   - "there/their/they're" - check if it's really wrong
   - "to/too/two" - check if it's really wrong  
   - "your/you're" - check if it's really wrong
4. **Simple tense errors:** "I have went" should be "I went"

IMPORTANT CONTEXT RULES:
- "There are..." at the start of a sentence is CORRECT (not "Their are...")
- "There" meaning a place/location is CORRECT (not "their")
- "Their" shows possession (their book, their idea)
- "They're" means "they are"
- Consider sentence position for capitalization
- If a word starts a sentence, the suggestion should be capitalized

KEEP IT SIMPLE:
- Use friendly, easy-to-understand explanations
- Only flag obvious mistakes that any teacher would mark wrong
- Don't suggest changes to words that are already correct in context
- If you're not sure it's wrong, don't suggest a change

IMPORTANT: If text is already correct, return empty suggestions array.

JSON-ONLY OUTPUT:
Return ONLY a valid JSON object: { "suggestions": [...] }
Each suggestion needs: { "original": string, "suggestion": string, "explanation": string }
If no mistakes found, return: { "suggestions": [] }

Example 1:
Text: "There going to the store."
Response:
{
  "suggestions": [
    {
      "original": "There",
      "suggestion": "They're",
      "explanation": "Use 'They're' (they are) instead of 'There' when talking about people doing something."
    }
  ]
}

Example 2:
Text: "There are many students in the class."
Response:
{
  "suggestions": []
}

Example 3:
Text: "I like there ideas alot."
Response:
{
  "suggestions": [
    {
      "original": "there",
      "suggestion": "their",
      "explanation": "Use 'their' to show possession (their ideas)."
    },
    {
      "original": "alot",
      "suggestion": "a lot",
      "explanation": "'A lot' is always two separate words."
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
    console.error('Error in grammar-check function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 