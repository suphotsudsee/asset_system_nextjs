export interface AppBranding {
  title: string;
  subtitle: string;
}

export const BRANDING_STORAGE_KEY = 'app-branding';
export const BRANDING_CHANGE_EVENT = 'app-branding-change';

export const defaultBranding: AppBranding = {
  title: 'Asset Mgmt',
  subtitle: 'ระบบงานทะเบียนครุภัณฑ์',
};

const defaultSnapshot = JSON.stringify(defaultBranding);

export function getBrandingSnapshot(): string {
  if (typeof window === 'undefined') {
    return defaultSnapshot;
  }

  return localStorage.getItem(BRANDING_STORAGE_KEY) ?? defaultSnapshot;
}

export function parseBranding(snapshot: string | null | undefined): AppBranding {
  if (!snapshot) {
    return defaultBranding;
  }

  try {
    const parsed = JSON.parse(snapshot) as Partial<AppBranding>;
    return {
      title: typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title : defaultBranding.title,
      subtitle: typeof parsed.subtitle === 'string' && parsed.subtitle.trim() ? parsed.subtitle : defaultBranding.subtitle,
    };
  } catch {
    return defaultBranding;
  }
}

export function subscribeBranding(callback: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleChange = () => callback();
  window.addEventListener('storage', handleChange);
  window.addEventListener(BRANDING_CHANGE_EVENT, handleChange);

  return () => {
    window.removeEventListener('storage', handleChange);
    window.removeEventListener(BRANDING_CHANGE_EVENT, handleChange);
  };
}

export function saveBranding(branding: AppBranding) {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(branding));
  window.dispatchEvent(new Event(BRANDING_CHANGE_EVENT));
}
