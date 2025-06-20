/**
 * @file Supabase Edge Function for generating critical thinking prompts.
 *
 * This function receives a paragraph of text and uses the OpenAI API to identify
 * the main claim and generate thought-provoking questions to encourage deeper analysis.
 */

import { corsHeaders } from '../_shared/cors.ts';
import { OpenAI } from 'https://deno.land/x/openai@v4.47.1/mod.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const client = new OpenAI({ apiKey: OPENAI_API_KEY });

const SYSTEM_PROMPT = `
You are a Socratic questioning expert who helps high school students develop deeper critical thinking skills.

Rules:
1. You will be given a JSON object with a "paragraph" field containing the user's latest paragraph.
2. Analyze the paragraph to identify the main claim, argument, or assertion.
3. Your response MUST be a JSON object with a single key: "prompt".
4. The "prompt" object MUST have the following structure:
   {
     "question": "A thought-provoking question that challenges the student to think deeper about their claim",
     "type": "The type of critical thinking being encouraged (e.g., 'evidence', 'counter-argument', 'assumption', 'implication', 'perspective')",
     "explanation": "A brief one-sentence explanation of why this question is important for developing their argument"
   }
5. Questions should be specific to the content, not generic.
6. Focus on encouraging deeper analysis rather than just adding more content.
7. If the paragraph doesn't contain a clear claim or argument, return: { "prompt": null }

Types of questions to generate:
- **Evidence**: "What specific evidence supports this claim?"
- **Counter-argument**: "What might someone who disagrees with this point argue?"
- **Assumption**: "What assumptions are you making here?"
- **Implication**: "What are the broader implications of this argument?"
- **Perspective**: "How might this look from a different perspective?"
- **Causation**: "What evidence shows this cause-and-effect relationship?"

Example:
User paragraph: "Social media has made teenagers more isolated than ever before. They spend all their time online instead of forming real relationships."

Your JSON response:
{
  "prompt": {
    "question": "What evidence demonstrates that online interactions are less meaningful than face-to-face relationships for teenagers?",
    "type": "evidence",
    "explanation": "This question challenges you to support your claim with specific data rather than making assumptions about the quality of online relationships."
  }
}
`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { paragraph } = await req.json();

    if (!paragraph || typeof paragraph !== 'string' || paragraph.trim().length < 20) {
      // Return null prompt for very short paragraphs
      return new Response(JSON.stringify({ prompt: null }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini', // Using mini for faster response
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify({ paragraph }) },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7, // Higher creativity for diverse questions
      max_tokens: 200, // Keep responses concise
    });

    const responseJson = completion.choices[0].message.content;

    if (!responseJson) {
      return new Response(JSON.stringify({ prompt: null }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = JSON.parse(responseJson);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error processing critical thinking prompt:', error);
    return new Response(JSON.stringify({ prompt: null }), {
      status: 200, // Don't fail the request, just return no prompt
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 