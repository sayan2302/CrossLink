import { NextRequest, NextResponse } from 'next/server';
import { getBrokerSessionContext, DX_ADAPTER_URL } from '@/lib/bff';

export async function POST(req: NextRequest) {
  try {
    const { context, error } = await getBrokerSessionContext();
    if (error) return error;

    const formData = await req.formData();
    const file = formData.get('file');
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const forwardFormData = new FormData();
    forwardFormData.append('file', file);

    const headers: Record<string, string> = { ...context.headers };
    delete headers['Content-Type'];
    delete headers['content-type'];

    const res = await fetch(`${DX_ADAPTER_URL}/broker/upload-claim-document`, {
      method: 'POST',
      headers,
      body: forwardFormData,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      return NextResponse.json(
        { error: errData?.message || 'Failed to upload claim document' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('[ClaimSubmission BFF Error] POST upload-document:', err);
    return NextResponse.json({ error: 'Internal adapter communication failure' }, { status: 500 });
  }
}
