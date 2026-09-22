export const RADAR_INDEX_GUIDE={
 IROP:{
  code:'IROP',name:'Índice Radar de Oferta Primária',type:'Índice composto de intensidade do mercado primário',
  question:'Quão forte está o pipeline de novas ofertas em relação à própria história recente?',
  whatItMeasures:'Combina volume registrado ajustado, quantidade de ofertas e amplitude de emissores/coordenadores para medir a intensidade relativa do mercado primário.',
  technicalBasis:'Percentis móveis por componente, agregados por pesos explícitos. Outliers de volume acima de 100x a mediana positiva da janela são preservados no dado oficial e isolados somente da camada analítica.',
  empiricalBasis:'Registros oficiais da CVM organizados em 12 competências mensais encerradas no mês de referência.',
  quantitativeBasis:'40% percentil do volume analítico ajustado + 35% percentil da quantidade de ofertas + 25% breadth.',
  qualitativeLayer:'A interpretação forte/intermediária/fraca é posterior ao cálculo e não altera o score. O Radar cruza o resultado com funding, concentração, documentos e contexto regulatório antes de formular uma tese.',
  whyItMatters:'Ajuda a distinguir meses de pipeline realmente intenso de meses apenas ruidosos e permite comparar FIDC, FIAGRO e FII respeitando a história de cada vertical.',
  highMeans:'Maior pressão relativa de oferta e atividade primária mais intensa.',
  lowMeans:'Pipeline relativamente contido frente à janela histórica.',
  limits:['Mede oferta registrada, não captação efetiva.','Uma janela de 12 meses captura o ciclo recente, não um ciclo econômico completo.','Não mede qualidade de crédito, retorno ou atratividade de uma oferta.']
 },
 IRBD:{
  code:'IRBD',name:'Índice Radar de Breadth',type:'Índice de amplitude de participação',
  question:'A atividade está disseminada ou depende de poucos participantes?',
  whatItMeasures:'Mede a amplitude do mercado observando quantos emissores e coordenadores distintos participam da competência em relação aos últimos 12 meses.',
  technicalBasis:'Média dos percentis da quantidade de emissores distintos e coordenadores distintos na janela histórica.',
  empiricalBasis:'Participantes identificados nos registros oficiais da CVM em 12 competências mensais.',
  quantitativeBasis:'50% percentil de emissores distintos + 50% percentil de coordenadores distintos.',
  qualitativeLayer:'A leitura ampla/mediana/estreita descreve a disseminação da atividade; a conclusão econômica depende de ser lida junto com IROP e IRCC.',
  whyItMatters:'Um mercado pode crescer porque muitos participantes estão ativos ou porque poucos agentes concentram grandes operações. O IRBD separa essas situações.',
  highMeans:'Atividade mais espalhada entre emissores e coordenadores.',
  lowMeans:'Atividade mais estreita, com menor diversidade de participantes.',
  limits:['Não mede concentração de volume sozinho; isso é função do IRCC.','Participante distinto não significa estratégia, qualidade ou porte distintos.']
 },
 IRCC:{
  code:'IRCC',name:'Índice Radar de Concentração',type:'Índice estrutural de concentração',
  question:'Quanto da atividade está concentrada em poucos coordenadores?',
  whatItMeasures:'Mede concentração dos coordenadores por quantidade de ofertas e por volume analítico registrado.',
  technicalBasis:'Índice Herfindahl-Hirschman (HHI) normalizado para escala 0–100, calculado separadamente por quantidade e volume e depois combinado.',
  empiricalBasis:'Distribuição observada dos coordenadores na competência corrente da base oficial CVM.',
  quantitativeBasis:'50% HHI normalizado por quantidade + 50% HHI normalizado por volume analítico.',
  qualitativeLayer:'Baixo significa mercado mais distribuído; alto significa maior dependência de poucos coordenadores. A interpretação não presume poder de mercado ou conduta competitiva.',
  whyItMatters:'Mostra se a expansão do pipeline é compartilhada pelo mercado ou dominada por poucos participantes.',
  highMeans:'Maior concentração da atividade em poucos coordenadores.',
  lowMeans:'Maior dispersão da atividade entre coordenadores.',
  limits:['Concentração não é sinônimo de problema concorrencial.','O índice não mede participação econômica fora das ofertas capturadas pelo Radar.']
 },
 IRFC:{
  code:'IRFC',name:'Índice Radar de Condições de Funding',type:'Índice composto de ambiente financeiro',
  question:'O ambiente de crédito e juros ajuda ou restringe a absorção de novas ofertas?',
  whatItMeasures:'Resume o ambiente de funding usando juros, spread de crédito PJ, inadimplência PJ e crescimento do saldo de crédito PJ.',
  technicalBasis:'Cada variável é transformada em posição percentílica dentro do histórico disponível do BCB; Selic, spread e inadimplência têm direção invertida porque níveis mais altos são tratados como condições menos favoráveis. Componentes indisponíveis são reponderados.',
  empiricalBasis:'Séries oficiais BCB/SGS disponíveis ao Radar, preservando frequência e datas de cada série.',
  quantitativeBasis:'30% Selic + 30% spread PJ + 20% inadimplência PJ + 20% crescimento trimestral do saldo PJ, com reponderação quando necessário.',
  qualitativeLayer:'Favorável/neutro/restritivo é uma leitura do ambiente de funding, não uma previsão de demanda por cotas nem de sucesso de distribuição.',
  whyItMatters:'Um pipeline forte pode encontrar pouca capacidade de absorção quando custo de capital, spreads ou qualidade do crédito pioram.',
  highMeans:'Condições relativas de funding mais favoráveis dentro da amostra observada.',
  lowMeans:'Condições relativas mais restritivas.',
  limits:['As séries têm frequências distintas e datas de atualização diferentes.','Não incorpora diretamente fluxo de fundos, book de ordens ou captação efetiva.','É um indicador de regime, não uma taxa de funding de uma operação específica.']
 },
 IRPM:{
  code:'IRPM',name:'Índice Radar de Pulso de Mercado',type:'Índice-síntese de atividade e funding',
  question:'Qual é o pulso conjunto do mercado primário e das condições de funding?',
  whatItMeasures:'Combina a intensidade das ofertas com o ambiente financeiro para produzir uma leitura sintética do momento.',
  technicalBasis:'Composto linear que mantém maior peso no comportamento observado do mercado primário e usa funding como condição de transmissão.',
  empiricalBasis:'Combina IROP, construído com dados CVM, e IRFC, construído com séries BCB/SGS.',
  quantitativeBasis:'70% IROP + 30% IRFC.',
  qualitativeLayer:'Expansivo/equilibrado/contido é a síntese editorial do score. A Tese Radar continua exigindo evidências adicionais e critérios de invalidação.',
  whyItMatters:'Evita interpretar muitas ofertas como expansão plena quando o funding continua restritivo — ou o contrário.',
  highMeans:'Atividade primária e condições financeiras combinadas apontam para pulso mais expansivo.',
  lowMeans:'O conjunto aponta para pulso mais contido.',
  limits:['É um composto proprietário e depende das premissas de peso declaradas.','Não substitui análise de cada vertical ou operação.','Ainda está construindo histórico de validação fora da amostra.']
 }
};
export const RADAR_SCALE={
 low:{min:0,max:34,label:'faixa baixa',meaning:'sinal abaixo da faixa intermediária da régua Radar'},
 mid:{min:34,max:67,label:'faixa intermediária',meaning:'sinal no centro da régua Radar; exige confirmação por outros indicadores'},
 high:{min:67,max:100,label:'faixa alta',meaning:'sinal elevado na régua Radar; não equivale, sozinho, a uma previsão'}
};
export function explainRadarIndex(code,score){
 const g=RADAR_INDEX_GUIDE[code];if(!g)return null;
 if(!Number.isFinite(score))return{...g,score:null,band:'indisponível',currentReading:'Sem observações suficientes para uma leitura numérica confiável nesta competência.'};
 const band=score>=67?'faixa alta':score>=34?'faixa intermediária':'faixa baixa';
 const proximity=score>=60&&score<67?' próximo da transição para a faixa alta':score>=27&&score<34?' próximo da transição para a faixa intermediária':'';
 const core=code==='IRCC'
  ?(score>=67?'A concentração está elevada: poucos coordenadores respondem por parcela relevante da atividade observada.':score>=34?'A concentração é moderada: há alguma dispersão, mas participantes relevantes ainda pesam na estrutura do mês.':'A concentração está baixa: a atividade observada está relativamente distribuída entre coordenadores.')
  :code==='IRFC'
   ?(score>=67?'As condições de funding estão relativamente favoráveis dentro da amostra observada.':score>=34?'O funding está em zona intermediária: não há evidência suficiente de abundância nem de restrição extrema.':'O ambiente de funding está relativamente restritivo dentro da amostra observada.')
   :code==='IRBD'
    ?(score>=67?'A participação está ampla: mais emissores e coordenadores estão ativos em relação ao histórico recente.':score>=34?'A amplitude é mediana: a atividade não está nem particularmente disseminada nem estreita.':'A amplitude está estreita: menos participantes estão sustentando a atividade.')
    :code==='IRPM'
     ?(score>=67?'O pulso combinado de oferta e funding está expansivo.':score>=34?'O pulso está equilibrado: atividade e funding ainda não formam um sinal extremo.':'O pulso está contido: o conjunto de oferta e funding permanece na faixa baixa.')
     :(score>=67?'A intensidade relativa das ofertas está forte frente à janela recente.':score>=34?'A intensidade das ofertas está intermediária frente à janela recente.':'A intensidade das ofertas está fraca frente à janela recente.');
 return{...g,score,band,currentReading:`${core} Score ${score.toFixed(0)}/100, ${band}${proximity}.`};
}
export const RADAR_METHODOLOGICAL_FOUNDATION={
 version:'1.0',
 status:'Metodologia proprietária em validação contínua',
 technical:'Sim. As fórmulas, pesos, tratamento de outliers, HHI e regras de escala são explícitos e reproduzíveis.',
 empirical:'Sim. Os scores partem de observações oficiais da CVM e do BCB e são recalculados à medida que novas competências entram.',
 quantitative:'Sim. O número de cada índice é produzido por regras matemáticas definidas antes da interpretação editorial.',
 qualitative:'Sim, como camada posterior e separada. A interpretação Radar explica mecanismos, contexto regulatório, confirmação e invalidação; ela não altera retrospectivamente o score.',
 caveat:'Os índices são proprietários, não oficiais e ainda constroem track record histórico. Não devem ser apresentados como modelos preditivos validados de longo prazo.'
};

const clean=v=>String(v||'').trim();
const digits=v=>clean(v).replace(/\D/g,'');
const finite=v=>Number.isFinite(v);
const positive=v=>finite(v)&&v>0;
const monthOf=item=>/^\d{4}-\d{2}-\d{2}$/.test(item?.date||'')?item.date.slice(0,7):'';
const monthEnd=month=>new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5,7)),0,23,59,59));
const quantile=(values,q)=>{const a=values.filter(finite).sort((x,y)=>x-y);if(!a.length)return null;const p=(a.length-1)*q,i=Math.floor(p),f=p-i;return a[i]+(a[i+1]!==undefined?(a[i+1]-a[i])*f:0)};
export const percentileRank=(value,values)=>{const a=values.filter(finite);if(!finite(value)||!a.length)return null;if(a.length===1)return 50;const less=a.filter(x=>x<value).length,equal=a.filter(x=>x===value).length;return Math.max(0,Math.min(100,((less+0.5*equal)/a.length)*100))};
const avg=values=>{const a=values.filter(finite);return a.length?a.reduce((s,x)=>s+x,0)/a.length:null};
const coordinatorKey=x=>digits(x.leaderCnpj)||clean(x.leader).toUpperCase();
const issuerKey=x=>digits(x.cnpj)||clean(x.name).toUpperCase();
const rowsForMonth=(items,month)=>items.filter(x=>monthOf(x)===month);
function listMonths(endMonth,n=12){const d=new Date(`${endMonth}-01T00:00:00Z`),out=[];for(let i=n-1;i>=0;i--){const x=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()-i,1));out.push(x.toISOString().slice(0,7))}return out}
function robustThreshold(items,endMonth){const months=new Set(listMonths(endMonth,12)),rows=items.filter(x=>months.has(monthOf(x))&&positive(x.volume)),values=rows.map(x=>x.volume),median=quantile(values,.5);return{medianPositiveVolume:median,threshold:median&&values.length>=3?median*100:Infinity,rule:'Oferta com volume > 100x a mediana positiva dos 12 meses é preservada no dado oficial, mas isolada dos índices e cenários analíticos.'}}
function isOutlier(x,threshold){return positive(x.volume)&&finite(threshold)&&x.volume>threshold}
const monthMetric=(items,month,threshold)=>{const rows=rowsForMonth(items,month),vol=rows.filter(x=>positive(x.volume)).map(x=>x.volume),adjRows=rows.filter(x=>positive(x.volume)&&!isOutlier(x,threshold)),adj=adjRows.map(x=>x.volume);return{month,count:rows.length,officialVolume:vol.reduce((s,x)=>s+x,0),adjustedVolume:adj.reduce((s,x)=>s+x,0),withVolume:vol.length,outliers:rows.filter(x=>isOutlier(x,threshold)).length,coordinators:new Set(rows.map(coordinatorKey).filter(Boolean)).size,issuers:new Set(rows.map(issuerKey).filter(Boolean)).size,medianTicket:quantile(adj,.5)}};
function normHHI(shares){const a=shares.filter(x=>finite(x)&&x>0),n=a.length;if(n<=1)return n===1?100:0;const sum=a.reduce((s,x)=>s+x,0);if(!sum)return 0;const h=a.reduce((s,x)=>s+(x/sum)**2,0),min=1/n;return Math.max(0,Math.min(100,(h-min)/(1-min)*100))}
function concentration(items,month,threshold){const rows=rowsForMonth(items,month),byCount=new Map(),byVol=new Map();for(const x of rows){const k=coordinatorKey(x);if(!k)continue;byCount.set(k,(byCount.get(k)||0)+1);if(positive(x.volume)&&!isOutlier(x,threshold))byVol.set(k,(byVol.get(k)||0)+x.volume)}const countScore=normHHI([...byCount.values()]),volumeScore=normHHI([...byVol.values()]),score=avg([countScore,volumeScore]);return{score,countHHI:countScore,volumeHHI:volumeScore,interpretation:score>=67?'alta':score>=34?'moderada':'baixa'}}
function selectSeriesAtOrBefore(series,month){const limit=monthEnd(month);return(series?.history||[]).filter(x=>new Date(x.date+'T00:00:00Z')<=limit).sort((a,b)=>a.date.localeCompare(b.date))}
function fundingConditions(bcb,month){if(!bcb?.series)return{score:null,components:[],asOf:null,interpretation:'indisponível'};const specs=[['selic','Selic',true,.3],['spreadPJ','Spread PJ',true,.3],['inadPJ','Inadimplência PJ',true,.2]],parts=[];for(const[key,label,invert,weight]of specs){const h=selectSeriesAtOrBefore(bcb.series[key],month);if(!h.length)continue;const cur=h.at(-1),rank=percentileRank(cur.value,h.map(x=>x.value));parts.push({key,label,value:cur.value,date:cur.date,score:invert?100-rank:rank,weight})}const credit=selectSeriesAtOrBefore(bcb.series.estoquePJ,month);if(credit.length>=4){const changes=[];for(let i=3;i<credit.length;i++)changes.push((credit[i].value/credit[i-3].value-1)*100);const current=changes.at(-1),rank=percentileRank(current,changes);parts.push({key:'credito3m',label:'Crescimento 3m do saldo PJ',value:current,date:credit.at(-1).date,score:rank,weight:.2})}const w=parts.reduce((s,x)=>s+x.weight,0),score=w?parts.reduce((s,x)=>s+x.score*x.weight,0)/w:null;return{score,components:parts,asOf:parts.map(x=>x.date).sort().at(-1)||null,interpretation:score===null?'indisponível':score>=67?'favoráveis':score>=34?'neutras/medianas':'restritivas'}}
function offeringPressure(items,month,quality){const months=listMonths(month,12),metrics=months.map(m=>monthMetric(items,m,quality.threshold)),cur=metrics.at(-1),countScore=percentileRank(cur.count,metrics.map(x=>x.count)),volumeScore=percentileRank(cur.adjustedVolume,metrics.map(x=>x.adjustedVolume)),coordScore=percentileRank(cur.coordinators,metrics.map(x=>x.coordinators)),issuerScore=percentileRank(cur.issuers,metrics.map(x=>x.issuers)),breadth=avg([coordScore,issuerScore]),score=.4*volumeScore+.35*countScore+.25*breadth;return{score,countScore,volumeScore,breadthScore:breadth,metric:cur,history:metrics,interpretation:score>=67?'forte':score>=34?'intermediária':'fraca'}}
function annualScenarios(items,month,quality){const year=month.slice(0,4),monthNum=Number(month.slice(5,7)),months=listMonths(month,12),hist=months.map(m=>monthMetric(items,m,quality.threshold)),ytd=items.filter(x=>monthOf(x)>=`${year}-01`&&monthOf(x)<=month),officialActualVolume=ytd.filter(x=>positive(x.volume)).reduce((s,x)=>s+x.volume,0),adjustedActualVolume=ytd.filter(x=>positive(x.volume)&&!isOutlier(x,quality.threshold)).reduce((s,x)=>s+x.volume,0),actualOffers=ytd.length,remaining=12-monthNum,vols=hist.map(x=>x.adjustedVolume),counts=hist.map(x=>x.count),qv=[quantile(vols,.25),quantile(vols,.5),quantile(vols,.75)],qc=[quantile(counts,.25),quantile(counts,.5),quantile(counts,.75)],build=(label,i)=>({label,volume:adjustedActualVolume+(qv[i]||0)*remaining,offers:Math.round(actualOffers+(qc[i]||0)*remaining),monthlyVolumeAssumption:qv[i],monthlyOfferAssumption:qc[i]});return{year:Number(year),actualThrough:month,officialActualVolume,adjustedActualVolume,actualOffers,remainingMonths:remaining,scenarios:[build('Conservador',0),build('Base',1),build('Expansão',2)],method:'Cenários usam volume analítico ajustado: realizado no ano sem outliers estatísticos + p25/mediana/p75 dos 12 meses encerrados no mês de referência para os meses restantes. Não são previsão de captação efetiva.'}}
export function computeMarketIndices(items,bcb,month){const quality=robustThreshold(items,month),offer=offeringPressure(items,month,quality),conc=concentration(items,month,quality.threshold),fund=fundingConditions(bcb,month),pulse=fund.score===null?offer.score:.7*offer.score+.3*fund.score,outliers=items.filter(x=>monthOf(x)===month&&isOutlier(x,quality.threshold)).map(x=>({id:x.id,name:x.name,volume:x.volume,date:x.date,leader:x.leader}));return{month,dataQuality:{...quality,outliers,outlierCount:outliers.length},offerPressure:{code:'IROP',name:'Índice Radar de Oferta Primária',score:offer.score,components:{volume:offer.volumeScore,quantity:offer.countScore,breadth:offer.breadthScore},interpretation:offer.interpretation,education:explainRadarIndex('IROP',offer.score)},breadth:{code:'IRBD',name:'Índice Radar de Breadth',score:offer.breadthScore,interpretation:offer.breadthScore>=67?'ampla':offer.breadthScore>=34?'mediana':'estreita',education:explainRadarIndex('IRBD',offer.breadthScore)},concentration:{code:'IRCC',name:'Índice Radar de Concentração',...conc,education:explainRadarIndex('IRCC',conc.score)},funding:{code:'IRFC',name:'Índice Radar de Condições de Funding',...fund,education:explainRadarIndex('IRFC',fund.score)},pulse:{code:'IRPM',name:'Índice Radar de Pulso de Mercado',score:pulse,interpretation:pulse>=67?'expansivo':pulse>=34?'equilibrado':'contido',education:explainRadarIndex('IRPM',pulse)},projection:annualScenarios(items,month,quality),methodology:'Escala 0-100. IROP: 40% percentil do volume analítico ajustado, 35% quantidade de ofertas e 25% breadth de emissores/coordenadores nos últimos 12 meses. Outliers >100x a mediana são preservados no dado oficial, mas isolados dos índices e cenários. IRCC usa HHI normalizado por quantidade e volume ajustado. IRFC combina Selic, spread PJ, inadimplência PJ e crescimento trimestral do saldo PJ, reponderando componentes disponíveis. IRPM = 70% IROP + 30% IRFC. Volume registrado não equivale a captação efetiva.'}}
export function computeRadarIndices(dataset,bcb,month){
 const keys=['FIDC','FIAGRO','FII'],markets={};for(const key of keys)markets[key]=computeMarketIndices(dataset.markets[key].items,bcb,month);
 const mean=fn=>avg(keys.map(k=>fn(markets[k])));
 const funding=markets.FIDC.funding;
 const projections=keys.map(k=>markets[k].projection);
 const scenarios=['Conservador','Base','Expansão'].map(label=>({label,volume:projections.reduce((s,p)=>s+(p.scenarios.find(x=>x.label===label)?.volume||0),0),offers:projections.reduce((s,p)=>s+(p.scenarios.find(x=>x.label===label)?.offers||0),0),monthlyVolumeAssumption:projections.reduce((s,p)=>s+(p.scenarios.find(x=>x.label===label)?.monthlyVolumeAssumption||0),0),monthlyOfferAssumption:projections.reduce((s,p)=>s+(p.scenarios.find(x=>x.label===label)?.monthlyOfferAssumption||0),0)}));
 const offerScore=mean(x=>x.offerPressure.score),breadthScore=mean(x=>x.breadth.score),concScore=mean(x=>x.concentration.score),pulseScore=mean(x=>x.pulse.score);
 markets.ALL={month,dataQuality:{rule:'Outliers são avaliados dentro de cada vertical; o agregado herda a união dos outliers FIDC/FIAGRO/FII.',outliers:keys.flatMap(k=>markets[k].dataQuality.outliers.map(x=>({...x,market:k}))),outlierCount:keys.reduce((s,k)=>s+markets[k].dataQuality.outlierCount,0)},offerPressure:{code:'IROP',name:'Índice Radar de Oferta Primária - 3 mercados',score:offerScore,components:{volume:mean(x=>x.offerPressure.components.volume),quantity:mean(x=>x.offerPressure.components.quantity),breadth:breadthScore},interpretation:offerScore>=67?'forte':offerScore>=34?'intermediária':'fraca',education:explainRadarIndex('IROP',offerScore)},breadth:{code:'IRBD',name:'Índice Radar de Breadth - 3 mercados',score:breadthScore,interpretation:breadthScore>=67?'ampla':breadthScore>=34?'mediana':'estreita',education:explainRadarIndex('IRBD',breadthScore)},concentration:{code:'IRCC',name:'Índice Radar de Concentração - 3 mercados',score:concScore,interpretation:concScore>=67?'alta':concScore>=34?'moderada':'baixa',education:explainRadarIndex('IRCC',concScore)},funding:{...funding,education:explainRadarIndex('IRFC',funding.score)},pulse:{code:'IRPM',name:'Índice Radar de Pulso de Mercado - 3 mercados',score:pulseScore,interpretation:pulseScore>=67?'expansivo':pulseScore>=34?'equilibrado':'contido',education:explainRadarIndex('IRPM',pulseScore)},projection:{year:Number(month.slice(0,4)),actualThrough:month,officialActualVolume:projections.reduce((s,p)=>s+p.officialActualVolume,0),adjustedActualVolume:projections.reduce((s,p)=>s+p.adjustedActualVolume,0),actualOffers:projections.reduce((s,p)=>s+p.actualOffers,0),remainingMonths:12-Number(month.slice(5,7)),scenarios,method:'Soma dos cenários analíticos de FIDC, FIAGRO e FII; cada vertical aplica sua própria regra de outlier antes da agregação.'},methodology:'Composto de igual peso entre FIDC, FIAGRO e FII. Cada vertical calcula IROP, IRBD, IRCC e IRPM na própria distribuição histórica; o agregado é a média simples das três leituras. IRFC é comum por representar o ambiente macro de funding. Outliers são tratados somente dentro da vertical.'};
 return{month,markets,guide:RADAR_INDEX_GUIDE,scale:RADAR_SCALE,foundation:RADAR_METHODOLOGICAL_FOUNDATION,generatedAt:new Date().toISOString()}
}
