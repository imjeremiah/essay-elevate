/**
 * @file Contains all the demo content and data for the Quick Tour feature.
 * Each step showcases one AI feature with realistic examples.
 */

export interface TourStep {
  id: number;
  title: string;
  description: string;
  demoText: string;
  suggestions: Array<{
    original: string;
    suggestion: string;
    explanation: string;
    category: string;
  }>;
  alternatives?: Array<{
    title: string;
    thesis: string;
  }>;
  criticalQuestions?: string[];
  interactionType: 'click-suggestion' | 'watch-demo' | 'see-alternatives';
  takeaway: string;
}

export const tourSteps: TourStep[] = [
  {
    id: 1,
    title: "Correctness",
    description: "I catch grammar and spelling errors as you type",
    demoText: "Me and my friend thinks this essay are really important for students.",
    suggestions: [
      {
        original: "Me and my friend",
        suggestion: "My friend and I",
        explanation: "Use 'I' instead of 'me' when it's the subject of the sentence.",
        category: "grammar"
      },
      {
        original: "thinks",
        suggestion: "think",
        explanation: "The subject 'My friend and I' is plural, so use 'think' not 'thinks'.",
        category: "grammar"
      },
      {
        original: "essay are",
        suggestion: "essay is",
        explanation: "The singular noun 'essay' requires the singular verb 'is'.",
        category: "grammar"
      }
    ],
    interactionType: 'click-suggestion',
    takeaway: "Real-time grammar checking helps you learn as you write"
  },
  {
    id: 2,
    title: "Clarity",
    description: "I transform casual language into academic tone",
    demoText: "This is a really big deal because it shows that social media is bad for teens and stuff.",
    suggestions: [
      {
        original: "a really big deal",
        suggestion: "particularly significant",
        explanation: "Uses more precise academic language instead of casual expressions.",
        category: "academic_voice"
      },
      {
        original: "and stuff",
        suggestion: "among other effects",
        explanation: "Replaces vague casual language with specific academic phrasing.",
        category: "academic_voice"
      }
    ],
    interactionType: 'click-suggestion',
    takeaway: "Elevate your writing from casual to college-ready"
  },
  {
    id: 3,
    title: "Evidence",
    description: "I teach you how to properly use quotes and connect them to your arguments",
    demoText: "Social media affects teenagers. According to Smith, \"teens spend 7 hours daily on social platforms.\" This is concerning for parents.",
    suggestions: [
      {
        original: "According to Smith, \"teens spend 7 hours daily on social platforms.\" This is concerning for parents.",
        suggestion: "According to Smith, \"teens spend 7 hours daily on social platforms,\" which suggests that excessive screen time may be interfering with other important activities like homework, sleep, and family time.",
        explanation: "Connect your evidence to your argument by explaining how the quote supports your point.",
        category: "evidence"
      }
    ],
    interactionType: 'click-suggestion',
    takeaway: "Move beyond quote-dropping to meaningful analysis"
  },
  {
    id: 4,
    title: "Arguments",
    description: "I identify weak reasoning and logical gaps in your arguments",
    demoText: "Video games cause violence because my cousin played them and got in a fight. Therefore, all video games should be banned from schools.",
    suggestions: [
      {
        original: "Video games cause violence because my cousin played them and got in a fight.",
        suggestion: "Consider broader evidence beyond personal anecdotes",
        explanation: "This is a hasty generalization fallacy - using one example to prove a general rule. You need more comprehensive evidence.",
        category: "fallacy"
      },
      {
        original: "Therefore, all video games should be banned from schools.",
        suggestion: "Consider less extreme alternatives",
        explanation: "This conclusion doesn't follow logically. Even if some games were problematic, a complete ban might be an overreaction.",
        category: "logical_flow"
      }
    ],
    interactionType: 'click-suggestion',
    takeaway: "Build stronger, more logical arguments"
  },
  {
    id: 5,
    title: "Thesis",
    description: "I help you build stronger, more specific thesis statements",
    demoText: "Technology has changed society in many ways.",
    suggestions: [],
    alternatives: [
      {
        title: "More Specific & Arguable",
        thesis: "Social media platforms have increased anxiety among teenagers by creating unrealistic standards for social comparison."
      },
      {
        title: "Clearer Position",
        thesis: "While smartphones connect people globally, they have weakened face-to-face communication skills in younger generations."
      },
      {
        title: "Evidence-Based Claim",
        thesis: "Online learning technology should be expanded in high schools because it allows for personalized learning and better prepares students for college."
      }
    ],
    interactionType: 'see-alternatives',
    takeaway: "Transform basic statements into powerful arguments"
  }
]; 