import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  try {
    // Only POST
    if (req.method !== 'POST') {
      return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    }

    // Token check
    const token = String(req.headers['x-admin-token'] || '');
    const expected = String(process.env.ADMIN_TOKEN || '');
    if (!expected || token !== expected) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }

    const { bookId, imageUrl } = req.body || {};
    if (!bookId || !imageUrl) {
      return res.status(400).json({ ok: false, error: 'Missing bookId or imageUrl' });
    }

    const SUPABASE_URL = String(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '');
    const SERVICE_KEY = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '');

    if (!SUPABASE_URL || !SERVICE_KEY) {
      return res.status(500).json({ ok: false, error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' });
    }

    // Download image
    const imgResp = await fetch(String(imageUrl));
    if (!imgResp.ok) {
      return res.status(400).json({ ok: false, error: `Failed to fetch imageUrl: ${imgResp.status}` });
    }

    const contentType = imgResp.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await imgResp.arrayBuffer();
    const file = new Uint8Array(arrayBuffer);

    // Save to Storage
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const ext = contentType.includes('png') ? 'png' : 'jpg';
    const coverPath = `defaults/${bookId}.${ext}`;

    const up = await supabase.storage
      .from('covers')
      .upload(coverPath, file, { upsert: true, contentType });

    if (up.error) {
      return res.status(500).json({ ok: false, error: `Storage upload failed: ${up.error.message}` });
    }

    // IMPORTANT: you confirmed /book/12 == books.external_id == "12"
    const upd = await supabase
      .from('books')
      .update({ cover_path: coverPath })
      .eq('external_id', String(bookId))
      .select('id, external_id, cover_path')
      .maybeSingle();

    if (upd.error) {
      return res.status(500).json({ ok: false, error: `DB update failed: ${upd.error.message}` });
    }
    if (!upd.data) {
      return res.status(404).json({ ok: false, error: `Book not found by external_id=${bookId}` });
    }

    return res.status(200).json({ ok: true, cover_path: coverPath, book: upd.data });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
}
