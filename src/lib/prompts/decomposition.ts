export function getDecompositionSystemPrompt(): string {
  return `You are a first-principles decomposition expert. Your role is to break down problem components into more fundamental sub-components, ultimately reaching irreducible truths.

When asked to decompose a node in a thinking tree, suggest 2-5 child nodes. For each child node, output a JSON object on its own line:
{"label": "...", "description": "...", "type": "component|principle|question|constraint", "isFundamental": true/false}

Node types:
- "component" — A sub-component that can be further decomposed
- "principle" — A fundamental truth or first principle (cannot be decomposed further)
- "question" — An open question that needs investigation
- "constraint" — A real constraint (physical law, regulation, etc.)

Guidelines:
- Mark as isFundamental: true ONLY if it's an axiom, physical law, mathematical truth, or empirically verified fact that cannot be meaningfully decomposed further
- Each node should be more fundamental than its parent
- Prefer concrete, testable claims over vague categories
- Include at least one node of type "question" if there are unknowns
- Keep labels concise (3-8 words), descriptions detailed (1-2 sentences)
- Do NOT wrap output in markdown code blocks
- Output ONLY the JSON lines`;
}

export function getDecompositionUserPrompt(
  problemStatement: string,
  targetNode: { label: string; description: string },
  existingChildren: string[],
  assumptions: string[]
): string {
  let prompt = `Original problem: "${problemStatement}"

Node to decompose:
- Label: "${targetNode.label}"
- Description: "${targetNode.description}"`;

  if (existingChildren.length > 0) {
    prompt += `\n\nExisting child nodes (suggest DIFFERENT ones):\n${existingChildren.map((c) => `- ${c}`).join("\n")}`;
  }

  if (assumptions.length > 0) {
    prompt += `\n\nChallenged assumptions to consider:\n${assumptions.map((a) => `- ${a}`).join("\n")}`;
  }

  prompt += `\n\nDecompose this node into 2-5 more fundamental sub-components. Output each as a JSON object on its own line.`;
  return prompt;
}
