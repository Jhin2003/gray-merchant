import { z } from 'zod';
import { passwordSchema } from './password.schema';

export const loginSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  client_id: z.string().optional(),
  redirect_uri: z.string().url().optional(),
  state: z.string().optional(),
  code_challenge: z.string().optional(),
  code_challenge_method: z.string().optional(),
});

export type LoginDto = z.infer<typeof loginSchema>;
