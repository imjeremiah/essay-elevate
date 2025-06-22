# API Documentation: EssayElevate

This document provides comprehensive API documentation for all Supabase Edge Functions used in the EssayElevate application.

---

## API Overview

### Base URL
```
https://[your-project-id].supabase.co/functions/v1/
```

### Authentication
All Edge Functions require authentication via Supabase JWT token:
```
Authorization: Bearer [jwt-token]
```

### Content Type
All requests must include:
```
Content-Type: application/json
```

---

## 1. Grammar Check API

### Endpoint
```
POST /grammar-check
```

### Description
Provides real-time grammar and spelling correction with educational explanations.

### Request Schema
```typescript
interface GrammarCheckRequest {
  text: string;                    // Text to analyze (max 2000 chars)
  mode?: 'fast' | 'comprehensive'; // Optional: default 'comprehensive'
  maxSuggestions?: number;         // Optional: max suggestions to return (default 10)
  includeAcademicVoice?: boolean;  // Optional: include style suggestions (default false)
}
```

### Response Schema
```typescript
interface GrammarCheckResponse {
  suggestions: GrammarSuggestion[];
  processingTime?: number;         // Optional: processing time in ms
}

interface GrammarSuggestion {
  original: string;                // Original incorrect text
  suggestion: string;              // Corrected text
  explanation: string;             // Educational explanation
  type: 'grammar' | 'spelling' | 'punctuation';
  confidence: number;              // 0-1 confidence score
  position?: {                     // Optional: position in text
    start: number;
    end: number;
  };
}
```

### Example Request
```json
{
  "text": "This sentence have some errors in it.",
  "mode": "fast",
  "maxSuggestions": 5
}
```

### Example Response
```json
{
  "suggestions": [
    {
      "original": "have",
      "suggestion": "has",
      "explanation": "The subject 'This sentence' is singular, so use the singular verb 'has'.",
      "type": "grammar",
      "confidence": 0.95,
      "position": {
        "start": 14,
        "end": 18
      }
    }
  ],
  "processingTime": 1200
}
```

### Error Responses
```typescript
// 400 Bad Request
{
  "error": "Text input is required and must be under 2000 characters."
}

// 429 Too Many Requests
{
  "error": "Rate limit exceeded. Please wait before making another request."
}

// 500 Internal Server Error
{
  "error": "AI service temporarily unavailable. Please try again."
}
```

---

## 2. Academic Voice API

### Endpoint
```
POST /academic-voice
```

### Description
Transforms casual language into sophisticated academic tone appropriate for high school essays.

### Request Schema
```typescript
interface AcademicVoiceRequest {
  text: string;                    // Text to analyze (max 1500 chars)
  gradeLevel?: 9 | 10 | 11 | 12;  // Optional: target grade level (default 9)
  context?: 'essay' | 'research' | 'general'; // Optional: writing context
}
```

### Response Schema
```typescript
interface AcademicVoiceResponse {
  suggestions: AcademicVoiceSuggestion[];
}

interface AcademicVoiceSuggestion {
  original: string;                // Casual phrase
  suggestion: string;              // Academic alternative
  explanation: string;             // Why this improves the writing
  category: 'formality' | 'precision' | 'sophistication';
  difficulty: 'easy' | 'medium' | 'advanced';
}
```

### Example Request
```json
{
  "text": "This is a really big deal because it shows that students are bad at writing and stuff.",
  "gradeLevel": 9,
  "context": "essay"
}
```

### Example Response
```json
{
  "suggestions": [
    {
      "original": "a really big deal",
      "suggestion": "particularly significant",
      "explanation": "Uses more precise academic language instead of casual expressions.",
      "category": "formality",
      "difficulty": "easy"
    },
    {
      "original": "and stuff",
      "suggestion": "among other factors",
      "explanation": "Replaces vague casual language with specific academic phrasing.",
      "category": "precision",
      "difficulty": "medium"
    }
  ]
}
```

---

## 3. Thesis Analyzer API

### Endpoint
```
POST /thesis-analyzer
```

### Description
Analyzes thesis statements and provides structured improvement suggestions with alternatives.

### Request Schema
```typescript
interface ThesisAnalyzerRequest {
  thesis: string;                  // Thesis statement to analyze (max 500 chars)
  essayType?: 'argumentative' | 'analytical' | 'expository'; // Optional
  subject?: string;                // Optional: essay subject/topic
}
```

### Response Schema
```typescript
interface ThesisAnalyzerResponse {
  analysis: ThesisAnalysis;
}

interface ThesisAnalysis {
  summary: string;                 // 2-3 sentence critique and encouragement
  alternatives: ThesisAlternative[];
  strengths?: string[];            // Optional: what's already good
  weaknesses?: string[];           // Optional: areas for improvement
}

interface ThesisAlternative {
  title: string;                   // Descriptive title for the improvement
  thesis: string;                  // Improved thesis statement
  reasoning: string;               // Why this version is better
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}
```

### Example Request
```json
{
  "thesis": "Technology has changed society in many ways.",
  "essayType": "argumentative",
  "subject": "Social Media Impact"
}
```

### Example Response
```json
{
  "analysis": {
    "summary": "This is a good start that identifies an important topic! However, it's more like a fact that everyone would agree with. A strong thesis needs to make a specific claim that people might disagree with—something you can prove with examples.",
    "alternatives": [
      {
        "title": "More Specific & Arguable",
        "thesis": "Social media platforms have increased anxiety among teenagers by creating unrealistic standards for social comparison.",
        "reasoning": "This version makes a specific, debatable claim about a particular technology and its specific effect.",
        "difficulty": "intermediate"
      },
      {
        "title": "Clearer Position",
        "thesis": "While smartphones help us stay connected with friends globally, they have actually weakened face-to-face communication skills in younger generations.",
        "reasoning": "This acknowledges both sides while taking a clear position that can be argued with evidence.",
        "difficulty": "advanced"
      },
      {
        "title": "Evidence-Based Claim",
        "thesis": "Video games should not be banned in schools because they can actually help students develop problem-solving skills and work better in teams.",
        "reasoning": "This makes a clear argument that students can support with research and examples.",
        "difficulty": "beginner"
      }
    ],
    "weaknesses": ["Too broad", "Not arguable", "Lacks specific focus"]
  }
}
```

---

## 4. Argument Coach API

### Endpoint
```
POST /argument-coach
```

### Description
Performs comprehensive document analysis to identify logical gaps, weak reasoning, and argument flow issues.

### Request Schema
```typescript
interface ArgumentCoachRequest {
  content: string;                 // Full document content (max 5000 chars)
  analysisType?: 'quick' | 'comprehensive'; // Optional: analysis depth
  focusAreas?: ArgumentFocusArea[]; // Optional: specific areas to analyze
}

type ArgumentFocusArea = 'logical_flow' | 'evidence' | 'fallacies' | 'consistency' | 'claim_support';
```

### Response Schema
```typescript
interface ArgumentCoachResponse {
  analysis: DocumentAnalysis;
  suggestions: ArgumentSuggestion[];
}

interface DocumentAnalysis {
  overallStrength: 'weak' | 'moderate' | 'strong';
  mainIssues: string[];            // Key problems identified
  flowProblems: string[];          // Logical flow issues
  score: number;                   // 0-100 argument quality score
}

interface ArgumentSuggestion {
  original: string;                // Problematic text
  suggestion: string;              // Improvement suggestion
  explanation: string;             // Why this is problematic
  category: 'logical_flow' | 'consistency' | 'claim_support' | 'fallacy';
  severity: 'high' | 'medium' | 'low';
  paragraphContext?: string;       // Surrounding paragraph for context
  position?: {
    start: number;
    end: number;
  };
}
```

### Example Request
```json
{
  "content": "Video games cause violence because my cousin played them and got in a fight. Therefore, all video games should be banned from schools. This is obvious to anyone who thinks about it.",
  "analysisType": "comprehensive",
  "focusAreas": ["fallacies", "logical_flow", "claim_support"]
}
```

### Example Response
```json
{
  "analysis": {
    "overallStrength": "weak",
    "mainIssues": [
      "Relies on anecdotal evidence instead of research",
      "Makes logical leaps without support",
      "Uses absolute statements without qualification"
    ],
    "flowProblems": [
      "Conclusion doesn't follow logically from evidence",
      "Missing consideration of alternative explanations"
    ],
    "score": 25
  },
  "suggestions": [
    {
      "original": "because my cousin played them and got in a fight",
      "suggestion": "Consider broader evidence beyond personal anecdotes",
      "explanation": "This is a hasty generalization fallacy—using one example to prove a general rule. You need more comprehensive evidence.",
      "category": "fallacy",
      "severity": "high",
      "paragraphContext": "Video games cause violence because my cousin played them and got in a fight.",
      "position": {
        "start": 25,
        "end": 65
      }
    }
  ]
}
```

---

## 5. Evidence Mentor API

### Endpoint
```
POST /evidence-mentor
```

### Description
Analyzes quote usage and provides guidance on proper evidence integration and analysis.

### Request Schema
```typescript
interface EvidenceMentorRequest {
  quote: string;                   // The quoted text
  context: string;                 // Surrounding paragraph context (max 1000 chars)
  source?: string;                 // Optional: source information
  citationStyle?: 'MLA' | 'APA' | 'Chicago'; // Optional: citation format
}
```

### Response Schema
```typescript
interface EvidenceMentorResponse {
  analysis: EvidenceAnalysis;
  suggestions: EvidenceSuggestion[];
}

interface EvidenceAnalysis {
  integration: 'poor' | 'adequate' | 'good' | 'excellent';
  issues: EvidenceIssue[];
  strengths?: string[];
}

type EvidenceIssue = 'quote_dropping' | 'missing_introduction' | 'no_analysis' | 'weak_connection' | 'citation_error';

interface EvidenceSuggestion {
  type: 'introduction' | 'analysis' | 'connection' | 'citation';
  suggestion: string;              // Specific improvement suggestion
  explanation: string;             // Why this helps
  example?: string;                // Optional: example implementation
}
```

### Example Request
```json
{
  "quote": "teens spend 7 hours daily on social platforms",
  "context": "Social media affects teenagers. According to Smith, \"teens spend 7 hours daily on social platforms.\" This is concerning for parents.",
  "source": "Smith, John. Digital Youth Study. 2023.",
  "citationStyle": "MLA"
}
```

### Example Response
```json
{
  "analysis": {
    "integration": "poor",
    "issues": ["quote_dropping", "no_analysis", "weak_connection"],
    "strengths": ["proper_citation"]
  },
  "suggestions": [
    {
      "type": "introduction",
      "suggestion": "Add context about who Smith is and why this study matters",
      "explanation": "Readers need to understand the credibility and relevance of your source.",
      "example": "According to Dr. John Smith, a leading researcher in digital behavior at Stanford University, \"teens spend 7 hours daily on social platforms.\""
    },
    {
      "type": "analysis",
      "suggestion": "Explain how this evidence supports your argument about social media's effects",
      "explanation": "Connect your evidence to your argument by explaining how the quote supports your point.",
      "example": "This extensive screen time suggests that social media has become a dominant force in teenagers' daily lives, potentially interfering with other important activities like homework, sleep, and family time."
    }
  ]
}
```

---

## 6. Critical Thinking Prompter API

### Endpoint
```
POST /critical-thinking-prompter
```

### Description
Generates thought-provoking questions to encourage deeper analysis and critical thinking.

### Request Schema
```typescript
interface CriticalThinkingRequest {
  paragraph: string;               // Paragraph to analyze (max 800 chars)
  promptType?: PromptType[];       // Optional: specific prompt types
  difficulty?: 'beginner' | 'intermediate' | 'advanced'; // Optional
}

type PromptType = 'evidence' | 'counter-argument' | 'assumption' | 'implication' | 'perspective' | 'causation';
```

### Response Schema
```typescript
interface CriticalThinkingResponse {
  prompts: CriticalThinkingPrompt[];
}

interface CriticalThinkingPrompt {
  id: string;                      // Unique identifier
  type: PromptType;
  question: string;                // The thought-provoking question
  explanation: string;             // Why this question helps thinking
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  followUp?: string;               // Optional: follow-up question
}
```

### Example Request
```json
{
  "paragraph": "Social media causes anxiety and depression in teenagers because they compare themselves to others online. This is why many teens feel bad about themselves.",
  "promptType": ["evidence", "causation", "perspective"],
  "difficulty": "intermediate"
}
```

### Example Response
```json
{
  "prompts": [
    {
      "id": "ctp_001",
      "type": "evidence",
      "question": "What specific evidence supports the claim that social media CAUSES anxiety rather than just being associated with it?",
      "explanation": "This helps you think about the difference between correlation and causation—a crucial distinction in academic writing.",
      "difficulty": "intermediate",
      "followUp": "Could there be other factors that cause both social media use and anxiety?"
    },
    {
      "id": "ctp_002",
      "type": "perspective",
      "question": "How might teenagers who benefit from social media connections disagree with this claim?",
      "explanation": "Considering alternative perspectives strengthens your argument by acknowledging complexity.",
      "difficulty": "intermediate"
    }
  ]
}
```

---

## Error Handling

### Standard Error Response Format
```typescript
interface ErrorResponse {
  error: string;                   // Human-readable error message
  code?: string;                   // Optional: error code for programmatic handling
  details?: Record<string, any>;   // Optional: additional error details
  timestamp: string;               // ISO 8601 timestamp
}
```

### Common HTTP Status Codes

| Status | Meaning | Common Causes |
|--------|---------|---------------|
| 200 | Success | Request processed successfully |
| 400 | Bad Request | Invalid input, missing required fields |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | User not authorized for this resource |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | AI service error, database error |
| 503 | Service Unavailable | OpenAI API temporarily down |

### Rate Limiting

All endpoints are rate-limited per user:
- **Grammar Check**: 60 requests per minute
- **Academic Voice**: 30 requests per minute  
- **Thesis Analyzer**: 10 requests per minute
- **Argument Coach**: 5 requests per minute
- **Evidence Mentor**: 20 requests per minute
- **Critical Thinking**: 15 requests per minute

### Rate Limit Headers
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640995200
```

---

## SDK Usage Examples

### JavaScript/TypeScript
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, anonKey);

// Grammar check example
async function checkGrammar(text: string) {
  const { data, error } = await supabase.functions.invoke('grammar-check', {
    body: { text, mode: 'fast' }
  });
  
  if (error) {
    console.error('Grammar check failed:', error);
    return null;
  }
  
  return data.suggestions;
}

// Academic voice example with error handling
async function improveAcademicVoice(text: string) {
  try {
    const { data, error } = await supabase.functions.invoke('academic-voice', {
      body: { text, gradeLevel: 9 }
    });
    
    if (error) throw error;
    return data.suggestions;
  } catch (err) {
    if (err.status === 429) {
      throw new Error('Rate limit exceeded. Please wait before trying again.');
    }
    throw new Error('Academic voice analysis failed: ' + err.message);
  }
}
```

### cURL Examples
```bash
# Grammar check
curl -X POST \
  'https://your-project.supabase.co/functions/v1/grammar-check' \
  -H 'Authorization: Bearer your-jwt-token' \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "This sentence have errors.",
    "mode": "fast"
  }'

# Thesis analysis
curl -X POST \
  'https://your-project.supabase.co/functions/v1/thesis-analyzer' \
  -H 'Authorization: Bearer your-jwt-token' \
  -H 'Content-Type: application/json' \
  -d '{
    "thesis": "Technology has changed society.",
    "essayType": "argumentative"
  }'
```

---

## Performance Considerations

### Response Time Targets
- Grammar Check: < 2 seconds
- Academic Voice: < 2 seconds
- Thesis Analyzer: < 3 seconds
- Argument Coach: < 4 seconds
- Evidence Mentor: < 2 seconds
- Critical Thinking: < 1.5 seconds

### Optimization Tips
1. **Use appropriate modes**: Use `fast` mode for real-time checks
2. **Implement caching**: Cache responses client-side for identical requests
3. **Batch requests**: For multiple paragraphs, consider batching if possible
4. **Handle timeouts**: Implement retry logic with exponential backoff

### Content Limits
- Grammar Check: 2,000 characters
- Academic Voice: 1,500 characters
- Thesis Analyzer: 500 characters
- Argument Coach: 5,000 characters
- Evidence Mentor: 1,000 characters (context)
- Critical Thinking: 800 characters

---

This API documentation provides comprehensive guidance for integrating with all EssayElevate AI services. 