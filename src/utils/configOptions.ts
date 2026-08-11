// Deriva as opções do formulário de lead a partir da configuração da região.
//
// Antes essas listas eram fixas no CompleteLeadModal, então apagar/renomear algo
// nas Configurações não refletia na cotação (relato do parceiro da Bahia: quartos
// excluídos continuavam aparecendo e os itens renomeados apareciam com o nome do Rio).
//
// IMPORTANTE: para o Rio o resultado tem que ser idêntico à lista fixa antiga —
// ver configOptions.test.ts, que trava isso.

// Nome do quarto na config vem como "Private: Double" / "Shared: Mixed Standard".
const CATEGORIAS = ["Private", "Shared"] as const;
export type RoomCategory = typeof CATEGORIAS[number];

export function roomOptions(
  config: any,
  categoria: RoomCategory,
  valorAtual?: string | null,
): string[] {
  const nomes: string[] = (config?.roomCategories ?? [])
    .map((r: any) => String(r?.name ?? ""))
    .filter((n: string) => n.startsWith(`${categoria}:`))
    .map((n: string) => n.slice(categoria.length + 1).trim())
    .filter(Boolean);

  const unicos = [...new Set(nomes)];

  // Um lead antigo pode estar num quarto que saiu da configuração. Mantemos a
  // opção pra não apagar silenciosamente o dado que já está gravado no lead.
  if (valorAtual && valorAtual !== "Select" && !unicos.includes(valorAtual)) {
    unicos.push(valorAtual);
  }
  return unicos;
}

// Nome do item para exibir no formulário. Se o usuário renomeou nas Configurações,
// o formulário passa a mostrar o nome dele; senão mantém o rótulo original.
export function itemLabel(config: any, itemId: string, padrao: string): string {
  const item = (config?.items ?? []).find((i: any) => i?.id === itemId);
  const nome = item?.name ? String(item.name).trim() : "";
  return nome || padrao;
}

// O item existe (e é cobrável) nesta região? Usado pra esconder do formulário o
// que foi removido das Configurações — ex: Surf-Skate não existe em Itacaré.
// Um lead que já tenha quantidade nesse item continua mostrando o campo.
export function itemAtivo(config: any, itemId: string, quantidadeAtual?: number | null): boolean {
  if (quantidadeAtual && Number(quantidadeAtual) > 0) return true;
  return (config?.items ?? []).some((i: any) => i?.id === itemId);
}

const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 }).format(v);

// Preço configurado do item, pra mostrar ao lado do campo no lead e o operador
// conferir sem abrir as Configurações. Ex: "R$ 280 · por pessoa".
// Retorna "" quando o item não existe na região (aí o campo nem deveria aparecer).
export function itemPreco(config: any, itemId: string): string {
  const item = (config?.items ?? []).find((i: any) => i?.id === itemId);
  if (!item) return "";
  const preco = Number(item.price) || 0;
  const cobranca = item.billingType === "per_person" ? "por pessoa"
    : item.billingType === "per_reservation" ? "por reserva"
    : "por unidade";
  return `${brl(preco)} · ${cobranca}`;
}

// Aulas de surf não têm preço único: o valor por aula cai de faixa conforme o
// total de aulas (tier1 = 1-3, tier2 = 4-7, tier3 = 8+). Mostramos as três.
export function precoAulasSurf(config: any): string {
  const t = config?.surfLessonPricing ?? config?.surf_lesson_pricing;
  if (!t) return "";
  return `1-3: ${brl(Number(t.tier1) || 0)} · 4-7: ${brl(Number(t.tier2) || 0)} · 8+: ${brl(Number(t.tier3) || 0)} por aula`;
}
