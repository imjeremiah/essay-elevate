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
          content: `You are a writing tutor. Analyze the text for logical fallacies, unsupported claims, weak reasoning, and document flow issues. Find problematic sentences and provide categorized feedback.

Identify these issues and assign categories:
- **claim_support**: Statements without sufficient evidence or support
- **fallacy**: Logical fallacies (ad hominem, straw man, false dichotomy, etc.)
- **consistency**: Contradictions or inconsistent positions within the text
- **logical_flow**: Poor transitions, unclear connections between ideas, or illogical sequence

For each issue, determine its severity: "high", "medium", or "low"

Return your response as a JSON object with this format: 
{
  "suggestions": [...],
  "documentAnalysis": {
    "overallStrength": "weak|moderate|strong",
    "mainIssues": ["summary of 2-3 most important problems"],
    "flowProblems": ["issues with logical progression"]
  }
}

Each suggestion: { 
  "original": "exact sentence", 
  "suggestion": "", 
  "explanation": "Clear, helpful explanation for high school students",
  "category": "claim_support|fallacy|consistency|logical_flow",
  "severity": "high|medium|low",
  "paragraphContext": "brief context about where this appears"
}

IMPORTANT: Always leave "suggestion" as an empty string "". Focus on coaching, not rewriting.

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