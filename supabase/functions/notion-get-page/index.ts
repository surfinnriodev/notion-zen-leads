import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const NOTION_API_KEY = Deno.env.get("NOTION_API_KEY") || "";
const NOTION_API_URL = "https://api.notion.com/v1";

// Função auxiliar para extrair valores das propriedades do Notion
function extractPropertyValue(property: any): any {
  if (!property) return null;

  switch (property.type) {
    case "title":
      return property.title?.map((t: any) => t.plain_text).join("") || "";
    case "rich_text":
      return property.rich_text?.map((t: any) => t.plain_text).join("") || "";
    case "number":
      return property.number;
    case "checkbox":
      return property.checkbox;
    case "date":
      return property.date?.start || null;
    case "select":
      return property.select?.name || null;
    case "multi_select":
      return property.multi_select?.map((item: any) => item.name) || [];
    case "phone_number":
      return property.phone_number || "";
    case "email":
      return property.email || "";
    default:
      return null;
  }
}

Deno.serve(async (req: Request) => {
  console.log("🔵 [EDGE FUNCTION] Request recebido:", {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries()),
  });

  // Handle CORS
  if (req.method === "OPTIONS") {
    console.log("✅ [EDGE FUNCTION] CORS preflight request - retornando OK");
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    // Página isolada - não precisa de autenticação
    console.log("✅ [EDGE FUNCTION] Página isolada - autenticação desabilitada");

    // Obter pageId da query string
    const url = new URL(req.url);
    const pageId = url.searchParams.get("pageId");
    console.log("🔍 [EDGE FUNCTION] PageId extraído:", pageId);

    if (!NOTION_API_KEY) {
      console.error("❌ [EDGE FUNCTION] NOTION_API_KEY não configurada");
      return new Response(
        JSON.stringify({ error: "NOTION_API_KEY environment variable is not configured" }),
        { 
          status: 500, 
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    if (!pageId) {
      console.error("❌ [EDGE FUNCTION] PageId não fornecido");
      return new Response(
        JSON.stringify({ error: "pageId parameter is required" }),
        { 
          status: 400, 
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          } 
        }
      );
    }

    // Buscar página do Notion
    console.log("🔍 [EDGE FUNCTION] Buscando página do Notion...");
    console.log("🔍 [EDGE FUNCTION] URL Notion:", `${NOTION_API_URL}/pages/${pageId}`);
    console.log("🔍 [EDGE FUNCTION] API Key presente:", !!NOTION_API_KEY);

    const notionResponse = await fetch(`${NOTION_API_URL}/pages/${pageId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${NOTION_API_KEY}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
    });

    console.log("🔍 [EDGE FUNCTION] Resposta do Notion:", {
      status: notionResponse.status,
      statusText: notionResponse.statusText,
      ok: notionResponse.ok,
    });

    if (!notionResponse.ok) {
      const errorText = await notionResponse.text();
      console.error("❌ [EDGE FUNCTION] Erro ao buscar página do Notion:", errorText);
      return new Response(
        JSON.stringify({ 
          error: "Failed to fetch Notion page",
          details: errorText 
        }),
        { 
          status: notionResponse.status,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          } 
        }
      );
    }

    const pageData = await notionResponse.json();
    console.log("✅ [EDGE FUNCTION] Dados do Notion recebidos:", {
      pageId: pageData.id,
      propertiesCount: Object.keys(pageData.properties || {}).length,
    });

    // Extrair valores das propriedades
    const properties = pageData.properties || {};
    const extractedProperties: Record<string, any> = {};
    const propertyTypes: Record<string, string> = {};

    for (const [key, prop] of Object.entries(properties)) {
      const property = prop as any;
      propertyTypes[key] = property.type;
      extractedProperties[key] = extractPropertyValue(property);
    }

    // Retornar dados formatados
    console.log("✅ [EDGE FUNCTION] Retornando dados processados:", {
      propertiesCount: Object.keys(extractedProperties).length,
      propertyTypesCount: Object.keys(propertyTypes).length,
    });

    return new Response(
      JSON.stringify({
        pageId: pageData.id,
        properties: extractedProperties,
        propertyTypes,
        rawProperties: properties, // Manter propriedades brutas para referência
        created_time: pageData.created_time,
        last_edited_time: pageData.last_edited_time,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("❌ [EDGE FUNCTION] Erro não tratado:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return new Response(
      JSON.stringify({ 
        error: error.message,
        debug: "unhandled error",
        stack: error.stack 
      }),
      { 
        status: 500, 
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        } 
      }
    );
  }
});
