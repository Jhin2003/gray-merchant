// Mirrors authflow's password policy (min 12 chars, mixed types).
import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(12)
  .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\W)/, {
    message: 'Password must include upper, lower, number and special char',
  });
