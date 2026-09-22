import crypto from 'node:crypto';
import AdmZip from 'adm-zip';
import {decodeOfficialCsv,parseCsv} from './csv.js';

export const CVM_CATALOG_URL='https://dados.cvm.gov.br/api/3/action/package_show?id=oferta-distrib';
export const MARKETS=['FIDC','FIAGRO','FII'];
export const MARKET_LABELS={FIDC:'FIDC',FIAGRO:'FIAGRO',FII:'FII'};
const USER_AGENT='RadarFIDC/7.0 (dados oficiais CVM)';
const clean=value=>String(value??'').replace(/\u0000/g,'').replace(/\s+/g,' ').trim();
const normalized=value=>clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
const digits=value=>clean(value).replace(/\D/g,'');
const validCnpj=value=>digits(value).length===14?clean(value):'';
const validDate=value=>{const input=clean(value);let m=input.match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!m){const br=input.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);if(br)m=[br[0],br[3],br[2],br[1]]}if(!m)return'';const iso=`${m[1]}-${m[2]}-${m[3]}`,date=new Date(`${iso}T00:00:00Z`);return Number.isNaN(date.valueOf())||date.toISOString().slice(0,10)!==iso?'':iso};
const validMoney=value=>{const input=clean(value);if(!input)return null;const s=input.includes(',')?input.replace(/\./g,'').replace(',','.'):input,n=Number(s.replace(/[^0-9+.-]/g,''));return Number.isFinite(n)&&n>=0?n:null};
const sha=value=>crypto.createHash('sha256').update(value).digest('hex').slice(0,16);
const officialTypes=(row,origin)=>origin==='resolucao160'?[row.Valor_Mobiliario]:[row.Tipo_Fundo_Investimento,row.Tipo_Ativo,row.Valor_Mobiliario];

export function classifyMarket(row,origin){
 const key=officialTypes(row,origin).map(normalized).filter(Boolean).join(' | ');
 if(!key)return'';
 if(/FIAGRO|CADEIAS PRODUTIVAS AGROINDUSTRIAIS/.test(key))return'FIAGRO';
 if(/(^|\b)(FIC-?FIDC|FICFIDC|FIDC)(\b|$)|DIREITOS CREDIT/.test(key))return'FIDC';
 if(/(^|\b)FII(\b|$)|FUNDO DE INVESTIMENTO IMOBILIARIO|COTAS? DE (FUNDO DE INVESTIMENTO )?IMOBILIARIO/.test(key))return'FII';
 return'';
}
function audience(value){const key=normalized(value);if(key.includes('PROFISSION'))return'Profissional';if(key.includes('QUALIFIC'))return'Qualificado';if(key.includes('PUBLICO GERAL')||key.includes('PUBLICO EM GERAL'))return'Público geral';return clean(value)}
function rite(value){const key=normalized(value);if(key.includes('AUTOM'))return'Automático';if(key.includes('ORDIN'))return'Ordinário';if(key.includes('ICVM 476'))return'ICVM 476';if(key.includes('ICVM 555'))return'ICVM 555';if(key.includes('ICVM 400'))return'ICVM 400';return clean(value)}
function fieldLabel(key){return clean(key).replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}
function extractPublications(row){
 const out=[];
 for(const [field,raw] of Object.entries(row||{})){
   const value=clean(raw),key=normalized(field);
   if(!value||value.length>1600)continue;
   if(!/(URL|LINK|PROSPECT|LAMINA|ANUNCIO|COMUNICADO|AVISO|DOCUMENTO|MATERIAL)/.test(key))continue;
   const match=value.match(/https?:\/\/[^\s;]+/i);
   out.push({field,label:fieldLabel(field),value,url:match?.[0]||''});
 }
 return out;
}
function rowToComponent(row,origin,market){
 const automatic=origin==='resolucao160',officialNumber=clean(automatic?row.Numero_Requerimento:row.Numero_Registro_Oferta),processNumber=clean(row.Numero_Processo),cnpj=validCnpj(row.CNPJ_Emissor),name=clean(row.Nome_Emissor);
 const registrationDate=validDate(automatic?row.Data_Registro:row.Data_Registro_Oferta),requestDate=validDate(automatic?row.Data_requerimento:row.Data_Protocolo)||validDate(row.Data_Abertura_Processo),date=registrationDate||requestDate,dateBasis=registrationDate?'registro':requestDate?'requerimento':'';
 const volume=validMoney(automatic?row.Valor_Total_Registrado:row.Valor_Total),leaderCnpj=validCnpj(row.CNPJ_Lider),leader=clean(row.Nome_Lider),security=clean(automatic?row.Valor_Mobiliario:row.Tipo_Ativo);
 const componentKey=automatic?(officialNumber||[market,processNumber,cnpj,date,volume].join('|')):[market,officialNumber,processNumber,clean(row.Emissao),clean(row.Classe_Ativo),clean(row.Serie),security,volume].join('|');
 const offerKey=automatic?`${market}:R160:${officialNumber||processNumber||sha([cnpj,name,date].join('|'))}`:`${market}:DISTRIB:${officialNumber||processNumber||sha([cnpj,name,date].join('|'))}`;
 return{market,offerKey,componentKey,officialNumber,processNumber,cnpj,name,leader,leaderCnpj,volume,date,dateBasis,security,rite:rite(automatic?row.Rito_Requerimento:row.Rito_Oferta),audience:audience(automatic?row.Publico_alvo:''),status:clean(automatic?row.Status_Requerimento:row.Modalidade_Registro||row.Modalidade_Oferta),sourceFile:automatic?'oferta_resolucao_160.csv':'oferta_distribuicao.csv',publications:extractPublications(row)};
}
function chooseText(values){const counts=new Map();values.map(clean).filter(Boolean).forEach(value=>counts.set(value,(counts.get(value)||0)+1));return[...counts.entries()].sort((a,b)=>b[1]-a[1]||b[0].length-a[0].length)[0]?.[0]||''}
function mergeOffer(components){
 const unique=new Map();for(const component of components)if(!unique.has(component.componentKey))unique.set(component.componentKey,component);
 const rows=[...unique.values()],base=rows[0],volumes=rows.map(row=>row.volume).filter(Number.isFinite),selectedDate=rows.filter(row=>row.date).sort((a,b)=>b.date.localeCompare(a.date))[0],leaderCnpj=chooseText(rows.map(row=>row.leaderCnpj));
 const pubs=new Map();for(const row of rows)for(const pub of row.publications||[]){const key=`${pub.field}|${pub.value}`;if(!pubs.has(key))pubs.set(key,pub)}
 return{id:sha(base.offerKey),market:base.market,name:chooseText(rows.map(row=>row.name))||`Oferta ${base.market} sem denominação informada`,cnpj:chooseText(rows.map(row=>row.cnpj)),registration:chooseText(rows.map(row=>row.officialNumber)),processNumber:chooseText(rows.map(row=>row.processNumber)),leader:chooseText(rows.filter(row=>!leaderCnpj||digits(row.leaderCnpj)===digits(leaderCnpj)).map(row=>row.leader))||chooseText(rows.map(row=>row.leader)),leaderCnpj,volume:volumes.length?volumes.reduce((sum,value)=>sum+value,0):null,volumeComponents:volumes.length,rite:chooseText(rows.map(row=>row.rite)),audience:chooseText(rows.map(row=>row.audience)),status:chooseText(rows.map(row=>row.status)),date:selectedDate?.date||'',dateBasis:selectedDate?.dateBasis||'',securities:[...new Set(rows.map(row=>row.security).filter(Boolean))],publications:[...pubs.values()],sourceFile:base.sourceFile,sourceRows:components.length,distinctComponents:rows.length};
}
function countBy(values){const counts=new Map();values.filter(Boolean).forEach(value=>counts.set(value,(counts.get(value)||0)+1));return[...counts.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'pt-BR')).map(([name,count])=>({name,count}))}
function coordinatorAnalytics(items){const groups=new Map();for(const item of items){const key=item.leaderCnpj?`CNPJ:${digits(item.leaderCnpj)}`:item.leader?`NOME:${normalized(item.leader)}`:'';if(!key)continue;const current=groups.get(key)||{names:[],cnpj:item.leaderCnpj,count:0,volume:0};current.names.push(item.leader);current.count+=1;if(Number.isFinite(item.volume)&&item.volume>0)current.volume+=item.volume;groups.set(key,current)}return[...groups.values()].map(group=>({name:chooseText(group.names)||group.cnpj,cnpj:group.cnpj,count:group.count,volume:group.volume})).sort((a,b)=>b.count-a.count||b.volume-a.volume||a.name.localeCompare(b.name,'pt-BR'))}
function monthBuckets(items){const map=new Map();for(const item of items){if(!/^\d{4}-\d{2}-\d{2}$/.test(item.date))continue;const month=item.date.slice(0,7),row=map.get(month)||{month,count:0,volume:0,withVolume:0};row.count+=1;if(Number.isFinite(item.volume)&&item.volume>0){row.volume+=item.volume;row.withVolume+=1}map.set(month,row)}return[...map.values()].sort((a,b)=>a.month.localeCompare(b.month)).slice(-18)}
function trailing12(items,latestMonth){if(!latestMonth)return[];const start=new Date(`${latestMonth}-01T00:00:00Z`);start.setUTCMonth(start.getUTCMonth()-11);const cutoff=start.toISOString().slice(0,7);return items.filter(item=>item.date&&item.date.slice(0,7)>=cutoff&&item.date.slice(0,7)<=latestMonth)}
function volumeQuality(items){const rows=items.filter(item=>Number.isFinite(item.volume)&&item.volume>0).sort((a,b)=>a.volume-b.volume);if(rows.length<3)return{rule:'volume > 100x a mediana positiva dos últimos 12 meses',medianPositiveVolume:rows.length?rows[Math.floor(rows.length/2)].volume:null,outlierCount:0,outliers:[]};const mid=Math.floor(rows.length/2),median=rows.length%2?rows[mid].volume:(rows[mid-1].volume+rows[mid].volume)/2,outliers=rows.filter(item=>item.volume>median*100).sort((a,b)=>b.volume-a.volume).slice(0,8).map(item=>({id:item.id,name:item.name,date:item.date,volume:item.volume,leader:item.leader}));return{rule:'volume > 100x a mediana positiva dos últimos 12 meses',medianPositiveVolume:median,outlierCount:outliers.length,outliers}}
function buildSingleMarket(market,components,sourceUpdatedAt){
 const offers=new Map();for(const component of components){const list=offers.get(component.offerKey)||[];list.push(component);offers.set(component.offerKey,list)}
 const items=[...offers.values()].map(mergeOffer).sort((a,b)=>b.date.localeCompare(a.date)||a.name.localeCompare(b.name,'pt-BR'));
 const latestMonth=items.find(item=>/^\d{4}-\d{2}-\d{2}$/.test(item.date))?.date.slice(0,7)||null,month=latestMonth?items.filter(item=>item.date.startsWith(latestMonth)):[],monthVolumes=month.map(item=>item.volume).filter(value=>Number.isFinite(value)&&value>0),monthLeaders=coordinatorAnalytics(month),trail=trailing12(items,latestMonth),trailVolumes=trail.map(item=>item.volume).filter(value=>Number.isFinite(value)&&value>0),leaders12m=coordinatorAnalytics(trail);
 return{market,label:MARKET_LABELS[market],source:'CVM Dados Abertos — Ofertas Públicas de Distribuição',sourceUrl:'https://dados.cvm.gov.br/dataset/oferta-distrib',sourceUpdatedAt,rawRows:components.length,count:items.length,analytics:{latestMonth,offersInMonth:month.length,volumeInMonth:monthVolumes.reduce((sum,value)=>sum+value,0),offersWithVolumeInMonth:monthVolumes.length,leadersInMonth:monthLeaders.length,byRite:countBy(month.map(item=>item.rite||'Não informado')),byAudience:countBy(month.map(item=>item.audience||'Não informado')),topLeaders:monthLeaders.slice(0,10),byMonth:monthBuckets(items),trailing12:{offers:trail.length,volume:trailVolumes.reduce((sum,value)=>sum+value,0),offersWithVolume:trailVolumes.length,leaders:leaders12m.length,topLeaders:leaders12m.slice(0,15)},dataQuality:volumeQuality(trail),latestOffers:items.slice(0,15)},items,methodology:`Ofertas ${market} identificadas exclusivamente pelos campos oficiais de tipo de fundo/ativo/valor mobiliário da CVM. FIAGRO prevalece sobre classificações históricas FIAGRO-FIDC/FII. Linhas de classes ou séries são consolidadas pelo número oficial da oferta ou processo; volumes somam somente componentes distintos.`};
}

export function buildCvmMarketsDataset(inputRows,sourceUpdatedAt){
 const components={FIDC:[],FIAGRO:[],FII:[]};
 for(const entry of inputRows){const market=classifyMarket(entry.row,entry.origin);if(market)components[market].push(rowToComponent(entry.row,entry.origin,market))}
 const markets={};for(const market of MARKETS)markets[market]=buildSingleMarket(market,components[market],sourceUpdatedAt);
 const allItems=MARKETS.flatMap(market=>markets[market].items).sort((a,b)=>b.date.localeCompare(a.date)||a.name.localeCompare(b.name,'pt-BR'));
 const latestMonth=allItems.find(item=>/^\d{4}-\d{2}-\d{2}$/.test(item.date))?.date.slice(0,7)||null,month=latestMonth?allItems.filter(item=>item.date.startsWith(latestMonth)):[],monthVolumes=month.map(item=>item.volume).filter(value=>Number.isFinite(value)&&value>0),leaders=coordinatorAnalytics(month);
 return{source:'CVM Dados Abertos — Ofertas Públicas de Distribuição',sourceUrl:'https://dados.cvm.gov.br/dataset/oferta-distrib',sourceUpdatedAt,markets,allItems,overall:{count:allItems.length,latestMonth,offersInMonth:month.length,volumeInMonth:monthVolumes.reduce((sum,value)=>sum+value,0),leadersInMonth:leaders.length,topLeaders:leaders.slice(0,12),byMarket:MARKETS.map(market=>({market,count:markets[market].count,latestMonth:markets[market].analytics.latestMonth,offersInMonth:markets[market].analytics.offersInMonth,volumeInMonth:markets[market].analytics.volumeInMonth}))}};
}

export function buildCvmDataset(inputRows,sourceUpdatedAt){const data=buildCvmMarketsDataset(inputRows,sourceUpdatedAt).markets.FIDC;return{...data,rawFidcRows:data.rawRows}}
async function fetchInputRows(fetchImpl){
 const metadataResponse=await fetchImpl(CVM_CATALOG_URL,{headers:{'User-Agent':USER_AGENT,Accept:'application/json'}});if(!metadataResponse.ok)throw new Error(`CVM catálogo indisponível: HTTP ${metadataResponse.status}`);const metadata=await metadataResponse.json(),pkg=metadata?.result;if(!pkg||!Array.isArray(pkg.resources))throw new Error('Resposta inválida do catálogo CVM');
 const resource=pkg.resources.find(item=>/ofertas de distribui/i.test(item.name||'')&&/zip/i.test(`${item.format||''} ${item.url||''}`));if(!resource?.url)throw new Error('Recurso oficial de ofertas da CVM não encontrado');const dataResponse=await fetchImpl(resource.url,{headers:{'User-Agent':USER_AGENT,Accept:'application/zip'}});if(!dataResponse.ok)throw new Error(`Download CVM indisponível: HTTP ${dataResponse.status}`);
 const zip=new AdmZip(Buffer.from(await dataResponse.arrayBuffer())),inputRows=[];for(const[fileName,origin]of[['oferta_distribuicao.csv','distribuicao'],['oferta_resolucao_160.csv','resolucao160']]){const entry=zip.getEntries().find(candidate=>candidate.entryName.toLowerCase().endsWith(fileName));if(!entry)throw new Error(`Arquivo obrigatório ausente no ZIP CVM: ${fileName}`);const rows=parseCsv(decodeOfficialCsv(entry.getData()));if(!rows.length)throw new Error(`Arquivo oficial CVM vazio ou inválido: ${fileName}`);rows.forEach(row=>inputRows.push({row,origin}))}
 return{inputRows,sourceUpdatedAt:resource.last_modified||pkg.metadata_modified||null};
}
export async function fetchCvmMarketsDataset(fetchImpl=fetch){const {inputRows,sourceUpdatedAt}=await fetchInputRows(fetchImpl);return buildCvmMarketsDataset(inputRows,sourceUpdatedAt)}
export async function fetchCvmDataset(fetchImpl=fetch){const dataset=await fetchCvmMarketsDataset(fetchImpl);return{...dataset.markets.FIDC,rawFidcRows:dataset.markets.FIDC.rawRows}}
