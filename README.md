# Case Estoque

Aplicação Next.js para importação e análise de carteira de recebíveis via CSV.
O analista sobe o arquivo e o sistema devolve tabela, indicadores, alertas de
concentração e o detalhamento das linhas rejeitadas.

---

## Como rodar

```bash
npm install
npm run dev
```

Acesse **http://localhost:3000/estoque**

A rota `/` redireciona automaticamente para `/estoque`.

### Testes unitários

```bash
npm test
```

---

## Arquivos de teste

Estão em `arquivos-teste/` — são os 3 arquivos oficiais anexados ao enunciado
do case, usados como gabarito de correção.

| Arquivo | Comportamento esperado |
|---|---|
| `estoque-ok.csv` | Importa as 6 linhas. Sem erros. |
| `estoque-parcial.csv` | Importa 8, rejeita 2 (linha 9 — NF duplicada; linha 10 — valor inválido). Taxa de erro de exatos 20%, dentro do limite: snapshot é gravado. |
| `estoque-rejeitado.csv` | 3 erros em 5 linhas (60%). Acima do limite de 20%. HTTP 400, snapshot **não** é gravado. |

**Sequência recomendada:** importe os três nessa ordem. No terceiro, a tabela
deve continuar exibindo o estoque do segundo — é a prova da Regra 7.

### Gabarito

**`estoque-ok.csv`**

| Indicador | Valor |
|---|---|
| Qtd. estoque ativo | 5 |
| Soma estoque ativo | R$ 100.000,00 |
| % vencido | 20,00% |
| PDD total | R$ 15.000,00 |
| Maior sacado | Hospital Central — 70,00% |

**`estoque-parcial.csv`**

| Indicador | Valor |
|---|---|
| Qtd. estoque ativo | 7 |
| Soma estoque ativo | R$ 103.000,00 |
| % vencido | 19,42% |
| PDD total | R$ 15.000,00 |
| Maior sacado | Hospital Central — 67,96% |
| Erros | 2 (linha 9 — NF duplicada; linha 10 — valor inválido) |

**`estoque-rejeitado.csv`**

| Indicador | Valor |
|---|---|
| Erros | 3 (linha 3 — status inválido; linha 4 — valor inválido; linha 5 — vencimento inválido) |
| Taxa de erro | 60,0% |
| Resultado | HTTP 400 — snapshot anterior preservado |

## Arquitetura

```
app/
├── page.tsx                      redirect para /estoque
├── estoque/
│   ├── page.tsx                  orquestra estado e composição da tela
│   └── components/
│       ├── ImportarCsv.tsx       upload + repasse do resultado
│       ├── CardsIndicadores.tsx  os 5 indicadores
│       ├── TabelaEstoque.tsx     tabela + regra de cores
│       ├── FiltroStatus.tsx      todos / aberto / vencido / liquidado
│       ├── PainelErros.tsx       linha + motivo (âmbar ou vermelho)
│       └── AlertasConcentracao.tsx
└── api/
    └── estoque/
        ├── route.ts              GET  - último snapshot
        └── import/route.ts       POST - multipart/form-data

lib/
├── estoque-types.ts              contratos compartilhados
├── csv-parser.ts                 parse + validação de cabeçalho
├── estoque-regras.ts             todas as regras de negócio
└── estoque-store.ts              snapshot em memória
```

**As regras de negócio vivem em `lib/` e não dependem do React.** São importadas
tanto pela API quanto pelos testes unitários, sem browser.

O `page.tsx` não calcula nada de domínio — apenas consome o que a API devolve.
A única lógica de apresentação nele é o filtro da tabela.

---

## APIs

### `POST /api/estoque/import`

`multipart/form-data`, campo `arquivo`.

**200 — aceito**
```json
{
  "importados": 5,
  "rejeitados": 1,
  "erros": [{ "linha": 6, "motivo": "NF vazia" }],
  "totais": { "quantidadeEstoqueAtivo": 4, "somaEstoqueAtivo": 113000, "...": "..." }
}
```

**400 — rejeitado (Regra 7 ou cabeçalho inválido)**
```json
{
  "importados": 0,
  "rejeitados": 4,
  "totais": null,
  "erros": [{ "linha": 2, "motivo": "NF duplicada" }],
  "mensagem": "Arquivo rejeitado: taxa de erro de 80.0% excede o limite de 20%."
}
```

Mesmo rejeitado, os erros são devolvidos para exibição na tela.

### `GET /api/estoque`

Devolve o último snapshot gravado. Se nunca houve importação válida, devolve um
snapshot vazio (nunca `null`).

**Persistência:** memória do processo (`lib/estoque-store.ts`). Sem banco. Um
restart do servidor zera o estado — comportamento aceito pelo escopo do case.

---

## Regras implementadas

Data de referência fixa: **2026-08-21** (`DATA_REFERENCIA` em `lib/estoque-regras.ts`).
Nenhum cálculo usa a data do sistema.

| # | Regra | Onde |
|---|---|---|
| 1 | Linha válida (NF, valor > 0, data, status) | `validarLinha` |
| 1 | Cabeçalho exato → 400 no arquivo inteiro | `parseCsv` |
| 2 | Duplicata por `cedente + nf`, case-insensitive | `gerarChaveDuplicata` |
| 3 | Estoque ativo = ABERTO + VENCIDO | `calcularIndicadoresEConcentracao` |
| 4 | Vencido operacional | `calcularVencidoOperacional` |
| 5 | PDD 0% / 50% / 100% | `calcularPdd` |
| 6 | Concentração > 25% | `calcularIndicadoresEConcentracao` |
| 7 | Trava de 20% | `processarImportacao` |

---

## Decisões de projeto

**Filtro "Vencido" usa a regra operacional, não o texto do CSV.**
Um título com status `ABERTO` e vencimento anterior a 2026-08-21 aparece em
"Vencido". Seria incoerente filtrar por "Aberto" e ver linhas vermelhas na
tabela — a Regra 4 define que esse título *é* vencido.

**Os cards não reagem ao filtro.**
Os indicadores vêm calculados do backend sobre o estoque completo. O filtro é
uma lente sobre a tabela; se ele alterasse o PDD total, o número deixaria de
representar a carteira.

**Prioridade das cores:** liquidado (cinza) → vencido (vermelho) → concentração
(amarelo). Um título liquidado permanece cinza mesmo com data vencida, porque
não participa de nenhum cálculo.

**Numeração das linhas de erro:** 1 = primeira linha de dados, após o cabeçalho.

**Datas em UTC.** `Date.UTC` em todo cálculo de vencimento, evitando que o fuso
do servidor desloque o resultado em um dia.

**Rejeição não recarrega a tabela.** O `page.tsx` só chama `GET /api/estoque`
quando a importação é aceita, deixando explícito na UI o que a Regra 7 já
garante no backend.

---

## Testes

Vitest, cobrindo as regras de cálculo e a trava do arquivo:

- **Regra 2** — duplicata: primeira ocorrência vale, demais viram erro
- **Regra 4** — vencido operacional: status `VENCIDO` e data anterior à referência
- **Regra 5** — PDD: fronteiras de 0, 1, 30 e 31 dias de atraso
- **Regra 7** — trava: aceita até 20%, rejeita acima, snapshot preservado

```bash
npm test
```

---

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · Vitest