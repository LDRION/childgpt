import bcrypt from 'bcryptjs';

export const hashSecret = (value: string) => bcrypt.hash(value, 12);
export const verifySecret = (value: string, hash: string) => bcrypt.compare(value, hash);

let dummyHash: string | null = null;

/** Проверка, которая тратит одинаковое время, даже если пользователя нет. */
export async function verifySecretConstantTime(value: string, hash: string | null | undefined): Promise<boolean> {
  dummyHash ??= await bcrypt.hash('constant-time-dummy', 12);
  const ok = await bcrypt.compare(value, hash ?? dummyHash);
  return Boolean(hash) && ok;
}
