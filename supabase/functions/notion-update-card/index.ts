import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RAILWAY_WEBHOOK_URL = "https://primary-production-67f96.up.railway.app/webhook/editar-card";

Deno.serve(async (req: Request) => {
  console.log("🔵 [EDGE FUNCTION] Request recebido:", {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries()),
  });

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    console.log("✅ [EDGE FUNCTION] CORS preflight request - retornando OK");
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  try {
    console.log("✅ [EDGE FUNCTION] Página isolada - autenticação desabilitada");

    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        },
      }
      );
    }

    // Ler o body da requisição
    const body = await req.json();
    console.log("🔍 [EDGE FUNCTION] Body recebido:", {
      hasPageId: !!body.pageId,
      fieldsCount: Object.keys(body).length - 1, // -1 para excluir pageId
    });

    // Fazer a requisição para o endpoint do Railway
    console.log("🔍 [EDGE FUNCTION] Enviando para Railway...");
    const railwayResponse = await fetch(RAILWAY_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    console.log("🔍 [EDGE FUNCTION] Resposta do Railway:", {
      status: railwayResponse.status,
      statusText: railwayResponse.statusText,
      ok: railwayResponse.ok,
    });

    const responseData = await railwayResponse.text();
    console.log("✅ [EDGE FUNCTION] Dados recebidos do Railway:", responseData);

    // Retornar a resposta com headers CORS
    return new Response(responseData, {
      status: railwayResponse.status,
      headers: {
        "Content-Type": railwayResponse.headers.get("Content-Type") || "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  } catch (error) {
    console.error("❌ [EDGE FUNCTION] Erro não tratado:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        },
      }
    );
  }
});
