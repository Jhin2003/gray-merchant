import { z } from 'zod';

export const staffLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(1_024),
  client_id: z.string().min(1),
  client_secret: z.string().min(1).optional(),
});

export type StaffLoginDto = z.infer<typeof staffLoginSchema>;
