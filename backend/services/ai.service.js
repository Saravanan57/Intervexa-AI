const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

let genAI = null;
let aiEnabled = false;

if (process.env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    aiEnabled = true;
    console.log('Google Gemini AI initialized successfully.');
  } catch (err) {
    logger.error('Failed to initialize Gemini AI: %s', err.message);
  }
} else {
  console.log('GEMINI_API_KEY is not defined. Intervexa AI is running in Simulated AI Fallback Mode.');
}

/**
 * Sanitizes input text against LLM prompt injection attacks.
 */
const sanitizePromptInput = (input = '') => {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<system>[\s\S]*?<\/system>/gi, '')
    .replace(/\[system instruction\]/gi, '')
    .replace(/ignore previous instructions/gi, '[FILTERED_PROMPT_INJECTION]')
    .replace(/override system prompt/gi, '[FILTERED_PROMPT_INJECTION]')
    .trim();
};

const callGemini = async (prompt, systemInstruction = '', jsonMode = true) => {
  if (!aiEnabled) {
    throw new Error('AI Engine is offline');
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: jsonMode ? 'application/json' : 'text/plain'
      },
      systemInstruction
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    if (jsonMode) {
      return JSON.parse(text);
    }
    return text;
  } catch (err) {
    logger.error('Gemini API Error: %s', err.message);
    throw err;
  }
};

/**
 * Analyzes resume text and generates ATS score, keyword suggestions, formatting checks, readiness index, and certificates.
 */
const analyzeResume = async (resumeText, jobDescription = '') => {
  const systemInstruction = 'You are a professional ATS resume scanner and senior talent acquisition leader. Compare the candidate resume against the job description, audit formatting/grammar, identify matched and missing keywords, and output a detailed analytical scorecard matching Jobscan standards in strict JSON.';
  
  const prompt = `
  Analyze the following resume text and compare it against the provided Job Description.
  Output a JSON object containing:
  {
    "score": number (0 to 100 representing overall ATS match score),
    "summary": "string (brief summary of candidate profile)",
    "overallRecommendation": "string (overall recommendation for the candidate regarding this job)",
    "skills": ["string", ... (extracted skills from resume)],
    "keywordMatch": ["string", ... (skills/keywords present in both resume and job description)],
    "missingSkills": ["string", ... (critical skills/keywords required in job description but missing in resume)],
    "strengths": ["string", ... (core strengths)],
    "weaknesses": ["string", ... (core gaps)],
    "careerSuggestions": ["string", ... (suggested target job roles)],
    "sectionFeedback": {
      "summary": "string (feedback on candidate summary section)",
      "experience": "string (feedback on experience section alignment with job description)",
      "skills": "string (feedback on skills section alignment)",
      "education": "string (feedback on education section)"
    },
    "grammarIssues": [
      { "text": "string (original segment)", "suggestion": "string (fix/suggestion)" }
    ],
    "formattingIssues": [
      { "text": "string (original layout issue)", "suggestion": "string (improvement)" }
    ],
    "keywordSuggestions": ["string", ... (high value ATS industry keywords to add)],
    "jobReadinessPercentage": number (0 to 100),
    "suggestedCertifications": ["string", ...],
    "suggestedCourses": ["string", ...],
    "recommendedProjects": ["string", ...]
  }

  Job Description:
  ${jobDescription || 'Not specified - evaluate general industry standards'}

  Resume Text:
  ${resumeText}
  `;

  if (aiEnabled) {
    try {
      return await callGemini(prompt, systemInstruction, true);
    } catch (err) {
      logger.error('Failed to analyze resume with Gemini, using mock data.');
    }
  }

  return mockResumeAnalysis(resumeText, jobDescription);
};

/**
 * Generates custom interview questions.
 */
const generateInterviewQuestions = async (skills = [], type = 'Technical', experience = '1 Year', count = 5, difficulty = 'medium', domain = 'General') => {
  const systemInstruction = `You are an expert interviewer. Generate challenging questions for a ${type} interview specializing in ${domain}.`;
  
  const prompt = `
  Generate ${count} custom interview questions of type '${type}' and difficulty '${difficulty}' for a candidate with skills: [${skills.join(', ')}], targeting domain '${domain}' and experience level '${experience}'.
  Output questions including scenario, MCQs, or coding challenges.
  
  Output in strict JSON format matching this schema:
  {
    "questions": [
      {
        "text": "string (the question prompt)",
        "difficulty": "easy" | "medium" | "hard",
        "category": "string (React, Node.js, SQL, conflict resolution, case study)",
        "sampleAnswer": "string (expected response keywords or logic explanation)",
        "codeTemplate": "string (optional code editor stub for Coding interviews)"
      }
    ]
  }
  `;

  if (aiEnabled) {
    try {
      const response = await callGemini(prompt, systemInstruction, true);
      return response.questions || [];
    } catch (err) {
      logger.error('Failed to generate interview questions with Gemini, using mock data.');
    }
  }

  return mockInterviewQuestions(skills, type, experience, count, difficulty, domain);
};

/**
 * Evaluates an answer for a specific question text, yielding detailed granular metrics.
 */
const evaluateAnswer = async (questionText, candidateAnswer, type = 'Technical') => {
  const systemInstruction = `You are a strict technical grader. Evaluate the answer and give multidimensional scores in strict JSON format.`;
  
  const prompt = `
  Evaluate the answer given by the candidate for the following question.
  Question: "${questionText}"
  Candidate's Answer: "${candidateAnswer}"

  Output in strict JSON format matching this schema:
  {
    "feedbackScore": number (0 to 100),
    "feedbackContent": "string (critique and correct answer)",
    "technicalScore": number (0 to 100),
    "communicationScore": number (0 to 100),
    "confidenceScore": number (0 to 100),
    "grammarScore": number (0 to 100),
    "problemSolvingScore": number (0 to 100),
    "leadershipScore": number (0 to 100)
  }
  `;

  if (aiEnabled) {
    try {
      return await callGemini(prompt, systemInstruction, true);
    } catch (err) {
      logger.error('Failed to evaluate answer with Gemini, using mock feedback.');
    }
  }

  return mockAnswerEvaluation(questionText, candidateAnswer);
};

/**
 * Evaluates source code submitted for a coding challenge.
 */
const evaluateCode = async (questionText, codeSubmitted) => {
  const systemInstruction = 'You are a technical code evaluator. Grade this code implementation in strict JSON.';
  
  const prompt = `
  Analyze the source code submitted by a candidate:
  Question: "${questionText}"
  Submitted Code:
  \`\`\`
  ${codeSubmitted}
  \`\`\`

  Output in strict JSON format matching this schema:
  {
    "feedbackScore": number (0 to 100),
    "feedbackContent": "string (runtime/logical complexity breakdown)",
    "technicalScore": number (0 to 100),
    "communicationScore": number (0 to 100),
    "confidenceScore": number (0 to 100),
    "grammarScore": number (0 to 100),
    "problemSolvingScore": number (0 to 100),
    "leadershipScore": number (0 to 100)
  }
  `;

  if (aiEnabled) {
    try {
      return await callGemini(prompt, systemInstruction, true);
    } catch (err) {
      logger.error('Failed to evaluate code with Gemini, using mock feedback.');
    }
  }

  return mockCodeEvaluation(questionText, codeSubmitted);
};

/* ==========================================================================
   SIMULATED AI MOCK GENERATORS (FALLBACKS)
   ========================================================================== */

function mockResumeAnalysis(text = '', jobDescription = '') {
  const lowerText = text.toLowerCase();
  const lowerJd = jobDescription.toLowerCase();
  const detectedSkills = [];
  const skillList = ['javascript', 'typescript', 'angular', 'react', 'node.js', 'express', 'mongodb', 'docker', 'python', 'java', 'sql', 'aws', 'rest api', 'graphql', 'git', 'ci/cd', 'tailwind', 'bootstrap'];
  
  skillList.forEach(skill => {
    if (lowerText.includes(skill)) {
      detectedSkills.push(skill.toUpperCase());
    }
  });

  if (detectedSkills.length === 0) {
    detectedSkills.push('JAVASCRIPT', 'HTML', 'CSS');
  }

  const keywordMatch = [];
  const missingSkills = [];

  skillList.forEach(skill => {
    const inResume = lowerText.includes(skill);
    const inJd = lowerJd.includes(skill);
    if (inResume && inJd) {
      keywordMatch.push(skill.toUpperCase());
    } else if (inJd && !inResume) {
      missingSkills.push(skill.toUpperCase());
    }
  });

  if (keywordMatch.length === 0) {
    keywordMatch.push(...detectedSkills.slice(0, 3));
  }
  if (missingSkills.length === 0 && jobDescription.trim()) {
    missingSkills.push('DOCKER', 'CI/CD', 'UNIT TESTING');
  } else if (missingSkills.length === 0) {
    missingSkills.push('KUBERNETES', 'SYSTEM DESIGN');
  }

  const baseScore = Math.floor(Math.random() * 15) + 72; // 72-87
  const matchBonus = Math.min(keywordMatch.length * 4, 15);
  const score = Math.min(baseScore + matchBonus, 98);
  const readiness = Math.floor(score * 0.95);

  return {
    score,
    summary: 'Candidate demonstrates solid foundational capabilities in web development and full stack programming paradigms, emphasizing ' + detectedSkills.slice(0, 3).join(', ') + '.',
    overallRecommendation: score > 80 
      ? 'Strong ATS match! Your resume contains high-value domain keywords aligned with the job description. Focus on emphasizing quantifiable metrics.' 
      : 'Moderate ATS match. Incorporate the missing skills and keywords highlighted below to boost your ATS search ranking.',
    skills: detectedSkills,
    keywordMatch,
    missingSkills,
    sectionFeedback: {
      summary: 'Summary is clear but could highlight specific years of experience with ' + (keywordMatch[0] || 'core technologies') + '.',
      experience: 'Work experience bullet points demonstrate active ownership. Add measurable ROI metrics and project impact.',
      skills: 'Skills list covers essential framework tools. Consider grouping frontend, backend, and DevOps tools explicitly.',
      education: 'Education section is formatted cleanly for standard ATS parsers.'
    },
    strengths: [
      'Good baseline knowledge of ' + detectedSkills.slice(0, 2).join(', '),
      'Practical codebase version controls integration.',
      'Active document configuration and structure.'
    ],
    weaknesses: [
      'Missing cloud deployments tags (e.g. AWS, Azure).',
      'Limited testing descriptors.'
    ],
    careerSuggestions: [
      'Senior Full Stack Developer',
      'Backend Engineer',
      'System Analyst'
    ],
    grammarIssues: [
      { text: 'worked on implementing of APIs', suggestion: 'worked on implementing APIs' }
    ],
    formattingIssues: [
      { text: 'experience timeline overlap', suggestion: 'list chronological order cleanly with gap notations' }
    ],
    keywordSuggestions: missingSkills.length > 0 ? missingSkills : ['Docker', 'CI/CD pipeline', 'Microservices', 'Unit Testing'],
    jobReadinessPercentage: readiness,
    suggestedCertifications: ['AWS Certified Developer', 'Angular Developer Certification'],
    suggestedCourses: ['Advanced Node.js Design Patterns', 'Docker and Kubernetes Deep Dive'],
    recommendedProjects: ['Build a secure Multi-tenant REST gateway', 'Implement an Event-driven websocket chat client']
  };
}

function mockInterviewQuestions(skills = [], type = 'Technical', experience = '1 Year', count = 5, difficulty = 'medium', domain = 'General') {
  const pool = [
    { text: `Explain how you would optimize a slow database query in ${domain} applications.`, category: 'Database' },
    { text: `What is the significance of REST constraints? How does it affect ${domain} performance?`, category: 'API Design' },
    { text: `Describe the difference between microservices and monolith architecture, focusing on ${domain}.`, category: 'Architecture' },
    { text: `How do you manage secure tokens storage and check for cross site scripting vulnerabilities?`, category: 'Security' },
    { text: `Given a scenario where a deployment fails in production, how do you diagnose and roll back?`, category: 'DevOps' }
  ];

  const questions = [];
  for (let i = 0; i < count; i++) {
    const item = pool[i % pool.length];
    questions.push({
      text: item.text,
      difficulty: difficulty,
      category: item.category,
      sampleAnswer: 'Explain indexing, indexing techniques, query profiling, caching, and database read/write separations.',
      codeTemplate: type === 'Coding' ? `function solveChallenge() {\n  // Write solution code here\n}` : ''
    });
  }

  return questions;
}

function mockAnswerEvaluation(questionText, answer) {
  const words = answer.trim().split(/\s+/).length;
  let score = 50;

  if (words > 25) {
    score = Math.floor(Math.random() * 20) + 75; // 75-95
  } else if (words > 10) {
    score = Math.floor(Math.random() * 15) + 60; // 60-75
  } else {
    score = Math.floor(Math.random() * 15) + 30; // 30-45
  }

  return {
    feedbackScore: score,
    feedbackContent: score > 70 
      ? 'The response demonstrates strong concept familiarity, structures definitions logically, and covers core use-cases.' 
      : 'The answer is brief. Focus on explaining runtime mechanics, architectural designs, or real-life project integrations.',
    technicalScore: score,
    communicationScore: Math.round(score * 0.95),
    confidenceScore: Math.round(score * 1.05) > 100 ? 100 : Math.round(score * 1.05),
    grammarScore: 90,
    problemSolvingScore: Math.round(score * 0.9),
    leadershipScore: Math.round(score * 0.8)
  };
}

function mockCodeEvaluation(questionText, code) {
  const isGood = code && code.includes('function') && code.length > 30;
  const score = isGood ? 85 : 40;

  return {
    feedbackScore: score,
    feedbackContent: isGood 
      ? 'The solution is structurally sound, runs in O(N) time complexity, and avoids duplicate state traversals.' 
      : 'The solution is incomplete or syntactically flawed. Please define the standard input arguments and write a complete return script.',
    technicalScore: score,
    communicationScore: 80,
    confidenceScore: 85,
    grammarScore: 95,
    problemSolvingScore: score,
    leadershipScore: 70
  };
}

const generateFollowUpQuestion = async (questionText, candidateAnswer) => {
  const systemInstruction = 'You are an expert interviewer. Ask a short, focused follow-up question based on the candidate\'s answer.';
  const prompt = `
  The candidate was asked: "${questionText}"
  The candidate answered: "${candidateAnswer}"
  
  Generate a single short follow-up question (under 25 words) that drill down on a detail, a gap, or a technology mentioned in their answer.
  Output in strict JSON:
  {
    "followUp": "string (the follow up question)"
  }
  `;

  if (aiEnabled) {
    try {
      const res = await callGemini(prompt, systemInstruction, true);
      return res.followUp || `Could you elaborate on the core logic behind that approach?`;
    } catch (err) {
      logger.error('Failed to generate follow-up: %s', err.message);
    }
  }

  return `Could you expand on how you would implement or test that in a production setup?`;
};

module.exports = {
  analyzeResume,
  generateInterviewQuestions,
  evaluateAnswer,
  evaluateCode,
  generateFollowUpQuestion,
  isAIEnabled: () => aiEnabled
};
