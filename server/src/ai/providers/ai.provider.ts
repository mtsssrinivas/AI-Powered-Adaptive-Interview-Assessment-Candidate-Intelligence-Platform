import { z } from 'zod';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

export interface CompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  promptVersion: string;
}

export interface StructuredCompletionResult<T> {
  data: T;
  rawResponse: string;
  model: string;
  provider: 'openrouter' | 'mock';
  tokensUsed: number;
  latencyMs: number;
}

export interface IAIProvider {
  name: 'openrouter' | 'mock';
  completeStructured<T>(
    systemPrompt: string,
    userPrompt: string,
    schema: z.ZodType<T>,
    options: CompletionOptions
  ): Promise<StructuredCompletionResult<T>>;
}

export class OpenRouterProvider implements IAIProvider {
  name = 'openrouter' as const;

  async completeStructured<T>(
    systemPrompt: string,
    userPrompt: string,
    schema: z.ZodType<T>,
    options: CompletionOptions
  ): Promise<StructuredCompletionResult<T>> {
    const startTime = Date.now();
    const model = options.model || env.OPENROUTER_MODEL;

    if (!env.OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY is not configured');
    }

    const response = await fetch(`${env.OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://interviewiq.ai',
        'X-Title': 'InterviewIQ 2.0 Assessment Platform',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: `${systemPrompt}\n\nIMPORTANT: You must return ONLY valid, raw JSON matching the required schema. Do not enclose in markdown ticks or include any commentary.`,
          },
          { role: 'user', content: userPrompt },
        ],
        temperature: options.temperature ?? 0.2,
        max_tokens: options.maxTokens ?? 4000,
        response_format: { type: 'json_object' },
      }),
    });

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API call failed [${response.status}]: ${errorText}`);
    }

    const jsonResponse: any = await response.json();
    const content = jsonResponse.choices?.[0]?.message?.content;
    const tokensUsed = jsonResponse.usage?.total_tokens || 0;

    if (!content) {
      throw new Error('OpenRouter returned empty completion content');
    }

    let parsedJson: any;
    try {
      parsedJson = JSON.parse(content);
    } catch {
      // Clean possible markdown code fence
      const cleaned = content.replace(/```json\s*|\s*```/g, '').trim();
      parsedJson = JSON.parse(cleaned);
    }

    // Strict Zod schema validation
    const validatedData = schema.parse(parsedJson);

    return {
      data: validatedData,
      rawResponse: content,
      model,
      provider: 'openrouter',
      tokensUsed,
      latencyMs,
    };
  }
}

// Fallback deterministic AI provider for offline development & automated tests
export class MockAIProvider implements IAIProvider {
  name = 'mock' as const;

  async completeStructured<T>(
    systemPrompt: string,
    userPrompt: string,
    schema: z.ZodType<T>,
    options: CompletionOptions
  ): Promise<StructuredCompletionResult<T>> {
    const startTime = Date.now();

    // Check if this is a question generation request
    if (
      userPrompt.includes('INTERVIEW STAGE CONTEXT') ||
      userPrompt.includes('Target Competency Category') ||
      systemPrompt.includes('question generator') ||
      userPrompt.includes('Target role:')
    ) {
      const skillMatch = userPrompt.match(/Specific Skill to Assess:\s*([^\n]+)/);
      const skill = skillMatch ? skillMatch[1].trim() : 'Node.js';
      const catMatch = userPrompt.match(/Target Competency Category:\s*([^\n]+)/);
      const category = catMatch ? catMatch[1].trim() : 'Backend';
      const diffMatch = userPrompt.match(/Calibrated Difficulty:\s*([^\n]+)/);
      const difficulty = (diffMatch ? diffMatch[1].trim() : 'MEDIUM') as any;
      const typeMatch = userPrompt.match(/Target Question Type:\s*([^\n]+)/);
      const questionType = (typeMatch ? typeMatch[1].trim() : 'SCENARIO') as any;
      const evidenceMatch = userPrompt.match(/Candidate Resume Project Evidence:\s*"([^"]+)"/);
      const resumeEvidence = evidenceMatch ? evidenceMatch[1] : undefined;

      let questionText = `When architecting a high-throughput ${skill} service, how do you manage backpressure and handle downstream database connection exhaustion under burst traffic?`;
      if (resumeEvidence) {
        questionText = `In your resume project, you mentioned: "${resumeEvidence}". In that architecture, how did you ensure data consistency and manage worker failover when network partitions occurred?`;
      }

      const generatedQuestion = {
        id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        interviewId: 'interview_ctx',
        orderIndex: 0,
        question: questionText,
        category,
        skill,
        difficulty: ['EASY', 'MEDIUM', 'HARD', 'EXPERT'].includes(difficulty) ? difficulty : 'MEDIUM',
        expectedConcepts: [
          'Backpressure mechanisms and queue buffering',
          'Connection pool saturation and timeout bounds',
          'Idempotency and circuit breaker implementation',
        ],
        questionType: ['CONCEPTUAL', 'SCENARIO', 'SYSTEM_DESIGN', 'PROJECT_DEFENSE', 'CODING'].includes(questionType)
          ? questionType
          : 'SCENARIO',
        source: resumeEvidence ? 'RESUME_PROJECT' : 'PLAN',
        resumeEvidenceCited: resumeEvidence,
        followUpPotential: true,
        promptVersion: options.promptVersion,
        createdAt: new Date().toISOString(),
      };

      const validated = schema.parse(generatedQuestion as any);
      return {
        data: validated,
        rawResponse: JSON.stringify(validated),
        model: 'mock-evaluator',
        provider: 'mock',
        tokensUsed: 320,
        latencyMs: Date.now() - startTime,
      };
    }

    // Check if this is an answer evaluation request
    if (userPrompt.includes('CANDIDATE RESPONSE') || userPrompt.includes('QUESTION DETAILS')) {
      const ansMatch = userPrompt.match(/CANDIDATE RESPONSE:\s*"""([\s\S]*?)"""/);
      const answerText = ansMatch ? ansMatch[1].trim() : '';

      // Determine score based on answer content
      let correctness = 40;
      let relevance = 45;
      let depth = 35;
      let problemSolving = 40;
      let communication = 50;
      let completeness = 40;

      const strengths: string[] = [];
      const weaknesses: string[] = [];
      const missingConcepts: string[] = [];

      if (answerText.length === 0 || answerText.toLowerCase().includes('idk') || answerText.toLowerCase().includes('no idea')) {
        correctness = 10;
        relevance = 20;
        depth = 10;
        problemSolving = 10;
        communication = 30;
        completeness = 10;
        weaknesses.push('Candidate did not provide a substantial technical answer.');
        missingConcepts.push('Core architectural principles', 'Failure handling', 'System state management');
      } else if (answerText.length > 80) {
        // Substantive answer
        correctness = 85;
        relevance = 90;
        depth = 80;
        problemSolving = 84;
        communication = 82;
        completeness = 80;
        strengths.push('Articulated solid reasoning regarding state distribution and buffering.');
        strengths.push('Understands the impact of connection exhaustion on microservice availability.');
        if (!answerText.toLowerCase().includes('idempotency')) {
          missingConcepts.push('Explicit idempotency key management during retry storms.');
        }
      } else {
        // Partially correct / short answer
        correctness = 62;
        relevance = 70;
        depth = 55;
        problemSolving = 58;
        communication = 65;
        completeness = 50;
        strengths.push('Addressed the basic scenario correctly.');
        weaknesses.push('Answer lacked deeper discussion of edge cases and failover protocols.');
        missingConcepts.push('Handling partition network splits', 'Backpressure signaling');
      }

      const overallScore = Math.round(
        (correctness + relevance + depth + problemSolving + communication + completeness) / 6
      );

      const evaluationOutput = {
        id: `eval_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        interviewId: 'interview_ctx',
        questionId: 'question_ctx',
        candidateAnswer: answerText,
        scores: {
          technicalCorrectness: correctness,
          relevance,
          depth,
          problemSolving,
          communication,
          completeness,
          overallScore,
        },
        strengths,
        weaknesses,
        missingConcepts,
        evidence: `Candidate stated: "${answerText.substring(0, 150)}${answerText.length > 150 ? '...' : ''}"`,
        recommendedFollowUp:
          overallScore >= 75
            ? 'How would you tune TCP keepalive and connection pooling to mitigate pool exhaustion?'
            : 'Can you walk through what happens at the socket level when a downstream database refuses connections?',
        confidence: 0.92,
        evaluationPromptVersion: options.promptVersion,
        evaluationLatencyMs: Date.now() - startTime,
        tokensUsed: 410,
        createdAt: new Date().toISOString(),
      };

      const validated = schema.parse(evaluationOutput as any);
      return {
        data: validated,
        rawResponse: JSON.stringify(validated),
        model: 'mock-evaluator',
        provider: 'mock',
        tokensUsed: 410,
        latencyMs: Date.now() - startTime,
      };
    }

    // Check if this is a preparation plan request
    if (userPrompt.includes('CANDIDATE PROFILE GAPS')) {
      const roleMatch = userPrompt.match(/Target Role:\s*([^\n]+)/);
      const targetRole = roleMatch ? roleMatch[1].trim() : 'Senior Backend Engineer';

      const planOutput = {
        userId: 'plan_ctx',
        generatedAt: new Date().toISOString(),
        targetRole,
        readinessGap: 28,
        recommendations: [
          {
            priority: 1,
            category: 'System Design',
            topic: 'Distributed Caching and Consistency Boundaries',
            reason: 'Demonstrated ambiguity when explaining write-through vs write-behind cache failure modes.',
            recommendedAction:
              'Design an LRU cache with Redis clustering. Practice handling cache stampedes via distributed mutex locking.',
            estimatedHours: 6,
            completed: false,
          },
          {
            priority: 2,
            category: 'Databases',
            topic: 'Transaction Isolation and Deadlock Detection in PostgreSQL',
            reason: 'Scored lower on transaction concurrency and snapshot isolation locks.',
            recommendedAction:
              'Review PostgreSQL MVCC internals. Simulate concurrent bank account transfers with SELECT ... FOR UPDATE.',
            estimatedHours: 4,
            completed: false,
          },
          {
            priority: 3,
            category: 'CS Fundamentals',
            topic: 'Graph Algorithms & Sliding Window Optimization',
            reason: 'Solid hash map skills, but room for acceleration on dynamic programming and two-pointer bounds.',
            recommendedAction:
              'Solve 5 medium-difficulty LeetCode problems on sliding windows and Dijkstra shortest path.',
            estimatedHours: 8,
            completed: false,
          },
        ],
      };

      const validated = schema.parse(planOutput as any);
      return {
        data: validated,
        rawResponse: JSON.stringify(validated),
        model: 'mock-evaluator',
        provider: 'mock',
        tokensUsed: 420,
        latencyMs: Date.now() - startTime,
      };
    }

    // Generate compliant mock based on text analysis
    const lines = userPrompt.split('\n').map((l) => l.trim()).filter(Boolean);
    const candidateName = lines.find((l) => l.length > 2 && !l.includes(':')) || 'Alex Mercer';

    const fallbackProfile = {
      candidateName: candidateName.replace(/[^a-zA-Z\s]/g, '').trim() || 'Alex Mercer',
      email: 'alex.mercer@example.com',
      phone: '+1 (555) 234-5678',
      summary: 'Experienced software engineer specialized in distributed backend services and cloud architecture.',
      skills: [
        {
          skill: 'Node.js',
          category: 'Backend',
          evidence: 'Built microservices using Node.js and TypeScript',
          source: 'resume',
          confidence: 0.95,
        },
        {
          skill: 'PostgreSQL',
          category: 'Databases',
          evidence: 'Designed relational schemas and query optimizations in PostgreSQL',
          source: 'resume',
          confidence: 0.9,
        },
        {
          skill: 'Redis',
          category: 'Databases',
          evidence: 'Implemented distributed caching with Redis',
          source: 'resume',
          confidence: 0.9,
        },
        {
          skill: 'Kafka',
          category: 'Backend',
          evidence: 'Constructed event-driven message pipelines using Apache Kafka',
          source: 'resume',
          confidence: 0.85,
        },
        {
          skill: 'Docker',
          category: 'DevOps',
          evidence: 'Containerized production workloads with multi-stage Docker builds',
          source: 'resume',
          confidence: 0.95,
        },
      ],
      projects: [
        {
          projectName: 'High-Throughput Fraud Detection Engine',
          description: 'Real-time financial transaction risk assessment platform processing 10k ops/sec.',
          technologies: ['Node.js', 'Kafka', 'Redis', 'PostgreSQL'],
          responsibilities: [
            'Architected distributed sliding-window velocity checks',
            'Implemented consumer group rebalance failover handlers',
          ],
          claimedOutcomes: ['Reduced false-positive fraud flags by 34%'],
          technicalConcepts: ['Event sourcing', 'Idempotency', 'Backpressure'],
          evidenceSnippet: 'Implemented event streaming via Kafka with sub-50ms latency',
        },
        {
          projectName: 'Distributed Consensus Storage Node',
          description: 'Raft-based replicated key-value storage engine with write-ahead logging.',
          technologies: ['C++', 'gRPC', 'RocksDB'],
          responsibilities: [
            'Implemented leader election and log compaction algorithms',
            'Benchmarked linearizable read performance under network partitions',
          ],
          claimedOutcomes: ['Maintained 99.99% availability during simulated network splits'],
          technicalConcepts: ['Consensus', 'WAL', 'State Machine Replication'],
          evidenceSnippet: 'Benchmarked Raft protocol under Jepsen partition tests',
        },
      ],
      experience: [
        {
          company: 'Nexus Cloud Systems',
          role: 'Senior Backend Engineer',
          duration: '2022 - Present',
          responsibilities: ['Maintained core distributed services', 'Reduced API P99 latency by 45%'],
          technologies: ['TypeScript', 'Express', 'PostgreSQL', 'Docker'],
        },
      ],
      education: [
        {
          institution: 'State University of Technology',
          degree: 'Bachelor of Science',
          fieldOfStudy: 'Computer Science',
          graduationYear: '2022',
        },
      ],
      certifications: ['AWS Certified Solutions Architect'],
      achievements: ['Published paper on low-latency stream consensus'],
    };

    const validatedData = schema.parse(fallbackProfile as any);

    return {
      data: validatedData,
      rawResponse: JSON.stringify(validatedData),
      model: options.model || 'mock-evaluator',
      provider: 'mock',
      tokensUsed: 450,
      latencyMs: Date.now() - startTime,
    };
  }
}
