// The shape we want Claude to return. Single source of truth. The prompt
// builder injects this schema text into the prompt, and the parser validates
// against it.

export interface ParsedStrategy {
  title: string;
  funnel_stages: ParsedStage[];
}

export interface ParsedStage {
  stage_order: number;
  title: string;
  description: string;
  tasks: ParsedTask[];
}

export interface ParsedTask {
  task_order: number;
  title: string;
}

export interface LlmGenerationResult {
  strategy: ParsedStrategy;
  input_tokens: number;
  output_tokens: number;
}
