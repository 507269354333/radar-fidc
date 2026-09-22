const BCB_URL=id=>'https://api.bcb.gov.br/dados/serie/bcdata.sgs.'+id+'/dados/ultimos/20?formato=json';
const IMA_URL='https://www.anbima.com.br/informacoes/ima/arqs/ima_completo.xml';
const parseDate=value=>{const m=String(value||'').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);return m?m[3]+'-'+m[2]+'-'+m[1]:''};
const n=v=>{const x=Number(String(v??'').replace(/\./g,'').replace(',','.'));return Number.isFinite(x)?x:null};
const escRe=s=>String(s).replace(/[.*+?^$()|[\]{}\\]/g,'\\$&');
const pctChange=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&b!==0?(a/b-1)*100:null;

export const MACRO_SERIES={
 selic:{id:1178,label:'Selic',short:'SELIC',unit:'% a.a.',category:'Macro',source:'BCB / SGS'},
 ipca:{id:433,label:'IPCA',short:'IPCA',unit:'% mês',category:'Inflação',source:'BCB / SGS'},
 igpm:{id:189,label:'IGP-M',short:'IGP-M',unit:'% mês',category:'Inflação',source:'BCB / SGS'},
 usdbrl:{id:1,label:'Dólar / Real',short:'USD/BRL',unit:'R$',category:'Câmbio',source:'BCB / PTAX'},
 dbgg:{id:13761,label:'Dívida Bruta do Governo Geral',short:'DBGG',unit:'R$ milhões',category:'Fiscal',source:'BCB / SGS'},
 dbggPib:{id:13762,label:'Dívida Bruta / PIB',short:'DBGG/PIB',unit:'%',category:'Fiscal',source:'BCB / SGS'}
};

async function fetchSgs(meta,fetchImpl=fetch,timeoutMs=8000){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
 try{
  const r=await fetchImpl(BCB_URL(meta.id),{headers:{Accept:'application/json','User-Agent':'RadarFIDC/10.0'},signal:controller.signal});
  if(!r.ok)throw new Error('HTTP '+r.status);
  const rows=await r.json();
  const hist=(Array.isArray(rows)?rows:[]).map(x=>({date:parseDate(x.data),value:Number(String(x.valor).replace(',','.'))})).filter(x=>x.date&&Number.isFinite(x.value)).sort((a,b)=>a.date.localeCompare(b.date));
  if(!hist.length)throw new Error('sem observações válidas');
  const latest=hist.at(-1),previous=hist.at(-2)||null;
  return{...meta,latest,previous,change:previous?latest.value-previous.value:null,changePct:previous?pctChange(latest.value,previous.value):null,status:'ok'};
 }catch(error){return{...meta,latest:null,previous:null,change:null,changePct:null,status:'unavailable',error:error?.name==='AbortError'?'timeout':error.message}}
 finally{clearTimeout(timer)}
}

function attrs(text){
 const out={};const re=/([A-Za-z0-9_]+)="([^"]*)"/g;let m;
 while((m=re.exec(text)))out[m[1]]=m[2];
 return out;
}
export function parseImaXml(xml){
 const out={};
 for(const code of ['IRF-M','IMA-S','IMA-B','IMA-C']){
  const fam=new RegExp('<FAMILIA\\s+INDICE="'+escRe(code)+'">([\\s\\S]*?)<\\/FAMILIA>','i').exec(xml||'');
  if(!fam)continue;
  const date=/<TOTAIS\s+DT_REF="([^"]+)"/i.exec(fam[1])?.[1]||'';
  const total=/<TOTAL\s+([^>]+)\/?>/i.exec(fam[1]);
  if(!total)continue;
  const a=attrs(total[1]);
  out[code]={code,label:code,date:parseDate(date),numberIndex:n(a.T_Num_Indice),daily:n(a.T_Var_Diaria),month:n(a.T_Var_Mensal),year:n(a.T_Var_Anual),last12m:n(a.T_Var_Ult12M),yield:n(a.T_Yield),status:'ok',source:'ANBIMA · IMA público'};
 }
 return out;
}
export async function fetchImaPublic(fetchImpl=fetch,timeoutMs=10000){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
 try{
  const r=await fetchImpl(IMA_URL,{headers:{Accept:'application/xml,text/xml,*/*','User-Agent':'RadarFIDC/10.0'},signal:controller.signal});
  if(!r.ok)throw new Error('HTTP '+r.status);
  const xml=await r.text(),indices=parseImaXml(xml);
  if(!Object.keys(indices).length)throw new Error('IMA sem totais reconhecidos');
  return{source:'ANBIMA — IMA Resultados Diários',sourceUrl:IMA_URL,indices};
 }finally{clearTimeout(timer)}
}

function formatTickerItem(key,s){
 if(!s?.latest)return{key,label:s?.short||key,category:s?.category||'',value:null,display:'n/d',change:null,changePct:null,date:null,source:s?.source||'',status:s?.status||'unavailable',note:s?.error||'Dado indisponível'};
 let display;
 if(key==='dbgg')display='R$ '+(s.latest.value/1e6).toLocaleString('pt-BR',{maximumFractionDigits:2})+' tri';
 else if(key==='usdbrl')display='R$ '+s.latest.value.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:4});
 else display=s.latest.value.toLocaleString('pt-BR',{maximumFractionDigits:2})+(s.unit?.includes('%')?'%':'');
 return{key,label:s.short,fullLabel:s.label,category:s.category,value:s.latest.value,display,change:s.change,changePct:s.changePct,date:s.latest.date,source:s.source,status:'ok'};
}
function formatIma(code,x,subtitle){
 if(!x)return{key:code.toLowerCase().replace(/[^a-z]/g,''),label:code,fullLabel:subtitle,category:'Renda Fixa',value:null,display:'n/d',status:'unavailable',source:'ANBIMA'};
 return{key:code.toLowerCase().replace(/[^a-z]/g,''),label:code,fullLabel:subtitle,category:'Renda Fixa',value:x.numberIndex,display:x.numberIndex?.toLocaleString('pt-BR',{maximumFractionDigits:2})||'n/d',change:x.daily,changePct:x.daily,date:x.date,source:x.source,status:'ok',note:x.yield!=null?'yield '+x.yield.toLocaleString('pt-BR',{maximumFractionDigits:2})+'%':''};
}
export async function fetchMacroTicker(fetchImpl=fetch){
 const entries=Object.entries(MACRO_SERIES);
 const [seriesResults,imaResult]=await Promise.all([
  Promise.all(entries.map(([,meta])=>fetchSgs(meta,fetchImpl))),
  fetchImaPublic(fetchImpl).catch(error=>({error:error.message,indices:{}}))
 ]);
 const series=Object.fromEntries(entries.map(([key],i)=>[key,seriesResults[i]]));
 const items=[
  formatTickerItem('selic',series.selic),
  formatTickerItem('ipca',series.ipca),
  formatTickerItem('igpm',series.igpm),
  formatTickerItem('usdbrl',series.usdbrl),
  {key:'riscoBrasil',label:'RISCO BRASIL',fullLabel:'EMBI+Br',category:'Risco',value:null,display:'fonte pública interrompida',change:null,changePct:null,date:'2024-08',source:'IPEA / EMBI+Br',status:'stale',note:'A divulgação pública do EMBI+Br pelo IPEA foi interrompida em agosto de 2024; o Radar não substitui por cotação não oficial.'},
  formatTickerItem('dbgg',series.dbgg),
  formatTickerItem('dbggPib',series.dbggPib),
  formatIma('IRF-M',imaResult.indices?.['IRF-M'],'Prefixados · LTN / NTN-F'),
  formatIma('IMA-S',imaResult.indices?.['IMA-S'],'Pós-fixados · LFT / Selic'),
  formatIma('IMA-B',imaResult.indices?.['IMA-B'],'Inflação · NTN-B / IPCA'),
  formatIma('IMA-C',imaResult.indices?.['IMA-C'],'Inflação · NTN-C / IGP-M')
 ];
 return{generatedAt:new Date().toISOString(),items,sources:{bcb:'Banco Central do Brasil — SGS/PTAX',anbima:'ANBIMA — IMA Resultados Diários',riskBrazil:'IPEA / EMBI+Br: divulgação pública interrompida em agosto de 2024'},methodology:'Ticker usa apenas fontes oficiais/públicas conectadas. IRF-M, IMA-S, IMA-B e IMA-C são índices ANBIMA de carteiras de títulos públicos federais. O Radar não preenche cotações ausentes com fontes não oficiais.'};
}
