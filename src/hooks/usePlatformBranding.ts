import { useEffect, useState } from 'react';

interface BrandingSettings {
  logoUrl: string | null;
  faviconUrl: string | null;
}

// Get API base URL from environment
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : '');

export function usePlatformBranding() {
  const [branding, setBranding] = useState<BrandingSettings>({
    logoUrl: null,
    faviconUrl: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBranding();
  }, []);

  useEffect(() => {
    if (branding.faviconUrl) {
      updateFavicon(branding.faviconUrl);
    } else {
      // Set a lightweight inline default favicon to avoid 404s in production
      const defaultFavicon = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><circle cx='16' cy='16' r='14' fill='%23ff7a00'/></svg>";
      updateFavicon(defaultFavicon);
    }
  }, [branding.faviconUrl]);

  const fetchBranding = async () => {
    try {
      const token =
        localStorage.getItem('auth_token') ||
        localStorage.getItem('token') ||
        localStorage.getItem('admin_token') ||
        sessionStorage.getItem('auth_token') ||
        sessionStorage.getItem('token') ||
        sessionStorage.getItem('admin_token');

      let logoUrl: string | null = null;
      let faviconUrl: string | null = null;

      // Try authenticated fetch first, if token is present
      if (token) {
        const headers = { 'Authorization': `Bearer ${token}` };

        try {
          const [logoResponse, faviconResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/api/system/settings/platform_logo_url`, { headers }),
            fetch(`${API_BASE_URL}/api/system/settings/platform_favicon_url`, { headers }),
          ]);

          if (logoResponse.ok) {
            const logoData = await logoResponse.json();
            if (logoData.value && typeof logoData.value === 'string') {
              // If value is already a full URL, use it as-is; otherwise prepend API_BASE_URL
              logoUrl = (logoData.value.startsWith('http://') || logoData.value.startsWith('https://'))
                ? logoData.value
                : `${API_BASE_URL}${logoData.value}`;
            }
          }

          if (faviconResponse.ok) {
            const faviconData = await faviconResponse.json();
            if (faviconData.value && typeof faviconData.value === 'string') {
              // If value is already a full URL, use it as-is; otherwise prepend API_BASE_URL
              faviconUrl = (faviconData.value.startsWith('http://') || faviconData.value.startsWith('https://'))
                ? faviconData.value
                : `${API_BASE_URL}${faviconData.value}`;
            }
          }
        } catch (e) {
          // will fallback to public endpoint
        }
      }

      // If missing either, try public endpoint
      if (!logoUrl || !faviconUrl) {
        try {
          const pubRes = await fetch(`${API_BASE_URL}/api/public/branding`);
          if (pubRes.ok) {
            const pubData = await pubRes.json();
            if (!logoUrl && pubData.logoUrl && typeof pubData.logoUrl === 'string') {
              // If value is already a full URL, use it as-is; otherwise prepend API_BASE_URL
              logoUrl = (pubData.logoUrl.startsWith('http://') || pubData.logoUrl.startsWith('https://'))
                ? pubData.logoUrl
                : `${API_BASE_URL}${pubData.logoUrl}`;
            }
            if (!faviconUrl && pubData.faviconUrl && typeof pubData.faviconUrl === 'string') {
              // If value is already a full URL, use it as-is; otherwise prepend API_BASE_URL
              faviconUrl = (pubData.faviconUrl.startsWith('http://') || pubData.faviconUrl.startsWith('https://'))
                ? pubData.faviconUrl
                : `${API_BASE_URL}${pubData.faviconUrl}`;
            }
          }
        } catch (e) {
          // ignore; leave nulls
        }
      }

      setBranding({ logoUrl, faviconUrl });
    } catch (error) {
      console.error('Failed to fetch branding:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFavicon = (url: string) => {
    // Cache-busting parameter to force refresh in browsers
    const cacheBustedUrl = `${url}${url.includes('?') ? '&' : '?'}cb=${Date.now()}`;

    // Remove existing favicon links of multiple types
    const selectors = [
      'link[rel="icon"]',
      'link[rel="shortcut icon"]',
      'link[rel="apple-touch-icon"]',
      'link[rel*="icon"]',
    ];
    document.querySelectorAll(selectors.join(',')).forEach((el) => el.parentNode?.removeChild(el));

    // Create standard icon
    const icon = document.createElement('link');
    icon.rel = 'icon';
    icon.type = 'image/x-icon';
    icon.href = cacheBustedUrl;
    document.head.appendChild(icon);

    // Create shortcut icon for broader compatibility
    const shortcut = document.createElement('link');
    shortcut.rel = 'shortcut icon';
    shortcut.type = 'image/x-icon';
    shortcut.href = cacheBustedUrl;
    document.head.appendChild(shortcut);
  };

  const refreshBranding = () => {
    setLoading(true);
    fetchBranding();
  };

  return { branding, loading, refreshBranding };
}

