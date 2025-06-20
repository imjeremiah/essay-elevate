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
      model: 'gpt-4o', // Using a more powerful model for this complex task
      messages: [
        {
          role: 'system',
          content: `You are a university-level writing tutor. Your goal is to analyze a student's essay for argumentation and reasoning. Read the entire text and identify specific sentences that contain logical fallacies, unsupported claims, or weak reasoning.

You must identify and explain the following issues:
- **Unsupported Claim:** A statement is made without any evidence or reasoning to back it up.
- **Hasty Generalization:** A conclusion is drawn from insufficient or biased evidence.
- **Weak Reasoning:** The connection between a claim and its evidence is unclear or unconvincing.
- **Logical Fallacy:** A flaw in reasoning (e.g., straw man, ad hominem, etc. - but explain it simply).

For each issue you find, you must pinpoint the exact sentence where it occurs.

Your response MUST be in a valid JSON object format: { "suggestions": [...] }
Each object in the "suggestions" array must have three properties:
1.  "original": The exact, complete sentence from the text that has an issue.
2.  "suggestion": An empty string. Do not suggest a revision.
3.  "explanation": A concise, constructive explanation of the issue. Start by naming the issue (e.g., "Unsupported Claim:").

Example:
Text: "Everyone knows that Shakespeare is the best writer ever. His plays are still performed, which proves it."
Response:
{
  "suggestions": [
    {
      "original": "Everyone knows that Shakespeare is the best writer ever.",
      "suggestion": "",
      "explanation": "Hasty Generalization: This is a broad claim based on an appeal to common knowledge, which isn't sufficient evidence in academic writing."
    },
    {
      "original": "His plays are still performed, which proves it.",
      "suggestion": "",
      "explanation": "Weak Reasoning: While the popularity of his plays is a valid point, it doesn't definitively 'prove' he is the 'best ever.' This connection could be stronger."
    }
  ]
}

If the text has no argumentation issues, return an empty array: { "suggestions": [] }`,
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

    // The response from OpenAI is a JSON string, so we parse it and return.
    const suggestions = JSON.parse(responseContent);

    // We need to add the 'type' to each suggestion for the client
    const typedSuggestions = suggestions.suggestions.map(s => ({
      ...s,
      type: 'argument', // A new type for these suggestions
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