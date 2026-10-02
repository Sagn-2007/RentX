import crypto from 'crypto';

export function generatePassportHash(item: { id: string, owner_id: string, created_at: Date, serial_number: string | null }): string {
  const canonicalString = [
    `id:${item.id}`,
    `owner:${item.owner_id}`,
    `created:${item.created_at.toISOString()}`,
    `serial:${item.serial_number || 'NONE'}`
  ].join('|');

  return crypto.createHash('sha256').update(canonicalString).digest('hex');
}
