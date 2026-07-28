// Use zod since the rest of the codebase (authflow) uses zod schemas.
import { passwordSchema } from './password.schema';
import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  type: z.enum(['USER']).optional(),
});

export type RegisterDto = z.infer<typeof registerSchema>;
