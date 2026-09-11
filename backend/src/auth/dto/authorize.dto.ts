import { z } from 'zod';

export const authorizeQuerySchema = z
  .object({
    client_id: z.string().min(1),
    redirect_uri: z.string().url(),
    state: z.string().optional(),
    code_challenge: z.string().min(1).optional(),
    code_challenge_method: z.enum(['S256', 'PLAIN']).optional(),
  })
  .refine(
    (value) =>
      Boolean(value.code_challenge) === Boolean(value.code_challenge_method),
    {
      message:
        'code_challenge and code_challenge_method must be provided together',
      path: ['code_challenge_method'],
    },
  );

export const tokenSchema = z.object({
  grant_type: z.literal('authorization_code'),
  code: z.string().min(1),
  client_id: z.string().min(1),
  redirect_uri: z.string().url(),
  client_secret: z.string().min(1).optional(),
  code_verifier: z.string().min(1).optional(),
});

export type AuthorizeQuery = z.infer<typeof authorizeQuerySchema>;
export type TokenDto = z.infer<typeof tokenSchema>;
