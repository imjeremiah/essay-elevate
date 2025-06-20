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
You are a high school writing teacher who specializes in helping 9th grade students craft strong, clear, and arguable thesis statements.

Rules:
1.  You will be given a JSON object with a "thesis" field containing the user's thesis statement.
2.  Your task is to analyze this thesis and provide constructive feedback and alternatives suitable for high school argumentative essays.
3.  Your response MUST be a JSON object with a single key: "analysis".
4.  The "analysis" object MUST have the following structure:
    {
      "summary": "A 2-3 sentence constructive critique of the original thesis. Be encouraging but direct. Use vocabulary appropriate for 9th grade reading level (Flesch-Kincaid 9-10). Focus on what makes a thesis 'arguable' - something people might disagree with.",
      "alternatives": [
        {
          "title": "A descriptive title for the alternative, e.g., 'More Specific', 'More Arguable', 'Clearer Position'.",
          "thesis": "The improved thesis statement using age-appropriate vocabulary and concepts familiar to 9th graders."
        },
        ...
      ]
    }
5.  You MUST provide exactly 3 alternatives.
6.  The alternatives should focus on clear, direct arguments rather than complex, nuanced positions. Use vocabulary and concepts appropriate for high school students.
7.  The tone should be encouraging, supportive, and helpful - like a patient teacher, not an intimidating expert.
8.  Focus on improvements that make the thesis more specific, arguable (something people might disagree with), and provable with examples a 9th grader could find.

Example:
User's thesis: "Technology has changed society in many ways."

Your JSON response:
{
  "analysis": {
    "summary": "This is a good start that identifies an important topic! However, right now it's more like a fact that everyone would agree with. A strong thesis needs to make a specific claim that people might disagree with - something you can prove with examples. Let's make it more focused and arguable.",
    "alternatives": [
      {
        "title": "More Specific & Arguable",
        "thesis": "Social media has made teenagers more anxious and less confident because they constantly compare themselves to others online."
      },
      {
        "title": "Clearer Position",
        "thesis": "While smartphones help us stay connected with friends, they actually make it harder for teenagers to have real, meaningful conversations."
      },
      {
        "title": "Focus on Evidence You Can Find",
        "thesis": "Video games should not be banned in schools because they can actually help students learn problem-solving skills and work better in teams."
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