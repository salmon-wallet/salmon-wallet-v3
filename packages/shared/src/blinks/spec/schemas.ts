/**
 * Runtime-validated zod schemas mirroring `@solana/actions-spec` v2.4.2 types.
 *
 * Wallet refuses to render Action API payloads that don't parse here. Schemas
 * intentionally enforce stricter constraints than the spec types (e.g. HTTPS
 * icon, base58 account format, base64 transaction) to keep untrusted payloads
 * safe for client rendering and on-chain submission.
 *
 * Pure zod — no `node:*` deps, runs in RN/web/node.
 */
import { z } from 'zod';

const HTTPS_URL = z
  .string()
  .url()
  .refine((v) => v.startsWith('https://'), 'icon must be HTTPS');

const BASE58_ACCOUNT = z
  .string()
  .regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, 'account must be base58 (32-44 chars)');

// Solana hard tx limit is 1232 bytes → 1644 base64 chars. 1700 gives ~3% headroom.
const BASE64_TRANSACTION = z
  .string()
  .min(1)
  .max(1700, 'transaction exceeds 1700 chars')
  .refine((v) => v.length > 0 && v.length % 4 === 0, 'transaction length must be a multiple of 4')
  .refine((v) => /^[A-Za-z0-9+/]+={0,2}$/.test(v), 'transaction must be base64');

const COMPILABLE_REGEX = z.string().refine((v) => {
  try {
    // eslint-disable-next-line no-new
    new RegExp(v);
    return true;
  } catch {
    return false;
  }
}, 'pattern must be a compilable regex');

const PARAMETER_TYPES = [
  'text',
  'email',
  'url',
  'number',
  'date',
  'datetime-local',
  'checkbox',
  'radio',
  'textarea',
  'select',
] as const;

export const ParameterOptionSchema = z.object({
  label: z.string().min(1),
  value: z.string(),
  selected: z.boolean().optional(),
});

export const ActionParameterSchema = z.object({
  name: z.string().min(1),
  label: z.string().optional(),
  required: z.boolean().optional(),
  type: z.enum(PARAMETER_TYPES).optional(),
  pattern: COMPILABLE_REGEX.optional(),
  patternDescription: z.string().optional(),
  min: z.union([z.number(), z.string()]).optional(),
  max: z.union([z.number(), z.string()]).optional(),
  options: z.array(ParameterOptionSchema).optional(),
});

export const ActionErrorSchema = z.object({
  message: z.string().min(1),
});

export const LinkedActionSchema = z.object({
  type: z.enum(['transaction', 'message', 'post', 'external-link']),
  href: z.string().min(1),
  label: z.string().min(1),
  parameters: z.array(ActionParameterSchema).optional(),
});

export const ActionGetResponseSchema: z.ZodType<ActionGetResponse> = z.lazy(() =>
  z.object({
    // Intentionally stricter than spec: we require `type` to refuse ambiguous
    // payloads. Spec marks it optional for backward compat. Relax if a real
    // provider in the registry sends responses without `type`.
    type: z.enum(['action', 'completed']),
    icon: HTTPS_URL,
    title: z.string().min(1).max(100),
    description: z.string().min(1).max(1000),
    label: z.string().min(1).max(50),
    disabled: z.boolean().optional(),
    links: z
      .object({
        actions: z.array(LinkedActionSchema),
      })
      .optional(),
    error: ActionErrorSchema.optional(),
  }),
);

export const NextActionLinkSchema: z.ZodType<NextActionLink> = z.lazy(() =>
  z.discriminatedUnion('type', [
    z.object({ type: z.literal('post'), href: z.string().min(1) }),
    z.object({ type: z.literal('inline'), action: ActionGetResponseSchema }),
  ]),
);

export const ActionPostRequestSchema = z.object({
  account: BASE58_ACCOUNT,
  data: z.record(z.string(), z.union([z.string(), z.array(z.string())])).optional(),
});

const TransactionPostResponseSchema = z.object({
  // optional for backward compat with old transaction-only providers
  type: z.literal('transaction').optional(),
  transaction: BASE64_TRANSACTION,
  message: z.string().optional(),
  links: z
    .object({
      next: NextActionLinkSchema,
    })
    .optional(),
});

const PostPostResponseSchema = z.object({
  type: z.literal('post'),
  href: z.string().min(1),
  message: z.string().optional(),
});

const ExternalLinkPostResponseSchema = z.object({
  type: z.literal('external-link'),
  externalLink: z
    .string()
    .url()
    .refine((v) => v.startsWith('https://'), 'must be HTTPS'),
  message: z.string().optional(),
});

// Phase 1: do NOT add the message variant yet — defer.
//
// Use z.union (not z.discriminatedUnion) because the `transaction` variant has
// optional `type` for backward compat with pre-v2 providers.
export const ActionPostResponseSchema = z.union([
  TransactionPostResponseSchema,
  PostPostResponseSchema,
  ExternalLinkPostResponseSchema,
]);

// Inferred public types — single source of truth, no manual duplication.
export type ParameterOption = z.infer<typeof ParameterOptionSchema>;
export type ActionParameter = z.infer<typeof ActionParameterSchema>;
export type LinkedAction = z.infer<typeof LinkedActionSchema>;
export type ActionError = z.infer<typeof ActionErrorSchema>;
export type ActionPostRequest = z.infer<typeof ActionPostRequestSchema>;
export type ActionPostResponse = z.infer<typeof ActionPostResponseSchema>;

// Recursive types declared up-front so z.lazy can reference them.
export interface ActionGetResponse {
  type: 'action' | 'completed';
  icon: string;
  title: string;
  description: string;
  label: string;
  disabled?: boolean;
  links?: { actions: LinkedAction[] };
  error?: ActionError;
}

export type NextActionLink =
  | { type: 'post'; href: string }
  | { type: 'inline'; action: ActionGetResponse };

/** Throws a ZodError on invalid input. */
export const parseActionGetResponse = (input: unknown): ActionGetResponse =>
  ActionGetResponseSchema.parse(input);

/** Throws a ZodError on invalid input. */
export const parseActionPostRequest = (input: unknown): ActionPostRequest =>
  ActionPostRequestSchema.parse(input);

/** Throws a ZodError on invalid input. */
export const parseActionPostResponse = (input: unknown): ActionPostResponse =>
  ActionPostResponseSchema.parse(input);
