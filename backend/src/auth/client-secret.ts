import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

export async function verifyClientSecret(
  supplied: string | undefined,
  stored: string,
): Promise<boolean> {
  if (stored.startsWith('$2')) {
    return bcrypt.compare(supplied ?? '', stored);
  }

  const suppliedBytes = Buffer.from(supplied ?? '', 'utf8');
  const storedBytes = Buffer.from(stored, 'utf8');
  return (
    suppliedBytes.length === storedBytes.length &&
    crypto.timingSafeEqual(suppliedBytes, storedBytes)
  );
}
