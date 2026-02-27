import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return jsonResponse({ ok: false, error: "Method Not Allowed" }, 405);
    }

    const { bookId, imageUrl } = await req.json();
    if (!bookId || !imageUrl) {
      return jsonResponse(
        { ok: false, error: "Missing bookId or imageUrl" },
        400
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !serviceKey) {
      return jsonResponse(
        { ok: false, error: "Server misconfigured" },
        500
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    const imgResp = await fetch(String(imageUrl));
    if (!imgResp.ok) {
      return jsonResponse(
        { ok: false, error: `Failed to fetch image: ${imgResp.status}` },
        400
      );
    }

    const contentType = imgResp.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await imgResp.arrayBuffer();
    const file = new Uint8Array(arrayBuffer);

    const ext = contentType.includes("png") ? "png" : "jpg";
    const coverPath = `defaults/${bookId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("covers")
      .upload(coverPath, file, { upsert: true, contentType });

    if (uploadError) {
      return jsonResponse(
        { ok: false, error: `Upload failed: ${uploadError.message}` },
        500
      );
    }

    const { data: bookData, error: updateError } = await supabase
      .from("books")
      .update({ cover_path: coverPath, updated_at: new Date().toISOString() })
      .eq("external_id", String(bookId))
      .select("id, external_id, cover_path")
      .maybeSingle();

    if (updateError) {
      return jsonResponse(
        { ok: false, error: `DB update failed: ${updateError.message}` },
        500
      );
    }

    if (!bookData) {
      const { error: insertError } = await supabase
        .from("books")
        .insert({ external_id: String(bookId), cover_path: coverPath });

      if (insertError) {
        return jsonResponse(
          { ok: false, error: `DB insert failed: ${insertError.message}` },
          500
        );
      }
    }

    return jsonResponse({ ok: true, cover_path: coverPath });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return jsonResponse({ ok: false, error: msg }, 500);
  }
});
