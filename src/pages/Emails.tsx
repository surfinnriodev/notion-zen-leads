import { useMemo, useState } from "react";
import { useEmailMetrics, EmailRow, OPENED_STATUSES, DELIVERED_STATUSES, ERROR_STATUSES } from "@/hooks/useEmailMetrics";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Mail, MailOpen, Send, AlertTriangle, RefreshCw } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  sent: "Enviado",
  delivered: "Entregue",
  opened: "Aberto",
  clicked: "Clicado",
  delayed: "Atrasado",
  failed: "Falhou",
  bounced: "Rejeitado",
  complained: "Spam",
  error: "Erro",
  no_email: "Sem email",
};

const STATUS_CLASS: Record<string, string> = {
  sent: "bg-blue-100 text-blue-800",
  delivered: "bg-green-100 text-green-800",
  opened: "bg-emerald-100 text-emerald-800",
  clicked: "bg-emerald-100 text-emerald-800",
  delayed: "bg-yellow-100 text-yellow-800",
  failed: "bg-red-100 text-red-800",
  bounced: "bg-red-100 text-red-800",
  complained: "bg-red-100 text-red-800",
  error: "bg-red-100 text-red-800",
  no_email: "bg-red-100 text-red-800",
};

function StatusBadge({ status }: { status: string | null }) {
  const s = status ?? "sent";
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CLASS[s] ?? "bg-gray-100 text-gray-800"}`}>
      {STATUS_LABEL[s] ?? s}
    </span>
  );
}

function fmtDate(v: string | null): string {
  if (!v) return "—";
  const d = new Date(v);
  return d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function recipient(r: EmailRow): string {
  return (r.to_addresses ?? []).filter((e) => e !== "surfinnrio@gmail.com")[0] ?? (r.to_addresses ?? [])[0] ?? "—";
}

const Emails = () => {
  const { data, isLoading, error, refetch, isFetching } = useEmailMetrics();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filtered = useMemo(() => {
    const rows = data?.rows ?? [];
    return rows.filter((r) => {
      // busca por lead / email destinatário / template
      if (search.trim()) {
        const q = search.toLowerCase();
        const hay = `${r.lead_name ?? ""} ${recipient(r)} ${r.template_slug ?? ""} ${r.casa ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      // filtro de status agrupado
      if (statusFilter !== "all") {
        const s = r.status ?? "";
        if (statusFilter === "opened" && !OPENED_STATUSES.includes(s)) return false;
        if (statusFilter === "delivered" && !DELIVERED_STATUSES.includes(s)) return false;
        if (statusFilter === "errors" && !ERROR_STATUSES.includes(s)) return false;
      }
      // faixa de data (sobre ts)
      const day = r.ts?.slice(0, 10) ?? "";
      if (from && day < from) return false;
      if (to && day > to) return false;
      return true;
    });
  }, [data, search, statusFilter, from, to]);

  if (isLoading) {
    return (
      <div className="p-8"><div className="flex items-center justify-center h-64 text-muted-foreground">Carregando emails...</div></div>
    );
  }
  if (error) {
    return (
      <div className="p-8"><div className="flex items-center justify-center h-64 text-red-500">Erro ao carregar emails</div></div>
    );
  }

  const m = data!;
  const recent = m.rows.slice(0, 8);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground mb-2">Emails</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Monitoramento de envios, aberturas e erros (via Resend)
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard title="Enviados" value={m.sent} icon={Send} subtitle="saíram de fato" />
        <MetricCard title="Entregues" value={m.delivered} icon={Mail} valueColor="text-green-600" subtitle="chegaram na caixa" />
        <MetricCard title="Taxa de abertura" value={`${m.openRate.toFixed(0)}%`} icon={MailOpen} valueColor="text-emerald-600" subtitle={`${m.opened} abertos / ${m.delivered} entregues`} />
        <MetricCard title="Erros" value={m.errors} icon={AlertTriangle} valueColor={m.errors > 0 ? "text-red-600" : "text-foreground"} subtitle="falhas / rejeições" />
      </div>

      {/* Últimos enviados */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Últimos emails enviados</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum email registrado ainda.</p>
          ) : recent.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{r.lead_name || recipient(r)}</p>
                <p className="text-xs text-muted-foreground truncate">{r.template_slug} · {recipient(r)}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-muted-foreground hidden sm:inline">{fmtDate(r.ts)}</span>
                <StatusBadge status={r.status} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Lista completa com filtros */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Todos os emails</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Input placeholder="Buscar lead, email, template..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="opened">Abertos</SelectItem>
                <SelectItem value="delivered">Entregues</SelectItem>
                <SelectItem value="errors">Erros</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} title="De" />
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} title="Até" />
          </div>

          <p className="text-xs text-muted-foreground">{filtered.length} de {m.total} emails</p>

          {/* Tabela */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="py-2 pr-3 font-medium">Data</th>
                  <th className="py-2 pr-3 font-medium">Lead</th>
                  <th className="py-2 pr-3 font-medium">Destinatário</th>
                  <th className="py-2 pr-3 font-medium">Template</th>
                  <th className="py-2 pr-3 font-medium">Casa</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 pr-3 font-medium hidden md:table-cell">Atualizado</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                    <td className="py-2 pr-3 whitespace-nowrap text-xs">{fmtDate(r.ts)}</td>
                    <td className="py-2 pr-3 max-w-[140px] truncate">{r.lead_name || "—"}</td>
                    <td className="py-2 pr-3 max-w-[180px] truncate">{recipient(r)}</td>
                    <td className="py-2 pr-3 text-xs">{r.template_slug || "—"}</td>
                    <td className="py-2 pr-3 text-xs">{r.casa || "—"}</td>
                    <td className="py-2 pr-3"><StatusBadge status={r.status} /></td>
                    <td className="py-2 pr-3 whitespace-nowrap text-xs text-muted-foreground hidden md:table-cell">{fmtDate(r.status_updated_at)}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">Nenhum email para esses filtros.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Emails;
