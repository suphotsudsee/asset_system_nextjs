type AssetQrPayloadInput = {
  id: number;
  assetCode: string;
  name: string;
  department?: string | null;
  status?: string | null;
  category?: string | null;
  location?: string | null;
  serialNumber?: string | null;
  openUrl?: string | null;
};

function sanitizeSegment(value: string | null | undefined) {
  return (value || '-').replaceAll('|', '/').replaceAll('\n', ' ').trim() || '-';
}

export function buildAssetQrPayload(asset: AssetQrPayloadInput) {
  return [
    'ASSET MGMT',
    `ID: ${asset.id}`,
    `CODE: ${sanitizeSegment(asset.assetCode)}`,
    `NAME: ${sanitizeSegment(asset.name)}`,
    `DEPARTMENT: ${sanitizeSegment(asset.department)}`,
    `CATEGORY: ${sanitizeSegment(asset.category)}`,
    `LOCATION: ${sanitizeSegment(asset.location)}`,
    `SERIAL: ${sanitizeSegment(asset.serialNumber)}`,
    `STATUS: ${sanitizeSegment(asset.status)}`,
    asset.openUrl ? `OPEN_URL: ${sanitizeSegment(asset.openUrl)}` : null,
  ]
    .filter(Boolean)
    .join('\n');
}

export function parseAssetQrPayload(payload: string) {
  const normalized = payload.trim();
  if (!normalized) {
    return null;
  }

  const idMatch = normalized.match(/(?:^|\n)ID:\s*(\d+)/i);
  if (!idMatch) {
    return null;
  }

  const assetId = parseInt(idMatch[1], 10);
  if (!Number.isInteger(assetId) || assetId <= 0) {
    return null;
  }

  const readField = (name: string) => {
    const match = normalized.match(new RegExp(`(?:^|\\n)${name}:\\s*(.*)`, 'i'));
    return match?.[1]?.trim() || '';
  };

  return {
    assetId,
    assetCode: readField('CODE'),
    name: readField('NAME'),
    department: readField('DEPARTMENT'),
    status: readField('STATUS'),
    category: readField('CATEGORY'),
    location: readField('LOCATION'),
    serialNumber: readField('SERIAL'),
    openUrl: readField('OPEN_URL'),
  };
}
