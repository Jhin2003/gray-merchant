import { z } from 'zod';

export const authorizeQuerySchema = z.object({
  client_id: z.string(),
  redirect_uri: z.string().url(),
  state: z.string().optional(),
  code_challenge: z.string().optional(),
  code_challenge_method: z.string().optional(),
});

export const tokenSchema = z.object({
  grant_type: z.literal('authorization_code'),
  code: z.string(),
  client_id: z.string(),
  redirect_uri: z.string().url(),
  client_secret: z.string().optional(),
  code_verifier: z.string().optional(),
});

export type AuthorizeQuery = z.infer<typeof authorizeQuerySchema>;
export type TokenDto = z.infer<typeof tokenSchema>;
