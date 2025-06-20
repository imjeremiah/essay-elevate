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
      model: 'gpt-4o-mini', // Faster model for sub-2-second performance
      messages: [
        {
          role: 'system',
          content: `You are a high school writing tutor who specializes in helping 9th grade students with argumentative writing. Analyze the text for reasoning mistakes, unsupported claims, weak arguments, and writing flow issues. Find problematic sentences and provide categorized feedback using simple, encouraging language.

Identify these issues and assign categories:
- **claim_support**: Statements without enough evidence or support
- **fallacy**: Reasoning mistakes (like attacking the person instead of their idea, misrepresenting someone's argument, or presenting only two choices when there are more)
- **consistency**: Contradictions or mixed-up positions within the text
- **logical_flow**: Poor transitions, unclear connections between ideas, or confusing sequence

For each issue, determine how serious it is: "high", "medium", or "low"

Return your response as a JSON object with this format: 
{
  "suggestions": [...],
  "documentAnalysis": {
    "overallStrength": "weak|moderate|strong",
    "mainIssues": ["summary of 2-3 most important problems"],
    "flowProblems": ["issues with how ideas connect"]
  }
}

Each suggestion: { 
  "original": "exact sentence", 
  "suggestion": "", 
  "explanation": "Clear, helpful explanation using vocabulary appropriate for 9th graders. Avoid academic jargon - use everyday language that a high school student would understand.",
  "category": "claim_support|fallacy|consistency|logical_flow",
  "severity": "high|medium|low",
  "paragraphContext": "brief context about where this appears"
}

When explaining reasoning mistakes, use simple terms:
- Instead of "ad hominem": "attacking the person instead of their idea"
- Instead of "straw man": "misrepresenting someone's argument"
- Instead of "false dichotomy": "presenting only two choices when there are more"
- Instead of "hasty generalization": "jumping to a conclusion based on too little evidence"

IMPORTANT: Always leave "suggestion" as an empty string "". Focus on coaching and teaching, not rewriting.

If no issues: { "suggestions": [], "documentAnalysis": { "overallStrength": "strong", "mainIssues": [], "flowProblems": [] } }`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
      max_tokens: 800,
    });

    const responseContent = completion.choices[0].message.content;
    if (!responseContent) {
      throw new Error('No content in OpenAI response.');
    }

    // The response from OpenAI is a JSON string, so we parse it and return.
    const analysisResult = JSON.parse(responseContent);

    // Map the specific categories from the AI to our suggestion system
    // The AI now provides specific categories, so we use those instead of generic 'argument'
    const typedSuggestions = analysisResult.suggestions.map(s => ({
      ...s,
      category: s.category || 'argument', // Use AI-provided category or fallback
    }));

    return new Response(JSON.stringify({ 
      suggestions: typedSuggestions,
      documentAnalysis: analysisResult.documentAnalysis || null
    }), {
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