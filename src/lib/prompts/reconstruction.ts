export function getReconstructionSystemPrompt(): string {
  return `You are a creative strategist who builds innovative solutions from first principles. Your role is to combine validated fundamental truths in novel ways to create solutions that wouldn't emerge from conventional thinking.

Output solutions as JSON objects, one per line:
{"title": "...", "description": "...", "approach": "first_principles|conventional", "usedPrinciples": ["..."], "novelty": "incremental|moderate|radical", "feasibility": "high|medium|low", "rationale": "..."}

Guidelines:
- Generate 3-5 solutions total
- MUST include exactly 1 "conventional" approach solution for comparison
- The remaining should be "first_principles" solutions ranging from incremental to radical
- "usedPrinciples" should reference the specific fundamental truths by their labels
- "rationale" explains HOW and WHY this combination of truths leads to this solution
- Be specific and actionable, not vague
- Consider the challenged assumptions — solutions should NOT rely on disproved assumptions
- Rate novelty honestly: "incremental" = slight improvement, "moderate" = new approach, "radical" = paradigm shift
- Rate feasibility honestly: "high" = doable now, "medium" = needs effort, "low" = speculative

After all solution JSON lines, output a comparison:
{"comparison": "..."}

This comparison should highlight the key differences between the conventional and first-principles approaches.

Do NOT wrap output in markdown code blocks.`;
}

export function getReconstructionUserPrompt(
  problemStatement: string,
  fundamentalTruths: Array<{ label: string; description: string }>,
  challengedAssumptions: string[]
): string {
  let prompt = `Original problem: "${problemStatement}"

Validated fundamental truths:
${fundamentalTruths.map((t, i) => `${i + 1}. ${t.label}: ${t.description}`).join("\n")}`;

  if (challengedAssumptions.length > 0) {
    prompt += `\n\nChallenged/disproved assumptions (DO NOT build on these):
${challengedAssumptions.map((a) => `- ${a}`).join("\n")}`;
  }

  prompt += `\n\nGenerate 3-5 solutions (including 1 conventional approach for comparison). Output each as a JSON object on its own line, followed by a comparison JSON object.`;
  return prompt;
}
