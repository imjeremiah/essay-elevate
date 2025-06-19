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
          content: `You are an expert academic writing coach specializing in thesis statement analysis. Your task is to evaluate the provided thesis statement and provide structured, actionable feedback.

ANALYSIS CRITERIA:
1. **Clarity:** Is the thesis statement clear and understandable?
2. **Specificity:** Does it make a specific, arguable claim rather than a broad generalization?
3. **Academic Rigor:** Does it demonstrate sophisticated thinking and analysis?
4. **Arguability:** Can reasonable people disagree with this position?
5. **Scope:** Is the claim appropriately scoped for the intended essay length?
6. **Evidence Support:** Does the thesis suggest claims that can be supported with evidence?

EVALUATION SCALE:
- **Excellent (4/4):** Strong, clear, specific, and academically rigorous
- **Good (3/4):** Solid with minor improvements needed
- **Fair (2/4):** Adequate but needs significant strengthening
- **Poor (1/4):** Weak, unclear, or problematic

JSON-ONLY OUTPUT:
Return ONLY a valid JSON object with the following structure:
{
  "analysis": {
    "overall_score": number (1-4),
    "clarity_score": number (1-4),
    "specificity_score": number (1-4),
    "rigor_score": number (1-4),
    "strengths": [array of specific strengths],
    "weaknesses": [array of specific areas for improvement],
    "feedback": "Detailed constructive feedback paragraph"
  },
  "alternatives": [
    {
      "version": "Alternative 1",
      "text": "Improved thesis statement",
      "explanation": "Why this version is stronger"
    },
    {
      "version": "Alternative 2", 
      "text": "Another improved thesis statement",
      "explanation": "Why this version is stronger"
    }
  ]
}

Example response for "Technology is changing education":
{
  "analysis": {
    "overall_score": 1,
    "clarity_score": 3,
    "specificity_score": 1,
    "rigor_score": 1,
    "strengths": ["Clear and understandable"],
    "weaknesses": ["Too broad and vague", "Not arguable", "Lacks specific claims", "No clear academic position"],
    "feedback": "While this statement is clear, it suffers from being too broad and stating an obvious fact rather than making an arguable academic claim. A strong thesis should take a specific position that can be debated and supported with evidence."
  },
  "alternatives": [
    {
      "version": "Alternative 1",
      "text": "The integration of AI-powered personalized learning platforms in K-12 education has fundamentally transformed student engagement but has also exacerbated existing inequalities in academic achievement.",
      "explanation": "This version is more specific, arguable, and presents a complex claim that can be supported with evidence while acknowledging counterarguments."
    },
    {
      "version": "Alternative 2",
      "text": "While digital learning tools have increased accessibility to educational resources, their implementation in higher education has paradoxically reduced critical thinking skills among undergraduate students.",
      "explanation": "This thesis makes a counterintuitive claim that requires sophisticated analysis and evidence, making it academically rigorous and debatable."
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