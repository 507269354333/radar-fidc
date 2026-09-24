const clean=v=>String(v||'').trim();
const normalize=v=>clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

export const REGULATORY_REFERENCES=[
 {institution:'CVM',kind:'Regulação',code:'RCVM 160',title:'Ofertas públicas de distribuição',url:'https://conteudo.cvm.gov.br/legislacao/resolucoes/resol160.html',scope:'Regime de ofertas públicas, ritos, documentos, responsabilidades e negociação dos valores mobiliários ofertados.'},
 {institution:'CVM',kind:'Regulação',code:'RCVM 175',title:'Fundos de investimento',url:'https://conteudo.cvm.gov.br/legislacao/resolucoes/resol175.html',scope:'Constituição, funcionamento, divulgação de informações e prestação de serviços para fundos, com anexos específicos por categoria.'},
 {institution:'CVM / SRE',kind:'Orientação',code:'Ofício Anual SRE 2026',title:'Orientações gerais sobre ofertas públicas',url:'https://www.gov.br/cvm/pt-br/assuntos/noticias/2026/confira-o-oficio-circular-anual-da-sre-sobre-ofertas-publicas/',scope:'Orientações da área técnica para emissores, ofertantes e intermediários em procedimentos de ofertas públicas.'},
 {institution:'CVM / SRE',kind:'Orientação',code:'Ofício Circular SRE 4/2026',title:'Registro automático e análise prévia',url:'https://www.gov.br/cvm/pt-br/assuntos/noticias/2026/area-tecnica-da-cvm-orienta-sobre-requerimentos-de-registro-automatico-de-ofertas-publicas-de-distribuicao-de-valores-mobiliarios',scope:'Orientação a coordenadores líderes sobre requerimentos de registro automático submetidos à análise prévia de entidade autorreguladora e campos de emissores não registrados.'},
 {institution:'ANBIMA',kind:'Autorregulação',code:'Código de Ofertas Públicas',title:'Estruturação e atividades em ofertas públicas',url:'https://www.anbima.com.br/pt_br/autorregular/codigos/ofertas-publicas/',scope:'Regras de autorregulação aplicáveis às instituições aderentes e às atividades alcançadas pelo Código de Ofertas Públicas.'}
];

export const REGULATORY_EXECUTION_METHOD={
 name:'Método Radar — Regulação → Execução',
 steps:[
  {order:1,key:'source',label:'Fonte oficial',question:'O que foi efetivamente publicado?',output:'Ato, ofício, resolução, código ou comunicado identificado e linkado.'},
  {order:2,key:'applicability',label:'Aplicabilidade',question:'Quem e qual processo podem ser alcançados?',output:'Participantes, produtos, ritos e etapas potencialmente afetados — sem presumir incidência antes da leitura da fonte.'},
  {order:3,key:'gap',label:'Gap operacional',question:'O processo atual já atende ao que a fonte exige?',output:'Diferenças entre prática atual e requisito/entendimento observado.'},
  {order:4,key:'process',label:'Processo executável',question:'Que mudança precisa virar tarefa, gate ou controle?',output:'Sequência operacional com responsáveis, pontos de decisão e dependências.'},
  {order:5,key:'evidence',label:'Evidência',question:'Como provar que o processo foi executado?',output:'Documento, protocolo, checklist, aprovação, registro de sistema ou trilha de auditoria.'},
  {order:6,key:'monitor',label:'Monitoramento',question:'O que pode mudar ou invalidar a implementação?',output:'Vigência, nova orientação, supervisão, atualização do documento e revisão periódica.'}
 ],
 guardrail:'O Radar separa obrigação expressa da fonte oficial de interpretação operacional. A tradução para processo não substitui parecer jurídico, compliance, autorregulação aplicável ou leitura integral da norma.'
};

export const REGULATORY_PLAYBOOKS=[
 {
  id:'oferta-publica',
  title:'Oferta pública: da definição do rito à evidência final',
  scope:'Modelo operacional para transformar requisitos de oferta em gates verificáveis.',
  participants:['Coordenador / Distribuidor','Emissor / Ofertante','Jurídico / Compliance','Administrador / Gestor quando aplicável'],
  stages:[
   {name:'1. Enquadramento',actions:['Identificar valor mobiliário, veículo, público-alvo e participantes.','Confirmar o rito e a fonte normativa/orientativa aplicável.'],evidence:'Memo de enquadramento ou checklist de aplicabilidade.'},
   {name:'2. Documentação',actions:['Mapear documentos exigidos pela fonte aplicável.','Controlar versões, aprovações e consistência entre documentos e cadastro.'],evidence:'Checklist documental versionado e trilha de aprovação.'},
   {name:'3. Autorregulação',actions:['Verificar se o Código/fluxo ANBIMA é aplicável à operação e aos participantes.','Quando aplicável, incorporar análise, protocolo e saneamento ao cronograma.'],evidence:'Registro da análise de aplicabilidade e protocolo/parecer quando existente.'},
   {name:'4. Protocolo / Registro',actions:['Executar o fluxo de requerimento ou registro compatível com o enquadramento validado.','Registrar número, data e evidências da submissão.'],evidence:'Protocolo, número oficial e comprovantes do processo.'},
   {name:'5. Exigências / Saneamento',actions:['Registrar pedido, óbice ou orientação recebido.','Converter cada ponto em tarefa com responsável, prazo interno e evidência de resposta.'],evidence:'Log de exigências e pacote de resposta/revisão.'},
   {name:'6. Fechamento',actions:['Confirmar status final e documentos definitivos.','Arquivar evidências e lições de processo para reutilização.'],evidence:'Dossiê final da oferta e trilha de decisão.'}
  ]
 },
 {
  id:'fundos',
  title:'Fundos: mudança regulatória → governança e operação',
  scope:'Modelo para absorver alterações que atinjam FIDC, FIAGRO, FII ou prestadores.',
  participants:['Administrador fiduciário','Gestor','Jurídico / Compliance','Controladoria / Operações','Distribuição quando aplicável'],
  stages:[
   {name:'1. Identificar o alcance',actions:['Localizar parte geral, anexo, ofício ou orientação aplicável.','Separar fundo, classe, subclasse, prestador e atividade atingidos.'],evidence:'Matriz de aplicabilidade.'},
   {name:'2. Gap de documentos',actions:['Comparar regulamento, anexos, políticas, contratos e cadastros com o novo requisito.'],evidence:'Gap list documentado.'},
   {name:'3. Gap de processo',actions:['Mapear rotinas, controles, eventos e responsabilidades afetados.'],evidence:'Fluxo atual x fluxo-alvo.'},
   {name:'4. Implementação',actions:['Transformar cada gap em tarefa, responsável, dependência e aceite.'],evidence:'Plano de implementação e aprovações.'},
   {name:'5. Prestação / cadastro',actions:['Verificar reflexos em informes, cadastros, registros e comunicações aplicáveis.'],evidence:'Protocolo, arquivo enviado ou evidência de revisão.'},
   {name:'6. Revisão',actions:['Testar o processo após implementação e manter gatilho para nova orientação.'],evidence:'Teste de controle e registro de revisão.'}
  ]
 },
 {
  id:'change-management',
  title:'Mudança regulatória: change management do início ao fim',
  scope:'Playbook transversal para qualquer ato novo capturado pelo Radar.',
  participants:['Regulatório / Compliance','Jurídico','Dono do processo','Tecnologia / Dados quando aplicável','Gestão'],
  stages:[
   {name:'1. Captura',actions:['Registrar fonte, data, vigência e versão.'],evidence:'Registro da mudança e link oficial.'},
   {name:'2. Classificação',actions:['Classificar tema, produtos, participantes e criticidade operacional.'],evidence:'Ficha de mudança regulatória.'},
   {name:'3. Aplicabilidade',actions:['Definir se a mudança alcança o processo e em que condições.'],evidence:'Decisão de aplicabilidade com fundamento.'},
   {name:'4. Desenho',actions:['Traduzir requisito em fluxo, regra de sistema, checklist ou controle.'],evidence:'Fluxo-alvo e especificação.'},
   {name:'5. Implementação',actions:['Executar tarefas e coletar aceite dos responsáveis.'],evidence:'Evidências de implementação.'},
   {name:'6. Sustentação',actions:['Monitorar supervisão, dúvidas, novos ofícios e necessidade de ajuste.'],evidence:'Histórico de revisão e testes periódicos.'}
  ]
 }
];

function executionForTheme(theme=''){
 const t=normalize(theme);
 if(t.includes('oferta'))return{
  owners:['Coordenação / Distribuição','Estruturação','Formalização','Jurídico / Compliance'],
  checkpoints:['Confirmar aplicabilidade e rito.','Revisar documentação e campos de protocolo.','Verificar reflexos em autorregulação quando aplicável.','Registrar evidência da implementação antes de tratar o item como concluído.'],
  evidence:['Checklist de enquadramento','Controle de versões','Protocolo/registro','Log de exigência e resposta']
 };
 if(t.includes('fundos'))return{
  owners:['Administrador fiduciário','Gestor','Jurídico / Compliance','Operações'],
  checkpoints:['Confirmar fundo/classe/prestador alcançado.','Comparar documentos e rotinas atuais com a fonte.','Mapear eventos, informes, cadastros e controles afetados.','Testar o fluxo implementado e preservar evidências.'],
  evidence:['Matriz de aplicabilidade','Gap list','Fluxo-alvo','Aprovação / protocolo / teste de controle']
 };
 if(t.includes('dados'))return{
  owners:['Regulatório / Compliance','Dados / Operações','Dono do processo'],
  checkpoints:['Identificar campo, informe ou base afetada.','Definir fonte mestra e validações.','Criar controle de completude, consistência e rastreabilidade.','Monitorar rejeições, pendências e reapresentações.'],
  evidence:['Dicionário de dados','Regra de validação','Log de envio','Trilha de correção']
 };
 return{
  owners:['Regulatório / Compliance','Jurídico','Dono do processo'],
  checkpoints:['Abrir e ler a fonte oficial.','Determinar aplicabilidade.','Converter o impacto confirmado em tarefa/controle.','Guardar evidência e monitorar novas orientações.'],
  evidence:['Fonte oficial','Decisão de aplicabilidade','Plano de ação','Evidência de implementação']
 };
}

export function buildRegulatoryExecution(regulatory=[]){
 return (regulatory||[]).map((item,index)=>{
  const x=executionForTheme(item.theme);
  return{
   id:'reg-'+String(index+1).padStart(2,'0'),
   title:item.title,
   source:item.source||'Fonte oficial',
   url:item.url,
   theme:item.theme||'Supervisão de mercado',
   observed:item.what||'Publicação oficial identificada.',
   radarInterpretation:item.implication||'Avaliar aplicabilidade e impacto operacional antes de alterar o processo.',
   execution:{
    status:'triagem necessária',
    owners:x.owners,
    checkpoints:x.checkpoints,
    evidence:x.evidence,
    firstAction:'Ler a fonte oficial e registrar uma decisão de aplicabilidade antes de executar qualquer mudança.'
   },
   boundary:'Os checkpoints são uma tradução operacional Radar. Só devem ser tratados como obrigação após validação da fonte aplicável e do contexto da instituição/operação.'
  };
 });
}

export function buildRegulatoryWorkspace(regulatory=[]){
 return{
  methodology:REGULATORY_EXECUTION_METHOD,
  references:REGULATORY_REFERENCES,
  playbooks:REGULATORY_PLAYBOOKS,
  live:buildRegulatoryExecution(regulatory),
  positioning:{
   promise:'Transformar exigência regulatória em processo executável e evidenciável.',
   audience:'Coordenadores, distribuidores, gestores, administradores, emissores, operações, jurídico e compliance.',
   differentiator:'O Radar não termina na leitura da norma: organiza aplicabilidade, gap, execução, evidência e monitoramento, sem confundir interpretação operacional com obrigação jurídica.'
  }
 };
}
