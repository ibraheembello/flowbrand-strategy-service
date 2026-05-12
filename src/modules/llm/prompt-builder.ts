import { GenerateStrategyDto } from '../strategies/dto/generate-strategy.dto';

// Pure function. No external dependencies, no I/O. Unit tested in
// prompt-builder.spec.ts. Keep it pure so tests stay fast and deterministic.

export const STRATEGY_SYSTEM_PROMPT = [
  'You are a senior marketing strategist creating actionable funnel plans.',
  'You ALWAYS reply with a single valid JSON object, no prose, no markdown fences.',
  'The JSON must match the schema given by the user message exactly.',
  'If a brief is too vague to plan specifically, still produce a structurally valid',
  'strategy with sensible defaults. Do not return errors.',
].join(' ');

export interface PromptInput {
  brief: GenerateStrategyDto;
  /** Number of funnel stages to generate. RFC fixes this at 4 for v1. */
  stageCount?: number;
  /** Tasks per stage. RFC fixes this at 3 for v1. */
  tasksPerStage?: number;
}

export function buildStrategyPrompt(input: PromptInput): string {
  const stageCount = input.stageCount ?? 4;
  const tasksPerStage = input.tasksPerStage ?? 3;
  const brief = input.brief;

  return [
    'Generate a marketing funnel strategy as JSON for the brief below.',
    '',
    '## Brief',
    `Product: ${brief.product_name}`,
    `Target audience: ${brief.target_audience}`,
    `Primary goal: ${brief.primary_goal}`,
    `Tone: ${brief.tone}`,
    brief.additional_context ? `Additional context: ${brief.additional_context}` : '',
    '',
    '## Requirements',
    `- Produce exactly ${stageCount} funnel stages in order.`,
    `- Each stage must have exactly ${tasksPerStage} concrete actionable tasks.`,
    '- title: a short product-relevant strategy name (max 80 chars).',
    '- Stage titles should reflect the funnel (Awareness, Consideration, Conversion, Retention or similar).',
    '- Task titles must be concrete actions (verbs first), max 120 chars.',
    '- Do not include any keys other than those in the schema.',
    '',
    '## Schema',
    '```json',
    '{',
    '  "title": "string, max 80",',
    '  "funnel_stages": [',
    '    {',
    '      "stage_order": 1,',
    '      "title": "string, max 80",',
    '      "description": "string, 1-2 sentences explaining the stage in context",',
    '      "tasks": [{ "task_order": 1, "title": "string, max 120" }]',
    '    }',
    '  ]',
    '}',
    '```',
    '',
    'Return ONLY the JSON object. No commentary.',
  ]
    .filter((line) => line !== null && line !== undefined)
    .join('\n');
}
