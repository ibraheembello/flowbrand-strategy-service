import Anthropic from '@anthropic-ai/sdk';
import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CustomHttpException } from '../../shared/exceptions/custom-http.exception';
import { GenerateStrategyDto } from '../strategies/dto/generate-strategy.dto';
import { LlmGenerationResult, ParsedStrategy } from './llm.types';
import { buildStrategyPrompt, STRATEGY_SYSTEM_PROMPT } from './prompt-builder';
import { parseStrategyResponse, ResponseParseError } from './response-parser';

@Injectable()
export class LlmService implements OnModuleInit {
  private readonly logger = new Logger(LlmService.name);
  private client: Anthropic;
  private model: string;
  private maxTokens: number;
  private timeoutMs: number;
  private fallbackEnabled: boolean;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const apiKey = this.config.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      // We allow boot without a key only if fallback is enabled. Useful in
      // demos and e2e tests where we don't want to hit the API.
      const fallbackOn = this.config.get<string>('STRATEGY_FALLBACK_ENABLED') === 'true';
      if (!fallbackOn) {
        throw new Error('ANTHROPIC_API_KEY is required (set STRATEGY_FALLBACK_ENABLED=true to allow boot without it).');
      }
    }
    this.client = new Anthropic({ apiKey: apiKey ?? 'placeholder-fallback-mode' });
    this.model = this.config.get<string>('ANTHROPIC_MODEL') ?? 'claude-sonnet-4-6';
    this.maxTokens = +(this.config.get<string>('ANTHROPIC_MAX_OUTPUT_TOKENS') ?? 4096);
    this.timeoutMs = +(this.config.get<string>('ANTHROPIC_TIMEOUT_MS') ?? 30000);
    this.fallbackEnabled = this.config.get<string>('STRATEGY_FALLBACK_ENABLED') === 'true';
  }

  /**
   * Calls Claude with the brief. On parse failure, retries once with a
   * "reformat as valid JSON" follow-up. After two failures total, falls back
   * to a canned strategy if STRATEGY_FALLBACK_ENABLED, otherwise rethrows.
   */
  async generate(brief: GenerateStrategyDto): Promise<LlmGenerationResult & { via: 'claude' | 'fallback' }> {
    const prompt = buildStrategyPrompt({ brief });

    try {
      const result = await this.callClaude(prompt);
      return { ...result, via: 'claude' };
    } catch (err) {
      const errAsErr = err as Error;
      this.logger.error(`Claude primary call failed: ${errAsErr.message}`, errAsErr.stack);

      if (err instanceof ResponseParseError) {
        try {
          const result = await this.retryReformat(prompt, err.raw ?? '');
          return { ...result, via: 'claude' };
        } catch (retryErr) {
          this.logger.warn(`Claude retry also failed: ${(retryErr as Error).message}`);
        }
      }

      if (this.fallbackEnabled) {
        this.logger.warn('Falling back to canned strategy (STRATEGY_FALLBACK_ENABLED=true).');
        return { ...this.fallback(brief), via: 'fallback' };
      }
      throw new CustomHttpException(
        'Strategy generation failed: upstream LLM did not return a valid strategy.',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  private async callClaude(userPrompt: string): Promise<LlmGenerationResult> {
    let response: Anthropic.Message;
    try {
      response = await this.client.messages.create(
        {
          model: this.model,
          max_tokens: this.maxTokens,
          system: STRATEGY_SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userPrompt }],
        },
        { timeout: this.timeoutMs },
      );
    } catch (err) {
      const e = err as { status?: number; message?: string };
      // Surface upstream rate limit as 502 with a useful message.
      if (e.status === 429) {
        throw new CustomHttpException(
          'Upstream LLM rate limit hit. Try again shortly.',
          HttpStatus.BAD_GATEWAY,
        );
      }
      throw new CustomHttpException(
        `LLM call failed: ${e.message ?? 'unknown error'}`,
        HttpStatus.GATEWAY_TIMEOUT,
      );
    }

    const text = this.extractText(response);
    const strategy = parseStrategyResponse(text);
    return {
      strategy,
      input_tokens: response.usage?.input_tokens ?? 0,
      output_tokens: response.usage?.output_tokens ?? 0,
    };
  }

  private async retryReformat(originalPrompt: string, badOutput: string): Promise<LlmGenerationResult> {
    const followUp = [
      'Your previous response was not valid JSON for the schema requested.',
      'Reformat it as ONLY a valid JSON object, no prose, no markdown fences.',
      '',
      'Previous output:',
      badOutput.slice(0, 4000),
      '',
      'Original request was:',
      originalPrompt,
    ].join('\n');
    return this.callClaude(followUp);
  }

  private extractText(message: Anthropic.Message): string {
    return message.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');
  }

  /**
   * Deterministic last-resort strategy used when STRATEGY_FALLBACK_ENABLED=true
   * and Claude fails. Visibly less specific than a real generation; the
   * `via: 'fallback'` marker tells the frontend to display a "demo mode" badge.
   * See RFC section 6 and Change Log.
   */
  private fallback(brief: GenerateStrategyDto): LlmGenerationResult {
    const strategy: ParsedStrategy = {
      title: `Funnel for ${brief.product_name}`,
      funnel_stages: [
        {
          stage_order: 1,
          title: 'Awareness',
          description: `Reach ${brief.target_audience} with content that introduces ${brief.product_name}.`,
          tasks: [
            { task_order: 1, title: 'Publish a launch blog post' },
            { task_order: 2, title: 'Share a teaser thread on social media' },
            { task_order: 3, title: 'Send a one-time announcement email to the list' },
          ],
        },
        {
          stage_order: 2,
          title: 'Consideration',
          description: 'Move interested viewers into evaluating the product.',
          tasks: [
            { task_order: 1, title: 'Publish a comparison page vs the closest competitor' },
            { task_order: 2, title: 'Run a 20-minute live walkthrough webinar' },
            { task_order: 3, title: 'Collect three short customer testimonials' },
          ],
        },
        {
          stage_order: 3,
          title: 'Conversion',
          description: `Drive ${brief.primary_goal.toLowerCase()} via targeted CTAs.`,
          tasks: [
            { task_order: 1, title: 'Add a free-trial CTA to the top of the homepage' },
            { task_order: 2, title: 'Run a two-week retargeting ad campaign' },
            { task_order: 3, title: 'Offer a 14-day extended trial via the newsletter' },
          ],
        },
        {
          stage_order: 4,
          title: 'Retention',
          description: 'Keep new users engaged past the activation moment.',
          tasks: [
            { task_order: 1, title: 'Send a 5-email onboarding drip' },
            { task_order: 2, title: 'Surface an in-app tour for first-week features' },
            { task_order: 3, title: 'Open a community channel and seed three weekly prompts' },
          ],
        },
      ],
    };
    return { strategy, input_tokens: 0, output_tokens: 0 };
  }
}
