import { z } from 'zod';

export const clientTokenSchema = z.object({
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
});

export type ClientTokenDto = z.infer<typeof clientTokenSchema>;
