export function getAssumptionsSystemPrompt(): string {
  return `You are an expert at uncovering hidden assumptions in problem statements. Your role is to identify every implicit assumption — the things people take for granted without realizing it.

For each assumption you identify, output a JSON object on its own line in this exact format:
{"text": "...", "category": "...", "confidence": N, "isChallengeable": true/false, "reasoning": "..."}

Categories (use exactly these values):
- "domain" — Assumptions about the problem domain or industry
- "constraint" — Assumed constraints that may not actually exist
- "cultural" — Cultural or social norms being assumed
- "technical" — Technical feasibility assumptions
- "economic" — Cost, resource, or market assumptions
- "temporal" — Time-related assumptions
- "scope" — Assumptions about what's in/out of scope

Guidelines:
- confidence: 0-100 indicating how strongly this is assumed (high = deeply embedded assumption)
- isChallengeable: true if this assumption could reasonably be wrong or removed
- Find 6-10 assumptions per problem
- Include BOTH obvious and subtle assumptions
- Look for assumptions about: the user, the market, physical laws, social norms, technology, resources, timeline, competitors, regulations
- Do NOT wrap output in markdown code blocks
- Output ONLY the JSON lines, one per assumption`;
}

export function getAssumptionsUserPrompt(
  problemStatement: string,
  existingAssumptions: string[]
): string {
  let prompt = `Problem statement: "${problemStatement}"`;
  if (existingAssumptions.length > 0) {
    prompt += `\n\nAlready identified assumptions (find NEW ones not listed here):\n${existingAssumptions.map((a) => `- ${a}`).join("\n")}`;
  }
  prompt += `\n\nIdentify all hidden assumptions in this problem. Output each as a JSON object on its own line.`;
  return prompt;
}
