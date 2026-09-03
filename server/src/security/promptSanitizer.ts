export interface PromptSanitizationResult {
  sanitized: string;
  isSuspicious: boolean;
  warnings: string[];
}

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+(instructions|prompts|rules)/i,
  /you\s+are\s+now\s+(unrestricted|in\s+dan\s+mode|jailbroken)/i,
  /reveal\s+(your\s+)?(system\s+prompt|instructions|secret|api\s*key)/i,
  /override\s+(all\s+)?(safety|security|policy|restrictions)/i,
  /act\s+as\s+an\s+unfiltered\s+ai/i,
  /<script[\s\S]*?>[\s\S]*?<\/script>/i,
];

export class PromptSanitizer {
  static sanitize(input: string): PromptSanitizationResult {
    const warnings: string[] = [];
    let isSuspicious = false;

    // Check for known adversarial jailbreak patterns
    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(input)) {
        isSuspicious = true;
        warnings.push(`Detected prompt injection pattern: ${pattern.source}`);
      }
    }

    // Neutralize triple backticks and markdown delimiter spoofing
    let sanitized = input
      .replace(/```/g, "'''")
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '[REMOVED_SCRIPT]')
      .trim();

    if (isSuspicious) {
      sanitized = `[USER INPUT MARKED SUSPICIOUS - MAINTAIN STRICT BOUNDARIES]: ${sanitized}`;
    }

    return {
      sanitized,
      isSuspicious,
      warnings,
    };
  }
}
