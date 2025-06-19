/**
 * @file This Edge Function analyzes thesis statements for clarity, strength,
 * and academic rigor. It provides structured feedback and improved alternatives
 * to help users craft stronger thesis statements.
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

    // Call the OpenAI API to analyze the thesis statement.
    const completion = await openAI.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a helpful high school English teacher helping students improve their thesis statements. Your job is to give friendly, encouraging feedback and suggest simple improvements that high schoolers can understand and use.

WHAT MAKES A GOOD HIGH SCHOOL THESIS:
1. **Clear main idea:** Easy to understand what the student is arguing
2. **Takes a position:** Not just stating facts, but making an argument
3. **Specific enough:** Not too vague or general
4. **Can be supported:** Student can find evidence to back it up

SCORING (1-4):
- **4:** Great job! Strong and clear
- **3:** Good work, just needs small tweaks  
- **2:** On the right track, needs some help
- **1:** Needs significant work to get stronger

KEEP SUGGESTIONS HIGH SCHOOL LEVEL:
- Use simple, clear language that sounds like a high school student wrote it
- Focus on basic improvements, not college-level writing
- Make alternatives that are better but still age-appropriate
- Give encouraging feedback that helps students learn

JSON-ONLY OUTPUT:
Return ONLY a valid JSON object with this structure:
{
  "analysis": {
    "overall_score": number (1-4),
    "clarity_score": number (1-4),
    "specificity_score": number (1-4),
    "rigor_score": number (1-4),
    "strengths": [array of positive things about the thesis],
    "weaknesses": [array of things that could be improved],
    "feedback": "Encouraging paragraph explaining what's good and what to work on"
  },
  "alternatives": [
    {
      "version": "Alternative 1",
      "text": "Improved thesis that sounds like a high school student wrote it",
      "explanation": "Simple explanation of why this version is better"
    },
    {
      "version": "Alternative 2", 
      "text": "Another improved thesis at high school level",
      "explanation": "Simple explanation of why this version works well"
    }
  ]
}

Example for "There's a lot of stuff":
{
  "analysis": {
    "overall_score": 1,
    "clarity_score": 2,
    "specificity_score": 1,
    "rigor_score": 1,
    "strengths": ["Shows you have ideas to share"],
    "weaknesses": ["Too vague - what kind of stuff?", "Doesn't take a clear position", "Needs to be more specific"],
    "feedback": "You're on the right track with having something to say! Now let's make it more specific. What exactly are you talking about? What's your opinion about it? A good thesis tells readers exactly what you're going to argue."
  },
  "alternatives": [
    {
      "version": "Alternative 1",
      "text": "Social media has more negative effects than positive ones on teenagers today.",
      "explanation": "This version picks a specific topic and takes a clear position that you can argue for with examples and evidence."
    },
    {
      "version": "Alternative 2",
      "text": "High schools should start later in the morning because teenagers need more sleep to do their best in school.",
      "explanation": "This thesis makes a specific argument and gives a reason, making it easy to support with facts and research."
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
      const analysis = JSON.parse(responseContent);

      return new Response(JSON.stringify(analysis), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } catch (parseError) {
      console.error('Error parsing OpenAI JSON response:', parseError);
      throw new Error('Could not parse response from AI.');
    }
  } catch (error) {
    console.error('Error in thesis-analyzer function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 