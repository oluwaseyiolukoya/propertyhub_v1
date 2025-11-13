import React, { useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';

interface PlatformLogoProps {
  className?: string;
  iconClassName?: string;
  showText?: boolean;
  textClassName?: string;
  onLogoLoad?: (hasCustomLogo: boolean) => void;
}

export function PlatformLogo({
  className = "flex items-center",
  iconClassName = "h-6 w-6 text-orange-600 mr-2",
  showText = true,
  textClassName = "text-xl font-semibold text-gray-900",
  onLogoLoad
}: PlatformLogoProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogo();
  }, []);

  const fetchLogo = async () => {
    try {
      // Try multiple token sources (auth_token is the correct key used by the app)
      const token =
        localStorage.getItem('auth_token') ||
        localStorage.getItem('token') ||
        localStorage.getItem('admin_token') ||
        sessionStorage.getItem('auth_token') ||
        sessionStorage.getItem('token') ||
        sessionStorage.getItem('admin_token');

      let valuePath: string | null = null;

      // Attempt authenticated fetch first (if token exists)
      if (token) {
        try {
          const response = await fetch('http://localhost:5000/api/system/settings/platform_logo_url', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            if (data.value && typeof data.value === 'string') {
              valuePath = data.value;
            }
          }
        } catch (e) {
          // ignore and fall through to public
        }
      }

      // Fallback to public branding endpoint if no token or no setting found
      if (!valuePath) {
        try {
          const pubRes = await fetch('http://localhost:5000/api/public/branding');
          if (pubRes.ok) {
            const pubData = await pubRes.json();
            if (pubData.logoUrl && typeof pubData.logoUrl === 'string') {
              valuePath = pubData.logoUrl;
            }
          }
        } catch (e) {
          // ignore; we'll just use default
        }
      }

      if (valuePath) {
        const fullUrl = `http://localhost:5000${valuePath}`;
        console.log('[PlatformLogo] Loaded custom logo:', fullUrl);
        setLogoUrl(fullUrl);
        if (onLogoLoad) onLogoLoad(true);
      } else {
        console.log('[PlatformLogo] No custom logo set, using default');
        if (onLogoLoad) onLogoLoad(false);
      }
    } catch (error) {
      console.error('[PlatformLogo] Failed to fetch logo:', error);
      if (onLogoLoad) onLogoLoad(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      {loading ? (
        <div className="animate-pulse flex items-center">
          <div className={`bg-gray-200 rounded ${iconClassName}`}></div>
          {showText && <div className="h-6 w-32 bg-gray-200 rounded"></div>}
        </div>
      ) : logoUrl ? (
        <>
          <img
            src={logoUrl}
            alt="Platform Logo"
            className={iconClassName}
            onError={() => setLogoUrl(null)}
          />
          {showText && <span className={textClassName}>Contrezz</span>}
        </>
      ) : (
        <>
          <Building2 className={iconClassName} />
          {showText && <span className={textClassName}>Contrezz</span>}
        </>
      )}
    </div>
  );
}

