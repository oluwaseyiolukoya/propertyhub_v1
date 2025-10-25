import React, { useState } from 'react'
import { API_BASE_URL } from '../../lib/api-config'

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg=='

/**
 * Get the full image URL
 * If the src starts with /uploads, prepend the API_BASE_URL
 * Otherwise, return the src as-is (for external URLs or data URLs)
 */
const getImageUrl = (src: string | undefined): string => {
  if (!src) return ERROR_IMG_SRC;
  
  // If it's a data URL or external URL, return as-is
  if (src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }
  
  // If it's a relative path starting with /uploads, prepend API_BASE_URL
  if (src.startsWith('/uploads')) {
    return `${API_BASE_URL}${src}`;
  }
  
  // If it's just a filename or relative path without /uploads, assume it's in /uploads
  if (!src.startsWith('/')) {
    return `${API_BASE_URL}/uploads/${src}`;
  }
  
  return src;
}

export function ImageWithFallback(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [didError, setDidError] = useState(false)

  const handleError = () => {
    console.warn('Image failed to load:', props.src);
    setDidError(true)
  }

  const { src, alt, style, className, ...rest } = props
  const imageUrl = getImageUrl(src)

  return didError ? (
    <div
      className={`inline-block bg-gray-100 text-center align-middle ${className ?? ''}`}
      style={style}
    >
      <div className="flex items-center justify-center w-full h-full">
        <img src={ERROR_IMG_SRC} alt="Error loading image" {...rest} data-original-url={src} />
      </div>
    </div>
  ) : (
    <img src={imageUrl} alt={alt} className={className} style={style} {...rest} onError={handleError} />
  )
}


