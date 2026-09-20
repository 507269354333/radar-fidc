# Radar FIDC — Salto 4

Analytics de ofertas públicas FIDC sobre a base oficial da CVM.

## Entrega
- KPIs de ofertas, volume observado, coordenadores e atualização da base
- filtros por busca, rito, público-alvo e coordenador
- ranking de coordenadores por quantidade de registros
- composição por rito e público-alvo
- tabela filtrável
- drawer individual de cada operação
- preserva BCB, ticker e notícias do Salto 3

## Publicação
Suba a pasta inteira para um repositório separado e importe no Vercel. As rotas `/api/*` só funcionam quando o projeto é servido pelo Vercel/ambiente Node compatível; abrir `index.html` via `content://` não executa o backend.

## Fonte
CVM Dados Abertos — Ofertas Públicas de Distribuição. Campos ausentes permanecem como não informados; o portal não cria estimativas.
