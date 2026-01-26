import { toPng } from 'html-to-image';
import { formatDateNumeric } from '../components/CustomDateRenderer';
import { getPhilippinesNow } from './timezoneUtils';

const DEFAULT_API_BASE = 'http://localhost:8000';

export const previewRenderConfig = {
  rotation: -8,
  signatureHeight: 112,
  signatureMarginBottom: -38,
  dateWrapperWidth: '45%',
  dateWrapperMarginLeft: '18.5%',
  dateWrapperMarginRight: '2%',
  dateWrapperMarginTop: '-10px',
  dateHeight: 22.5,
  dateRotation: -20,
  dotScale: 0.55,
  previewPadding: {
    top: 28,
    right: 26,
    bottom: 32,
    left: 30,
  },
};

const PREVIEW_IFRAME_SIZE = { width: 800, height: 600 };
const DEFAULT_SEED = 42;

async function waitForFonts(doc: Document): Promise<void> {
  if (doc.fonts && typeof doc.fonts.ready === 'object') {
    try {
      await doc.fonts.ready;
    } catch {
      // Ignore font readiness errors; images still capture without custom fonts.
    }
  }
}

async function waitForImages(root: ParentNode): Promise<void> {
  const images = Array.from(root.querySelectorAll('img'));
  await Promise.all(
    images.map((img) => {
      if (img.complete && img.naturalWidth > 0) {
        return Promise.resolve();
      }
      return new Promise<void>((resolve) => {
        const onDone = () => resolve();
        img.addEventListener('load', onDone, { once: true });
        img.addEventListener('error', onDone, { once: true });
      });
    })
  );
}

async function exportPreviewBlob(node: HTMLElement): Promise<Blob> {
  await waitForFonts(node.ownerDocument);
  await waitForImages(node);
  const dataUrl = await toPng(node, {
    cacheBust: true,
    backgroundColor: 'transparent',
    pixelRatio: 1,
    style: {
      backgroundColor: 'transparent',
    },
  });
  const response = await fetch(dataUrl);
  return response.blob();
}

interface SavePreviewOptions {
  signatureId: number;
  signatureUrl: string;
  apiBase?: string;
}

function getWeekDates(baseDate: Date): Date[] {
  const current = new Date(baseDate);
  const weekday = current.getDay();
  if (weekday === 0) {
    current.setDate(current.getDate() + 1);
  } else if (weekday === 6) {
    current.setDate(current.getDate() + 2);
  } else {
    current.setDate(current.getDate() - (weekday - 1));
  }

  return Array.from({ length: 5 }, (_, index) => {
    const next = new Date(current);
    next.setDate(current.getDate() + index);
    return next;
  });
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildPreviewUrl(signatureUrl: string, dateIso: string, seed: number): string {
  const origin = window.location.origin;
  const url = new URL(origin);
  url.searchParams.set('render', 'lark-preview');
  url.searchParams.set('date', dateIso);
  url.searchParams.set('signature', signatureUrl);
  url.searchParams.set('seed', String(seed));
  return url.toString();
}

function normalizeSignatureUrl(signatureUrl: string): string {
  if (!signatureUrl) {
    return signatureUrl;
  }
  try {
    const url = new URL(signatureUrl, window.location.origin);
    if (url.pathname.startsWith('/uploads') || url.pathname.startsWith('/sign')) {
      return `${url.pathname}${url.search}`;
    }
  } catch {
    // Ignore invalid URLs and fall back to the original value.
  }
  return signatureUrl;
}

function createPreviewIframe(): HTMLIFrameElement {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-10000px';
  iframe.style.top = '0';
  iframe.style.width = `${PREVIEW_IFRAME_SIZE.width}px`;
  iframe.style.height = `${PREVIEW_IFRAME_SIZE.height}px`;
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  document.body.appendChild(iframe);
  return iframe;
}

async function waitForSelector(
  doc: Document,
  selector: string,
  timeoutMs = 15000
): Promise<HTMLElement> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const node = doc.querySelector(selector) as HTMLElement | null;
    if (node) {
      return node;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Preview element not found: ${selector}`);
}

async function waitForPreviewDate(
  target: HTMLElement,
  expectedLabel: string,
  timeoutMs = 5000
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const currentLabel = target.getAttribute('data-lark-preview-date');
    if (currentLabel === expectedLabel) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Preview date did not update to ${expectedLabel}.`);
}

async function capturePreviewFromIframe(
  iframe: HTMLIFrameElement,
  signatureUrl: string,
  dateIso: string,
  seed: number,
  expectedLabel?: string
): Promise<Blob> {
  const targetUrl = buildPreviewUrl(signatureUrl, dateIso, seed);
  await new Promise<void>((resolve, reject) => {
    iframe.onload = () => resolve();
    iframe.onerror = () => reject(new Error('Failed to load preview iframe.'));
    iframe.src = targetUrl;
  });

  const doc = iframe.contentDocument;
  if (!doc) {
    throw new Error('Preview iframe document not available.');
  }
  await waitForFonts(doc);
  const target = await waitForSelector(doc, '[data-lark-preview-target]');
  if (expectedLabel) {
    await waitForPreviewDate(target, expectedLabel);
  }
  await waitForImages(target);
  return exportPreviewBlob(target);
}

export async function savePreviewImages(options: SavePreviewOptions): Promise<any> {
  const { signatureId, signatureUrl, apiBase = DEFAULT_API_BASE } = options;

  const phNow = getPhilippinesNow();
  const weekDates = getWeekDates(phNow);
  const dateIsos = weekDates.map(toIsoDate);
  const dateLabels = weekDates.map((dateValue) => formatDateNumeric(dateValue));
  const weekStart = toIsoDate(weekDates[0]);
  const normalizedSignatureUrl = normalizeSignatureUrl(signatureUrl);

  const iframe = createPreviewIframe();
  const previewBlobs: Blob[] = [];
  try {
    for (let index = 0; index < dateIsos.length; index += 1) {
      const dateIso = dateIsos[index];
      const label = dateLabels[index];
      const blob = await capturePreviewFromIframe(
        iframe,
        normalizedSignatureUrl,
        dateIso,
        DEFAULT_SEED,
        label
      );
      previewBlobs.push(blob);
    }
  } finally {
    iframe.remove();
  }

  if (previewBlobs.length !== 5) {
    throw new Error('Failed to generate preview images.');
  }

  const formData = new FormData();
  formData.append('signature_id', String(signatureId));
  formData.append('date_text', dateLabels[0]);
  formData.append('render_config', JSON.stringify(previewRenderConfig));
  formData.append('week_start', weekStart);
  formData.append('date_labels', JSON.stringify(dateLabels));

  previewBlobs.forEach((blob, index) => {
    formData.append('images', blob, `preview_${index + 1}.png`);
  });

  const response = await fetch(`${apiBase}/api/previews/save`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to save preview images.');
  }

  return response.json();
}
