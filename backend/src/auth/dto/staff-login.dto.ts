import { z } from 'zod';

export const staffLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  client_id: z.string(),
  client_secret: z.string().optional(),
});

export type StaffLoginDto = z.infer<typeof staffLoginSchema>;
