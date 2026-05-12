import { parseStrategyResponse, ResponseParseError } from './response-parser';

const validJson = JSON.stringify({
  title: 'My Funnel',
  funnel_stages: [
    {
      stage_order: 1,
      title: 'Awareness',
      description: 'Reach the audience.',
      tasks: [
        { task_order: 1, title: 'Write a blog post' },
        { task_order: 2, title: 'Share on socials' },
      ],
    },
  ],
});

describe('parseStrategyResponse', () => {
  it('parses a clean JSON response', () => {
    const result = parseStrategyResponse(validJson);
    expect(result.title).toBe('My Funnel');
    expect(result.funnel_stages).toHaveLength(1);
    expect(result.funnel_stages[0].tasks).toHaveLength(2);
  });

  it('strips a markdown code fence', () => {
    const fenced = '```json\n' + validJson + '\n```';
    const result = parseStrategyResponse(fenced);
    expect(result.title).toBe('My Funnel');
  });

  it('extracts JSON when wrapped in leading and trailing prose', () => {
    const noisy = `Sure, here's your strategy:\n\n${validJson}\n\nHope this helps!`;
    const result = parseStrategyResponse(noisy);
    expect(result.title).toBe('My Funnel');
  });

  it('rejects malformed JSON', () => {
    expect(() => parseStrategyResponse('{not json')).toThrow(ResponseParseError);
  });

  it('rejects missing title', () => {
    const bad = JSON.stringify({ funnel_stages: [] });
    expect(() => parseStrategyResponse(bad)).toThrow(/title missing/);
  });

  it('rejects an empty funnel_stages array', () => {
    const bad = JSON.stringify({ title: 'X', funnel_stages: [] });
    expect(() => parseStrategyResponse(bad)).toThrow(/non-empty array/);
  });

  it('rejects a stage with no tasks', () => {
    const bad = JSON.stringify({
      title: 'X',
      funnel_stages: [{ stage_order: 1, title: 'A', tasks: [] }],
    });
    expect(() => parseStrategyResponse(bad)).toThrow(/tasks must be a non-empty array/);
  });

  it('truncates over-long strings to safe lengths', () => {
    const big = 'x'.repeat(500);
    const json = JSON.stringify({
      title: big,
      funnel_stages: [
        {
          stage_order: 1,
          title: big,
          description: 'ok',
          tasks: [{ task_order: 1, title: big }],
        },
      ],
    });
    const result = parseStrategyResponse(json);
    expect(result.title.length).toBeLessThanOrEqual(200);
    expect(result.funnel_stages[0].title.length).toBeLessThanOrEqual(100);
    expect(result.funnel_stages[0].tasks[0].title.length).toBeLessThanOrEqual(200);
  });
});
