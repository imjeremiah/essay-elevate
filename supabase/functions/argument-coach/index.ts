/**
 * @file This Edge Function provides an on-demand analysis of an entire text,
 * acting as an argument coach to identify logical fallacies, unsupported claims,
 * and weak reasoning.
 */

import { corsHeaders } from '../_shared/cors.ts';
import { OpenAI } from 'https://deno.land/x/openai@v4.47.1/mod.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const client = new OpenAI({ apiKey: OPENAI_API_KEY });

/**
 * Safely parse JSON with fallback handling for malformed responses
 */
function safeJsonParse(jsonString: string) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('JSON parsing failed, attempting to clean and retry:', error);
    
    // Try to fix common JSON issues
    try {
      // Remove any control characters and fix common escaping issues
      let cleaned = jsonString
        .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
        .replace(/\\n/g, ' ') // Replace literal \n with spaces
        .replace(/\\r/g, ' ') // Replace literal \r with spaces  
        .replace(/\\t/g, ' ') // Replace literal \t with spaces
        .replace(/\n/g, ' ') // Replace actual newlines with spaces
        .replace(/\r/g, ' ') // Replace actual carriage returns with spaces
        .replace(/\t/g, ' ') // Replace actual tabs with spaces
        .replace(/"/g, '"') // Fix smart quotes
        .replace(/"/g, '"') // Fix smart quotes
        .replace(/'/g, "'") // Fix smart apostrophes
        .replace(/'/g, "'"); // Fix smart apostrophes
      
      // Try to find the JSON object bounds
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      
      if (start !== -1 && end !== -1 && end > start) {
        cleaned = cleaned.substring(start, end + 1);
      }
      
      return JSON.parse(cleaned);
    } catch (secondError) {
      console.error('JSON cleaning also failed:', secondError);
      // Return a safe fallback structure
      return {
        suggestions: [],
        documentAnalysis: {
          overallStrength: "moderate",
          mainIssues: ["Unable to analyze due to processing error"],
          flowProblems: []
        }
      };
    }
  }
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set.');
    }

    const { text } = await req.json();

    if (!text) {
      return new Response(JSON.stringify({ error: 'No text provided.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const completion = await client.chat.completions.create({
      model: 'gpt-4o', // Better model for complex argument analysis
      messages: [
        {
          role: 'system',
          content: `You are a friendly high school writing coach who helps 9th grade students spot weak arguments and make them stronger. Use simple, encouraging language that a 9th grader would understand.

LOOK FOR THESE ISSUES:
1. **fallacy** - Logical mistakes like:
   - Attacking the person instead of their argument ("She's weird, so her idea is wrong")
   - Only giving two choices when there are more ("You're either with us or against us")
   - Using just one example to prove everything ("My friend got sick, so all food is bad")
   - Misrepresenting someone's argument to make it easier to attack
2. **claim_support** - Big statements that need more proof or examples
3. **consistency** - Saying two things that contradict each other
4. **logical_flow** - Ideas that don't connect well or jump around

For each problem, use the EXACT sentence and explain what's wrong using vocabulary a 9th grader would know. Be encouraging and helpful, not harsh.

Return JSON format:
{
  "suggestions": [
    {
      "original": "exact problematic sentence from the text",
      "suggestion": "",
      "explanation": "Simple, friendly explanation of what's wrong and how to fix it (9th grade vocabulary)",
      "category": "fallacy|claim_support|consistency|logical_flow",
      "severity": "high|medium|low"
    }
  ],
  "documentAnalysis": {
    "overallStrength": "weak|moderate|strong",
    "mainIssues": ["main problems found using simple language"],
    "flowProblems": []
  }
}

BE THOROUGH but ENCOURAGING - find problems but explain them in a way that helps the student learn, not feel bad.`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 1500, // Increased from 800 to allow more comprehensive analysis
    });

    const responseContent = completion.choices[0].message.content;
    if (!responseContent) {
      throw new Error('No content in OpenAI response.');
    }

    // Use safe JSON parsing instead of direct JSON.parse
    const analysisResult = safeJsonParse(responseContent);

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