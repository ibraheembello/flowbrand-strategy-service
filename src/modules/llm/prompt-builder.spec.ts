import { GenerateStrategyDto, StrategyTone } from '../strategies/dto/generate-strategy.dto';
import { buildStrategyPrompt, STRATEGY_SYSTEM_PROMPT } from './prompt-builder';

const baseBrief: GenerateStrategyDto = {
  product_name: 'NimbusNotes',
  target_audience: 'Remote PMs',
  primary_goal: 'Acquire trial signups',
  tone: StrategyTone.Professional,
};

describe('buildStrategyPrompt', () => {
  it('includes every brief field', () => {
    const prompt = buildStrategyPrompt({
      brief: { ...baseBrief, additional_context: 'We have a Slack integration.' },
    });
    expect(prompt).toContain('NimbusNotes');
    expect(prompt).toContain('Remote PMs');
    expect(prompt).toContain('Acquire trial signups');
    expect(prompt).toContain('professional');
    expect(prompt).toContain('We have a Slack integration.');
  });

  it('omits additional_context when not provided', () => {
    const prompt = buildStrategyPrompt({ brief: baseBrief });
    expect(prompt).not.toContain('Additional context');
  });

  it('honours custom stage and task counts', () => {
    const prompt = buildStrategyPrompt({ brief: baseBrief, stageCount: 6, tasksPerStage: 5 });
    expect(prompt).toContain('exactly 6 funnel stages');
    expect(prompt).toContain('exactly 5 concrete actionable tasks');
  });

  it('defaults to 4 stages / 3 tasks per stage', () => {
    const prompt = buildStrategyPrompt({ brief: baseBrief });
    expect(prompt).toContain('exactly 4 funnel stages');
    expect(prompt).toContain('exactly 3 concrete actionable tasks');
  });

  it('asks for JSON-only output', () => {
    const prompt = buildStrategyPrompt({ brief: baseBrief });
    expect(prompt).toContain('Return ONLY the JSON object');
  });
});

describe('STRATEGY_SYSTEM_PROMPT', () => {
  it('instructs Claude to reply with valid JSON only', () => {
    expect(STRATEGY_SYSTEM_PROMPT).toContain('JSON');
    expect(STRATEGY_SYSTEM_PROMPT).toContain('no prose');
  });
});
