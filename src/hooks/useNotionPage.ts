import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface NotionProperty {
  id: string;
  type: string;
  [key: string]: any;
}

interface NotionPageData {
  pageId: string;
  properties: Record<string, NotionProperty>;
  created_time: string;
  last_edited_time: string;
}

// Função auxiliar para extrair valores das propriedades do Notion
function extractPropertyValue(property: NotionProperty): any {
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

export const useNotionPage = (pageId: string | null) => {
  const queryClient = useQueryClient();

  // Buscar dados da página do Notion através da edge function do Supabase
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["notion-page", pageId],
    queryFn: async () => {
      if (!pageId) {
        throw new Error("Page ID is required");
      }

      // Chamar edge function do Supabase via fetch direto para passar query parameters
      // Página isolada - não precisa de autenticação
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      const functionUrl = `${supabaseUrl}/functions/v1/notion-get-page?pageId=${encodeURIComponent(pageId)}`;
      const functionResponse = await fetch(functionUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseAnonKey,
        },
      });

      if (!functionResponse.ok) {
        const errorText = await functionResponse.text();
        console.error("❌ [HOOK] Erro na resposta da edge function:", errorText);
        throw new Error(`Failed to fetch Notion page: ${errorText}`);
      }

      const functionData = await functionResponse.json();
      console.log("✅ [HOOK] Dados recebidos da edge function:", {
        hasProperties: !!functionData.properties,
        propertiesCount: Object.keys(functionData.properties || {}).length,
      });

      return functionData as NotionPageData & { propertyTypes: Record<string, string>; rawProperties: Record<string, NotionProperty> };
    },
    enabled: !!pageId,
  });

  // Atualizar dados através da API do Railway
  const updateMutation = useMutation({
    mutationFn: async (updatedProperties: Record<string, any>) => {
      if (!pageId) {
        throw new Error("Page ID is required");
      }

      // Chamar edge function do Supabase para fazer proxy e evitar CORS
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      const functionUrl = `${supabaseUrl}/functions/v1/notion-update-card`;
      const response = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseAnonKey,
        },
        body: JSON.stringify({
          pageId,
          ...updatedProperties, // Enviar todos os campos diretamente no body
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ [HOOK] Erro na resposta da edge function:", errorText);
        throw new Error(`Failed to update: ${errorText}`);
      }

      const responseData = await response.text();
      // Tentar fazer parse do JSON, se falhar retornar o texto
      try {
        return JSON.parse(responseData);
      } catch {
        return { message: responseData };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notion-page", pageId] });
      toast.success("Página do Notion atualizada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar página: ${error.message}`);
    },
  });

  return {
    data,
    isLoading,
    error,
    refetch,
    updatePage: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
};
