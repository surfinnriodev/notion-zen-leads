// Trava a regra: sem nenhuma marcação do operador, a divisão tem que ser
// idêntica à de hoje (serviços = agora; hospedagem + café = chegada).
import { describe, it, expect } from "vitest";
import { montarLinhas, somar, chaveLinha } from "./pagamentoItens";

const base = {
  tipoQuarto: "Private: Double",
  nights: 7,
  accommodationCost: 2100,
  accommodationManual: true,
  dailyItems: [{ name: "Café da Manhã", quantity: 7, unitPrice: 0, cost: 0 }],
  fixedItems: [
    { name: "Aulas de surf", quantity: 1, unitPrice: 250, cost: 250 },
    { name: "Surf guide", quantity: 3, unitPrice: 350, cost: 1050 },
    { name: "Water Fall by boat", quantity: 1, unitPrice: 280, cost: 280 },
  ],
  extraFee: 0,
};

describe("padrão = regra de hoje", () => {
  it("hospedagem e café vão pra chegada; serviços ficam pra agora", () => {
    const l = montarLinhas(base);
    expect(somar(l, "chegada")).toBe(2100);
    expect(somar(l, "agora")).toBe(1580);
  });

  it("soma das duas partes fecha com o total", () => {
    const l = montarLinhas(base);
    expect(somar(l, "agora") + somar(l, "chegada")).toBe(2100 + 250 + 1050 + 280);
  });

  it("taxa extra entra em 'agora' (era retido junto com serviços)", () => {
    const l = montarLinhas({ ...base, extraFee: 300, extraFeeDescricao: "Taxa" });
    expect(somar(l, "agora")).toBe(1880);
  });
});

describe("marcação do operador", () => {
  it("mover um serviço pra chegada muda os dois totais", () => {
    const l = montarLinhas({ ...base, escolhas: { [chaveLinha("Water Fall by boat")]: "chegada" } });
    expect(somar(l, "agora")).toBe(1300);
    expect(somar(l, "chegada")).toBe(2380);
  });

  it("mover a hospedagem pra agora também funciona", () => {
    const l = montarLinhas({ ...base, escolhas: { [chaveLinha("Hospedagem")]: "agora" } });
    expect(somar(l, "agora")).toBe(3680);
    expect(somar(l, "chegada")).toBe(0);
  });

  it("escolha inválida no banco cai no padrão, sem quebrar", () => {
    const l = montarLinhas({ ...base, escolhas: { hospedagem: "qualquer-coisa" as any } });
    expect(somar(l, "chegada")).toBe(2100);
  });

  it("chave de item que não existe mais é ignorada", () => {
    const l = montarLinhas({ ...base, escolhas: { "item-apagado": "agora" } });
    expect(somar(l, "chegada")).toBe(2100);
  });
});

describe("exibição", () => {
  it("marca item de custo zero como grátis", () => {
    const cafe = montarLinhas(base).find((l) => l.nome === "Café da Manhã")!;
    expect(cafe.gratis).toBe(true);
  });

  it("hospedagem digitada mostra 'manual' no detalhe", () => {
    const h = montarLinhas(base).find((l) => l.nome === "Hospedagem")!;
    expect(h.detalhe).toContain("manual");
    expect(h.detalhe).toContain("7 noites");
  });
});
