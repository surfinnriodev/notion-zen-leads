import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EmailRow {
  id: number;
  lead_id: number | null;
  ts: string;
  status_updated_at: string | null;
  to_addresses: string[] | null;
  template_slug: string | null;
  casa: string | null;
  status: string | null;
  resend_id: string | null;
  meta: any;
  lead_name?: string | null;
}

// Categorização dos status do Resend
export const OPENED_STATUSES = ["opened", "clicked"];
export const DELIVERED_STATUSES = ["delivered", "opened", "clicked"];
export const SENT_STATUSES = ["sent", "delivered", "opened", "clicked", "delayed"];
export const ERROR_STATUSES = ["failed", "bounced", "complained", "error", "no_email"];

export interface EmailMetrics {
  rows: EmailRow[];
  total: number;
  sent: number;       // saíram de fato (não-erro)
  delivered: number;  // chegaram na caixa
  opened: number;     // foram abertos
  errors: number;     // falhas/bounces
  openRate: number;   // abertos / entregues
}

export const useEmailMetrics = () => {
  return useQuery({
    queryKey: ["email-metrics"],
    refetchInterval: 60_000,
    queryFn: async (): Promise<EmailMetrics> => {
      const { data, error } = await (supabase as any)
        .from("email_sent")
        .select("id,lead_id,ts,status_updated_at,to_addresses,template_slug,casa,status,resend_id,meta")
        .order("ts", { ascending: false })
        .limit(1000);

      if (error) throw error;
      const rows = (data ?? []) as EmailRow[];

      // Resolve nome do lead (email_sent.lead_id → reservations.name)
      const ids = Array.from(new Set(rows.map((r) => r.lead_id).filter(Boolean))) as number[];
      if (ids.length > 0) {
        const { data: leads } = await (supabase as any)
          .from("reservations")
          .select("id,name")
          .in("id", ids);
        const nameById = new Map<number, string>((leads ?? []).map((l: any) => [l.id, l.name]));
        for (const r of rows) {
          if (r.lead_id) r.lead_name = nameById.get(r.lead_id) ?? null;
        }
      }

      const count = (arr: string[]) => rows.filter((r) => r.status && arr.includes(r.status)).length;
      const sent = count(SENT_STATUSES);
      const delivered = count(DELIVERED_STATUSES);
      const opened = count(OPENED_STATUSES);
      const errors = count(ERROR_STATUSES);
      const openRate = delivered > 0 ? (opened / delivered) * 100 : 0;

      return { rows, total: rows.length, sent, delivered, opened, errors, openRate };
    },
  });
};
