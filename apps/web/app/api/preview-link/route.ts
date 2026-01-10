import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { getLinkPreview } from '@/lib/integrations/link-preview';

/**
 * GET /api/preview-link
 * Get link preview metadata (oembed/og:meta)
 * Requires authentication to prevent abuse
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication to prevent abuse
    const authResult = await requireAuth(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    const preview = await getLinkPreview(url);

    if (!preview) {
      return NextResponse.json(
        { error: 'Could not fetch preview for this URL' },
        { status: 404 }
      );
    }

    return NextResponse.json(preview, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Link preview error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch link preview' },
      { status: 500 }
    );
  }
}

