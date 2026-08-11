import { useMemo, useState, useEffect } from "react";
import { useRegion } from "@/contexts/RegionContext";
import { differenceInDays } from "date-fns";
import { DollarSign, Home, Calendar, Activity, AlertCircle, Send, ArrowRightLeft, Check } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { usePricingConfig } from "@/hooks/usePricingConfig";
import { calculatePrice } from "@/utils/priceCalculator";
import { calculateRetainedAndPendingValues } from "@/utils/pricingRules";
import {
  LeadWithCalculation,
  NotionReserva,
  convertLeadToCalculationInput,
} from "@/types/leads";

type Casa = "axe" | "pontal" | "lbp";
type Moeda = "BRL" | "EUR" | "USD" | "GBP";

const TEMPLATE_MAP: Record<Casa, { orcamento: string; pagamento: string; confirmacao: string }> = {
  axe:    { orcamento: "orcamento-axe",       pagamento: "pagamento-axe",       confirmacao: "confirmacao-axe" },
  pontal: { orcamento: "orcamento-pontal",    pagamento: "pagamento-pontal",    confirmacao: "confirmacao-pontal" },
  lbp:    { orcamento: "orcamento-lbp",       pagamento: "link-pagamento-lbp",  confirmacao: "confirmacao-lbp" },
};

const CURRENCY_SYMBOL: Record<Moeda, string> = { BRL: "R$", EUR: "€", USD: "$", GBP: "£" };
const MOEDA_NOTION: Record<Moeda, string> = { BRL: "", EUR: "EURO", USD: "USD", GBP: "GBP" };

async function fetchFxRate(target: Moeda): Promise<number | null> {
  if (target === "BRL") return 1;
  try {
    const r = await fetch(`https://api.frankfurter.dev/v1/latest?base=BRL&symbols=${target}`);
    if (!r.ok) return null;
    const j = await r.json();
    return j?.rates?.[target] ?? null;
  } catch {
    return null;
  }
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";

interface CotacaoPanelProps {
  lead: NotionReserva | LeadWithCalculation;
}

const brl = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);

// Painel read-only que recomputa a cotação a partir dos campos do lead
// e da PricingConfig do Supabase. Não persiste nada.
export const CotacaoPanel = ({ lead }: CotacaoPanelProps) => {
  const region = useRegion();
  const { config, isLoading, error } = usePricingConfig(region);

  const calculation = useMemo(() => {
    if (!config) return null;
    if (!lead || !lead.check_in_start || !lead.check_in_end) return null;

    try {
      const input = convertLeadToCalculationInput(lead as NotionReserva, config);

      // Usar differenceInDays (consistente com calculatePrice) ao invés de Math.ceil
      const numDays = Math.max(
        0,
        differenceInDays(new Date(input.checkInEnd), new Date(input.checkInStart)),
      );
      if (lead.breakfast) input.breakfast = numDays;
      if (lead.aluguel_de_prancha) input.unlimitedBoardRental = numDays;

      return calculatePrice(input, config);
    } catch (err) {
      console.error("CotacaoPanel: erro ao calcular preço", err);
      return null;
    }
  }, [lead, config]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="w-4 h-4" />
            Cotação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 animate-pulse rounded-md bg-muted" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-amber-800">
            <AlertCircle className="w-4 h-4" />
            Cotação indisponível
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Não foi possível carregar a configuração de preços.
        </CardContent>
      </Card>
    );
  }

  const missingFields: string[] = [];
  if (!lead?.check_in_start || !lead?.check_in_end) missingFields.push("datas de check-in/out");
  if (!lead?.number_of_people) missingFields.push("número de pessoas");
  if (!lead?.tipo_de_quarto && !lead?.pacote) missingFields.push("tipo de quarto ou pacote");

  if (!calculation || missingFields.length > 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="w-4 h-4" />
            Cotação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-amber-700">
            <AlertCircle className="w-4 h-4" />
            <span>Dados incompletos para calcular</span>
          </div>
          {missingFields.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Faltando: {missingFields.join(", ")}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Aplica overrides salvos no lead (mesma regra de getLeadDisplayPrice)
  const accommodationOverride =
    lead.accommodation_price_override !== null &&
    lead.accommodation_price_override !== undefined
      ? Number(lead.accommodation_price_override)
      : null;

  const accommodationCost =
    accommodationOverride !== null
      ? accommodationOverride
      : calculation.accommodationCost || 0;

  const extraFee = Number(lead?.extra_fee_amount) || 0;

  const packageCost = calculation.packageCost || 0;
  const dailyItemsCost = calculation.dailyItemsCost || 0;
  const fixedItemsCost = calculation.fixedItemsCost || 0;
  const breakfastOnlyCost = (calculation as any).breakfastOnlyCost || 0;

  const total =
    accommodationCost + packageCost + dailyItemsCost + fixedItemsCost + extraFee;

  // Usar regras de negócio reais ao invés de 30/70 hardcoded
  // retainedValue = serviços (fixedItems) + taxa extra
  // pendingValue  = hospedagem + café da manhã
  const { retainedValue, pendingValue } = calculateRetainedAndPendingValues(
    fixedItemsCost,
    extraFee,
    accommodationCost,
    breakfastOnlyCost,
  );

  const nights = calculation.numberOfNights || 0;
  const people = calculation.numberOfPeople || 0;

  return (
    <CotacaoPanelView
      lead={lead}
      nights={nights}
      people={people}
      total={total}
      retainedValue={retainedValue}
      pendingValue={pendingValue}
      accommodationCost={accommodationCost}
      accommodationOverride={accommodationOverride}
      dailyItemsCost={dailyItemsCost}
      fixedItemsCost={fixedItemsCost}
      extraFee={extraFee}
      calculation={calculation}
    />
  );
};

// View component com a seção interativa (currency + send)
interface ViewProps {
  lead: NotionReserva | LeadWithCalculation;
  nights: number;
  people: number;
  total: number;
  retainedValue: number;
  pendingValue: number;
  accommodationCost: number;
  accommodationOverride: number | null;
  dailyItemsCost: number;
  fixedItemsCost: number;
  extraFee: number;
  calculation: any;
}

const CotacaoPanelView = ({
  lead, nights, people, total, retainedValue, pendingValue,
  accommodationCost, accommodationOverride, dailyItemsCost, fixedItemsCost, extraFee, calculation,
}: ViewProps) => {
  // Região da tela: define se mostramos a escolha de Casa e o envio de email
  // (os 3 templates existentes são todos da operação do Rio).
  const region = useRegion();
  const [casa, setCasa] = useState<Casa>("axe");
  const [moeda, setMoeda] = useState<Moeda>("BRL");
  const [rate, setRate] = useState<number | null>(1);
  const [loadingRate, setLoadingRate] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (moeda === "BRL") { setRate(1); return; }
    setLoadingRate(true);
    fetchFxRate(moeda).then((r) => {
      setRate(r);
      setLoadingRate(false);
    });
  }, [moeda]);

  async function loadHistory() {
    const leadId = (lead as any).id;
    if (!leadId) return;
    setHistoryLoading(true);
    try {
      const apikey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/email_sent?lead_id=eq.${leadId}&select=id,ts,template_slug,casa,currency,resend_id,status,status_updated_at&order=ts.desc&limit=20`,
        { headers: { apikey, Authorization: `Bearer ${apikey}` } },
      );
      const data = await r.json();
      if (Array.isArray(data)) setHistory(data);
    } catch (e) {
      console.error("loadHistory", e);
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => { loadHistory(); }, [(lead as any).id]);

  const convertedDeposit = rate ? Math.round(retainedValue * rate * 100) / 100 : null;
  const convertedTotal = rate ? Math.round(total * rate * 100) / 100 : null;
  const convertedPending = rate ? Math.round(pendingValue * rate * 100) / 100 : null;
  const fmt = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  async function sendEmail(kind: "orcamento" | "pagamento" | "confirmacao") {
    const slug = TEMPLATE_MAP[casa][kind];
    setSending(slug);
    try {
      // Pra emails de pagamento, gera primeiro o link Stripe direto
      let linkPagamento = "";
      let stripeSessionId: string | undefined;
      if (kind === "pagamento") {
        const stripeAmount = moeda === "BRL"
          ? retainedValue * 1.06
          : (convertedDeposit ?? retainedValue) * 1.06;
        const stripeCurrency = moeda === "BRL" ? "brl" : moeda.toLowerCase();
        const stripeRes = await fetch(`${SUPABASE_URL}/functions/v1/stripe-link?direct=1`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: lead.name || "",
            email: lead.email || "",
            amount: stripeAmount,
            currency: stripeCurrency,
            casa: casa.toUpperCase(),
          }),
        });
        const sj = await stripeRes.json();
        if (!sj.ok) {
          toast.error(`Falhou ao gerar link Stripe: ${sj.error}`);
          setSending(null);
          return;
        }
        linkPagamento = sj.url;
        stripeSessionId = sj.sessionId;
      }

      // Constrói body em formato Notion: { data: { properties: {...} } }
      const moedaName = MOEDA_NOTION[moeda];
      const body = {
        data: {
          properties: {
            "Full Name":      { title: [{ plain_text: lead.name || "", text: { content: lead.name || "" } }] },
            "Email":          { email: lead.email || "" },
            "Link de Pagamento": { rich_text: [{ plain_text: linkPagamento, text: { content: linkPagamento } }] },
            "Cotação Cliente - EN": { formula: { string: "" } },
            "Valor Pendente": { formula: { number: pendingValue } },
            "Valor deposito": { formula: { number: retainedValue } },
            "Valor total de reserva (calculado)": { formula: { number: total } },
            "Moeda esperada": moedaName ? { select: { name: moedaName } } : { select: null },
            "Valor depósito convertido": { number: convertedDeposit ?? 0 },
            "Valor Stripe": { formula: { number: convertedDeposit ? convertedDeposit * 1.06 : retainedValue * 1.06 } },
          },
        },
        // Metadados pra audit trail em email_sent
        _meta: {
          leadId: (lead as any).id ?? null,
          casa: casa.toUpperCase(),
          currency: moeda,
          stripeSessionId: stripeSessionId ?? null,
        },
      };

      const leadIdParam = (lead as any).id ? `&leadId=${(lead as any).id}` : "";
      const res = await fetch(`${SUPABASE_URL}/functions/v1/notion-webhook?template=${slug}${leadIdParam}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (j.ok) {
        toast.success(`Email enviado: ${slug}`, {
          description: linkPagamento
            ? `Stripe link gerado + Resend ID: ${j.resend?.body?.id || "?"}`
            : `Resend ID: ${j.resend?.body?.id || "?"}`,
        });
        // Refresh do histórico
        loadHistory();
      } else {
        toast.error(`Falhou: ${j.error || slug}`);
      }
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    } finally {
      setSending(null);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          <span className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Cotação
          </span>
          <Badge variant="outline">
            {nights} noites • {people} {people === 1 ? "pessoa" : "pessoas"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-md border bg-muted/30 p-3">
            <div className="text-xs text-muted-foreground">Total</div>
            <div className="text-base font-bold text-primary">{brl(total)}</div>
          </div>
          <div className="rounded-md border bg-blue-50 p-3">
            <div className="text-xs text-blue-900/70">Retido (serviços + taxa)</div>
            <div className="text-base font-bold text-blue-900">{brl(retainedValue)}</div>
          </div>
          <div className="rounded-md border bg-amber-50 p-3">
            <div className="text-xs text-amber-900/70">Pendente (hospedagem + café)</div>
            <div className="text-base font-bold text-amber-900">{brl(pendingValue)}</div>
          </div>
        </div>

        <Separator />

        <div className="space-y-3 text-sm">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
              <Home className="w-3 h-3" />
              Hospedagem
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {lead.tipo_de_quarto || "—"}
                {accommodationOverride !== null && (
                  <span className="ml-2 text-xs text-orange-600">(manual)</span>
                )}
              </span>
              <span className="font-medium">{brl(accommodationCost)}</span>
            </div>
          </div>

          {calculation.breakdown.dailyItems.length > 0 && (
            <div>
              <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                <Calendar className="w-3 h-3" />
                Itens diários
              </div>
              <ul className="space-y-1">
                {calculation.breakdown.dailyItems.map((item, idx) => (
                  <li key={idx} className="flex justify-between">
                    <span className="text-muted-foreground">
                      {item.name}
                      <span className="ml-1 text-xs">
                        ({item.quantity}× {brl(item.unitPrice)})
                      </span>
                    </span>
                    <span className="font-medium">{brl(item.cost)}</span>
                  </li>
                ))}
                <li className="flex justify-between border-t pt-1 text-xs text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{brl(dailyItemsCost)}</span>
                </li>
              </ul>
            </div>
          )}

          {calculation.breakdown.fixedItems.length > 0 && (
            <div>
              <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                <Activity className="w-3 h-3" />
                Atividades & extras
              </div>
              <ul className="space-y-1">
                {calculation.breakdown.fixedItems.map((item, idx) => (
                  <li key={idx} className="flex justify-between">
                    <span className="text-muted-foreground">
                      {item.name}
                      <span className="ml-1 text-xs">
                        ({item.quantity}× {brl(item.unitPrice)})
                      </span>
                    </span>
                    <span className="font-medium">{brl(item.cost)}</span>
                  </li>
                ))}
                <li className="flex justify-between border-t pt-1 text-xs text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{brl(fixedItemsCost)}</span>
                </li>
              </ul>
            </div>
          )}

          {extraFee > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {lead.extra_fee_description || "Taxa extra"}
              </span>
              <span className="font-medium text-orange-600">{brl(extraFee)}</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Conversão + Envio */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
            <ArrowRightLeft className="w-3 h-3" />
            Conversão & Envio
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Casa só existe no Rio (Axé/Pontal/LBP são as casas de lá e os
                templates de email são todos do Rio). A Bahia não tem template
                próprio ainda, então nem mostramos a escolha. */}
            {region !== "bahia" && (
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Casa</label>
                <Select value={casa} onValueChange={(v) => setCasa(v as Casa)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="axe">Axé</SelectItem>
                    <SelectItem value="pontal">Pontal</SelectItem>
                    <SelectItem value="lbp">LBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Moeda do cliente</label>
              <Select value={moeda} onValueChange={(v) => setMoeda(v as Moeda)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRL">BRL — R$</SelectItem>
                  <SelectItem value="EUR">EUR — €</SelectItem>
                  <SelectItem value="USD">USD — $</SelectItem>
                  <SelectItem value="GBP">GBP — £</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {moeda !== "BRL" && (
            <div className="rounded-md border bg-muted/40 p-3 text-sm space-y-1">
              {loadingRate ? (
                <div className="text-xs text-muted-foreground">Buscando cotação...</div>
              ) : rate ? (
                <>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Cotação do dia (ECB)</span>
                    <span className="font-mono">1 BRL = {rate.toFixed(5)} {moeda}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total convertido</span>
                    <span className="font-medium">{CURRENCY_SYMBOL[moeda]} {fmt(convertedTotal!)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Depósito convertido</span>
                    <span className="font-medium text-blue-700">{CURRENCY_SYMBOL[moeda]} {fmt(convertedDeposit!)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pendente convertido</span>
                    <span className="font-medium text-amber-700">{CURRENCY_SYMBOL[moeda]} {fmt(convertedPending!)}</span>
                  </div>
                </>
              ) : (
                <div className="text-xs text-destructive">Falha ao buscar cotação. Tenta de novo.</div>
              )}
            </div>
          )}

          {/* Bahia ainda não tem template de email próprio — os 3 disponíveis são
              do Rio (endereço no Recreio, conteúdo do Rio). Enviar um deles pra um
              hóspede de Itacaré manda informação errada, então bloqueamos. */}
          {region === "bahia" ? (
            <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
              Envio de email ainda não disponível para a Bahia — os templates existentes
              são da operação do Rio. A cotação acima pode ser copiada e enviada à mão.
            </div>
          ) : (
          <div className="grid grid-cols-3 gap-2 pt-1">
            <Button size="sm" variant="outline" disabled={!!sending} onClick={() => sendEmail("orcamento")}>
              {sending === TEMPLATE_MAP[casa].orcamento ? (
                <Check className="w-3 h-3 animate-spin" />
              ) : (
                <Send className="w-3 h-3" />
              )}
              <span className="ml-1">Orçamento</span>
            </Button>
            <Button size="sm" variant="outline" disabled={!!sending} onClick={() => sendEmail("pagamento")}>
              {sending === TEMPLATE_MAP[casa].pagamento ? (
                <Check className="w-3 h-3 animate-spin" />
              ) : (
                <Send className="w-3 h-3" />
              )}
              <span className="ml-1">Link Pagto</span>
            </Button>
            <Button size="sm" variant="outline" disabled={!!sending} onClick={() => sendEmail("confirmacao")}>
              {sending === TEMPLATE_MAP[casa].confirmacao ? (
                <Check className="w-3 h-3 animate-spin" />
              ) : (
                <Send className="w-3 h-3" />
              )}
              <span className="ml-1">Confirmação</span>
            </Button>
          </div>
          )}
          {region !== "bahia" && (
            <p className="text-xs text-muted-foreground">
              Envio real: o email vai pro endereço do lead, com cópia (BCC) pra <code>surfinnrio@gmail.com</code>.
            </p>
          )}
        </div>

        {((lead as any).id && (history.length > 0 || historyLoading)) && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                  Histórico de envios
                </div>
                <button
                  type="button"
                  onClick={loadHistory}
                  className="text-xs text-muted-foreground hover:underline"
                  disabled={historyLoading}
                >
                  {historyLoading ? "..." : "Atualizar"}
                </button>
              </div>
              {history.length === 0 ? (
                <div className="text-xs text-muted-foreground">Nenhum envio ainda.</div>
              ) : (
                <ul className="space-y-1 text-xs">
                  {history.map((h) => {
                    const dt = new Date(h.ts);
                    const statusColor: Record<string, string> = {
                      sent: "bg-blue-100 text-blue-800",
                      delivered: "bg-green-100 text-green-800",
                      opened: "bg-emerald-100 text-emerald-800",
                      clicked: "bg-emerald-100 text-emerald-800",
                      bounced: "bg-red-100 text-red-800",
                      complained: "bg-red-100 text-red-800",
                      delayed: "bg-amber-100 text-amber-800",
                    };
                    const cls = statusColor[h.status] ?? "bg-gray-100 text-gray-800";
                    return (
                      <li key={h.id} className="flex items-center justify-between gap-2 rounded border bg-muted/20 px-2 py-1">
                        <div className="flex flex-col">
                          <span className="font-medium">{h.template_slug}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {dt.toLocaleString("pt-BR")}
                            {h.casa && ` • ${h.casa}`}
                            {h.currency && h.currency !== "BRL" && ` • ${h.currency}`}
                          </span>
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${cls}`}>
                          {h.status}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
