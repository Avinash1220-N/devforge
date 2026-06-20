const { GoogleGenerativeAI } = require('@google/generative-ai');
const AIUsage = require('../models/AIUsage');
const { generateCacheKey } = require('../utils/hashGenerator');
const { getCachedResponse, saveCachedResponse } = require('../utils/cacheHelper');
const { cleanAndParseJson } = require('../utils/jsonValidator');

// Initialize Gemini SDK safely
let genAI = null;
const isMockMode = !process.env.GEMINI_API_KEY || 
                   process.env.GEMINI_API_KEY === 'mock_gemini_api_key' || 
                   process.env.GEMINI_API_KEY.startsWith('your_');

if (!isMockMode) {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  } catch (err) {
    console.error('Failed to initialize GoogleGenerativeAI SDK:', err.message);
  }
}

/**
 * Executes a Gemini prompt, handling caching, token usage tracking, and mock fallback simulation.
 * 
 * @param {object} params - Service parameters
 * @param {string} params.userId - The user running the request
 * @param {string} params.feature - Feature label (e.g. 'ats-check', 'resume-parse')
 * @param {string} params.promptText - The compiled prompt string
 * @param {string} params.version - Prompt template version
 * @param {object|string} params.rawInput - Original variables used in hashing
 * @param {boolean} [params.isJson=true] - Expect JSON response or plain text
 * @returns {Promise<any>} - The response string or parsed JSON object
 */
async function executeGeminiCall({ userId, feature, promptText, version, rawInput, isJson = true }) {
  const modelName = 'gemini-2.5-flash';
  const startTime = Date.now();

  // 1. Generate SHA-256 cache key hash
  const hashKey = generateCacheKey({
    feature,
    model: modelName,
    version,
    input: rawInput
  });

  // 2. Query Cache first
  try {
    const cached = await getCachedResponse(hashKey);
    if (cached) {
      // Log cache hit usage
      await AIUsage.create({
        userId,
        feature,
        tokensUsed: 0,
        responseTime: Date.now() - startTime,
        model: modelName,
        cacheHit: true
      });
      return cached;
    }
  } catch (cacheErr) {
    console.warn('Cache lookup failed, proceeding to query Gemini API:', cacheErr.message);
  }

  // 3. Handle Simulation Mode if Mock Key is configured
  if (isMockMode || !genAI) {
    console.log(`[Simulation Mode] Simulating response for feature: ${feature}`);
    const simulated = getMockResponse(feature, rawInput);
    
    // Write cache and usage log for mock run
    await saveCachedResponse(hashKey, simulated);
    await AIUsage.create({
      userId,
      feature,
      tokensUsed: 150, // simulated token count
      responseTime: Date.now() - startTime,
      model: modelName,
      cacheHit: false
    });
    return simulated;
  }

  // 4. Run real Gemini API call
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    
    const config = {};
    if (isJson) {
      config.responseMimeType = 'application/json';
    }

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: promptText }] }],
      generationConfig: config
    });

    const response = result.response;
    const responseText = response.text();
    const duration = Date.now() - startTime;

    // Retrieve token metadata
    let promptTokens = 0;
    let candidateTokens = 0;
    let totalTokens = 0;

    if (response.usageMetadata) {
      promptTokens = response.usageMetadata.promptTokenCount || 0;
      candidateTokens = response.usageMetadata.candidatesTokenCount || 0;
      totalTokens = response.usageMetadata.totalTokenCount || 0;
    } else {
      // Fallback rough estimate: 1 token per 4 chars of text
      promptTokens = Math.round(promptText.length / 4);
      candidateTokens = Math.round(responseText.length / 4);
      totalTokens = promptTokens + candidateTokens;
    }

    // Process result
    let finalResult = responseText;
    if (isJson) {
      finalResult = cleanAndParseJson(responseText);
    }

    // Save to Cache
    await saveCachedResponse(hashKey, finalResult);

    // Save to AIUsage log
    await AIUsage.create({
      userId,
      feature,
      tokensUsed: totalTokens,
      responseTime: duration,
      model: modelName,
      cacheHit: false
    });

    return finalResult;

  } catch (apiError) {
    console.error(`Gemini API execution error inside ${feature}:`, apiError);
    
    // Check if we can fallback to *any* cached data for this feature as a resilient fallback
    throw new Error(`AI generation failed: ${apiError.message || apiError}`);
  }
}

/**
 * Returns clean mock JSON payloads for developer workspace simulations
 */
function getMockResponse(feature, rawInput) {
  switch (feature) {
    case 'resume-parse':
      return {
        name: "Avinash Nani",
        email: "avinash.nani@mockforge.com",
        skills: ["Python", "TensorFlow", "React", "Node.js", "MongoDB", "SQL", "OpenCV"],
        education: [
          { school: "National Institute of Technology", degree: "B.Tech Computer Science", year: "2022 - 2026" }
        ],
        projects: [
          {
            title: "Real-Time Sign Language Recognition",
            description: "A computer vision model translating manual gesture sequences to textual alphabets.",
            techStack: ["Python", "TensorFlow", "MediaPipe", "OpenCV"]
          }
        ],
        experience: [
          {
            company: "AI Solutions Lab",
            role: "Machine Learning Intern",
            duration: "May 2025 - July 2025",
            bullets: [
              "Designed visual gesture classifiers running MediaPipe trackers, achieving 94% translation accuracy.",
              "Optimized inference frame rates from 12 FPS to 28 FPS, stabilizing webcam processing."
            ]
          }
        ]
      };
      
    case 'portfolio-generate':
      return `# Avinash Nani
AIML Intern | Full-Stack Software Engineer

Passionate software engineer specializing in computer vision pipelines and interactive React web interfaces. Experienced in crafting intelligent full-stack solutions.

## Skills
- Languages: Python, JavaScript, SQL, C++
- Technologies & Tools: TensorFlow, OpenCV, MediaPipe, React.js, Express, MongoDB, Node.js

## Projects
### Real-Time Sign Language Recognition
Developed an AI-powered hand gesture translation system using TensorFlow and OpenCV.
- **Tech**: Python, TensorFlow, MediaPipe, OpenCV
- [GitHub Repository](https://github.com/avinash-nani/sign-language-recognition)

## Experience
### Machine Learning Intern
AI Solutions Lab - Duration: May 2025 - July 2025
- Designed visual gesture classifiers running MediaPipe trackers, achieving 94% translation accuracy.
- Optimized inference frame rates from 12 FPS to 28 FPS, stabilizing webcam processing.

## Education
### B.Tech Computer Science
- National Institute of Technology
- 2022 - 2026`;

    case 'project-summary':
      const projName = typeof rawInput === 'object' ? (rawInput.name || 'Sign Language App') : 'Project';
      return {
        title: projName.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        summary: `Developed a high-performance computer vision system for ${projName}, integrating predictive deep learning frameworks and responsive APIs to automate gesture tracking and classification.`,
        technologies: ["Python", "TensorFlow", "OpenCV", "MediaPipe"]
      };

    case 'career-fit':
      return {
        readiness: 78,
        missingSkills: ["Docker", "AWS", "MLOps Pipelines", "PyTorch"],
        roadmap: [
          "Study containerization with Docker and deploy static endpoints to AWS ECS.",
          "Implement model registry logging using MLflow or DVC to master MLOps."
        ]
      };

    case 'ats-check':
      return {
        score: 82,
        strengths: [
          "Demonstrates strong engineering foundations in Python and React.",
          "Clear description of project achievements and durations."
        ],
        weaknesses: [
          "Lacks cloud integration details (AWS, Azure) or DevOps container scripts.",
          "Project list could feature concrete quantitative metrics."
        ],
        missingKeywords: ["Docker", "Kubernetes", "AWS", "CI/CD", "TypeScript"]
      };

    case 'portfolio-score':
      return {
        overall: 84,
        content: 85,
        projects: 88,
        skills: 82,
        seo: 80,
        ats: 85,
        feedback: [
          "Add details about cloud deployments (e.g. AWS or Vercel config).",
          "Ensure keywords like TypeScript and Next.js are grouped in your skills section."
        ]
      };

    case 'rewrite':
      return "Developed a responsive web application utilizing React, implementing modular styling and component patterns to increase rendering speeds by 30% and improve maintainability.";

    default:
      return isJson ? { text: "Mock response" } : "Mock response";
  }
}

module.exports = {
  executeGeminiCall,
  isMockMode
};
