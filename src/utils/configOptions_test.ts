// TRAVA DE SEGURANÇA: o Rio não pode mudar.
//
// As listas abaixo são exatamente as que estavam fixas no CompleteLeadModal antes
// de passarem a vir da configuração. Se algum destes testes quebrar, o formulário
// do Rio mudou — e isso é proibido.
//
// Roda com: deno test --allow-read src/utils/configOptions_test.ts
import { assertEquals, assert, assertFalse } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { roomOptions, itemLabel, itemAtivo } from "./configOptions.ts";

const configs = JSON.parse(await Deno.readTextFile("src/utils/__fixtures__configs.json"));
const rio = configs.rio;
const bahia = configs.bahia;

// Copiado do código antigo, exatamente como estava na tela.
const RIO_PRIVATE_ANTIGO = ["Shared bathroom", "Double", "Sea-View", "Triple", "Family"];
const RIO_SHARED_ANTIGO = ["Mixed Economic", "Mixed Standard", "Female Economic", "Female Standard"];

// === RIO PERMANECE IDÊNTICO ===
Deno.test("RIO: quartos privativos iguais aos de antes", () => {
  assertEquals(roomOptions(rio, "Private").sort(), [...RIO_PRIVATE_ANTIGO].sort());
});
Deno.test("RIO: quartos compartilhados iguais aos de antes", () => {
  assertEquals(roomOptions(rio, "Shared").sort(), [...RIO_SHARED_ANTIGO].sort());
});
Deno.test("RIO: rótulos das atividades inalterados", () => {
  assertEquals(itemLabel(rio, "hike", "Trilha"), "Trilha");
  assertEquals(itemLabel(rio, "rio-city-tour", "Rio City Tour"), "Rio City Tour");
  assertEquals(itemLabel(rio, "carioca-experience", "Carioca Experience"), "Carioca Experience");
});
Deno.test("RIO: todos os itens continuam ativos", () => {
  for (const id of ["hike", "rio-city-tour", "carioca-experience", "surf-skate", "transfer"]) {
    assert(itemAtivo(rio, id), `item ${id} sumiu do Rio`);
  }
});

// === BAHIA REFLETE O QUE O PARCEIRO CONFIGUROU ===
Deno.test("BAHIA: só os quartos que ele deixou", () => {
  assertEquals(roomOptions(bahia, "Private").sort(), ["Double", "Triple"]);
  assertEquals(roomOptions(bahia, "Shared").sort(), ["Female Standard", "Mixed Standard"]);
});
Deno.test("BAHIA: mostra os nomes dele, não os do Rio", () => {
  assertEquals(itemLabel(bahia, "hike", "Trilha"), "Water Fall by boat");
  assertEquals(itemLabel(bahia, "rio-city-tour", "Rio City Tour"), "Rafting");
  assertEquals(itemLabel(bahia, "carioca-experience", "Carioca Experience"), "Itacaré Experience");
});
Deno.test("BAHIA: Surf-Skate removido some do formulário", () => {
  assertFalse(itemAtivo(bahia, "surf-skate"));
});

// === NÃO PERDE DADO DE LEAD ANTIGO ===
Deno.test("item removido reaparece se o lead já tem quantidade", () => {
  assert(itemAtivo(bahia, "surf-skate", 2));
});
Deno.test("quarto fora da config continua como opção NAQUELE lead", () => {
  assert(roomOptions(bahia, "Private", "Sea-View").includes("Sea-View"));
});
Deno.test("sem valor atual, quarto removido nao volta pra lista", () => {
  assertFalse(roomOptions(bahia, "Private").includes("Sea-View"));
});

// === BORDAS ===
Deno.test("config vazia nao quebra", () => {
  assertEquals(roomOptions(null, "Private"), []);
  assertEquals(itemLabel(undefined, "hike", "Trilha"), "Trilha");
});
Deno.test("nome em branco cai no rotulo padrao", () => {
  assertEquals(itemLabel({ items: [{ id: "hike", name: "  " }] }, "hike", "Trilha"), "Trilha");
});

// Documenta EXATAMENTE os rótulos que o Rio passa a exibir. Qualquer mudança aqui
// é mudança visível na tela do Rio e precisa ser decisão consciente.
Deno.test("RIO: inventario completo dos rotulos exibidos", () => {
  assertEquals(itemLabel(rio, "surf-skate", "Surf-Skate"), "Surf-Skate");
  assertEquals(itemLabel(rio, "surf-guide", "Surf Guide"), "Surf Guide");
  assertEquals(itemLabel(rio, "hike", "Trilha"), "Trilha");
  assertEquals(itemLabel(rio, "rio-city-tour", "Rio City Tour"), "Rio City Tour");
  assertEquals(itemLabel(rio, "carioca-experience", "Carioca Experience"), "Carioca Experience");
  // ÚNICA divergência vs. o rótulo fixo antigo ("Aulas de Yoga"): a config do Rio
  // sempre teve o nome no singular. Só texto — nenhum valor muda.
  assertEquals(itemLabel(rio, "yoga-lesson", "Aulas de Yoga"), "Aula de Yoga");
});
