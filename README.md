# Radar FIDC

Plataforma de inteligência de mercado para ofertas públicas de **FIDC, FIAGRO e FII**, construída sobre fontes oficiais.

## Versão 10 — Cockpit + Macro Tape

- **Mercados 360:** FIDC, FIAGRO e FII classificados pelos campos oficiais da CVM, sem inferência pelo nome do fundo.
- **Analytics por vertical:** competência, quantidade de ofertas, volume observado, ticket, ritos, públicos e séries mensais.
- **League tables:** coordenadores por quantidade e volume, com janela de 12 meses e página individual.
- **Monitor de eventos:** novas ofertas, status, documentos/publicações presentes na base e histórico do emissor/coordenador.
- **Relatório semanal:** fechamento de segunda a domingo para cada vertical ou para os três mercados, com comparação contra a semana anterior.
- **Contexto macro:** Banco Central/SGS e Quadro de Indicadores da ANBIMA.
- **Regulação:** curadoria de publicações oficiais da CVM ligada a ofertas, FIDC, FIAGRO, FII, securitização e distribuição.
- **Separação editorial:** dado oficial, documento da operação e leitura Radar permanecem identificados separadamente.
- **Inteligência de Mercado:** briefing, mapa de direção, teses Radar, cenários condicionais, regulador decodificado e mesa de decisão por participante.
- **Teses testáveis:** toda tese publica evidência, mecanismo econômico, horizonte, variáveis que confirmam e critérios que invalidam a leitura.
- **Regulatory Intelligence:** o Radar descreve primeiro o fato observado na fonte oficial e separa a interpretação operacional, sem atribuir intenção ao regulador.
- **Consistência multicanal:** a mesma inteligência alimenta homepage, relatório semanal, Carta Mensal e a página dedicada.
- **Educação dos índices:** IROP, IRBD, IRCC, IRFC e IRPM publicam pergunta respondida, definição, base técnica, evidência empírica, fórmula quantitativa, camada qualitativa, leitura do score atual e limitações.
- **Governança metodológica:** score quantitativo e interpretação qualitativa permanecem separados; os índices são proprietários, não oficiais e estão em validação histórica contínua.

## Rotas

- `/` — visão geral FIDC + resumo dos três mercados
- `/markets.html?market=FIDC|FIAGRO|FII` — inteligência por vertical
- `/offer.html?market=...&id=...` — ficha individual de oferta
- `/coordinator.html?market=...&cnpj=...` — perfil do coordenador
- `/weekly-report.html?market=FIDC|FIAGRO|FII|ALL` — relatório semanal imprimível/PDF
- `/intelligence.html?month=AAAA-MM` — briefing, teses, cenários, regulador e mesa de decisão
- `/monthly-letter.html?month=AAAA-MM&market=ALL|FIDC|FIAGRO|FII` — Carta Mensal Radar
- `/api/markets`, `/api/offer`, `/api/coordinator`, `/api/weekly`, `/api/monthly`, `/api/indices`, `/api/intelligence`, `/api/macro-ticker` — camada de dados e inteligência

## Fontes

- CVM Dados Abertos — Ofertas Públicas de Distribuição.
- Banco Central do Brasil — Sistema Gerenciador de Séries Temporais (SGS).
- ANBIMA — Quadro de Indicadores público.
- CVM — notícias e orientações oficiais.

A integração de séries licenciadas/autenticadas do **ANBIMA Data** (por exemplo, famílias IDA/IMA quando aplicável) deve usar credenciais próprias e a API oficial; o projeto não replica cotações a partir de fontes não oficiais.

## Metodologia

A classificação FIDC/FIAGRO/FII usa somente campos oficiais de tipo de fundo, tipo de ativo ou valor mobiliário. FIAGRO tem precedência sobre classificações históricas como FIAGRO-FIDC/FIAGRO-FII. Linhas de classes ou séries da mesma oferta são consolidadas pelo número oficial/processo e somente componentes distintos compõem o volume.

Sinais de tema no relatório semanal são derivados apenas da denominação e aparecem como **indicativos**, nunca como tese confirmada. Uma tese/destinação só deve ser atribuída quando houver documento público que a sustente.

## Validação

```bash
npm test
npm run validate:data
```

O deploy é feito automaticamente pela integração GitHub/Vercel; não é necessário alterar o projeto Vercel manualmente.
