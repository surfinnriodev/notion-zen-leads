import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const N8N_PAYMENT_WEBHOOK_URL =
  "https://primary-production-67f96.up.railway.app/webhook/generate-link-payment-stripe";

interface NotionPaymentPageData {
  pageId: string;
  properties: Record<string, unknown>;
  created_time: string;
  last_edited_time: string;
}

interface PaymentWebhookResponse {
  paymentUrl: string;
}

export interface NotionPaymentFormData {
  amount: string;
  name: string;
  email: string;
  phone: string;
}

function normalizeStringValue(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function formatAmountForInput(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  if (typeof value === "string") {
    return value.trim();
  }

  return "";
}

function tryParseJson(value: string): unknown {
  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function getResponseMessage(responseBody: unknown, fallback: string): string {
  if (!responseBody || typeof responseBody !== "object") return fallback;

  const withMessage = responseBody as { message?: unknown; error?: unknown };
  if (typeof withMessage.message === "string" && withMessage.message.trim()) {
    return withMessage.message;
  }

  if (typeof withMessage.error === "string" && withMessage.error.trim()) {
    return withMessage.error;
  }

  return fallback;
}

function isPaymentWebhookResponse(value: unknown): value is PaymentWebhookResponse {
  if (!value || typeof value !== "object") return false;
  const parsed = value as { paymentUrl?: unknown };
  return typeof parsed.paymentUrl === "string" && parsed.paymentUrl.trim().length > 0;
}

export function parseAmountToCents(amountInput: string): number | null {
  const cleanedValue = amountInput
    .replace(/\s/g, "")
    .replace(/R\$/gi, "")
    .replace(/[^\d,.-]/g, "");

  if (!cleanedValue) return null;

  let normalized = cleanedValue;

  if (normalized.includes(",") && normalized.includes(".")) {
    const lastCommaIndex = normalized.lastIndexOf(",");
    const lastDotIndex = normalized.lastIndexOf(".");

    if (lastCommaIndex > lastDotIndex) {
      normalized = normalized.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = normalized.replace(/,/g, "");
    }
  } else if (normalized.includes(",")) {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  } else {
    normalized = normalized.replace(/,/g, "");
  }

  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const amountInCents = Math.round(amount * 100);
  return amountInCents > 0 ? amountInCents : null;
}

export const useNotionPaymentPage = (pageId: string | null) => {
  const [formData, setFormData] = useState<NotionPaymentFormData>({
    amount: "",
    name: "",
    email: "",
    phone: "",
  });
  const [paymentUrl, setPaymentUrl] = useState<string>("");
  const [isInitialized, setIsInitialized] = useState(false);

  const notionQuery = useQuery({
    queryKey: ["notion-payment-page", pageId],
    queryFn: async () => {
      if (!pageId) {
        throw new Error("Page ID is required");
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const functionUrl = `${supabaseUrl}/functions/v1/notion-get-page?pageId=${encodeURIComponent(pageId)}`;

      const response = await fetch(functionUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseAnonKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Falha ao carregar página do Notion: ${errorText}`);
      }

      return (await response.json()) as NotionPaymentPageData;
    },
    enabled: !!pageId,
    retry: false,
  });

  useEffect(() => {
    setFormData({
      amount: "",
      name: "",
      email: "",
      phone: "",
    });
    setPaymentUrl("");
    setIsInitialized(false);
  }, [pageId]);

  useEffect(() => {
    if (!notionQuery.data || isInitialized) return;

    const properties = notionQuery.data.properties || {};
    setFormData({
      amount: formatAmountForInput(properties["Valor Pendente"]),
      name: normalizeStringValue(properties["Full Name"]),
      email: normalizeStringValue(properties["Email"]),
      phone: normalizeStringValue(properties["Telefone"]),
    });
    setIsInitialized(true);
  }, [notionQuery.data, isInitialized]);

  const amountInCents = useMemo(() => parseAmountToCents(formData.amount), [formData.amount]);
  const isFormValid = useMemo(() => {
    return Boolean(
      amountInCents &&
        formData.name.trim() &&
        formData.email.trim() &&
        formData.phone.trim()
    );
  }, [amountInCents, formData.email, formData.name, formData.phone]);

  const generatePaymentLinkMutation = useMutation({
    mutationFn: async () => {
      if (!pageId) {
        throw new Error("Page ID não informado");
      }

      const parsedAmount = parseAmountToCents(formData.amount);
      if (!parsedAmount) {
        throw new Error("Informe um valor válido maior que zero");
      }

      const payload = {
        pageId,
        amount: parsedAmount,
        currency: "BRL",
        lead: {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
        },
      };

      const response = await fetch(N8N_PAYMENT_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      const parsedResponse = tryParseJson(responseText);

      if (!response.ok) {
        const fallbackMessage = responseText || `Erro ao gerar link (${response.status})`;
        throw new Error(getResponseMessage(parsedResponse, fallbackMessage));
      }

      if (!isPaymentWebhookResponse(parsedResponse)) {
        throw new Error("Resposta inválida do webhook: campo paymentUrl não encontrado.");
      }

      return parsedResponse;
    },
    onSuccess: (responseData) => {
      setPaymentUrl(responseData.paymentUrl);
      toast.success("Link de pagamento gerado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao gerar link de pagamento");
    },
  });

  const updateField = (field: keyof NotionPaymentFormData, value: string) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const generatePaymentLink = () => {
    generatePaymentLinkMutation.mutate();
  };

  return {
    pageData: notionQuery.data,
    isLoadingPage: notionQuery.isLoading,
    pageError: notionQuery.error,
    refetchPage: notionQuery.refetch,
    formData,
    updateField,
    amountInCents,
    isFormValid,
    paymentUrl,
    isGeneratingLink: generatePaymentLinkMutation.isPending,
    generatePaymentLink,
  };
};

