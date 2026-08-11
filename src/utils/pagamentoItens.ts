// Divide as linhas da cotação entre "paga agora" e "paga na chegada".
//
// A regra padrão é a que sempre valeu (herdada do n8n): serviços e taxa entram no
// depósito; hospedagem e café ficam pra pagar na chegada. Agora o operador pode
// mover linha a linha — o que ele marcar fica guardado em `pagamento_por_item`.

export type Momento = "agora" | "chegada";

export interface LinhaCotacao {
  chave: string;
  nome: string;
  detalhe: string;
  valor: number;
  momento: Momento;
  gratis: boolean;
}

// Chave estável da linha, pra guardar a escolha do operador. Usamos o nome do
// item porque é o que identifica a linha pro usuário e não muda ao recalcular.
export const chaveLinha = (nome: string) => nome.trim().toLowerCase();

export function momentoDaLinha(
  chave: string,
  padrao: Momento,
  escolhas?: Record<string, Momento> | null,
): Momento {
  const escolhido = escolhas?.[chave];
  return escolhido === "agora" || escolhido === "chegada" ? escolhido : padrao;
}

// Monta as linhas da cotação a partir do cálculo, já com o momento resolvido.
export function montarLinhas(args: {
  tipoQuarto: string | null;
  nights: number;
  accommodationCost: number;
  accommodationManual: boolean;
  dailyItems: Array<{ name: string; quantity: number; unitPrice: number; cost: number }>;
  fixedItems: Array<{ name: string; quantity: number; unitPrice: number; cost: number }>;
  extraFee: number;
  extraFeeDescricao?: string | null;
  escolhas?: Record<string, Momento> | null;
}): LinhaCotacao[] {
  const linhas: LinhaCotacao[] = [];
  const add = (nome: string, detalhe: string, valor: number, padrao: Momento) => {
    const chave = chaveLinha(nome);
    linhas.push({
      chave,
      nome,
      detalhe,
      valor,
      momento: momentoDaLinha(chave, padrao, args.escolhas),
      gratis: valor === 0,
    });
  };

  // Hospedagem: por padrão paga na chegada.
  add(
    "Hospedagem",
    [args.tipoQuarto || "—", `${args.nights} ${args.nights === 1 ? "noite" : "noites"}`]
      .filter(Boolean).join(" · ") + (args.accommodationManual ? " · manual" : ""),
    args.accommodationCost,
    "chegada",
  );

  // Itens diários (café): também na chegada por padrão.
  for (const i of args.dailyItems) {
    add(i.name, `${i.quantity}× ${fmt(i.unitPrice)}`, i.cost, "chegada");
  }

  // Atividades e extras: adiantados.
  for (const i of args.fixedItems) {
    add(i.name, `${i.quantity}× ${fmt(i.unitPrice)}`, i.cost, "agora");
  }

  if (args.extraFee > 0) {
    add(args.extraFeeDescricao || "Taxa extra", "taxa", args.extraFee, "agora");
  }

  return linhas;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 }).format(v);

export const somar = (linhas: LinhaCotacao[], momento: Momento) =>
  linhas.filter((l) => l.momento === momento).reduce((s, l) => s + l.valor, 0);
