import { ParsedStage, ParsedStrategy, ParsedTask } from './llm.types';

export class ResponseParseError extends Error {
  constructor(message: string, public readonly raw?: string) {
    super(message);
  }
}

// Pure function. Tries hard to recover from common Claude quirks
// (leading/trailing prose, markdown fences) before giving up. If the
// resulting JSON shape doesn't match what we asked for, throws
// ResponseParseError so the caller can decide whether to retry.

const FENCE_RE = /^```(?:json)?\s*([\s\S]+?)\s*```$/m;

function extractJson(raw: string): string {
  const trimmed = raw.trim();

  // 1. If wrapped in a markdown fence, extract the inner content.
  const fenced = FENCE_RE.exec(trimmed);
  if (fenced) return fenced[1].trim();

  // 2. If there's stray prose, slice from the first { to the last }.
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return trimmed;
}

function isString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0;
}

function validateTask(t: unknown, ctx: string): ParsedTask {
  if (!t || typeof t !== 'object') throw new ResponseParseError(`${ctx}: task must be an object`);
  const task = t as Record<string, unknown>;
  if (typeof task.task_order !== 'number') throw new ResponseParseError(`${ctx}: task_order missing`);
  if (!isString(task.title)) throw new ResponseParseError(`${ctx}: task title missing`);
  return { task_order: task.task_order, title: task.title.slice(0, 200) };
}

function validateStage(s: unknown, idx: number): ParsedStage {
  const ctx = `stage[${idx}]`;
  if (!s || typeof s !== 'object') throw new ResponseParseError(`${ctx}: stage must be an object`);
  const stage = s as Record<string, unknown>;
  if (typeof stage.stage_order !== 'number') throw new ResponseParseError(`${ctx}: stage_order missing`);
  if (!isString(stage.title)) throw new ResponseParseError(`${ctx}: title missing`);
  if (!Array.isArray(stage.tasks) || stage.tasks.length === 0) {
    throw new ResponseParseError(`${ctx}: tasks must be a non-empty array`);
  }
  return {
    stage_order: stage.stage_order,
    title: stage.title.slice(0, 100),
    description: isString(stage.description) ? stage.description : '',
    tasks: stage.tasks.map((t, i) => validateTask(t, `${ctx}.tasks[${i}]`)),
  };
}

export function parseStrategyResponse(raw: string): ParsedStrategy {
  const json = extractJson(raw);
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (err) {
    throw new ResponseParseError(`Invalid JSON from LLM: ${(err as Error).message}`, raw);
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new ResponseParseError('LLM response is not an object', raw);
  }
  const obj = parsed as Record<string, unknown>;
  if (!isString(obj.title)) throw new ResponseParseError('title missing', raw);
  if (!Array.isArray(obj.funnel_stages) || obj.funnel_stages.length === 0) {
    throw new ResponseParseError('funnel_stages must be a non-empty array', raw);
  }
  return {
    title: obj.title.slice(0, 200),
    funnel_stages: obj.funnel_stages.map((s, i) => validateStage(s, i)),
  };
}
