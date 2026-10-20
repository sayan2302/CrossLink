import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getPolicySessionContext, DX_ADAPTER_URL } from '@/lib/bff';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileGuid: string }> }
) {
  try {
    const { fileGuid } = await params;
    if (!fileGuid) {
      return new NextResponse('fileGuid parameter is required', { status: 400 });
    }

    const { context, error } = await getPolicySessionContext();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('fileName') || 'document.pdf';

    const backendUrl = `${DX_ADAPTER_URL}/policy/attachment/${encodeURIComponent(fileGuid)}?fileName=${encodeURIComponent(fileName)}`;

    const res = await fetch(backendUrl, {
      method: 'GET',
      headers: context.headers,
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error('[Policy Attachment BFF] Backend returned error:', res.status);
      return new NextResponse('Attachment not found or unavailable', { status: res.status });
    }

    const contentType = res.headers.get('content-type') || 'application/pdf';
    const contentDisposition =
      res.headers.get('content-disposition') || `inline; filename="${fileName}"`;
    const arrayBuffer = await res.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err: any) {
    console.error('[Policy Attachment BFF Error]:', err);
    return new NextResponse('Internal error downloading attachment', { status: 500 });
  }
}
