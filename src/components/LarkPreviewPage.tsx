import React from 'react';
import { CustomDateRenderer, formatDateNumeric } from './CustomDateRenderer';

const DEFAULT_SIGNATURE_URL = '/sign/atty_signatureSPM.png';

type SeedValue = number | null;

function parseDateInput(value?: string | null): Date {
  if (!value) {
    return new Date();
  }
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  if (/^\d{1,2}\.\d{1,2}\.\d{2}$/.test(trimmed)) {
    const [month, day, year] = trimmed.split('.').map(Number);
    return new Date(2000 + year, month - 1, day);
  }
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }
  return new Date();
}

function toSeed(value?: string | null): SeedValue {
  if (!value) {
    return null;
  }
  const normalized = Number.parseInt(value, 10);
  return Number.isNaN(normalized) ? null : normalized;
}

function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let result = Math.imul(state ^ (state >>> 15), 1 | state);
    result ^= result + Math.imul(result ^ (result >>> 7), 61 | result);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function applySeededRandom(seed: SeedValue) {
  if (seed === null) {
    return;
  }
  const seeded = mulberry32(seed);
  Math.random = seeded;
}

const urlParams = new URLSearchParams(window.location.search);
const isPreviewRoute = urlParams.get('render') === 'lark-preview';
const seededValue = isPreviewRoute
  ? toSeed(urlParams.get('seed') || (window as any).__LARK_PREVIEW_SEED__)
  : null;
applySeededRandom(seededValue);

export default function LarkPreviewPage() {
  const rawDateParam = urlParams.get('date') || (window as any).__DATE__;
  const dateParam = typeof rawDateParam === 'string' ? rawDateParam : rawDateParam?.toString();
  const rawSignatureParam =
    urlParams.get('signature') || (window as any).__SIGNATURE__ || DEFAULT_SIGNATURE_URL;
  const signatureParam =
    typeof rawSignatureParam === 'string' ? rawSignatureParam : rawSignatureParam?.toString();

  const previewDate = parseDateInput(dateParam);
  const previewLabel = formatDateNumeric(previewDate);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div
        data-lark-preview-target
        data-lark-preview-date={previewLabel}
        style={{ padding: '28px 26px 32px 30px', display: 'inline-block' }}
      >
        <div
          className="flex flex-col items-center gap-0"
          style={{ transform: 'rotate(-8deg)' }}
        >
          <img
            src={signatureParam}
            alt="Active Signature"
            className="h-28 object-contain"
            style={{ marginBottom: '-38px', height: '112px', objectFit: 'contain' }}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iODAiPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQ2F2ZWF0LGN1cnNpdmUiIGZvbnQtc2l6ZT0iMjRweCI+U2lnbmF0dXJlPC90ZXh0Pjwvc3ZnPg==';
            }}
          />
          <div
            className="flex justify-center"
            style={{
              width: '45%',
              marginLeft: '18.5%',
              marginRight: '2%',
              marginTop: '-10px',
            }}
          >
            <CustomDateRenderer date={previewDate} height={22.5} rotation={-20} dotScale={0.55} />
          </div>
        </div>
      </div>
    </div>
  );
}
