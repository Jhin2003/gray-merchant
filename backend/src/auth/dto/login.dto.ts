import { z } from 'zod';

export const loginSchema = z
  .object({
    email: z.string().email(),
    // Complexity belongs at registration/password-change time. Login only
    // requires a supplied password so existing accounts are never locked out.
    password: z.string().min(1).max(1_024),
    client_id: z.string().min(1).optional(),
    redirect_uri: z.string().url().optional(),
    state: z.string().optional(),
    code_challenge: z.string().min(1).optional(),
    code_challenge_method: z.enum(['S256', 'PLAIN']).optional(),
  })
  .refine((value) => Boolean(value.client_id) === Boolean(value.redirect_uri), {
    message: 'client_id and redirect_uri must be provided together',
    path: ['client_id'],
  })
  .refine((value) => !value.code_challenge || Boolean(value.client_id), {
    message: 'code_challenge requires an OAuth client_id',
    path: ['code_challenge'],
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

export type LoginDto = z.infer<typeof loginSchema>;
