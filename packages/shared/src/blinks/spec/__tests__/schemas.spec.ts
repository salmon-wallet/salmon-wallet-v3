import { describe, it, expect } from 'vitest';
import {
  ActionGetResponseSchema,
  ActionParameterSchema,
  ActionPostRequestSchema,
  ActionPostResponseSchema,
  NextActionLinkSchema,
  parseActionGetResponse,
  parseActionPostRequest,
  parseActionPostResponse,
} from '../schemas';

const validGet = {
  type: 'action' as const,
  icon: 'https://example.com/icon.png',
  title: 'Tip the creator',
  description: 'Send a SOL tip',
  label: 'Tip',
};

describe('ActionGetResponseSchema', () => {
  it('parses a valid response with no links', () => {
    expect(() => parseActionGetResponse(validGet)).not.toThrow();
  });

  it('rejects when icon is missing', () => {
    const { icon: _icon, ...rest } = validGet;
    expect(() => parseActionGetResponse(rest)).toThrow();
  });

  it('rejects non-HTTPS icon', () => {
    expect(() =>
      parseActionGetResponse({ ...validGet, icon: 'http://example.com/icon.png' }),
    ).toThrow(/HTTPS/);
  });

  it('rejects empty title', () => {
    expect(() => parseActionGetResponse({ ...validGet, title: '' })).toThrow();
  });

  it('parses links.actions with parameters', () => {
    const r = ActionGetResponseSchema.parse({
      ...validGet,
      links: {
        actions: [
          {
            type: 'transaction',
            href: '/api/tip?amount={amount}',
            label: 'Send',
            parameters: [
              { name: 'amount', type: 'number', required: true, min: 0.001 },
            ],
          },
        ],
      },
    });
    expect(r.links?.actions[0].label).toBe('Send');
  });

  it('parses a completed response with minimal fields', () => {
    expect(() =>
      parseActionGetResponse({ ...validGet, type: 'completed' }),
    ).not.toThrow();
  });
});

describe('ActionParameterSchema', () => {
  it('rejects an invalid parameter type', () => {
    expect(() =>
      ActionParameterSchema.parse({ name: 'foo', type: 'invalid-type' }),
    ).toThrow();
  });

  it('rejects a pattern that does not compile as RegExp', () => {
    expect(() =>
      ActionParameterSchema.parse({ name: 'foo', type: 'text', pattern: '[unclosed' }),
    ).toThrow(/regex/i);
  });

  it('accepts a valid pattern', () => {
    expect(() =>
      ActionParameterSchema.parse({ name: 'foo', type: 'text', pattern: '^[A-Z]+$' }),
    ).not.toThrow();
  });

  it('accepts a select with options', () => {
    expect(() =>
      ActionParameterSchema.parse({
        name: 'choice',
        type: 'select',
        options: [
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b', selected: true },
        ],
      }),
    ).not.toThrow();
  });
});

describe('ActionPostRequestSchema', () => {
  const validAccount = '11111111111111111111111111111111'; // 32 chars, base58

  it('parses a valid base58 account', () => {
    expect(() =>
      parseActionPostRequest({ account: validAccount }),
    ).not.toThrow();
  });

  it('rejects too-short account', () => {
    expect(() => parseActionPostRequest({ account: '1234' })).toThrow();
  });

  it('rejects account with non-base58 chars (0, O, I, l)', () => {
    expect(() =>
      parseActionPostRequest({ account: '0OIl0OIl0OIl0OIl0OIl0OIl0OIl0OIl' }),
    ).toThrow();
  });

  it('accepts optional data map', () => {
    expect(() =>
      parseActionPostRequest({ account: validAccount, data: { amount: '1.5' } }),
    ).not.toThrow();
  });

  it('accepts data values as string arrays', () => {
    expect(() =>
      parseActionPostRequest({ account: validAccount, data: { tags: ['a', 'b'] } }),
    ).not.toThrow();
  });
});

describe('ActionPostResponseSchema', () => {
  it('parses a valid base64 transaction', () => {
    expect(() =>
      parseActionPostResponse({ transaction: 'AQIDBAUGBwgJCgsMDQ4PEA==' }),
    ).not.toThrow();
  });

  it('rejects a non-base64 transaction', () => {
    expect(() =>
      parseActionPostResponse({ transaction: 'not-base64-!!!' }),
    ).toThrow();
  });

  it('rejects a transaction longer than 1700 chars', () => {
    expect(() =>
      parseActionPostResponse({ transaction: 'A'.repeat(1700).padEnd(1704, '=') }),
    ).toThrow();
  });

  it('parses a NextActionLink of type post', () => {
    expect(() =>
      NextActionLinkSchema.parse({ type: 'post', href: '/next' }),
    ).not.toThrow();
  });

  it('parses a NextActionLink of type inline recursively', () => {
    const parsed = NextActionLinkSchema.parse({
      type: 'inline',
      action: validGet,
    });
    expect(parsed.type).toBe('inline');
  });

  it('parses a POST response with links.next inline action', () => {
    const r = ActionPostResponseSchema.parse({
      transaction: 'AQIDBAUGBwgJCgsMDQ4PEA==',
      message: 'ok',
      links: { next: { type: 'inline', action: validGet } },
    });
    // Narrow union: transaction variant has links.next
    if ('transaction' in r) {
      expect(r.links?.next.type).toBe('inline');
    } else {
      throw new Error('expected transaction variant');
    }
  });

  it('parses a post variant response', () => {
    expect(() =>
      parseActionPostResponse({ type: 'post', href: '/next-step' }),
    ).not.toThrow();
  });

  it('parses an external-link variant response', () => {
    expect(() =>
      parseActionPostResponse({
        type: 'external-link',
        externalLink: 'https://example.com',
      }),
    ).not.toThrow();
  });

  it('rejects an external-link variant with non-HTTPS URL', () => {
    expect(() =>
      parseActionPostResponse({
        type: 'external-link',
        externalLink: 'http://example.com',
      }),
    ).toThrow();
  });

  it('rejects a message variant (not yet supported)', () => {
    expect(() =>
      parseActionPostResponse({ type: 'message', text: 'foo' }),
    ).toThrow();
  });
});
