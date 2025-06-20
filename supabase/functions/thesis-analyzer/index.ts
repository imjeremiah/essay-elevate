/**
 * @file Supabase Edge Function for analyzing and improving thesis statements.
 *
 * This function receives a thesis statement and uses the OpenAI API to analyze
 * its clarity and strength, providing structured feedback and improved alternatives.
 */

import { corsHeaders } from '../_shared/cors.ts';
import { OpenAI } from 'https://deno.land/x/openai@v4.47.1/mod.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const client = new OpenAI({ apiKey: OPENAI_API_KEY });

const SYSTEM_PROMPT = `
You are a world-class university writing professor who specializes in helping students craft strong, clear, and arguable thesis statements.

Rules:
1.  You will be given a JSON object with a "thesis" field containing the user's thesis statement.
2.  Your task is to analyze this thesis and provide constructive feedback and alternatives.
3.  Your response MUST be a JSON object with a single key: "analysis".
4.  The "analysis" object MUST have the following structure:
    {
      "summary": "A 2-3 sentence constructive critique of the original thesis. Be encouraging but direct. Identify its strengths and weaknesses regarding clarity, arguability, and specificity.",
      "alternatives": [
        {
          "title": "A descriptive title for the alternative, e.g., 'More Specific', 'More Arguable', 'More Nuanced'.",
          "thesis": "The improved thesis statement."
        },
        ...
      ]
    }
5.  You MUST provide exactly 3 alternatives.
6.  The alternatives should not just be rephrasings. Each should demonstrate a different way to improve the thesis (e.g., one might be more specific, one might introduce a counter-argument, one might be more complex).
7.  The tone should be encouraging, expert, and helpful.

Example:
User's thesis: "Technology has changed society in many ways."

Your JSON response:
{
  "analysis": {
    "summary": "This is a solid start that correctly identifies a broad topic. However, it's currently more of an observation than an argument. A strong thesis needs to make a specific, debatable claim that you can prove with evidence. Let's explore some ways to make it more focused and compelling.",
    "alternatives": [
      {
        "title": "More Specific & Arguable",
        "thesis": "The proliferation of social media has fundamentally altered political discourse by creating echo chambers that diminish the potential for cross-partisan dialogue."
      },
      {
        "title": "Focus on a Counter-Argument",
        "thesis": "While many celebrate technology's role in connecting people, the rise of algorithm-driven content platforms has ironically led to greater social isolation and a decline in genuine community engagement."
      },
      {
        "title": "More Nuanced Perspective",
        "thesis": "By both democratizing access to information and enabling the rapid spread of misinformation, the internet presents a complex paradox, fundamentally reshaping modern society's relationship with truth."
      }
    ]
  }
}
`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { thesis } = await req.json();

    if (!thesis || typeof thesis !== 'string') {
      return new Response(JSON.stringify({ error: 'Thesis input is required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const completion = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify({ thesis }) },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7, // Higher temperature for more creative alternatives
    });

    const responseJson = completion.choices[0].message.content;

    if (!responseJson) {
      return new Response(JSON.stringify({ error: 'No response from AI.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const analysis = JSON.parse(responseJson);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error processing thesis analysis:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 