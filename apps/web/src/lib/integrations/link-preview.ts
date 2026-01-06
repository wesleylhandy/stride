import ogs from 'open-graph-scraper';

export interface LinkPreview {
  title?: string;
  description?: string;
  image?: string;
  url: string;
  siteName?: string;
  type?: string;
}

// Cache for link previews (in-memory, can be replaced with Redis in production)
const previewCache = new Map<string, { preview: LinkPreview; timestamp: number }>();
const CACHE_TTL = 3600 * 1000; // 1 hour in milliseconds

/**
 * Get link preview metadata from a URL
 * Supports oembed and Open Graph meta tags
 * 
 * @param url - URL to fetch preview for
 * @returns Link preview data or null if unavailable
 */
export async function getLinkPreview(url: string): Promise<LinkPreview | null> {
  // Check cache first
  const cached = previewCache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.preview;
  }

  try {
    // Use open-graph-scraper for Open Graph and oembed support
    const options = {
      url,
      fetchOptions: {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      },
      timeout: 5000, // 5 second timeout
    };

    const { result } = await ogs(options);

    const preview: LinkPreview = {
      url,
      title: result.ogTitle || result.twitterTitle || result.oEmbedTitle || undefined,
      description:
        result.ogDescription ||
        result.twitterDescription ||
        result.oEmbedDescription ||
        undefined,
      image:
        result.ogImage?.[0]?.url ||
        result.twitterImage?.[0]?.url ||
        result.oEmbedThumbnailUrl ||
        undefined,
      siteName: result.ogSiteName || undefined,
      type: result.ogType || result.oEmbedType || undefined,
    };

    // Cache the result
    previewCache.set(url, { preview, timestamp: Date.now() });

    return preview;
  } catch (error) {
    console.error(`Failed to fetch preview for ${url}:`, error);
    
    // Return basic preview with just the URL
    return {
      url,
    };
  }
}

/**
 * Clear the preview cache (useful for testing or manual cache invalidation)
 */
export function clearPreviewCache(): void {
  previewCache.clear();
}

/**
 * Check if a URL is from a supported service
 */
export function isSupportedService(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // Supported services
    const supportedDomains = [
      'notion.so',
      'notion.site',
      'docs.google.com',
      'drive.google.com',
      'atlassian.net',
      'confluence.com',
      'github.com',
      'gitlab.com',
      'bitbucket.org',
      'linear.app',
      'figma.com',
      'miro.com',
    ];

    return supportedDomains.some((domain) => hostname.includes(domain));
  } catch {
    return false;
  }
}

