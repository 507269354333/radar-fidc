import {computeRadarIndices} from './indices.js';
import {buildRegulatoryWorkspace} from './regulatory-execution.js';

const finite=v=>Number.isFinite(v);
const scoreBand=score=>!finite(score)?'indisponível':score>=67?'alto':score>=34?'intermediário':'baixo';
const clean=v=>String(v||'').trim();
const normalize=v=>clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const money=v=>finite(v)?v:null;
const previousFullMonth=reference=>{const d=new Date(Date.UTC(reference.getUTCFullYear(),reference.getUTCMonth(),1));d.setUTCMonth(d.getUTCMonth()-1);return d.toISOString().slice(0,7)};

function marketDirection(key,idx){
  const irop=idx.offerPressure?.score, funding=idx.funding?.score, pulse=idx.pulse?.score, conc=idx.concentration?.score;
  let headline='Mercado em leitura intermediária';
  let statement='Oferta primária e funding precisam ser lidos em conjunto antes de inferir expansão ou retração.';
  if(finite(irop)&&finite(funding)&&irop>=67&&funding<50){
    headline='Pipeline forte, capital ainda seletivo';
    statement='A atividade de ofertas está elevada em relação à própria história recente, enquanto as condições de funding permanecem menos favoráveis. Isso tende a aumentar a importância de estrutura, documentação, diferenciação e janela de distribuição.';
  }else if(finite(irop)&&finite(funding)&&irop>=67&&funding>=50){
    headline='Oferta forte com funding mais construtivo';
    statement='A pressão de oferta e as condições de funding estão simultaneamente acima da faixa baixa. O cenário favorece maior capacidade potencial de absorção, sem garantir distribuição integral.';
  }else if(finite(irop)&&irop<34){
    headline='Pipeline contido';
    statement='A intensidade de novas ofertas está na faixa baixa da própria janela histórica. O mercado deve ser lido mais por seletividade e operações específicas do que por expansão generalizada.';
  }else if(finite(pulse)&&pulse>=67){
    headline='Pulso expansivo';
    statement='O composto Radar de oferta e funding está em faixa elevada, sinalizando atividade primária disseminada em relação à janela histórica.';
  }
  return {
    market:key,
    headline,
    statement,
    scores:{IROP:irop,IRBD:idx.breadth?.score,IRCC:conc,IRFC:funding,IRPM:pulse},
    bands:{offer:scoreBand(irop),funding:scoreBand(funding),pulse:scoreBand(pulse),concentration:scoreBand(conc)}
  };
}

function evidenceLevel(items){
  const valid=items.filter(x=>x&&x.value!==null&&x.value!==undefined&&x.value!=='').length;
  return valid>=4?'ampla':valid>=2?'moderada':'limitada';
}

function buildTheses(indices,month){
  const theses=[];
  const all=indices.markets.ALL, f=indices.markets.FIDC, a=indices.markets.FIAGRO, i=indices.markets.FII;

  const capitalEvidence=[
    {label:'IROP agregado',value:all.offerPressure?.score,source:'Metodologia Radar / CVM'},
    {label:'IRFC',value:all.funding?.score,source:'Metodologia Radar / BCB'},
    {label:'IRBD',value:all.breadth?.score,source:'Metodologia Radar / CVM'},
    {label:'IRCC',value:all.concentration?.score,source:'Metodologia Radar / CVM'}
  ];
  theses.push({
    id:'capital-competition',
    title:finite(all.offerPressure?.score)&&finite(all.funding?.score)&&all.offerPressure.score>=60&&all.funding.score<50?'Mais ofertas competindo por capital seletivo':'Oferta e funding precisam ser lidos juntos',
    statement:finite(all.offerPressure?.score)&&finite(all.funding?.score)&&all.offerPressure.score>=60&&all.funding.score<50
      ?'O pipeline primário está relativamente forte, mas o ambiente de funding não acompanha na mesma intensidade. A leitura Radar é de maior competição por atenção e capital, não de excesso comprovado de recursos.'
      :'A força do mercado primário não deve ser interpretada isoladamente. O Radar cruza pipeline, breadth, concentração e funding antes de inferir pressão competitiva.',
    evidence:capitalEvidence,
    evidenceLevel:evidenceLevel(capitalEvidence),
    mechanism:['mais ofertas registradas','disputa por distribuição e alocação','maior importância de preço, estrutura e diferenciação','absorção final depende de funding e demanda efetiva'],
    confirms:['IROP e IRBD permanecem elevados por mais de uma competência','IRFC melhora sem deterioração relevante de crédito','volume distribuído/captado confirma o volume registrado quando essa informação estiver disponível'],
    invalidates:['queda persistente do IROP','aumento de concentração com retração de emissores','piora adicional do funding acompanhada de redução do pipeline'],
    horizon:'3–12 meses'
  });

  const strongest=[['FIDC',f],['FIAGRO',a],['FII',i]].sort((x,y)=>(y[1].offerPressure?.score??-1)-(x[1].offerPressure?.score??-1))[0];
  const weakFunding=finite(all.funding?.score)&&all.funding.score<50;
  const strongestEvidence=[
    {label:`IROP ${strongest[0]}`,value:strongest[1].offerPressure?.score,source:'Metodologia Radar / CVM'},
    {label:`IRBD ${strongest[0]}`,value:strongest[1].breadth?.score,source:'Metodologia Radar / CVM'},
    {label:`IRPM ${strongest[0]}`,value:strongest[1].pulse?.score,source:'Metodologia Radar / CVM + BCB'},
    {label:'IRFC comum',value:all.funding?.score,source:'Metodologia Radar / BCB'}
  ];
  theses.push({
    id:'leading-vertical',
    title:`${strongest[0]} lidera a pressão relativa de oferta`,
    statement:`Na competência ${month}, ${strongest[0]} apresenta o maior IROP entre as três verticais. Isso mede intensidade relativa do pipeline na própria história do segmento; não significa maior retorno, melhor qualidade ou captação garantida.`,
    evidence:strongestEvidence,
    evidenceLevel:evidenceLevel(strongestEvidence),
    mechanism:['pipeline mais intenso na vertical','maior número/volume relativo de operações','mais necessidade de comparar estruturas e participantes',weakFunding?'funding restritivo pode aumentar seletividade':'funding menos restritivo pode melhorar capacidade de absorção'],
    confirms:[`IROP de ${strongest[0]} permanece acima das demais verticais`,'breadth acompanha o aumento de oferta','novas competências mantêm atividade sem depender de poucos coordenadores'],
    invalidates:['reversão do IROP na competência seguinte','crescimento concentrado em poucos registros ou outliers','queda relevante do breadth'],
    horizon:'1–6 meses'
  });

  const fiiEvidence=[
    {label:'IROP FII',value:i.offerPressure?.score,source:'Metodologia Radar / CVM'},
    {label:'IRFC',value:i.funding?.score,source:'Metodologia Radar / BCB'},
    {label:'IRCC FII',value:i.concentration?.score,source:'Metodologia Radar / CVM'},
    {label:'Cenário base anual',value:money(i.projection?.scenarios?.find(x=>x.label==='Base')?.volume),source:'Cenário Radar'}
  ];
  theses.push({
    id:'real-estate-transmission',
    title:'Oferta de FII não é sinônimo de inflação imobiliária',
    statement:'Maior volume de ofertas de FII aumenta a capacidade potencial de formação de capital. O efeito sobre preços de imóveis depende de quanto é efetivamente distribuído, de onde o capital será alocado e de variáveis como juros, crédito, renda, vacância, estoque e desenvolvimento.',
    evidence:fiiEvidence,
    evidenceLevel:evidenceLevel(fiiEvidence),
    mechanism:['oferta registrada','capital efetivamente distribuído','aquisição/desenvolvimento/desalavancagem','competição por ativos ou aumento de oferta física','efeito final depende de fundamentos imobiliários e macro'],
    confirms:['captação efetiva acompanha registros','aquisições e desenvolvimento aceleram','cap rates, vacância, aluguel e crédito confirmam pressão no mesmo sentido'],
    invalidates:['baixa distribuição das ofertas','capital direcionado majoritariamente a desalavancagem','aumento de oferta física/vacância neutraliza pressão de demanda'],
    horizon:'6–24 meses'
  });
  return theses;
}

function classifyRegulation(item){
  const t=normalize(item?.title);
  if(/registro automatic|resolucao.*160|oferta.*public|coordenador/.test(t))return{
    theme:'Ofertas & distribuição',
    what:'O título aponta para regras, orientações ou procedimentos ligados ao registro/distribuição de ofertas.',
    implication:'Revisar o conteúdo oficial para identificar impactos em documentação, rito, responsabilidades do coordenador e protocolo. O Radar não presume alteração operacional apenas pelo título.'
  };
  if(/fidc|fiagro|fii|resolucao.*175|fundo.*investimento/.test(t))return{
    theme:'Fundos & governança',
    what:'O título se relaciona ao regime de fundos, suas classes, prestadores ou obrigações.',
    implication:'Conferir escopo, vigência e participantes alcançados antes de ajustar governança, documentos ou rotinas.'
  };
  if(/dados|portal|informac/.test(t))return{
    theme:'Dados & transparência',
    what:'O título se relaciona à disponibilidade, qualidade ou prestação de informações.',
    implication:'Para o Radar, esse tipo de evento aumenta a relevância de controles de cadastro, consistência e rastreabilidade dos dados usados em ofertas e fundos.'
  };
  return{
    theme:'Supervisão de mercado',
    what:'Publicação oficial potencialmente relevante ao ecossistema acompanhado pelo Radar.',
    implication:'Abrir a fonte oficial e verificar escopo, vigência e participantes afetados antes de transformar o evento em ação operacional.'
  };
}

function regulatorySignals(news=[]){
  return news.slice(0,8).map(item=>{
    const c=classifyRegulation(item);
    return {title:item.title,url:item.url,source:item.source||'CVM',...c}
  });
}

function stakeholderDesk(indices){
  const all=indices.markets.ALL;
  const offer=all.offerPressure?.score, funding=all.funding?.score;
  return [
    {role:'Coordenador / Distribuidor',question:'A oferta está entrando em uma janela com muita competição por capital?',radar:['Comparar IROP e IRBD com o pipeline próprio','Monitorar concentração de coordenadores e novas ofertas concorrentes','Conferir rito, documentação e orientações SRE/CVM antes do protocolo'],signal:finite(offer)&&offer>=67?'atenção alta ao pipeline':'monitoramento regular'},
    {role:'Gestor',question:'O capital potencial do mercado está crescendo mais rápido que a capacidade de alocação?',radar:['Cruzar oferta primária com funding e condições do ativo subjacente','Separar volume registrado de capital efetivamente distribuído','Acompanhar cenários por vertical e variáveis que confirmam a tese'],signal:finite(offer)&&offer>=67?'pipeline forte':'pipeline intermediário/baixo'},
    {role:'Administrador / Prestadores',question:'O processo e os dados suportam aumento de atividade sem elevar risco operacional?',radar:['Acompanhar atos da CVM/ANBIMA relacionados à vertical','Reforçar consistência de cadastro, documentos e eventos da oferta','Usar alertas de mudanças regulatórias como gatilho de revisão, não como conclusão automática'],signal:'foco em qualidade e aderência'},
    {role:'Emissor / Originador',question:'Existe espaço de mercado para uma nova operação sem depender de premissas otimistas?',radar:['Comparar volume/ticket da operação com histórico e concorrentes','Observar funding e concentração de participantes','Testar cenários conservador, base e expansão antes de extrapolar demanda'],signal:finite(funding)&&funding<50?'funding mais seletivo':'funding neutro/favorável'},
    {role:'Profissional de mercado',question:'O que mudou desde a última leitura?',radar:['Começar pelo briefing Radar','Abrir teses com evidências e critérios de invalidação','Ir da interpretação para a fonte oficial quando o tema afetar uma operação real'],signal:'consumo diário'}
  ];
}

function scenarioMap(indices){
  return ['FIDC','FIAGRO','FII'].map(market=>{
    const p=indices.markets[market].projection;
    return {
      market,
      current:{IROP:indices.markets[market].offerPressure?.score,IRPM:indices.markets[market].pulse?.score,IRFC:indices.markets[market].funding?.score},
      scenarios:(p?.scenarios||[]).map(x=>({label:x.label,volume:x.volume,offers:x.offers})),
      method:p?.method||''
    };
  });
}

function marketContext(bcb,anbima){
  const a=anbima?.indicators||{},series=bcb?.series||{};
  const pick=(label,x,source)=>({label,value:x?.value??x?.latest?.value??null,unit:x?.unit||'',date:x?.date||x?.latest?.date||'',source});
  return {
    anbima:[
      pick('Estimativa Selic',a.selicEstimate,'ANBIMA'),
      pick('DI-B3',a.diB3,'ANBIMA'),
      pick('IPCA projetado',a.ipcaProjection,'ANBIMA'),
      pick('Dólar venda',a.dollarSell,'ANBIMA')
    ],
    bcb:[
      pick('Selic',series.selic,'BCB / SGS'),
      pick('Spread PJ',series.spreadPJ,'BCB / SGS'),
      pick('Inadimplência PJ',series.inadPJ,'BCB / SGS'),
      pick('Saldo de crédito PJ',series.estoquePJ,'BCB / SGS')
    ]
  };
}

export function buildMarketIntelligence(dataset,bcb,anbima,news=[],options={}){
  const month=options.month||previousFullMonth(new Date());
  const indices=computeRadarIndices(dataset,bcb,month);
  const directions=['FIDC','FIAGRO','FII'].map(key=>marketDirection(key,indices.markets[key]));
  const strongest=[...directions].sort((a,b)=>(b.scores.IROP??-1)-(a.scores.IROP??-1))[0];
  const all=indices.markets.ALL;
  const brief={
    headline:finite(all.offerPressure?.score)&&finite(all.funding?.score)&&all.offerPressure.score>=60&&all.funding.score<50
      ?'Oferta primária forte encontra funding ainda seletivo.'
      :strongest?`${strongest.market} lidera a pressão relativa de oferta; funding define a capacidade de absorção.`:'Mercado primário em monitoramento.',
    summary:`O Radar lê a competência ${month} combinando atividade primária, amplitude de participantes, concentração e funding. A direção é inferida por sinais convergentes; nenhum índice isolado é tratado como previsão.`,
    watch:[
      'Se o IROP sobe junto com IRBD, a expansão é mais disseminada; se sobe com concentração alta, a leitura é mais dependente de poucos participantes.',
      'IRFC abaixo de 50 indica que o ambiente de funding ainda exige seletividade na interpretação de um pipeline forte.',
      'Cenários anualizados são faixas de ritmo. O Radar revisa a leitura quando novas competências, dados macro ou atos regulatórios contradizem a tese.'
    ]
  };
  return {
    month,
    generatedAt:new Date().toISOString(),
    brief,
    directions,
    theses:buildTheses(indices,month),
    scenarios:scenarioMap(indices),
    regulatory:regulatorySignals(news),
    regulatoryExecution:buildRegulatoryWorkspace(regulatorySignals(news)),
    stakeholderDesk:stakeholderDesk(indices),
    marketContext:marketContext(bcb,anbima),
    indices,
    sources:{
      cvm:{name:dataset.source,url:dataset.sourceUrl,updatedAt:dataset.sourceUpdatedAt},
      bcb:bcb?{name:bcb.source,url:bcb.sourceUrl,updatedAt:bcb.updatedAt}:null,
      anbima:anbima?{name:anbima.source,url:anbima.sourceUrl,updatedAt:anbima.sourceUpdatedAt}:null
    },
    methodology:'Inteligência Radar = dado oficial + índices proprietários + mecanismo econômico + critérios de confirmação/invalidação. A camada regulatória descreve primeiro o conteúdo observado na fonte oficial, separa a interpretação operacional do Radar e organiza aplicabilidade, gap, processo, evidência e monitoramento. Cenários não são promessa de resultado, previsão garantida nem recomendação de investimento.'
  };
}
