# Radar FIDC

Analytics de ofertas públicas FIDC sobre bases oficiais da CVM e do Banco Central do Brasil.

## Entrega
- KPIs de ofertas, volume observado, coordenadores e atualização da base
- filtros por busca, rito, público-alvo e coordenador
- ranking de coordenadores consolidados por CNPJ
- composição por rito e público-alvo
- tabela filtrável
- drawer individual de cada operação
- séries BCB independentes, sem indisponibilidade em cascata

## Publicação
O deploy é realizado pela integração GitHub/Vercel. As rotas `/api/*` exigem ambiente Node compatível; abrir `index.html` diretamente não executa o backend.

## Validação

```bash
npm test
npm run validate:data
```

## Fontes e metodologia

- CVM Dados Abertos — Ofertas Públicas de Distribuição.
- Banco Central do Brasil — Sistema Gerenciador de Séries Temporais (SGS).

As ofertas são identificadas pelos campos oficiais de tipo do ativo/fundo. Linhas de classes e séries da mesma oferta são consolidadas pelo número oficial ou processo, e somente componentes distintos compõem o volume. Campos ausentes permanecem não informados; o Radar não cria estimativas.
