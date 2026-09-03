import { KnowledgeChunk, TECHNICAL_KNOWLEDGE_CORPUS } from './knowledge.corpus';

export interface RetrievedContext {
  chunk: KnowledgeChunk;
  relevanceScore: number;
  snippet: string;
}

export class RetrievalEngine {
  private static corpus: KnowledgeChunk[] = TECHNICAL_KNOWLEDGE_CORPUS;

  private static tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s_-]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2);
  }

  static retrieveContext(
    query: string,
    category?: string,
    skill?: string,
    topK = 2
  ): RetrievedContext[] {
    const queryTokens = this.tokenize(`${query} ${category || ''} ${skill || ''}`);
    const results: RetrievedContext[] = [];

    for (const chunk of this.corpus) {
      let score = 0;
      const chunkTokens = this.tokenize(
        `${chunk.topic} ${chunk.skill} ${chunk.category} ${chunk.tags.join(' ')} ${chunk.content}`
      );

      // 1. Skill exact match boost
      if (skill && chunk.skill.toLowerCase().includes(skill.toLowerCase())) {
        score += 30;
      }

      // 2. Category match boost
      if (category && chunk.category.toLowerCase() === category.toLowerCase()) {
        score += 20;
      }

      // 3. Tag overlap boost
      for (const tag of chunk.tags) {
        if (queryTokens.includes(tag.toLowerCase())) {
          score += 15;
        }
      }

      // 4. Term frequency matching
      for (const qToken of queryTokens) {
        const occurrences = chunkTokens.filter((c) => c === qToken).length;
        if (occurrences > 0) {
          score += occurrences * 5;
        }
      }

      // 5. Topic match boost
      for (const qToken of queryTokens) {
        if (chunk.topic.toLowerCase().includes(qToken)) {
          score += 10;
        }
      }

      if (score > 0) {
        results.push({
          chunk,
          relevanceScore: score,
          snippet: chunk.content.substring(0, 250) + '...',
        });
      }
    }

    // Sort descending by relevance score
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return results.slice(0, topK);
  }

  static formatContextForPrompt(retrieved: RetrievedContext[]): string {
    if (retrieved.length === 0) return '';

    return `
TECHNICAL REFERENCE KNOWLEDGE (GROUND TRUTH ARCHITECTURE GUIDELINES):
${retrieved
  .map(
    (r, i) => `
[REFERENCE ${i + 1}] Topic: ${r.chunk.topic} (${r.chunk.category} - ${r.chunk.skill})
Content:
${r.chunk.content}
Verified Architecture Rules:
${r.chunk.verifiedArchitectureRules.map((rule) => `  * ${rule}`).join('\n')}
`
  )
  .join('\n')}
`;
  }

  static search(query: string, category?: string): KnowledgeChunk[] {
    const retrieved = this.retrieveContext(query, category, undefined, 10);
    return retrieved.map((r) => r.chunk);
  }

  static getTopics(): { category: string; count: number; topics: string[] }[] {
    const grouped = new Map<string, string[]>();
    for (const chunk of this.corpus) {
      const list = grouped.get(chunk.category) || [];
      list.push(chunk.topic);
      grouped.set(chunk.category, list);
    }

    return Array.from(grouped.entries()).map(([category, topics]) => ({
      category,
      count: topics.length,
      topics,
    }));
  }
}
