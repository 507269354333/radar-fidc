import {readFile,writeFile,mkdir} from 'node:fs/promises';

const BCB=[
 ['selic',1178,'SELIC','Selic','Macro','BCB / SGS','rate'],
 ['ipca',433,'IPCA','IPCA mensal','Inflação','BCB / SGS','rate'],
 ['igpm',189,'IGP-M','IGP-M mensal','Inflação','BCB / SGS','rate'],
 ['usdbrl',1,'USD/BRL','Dólar / Real','Câmbio','BCB / PTAX','fx'],
 ['dbgg',13761,'DBGG','Dívida Bruta do Governo Geral','Fiscal','BCB / SGS','debt'],
 ['dbggPib',13762,'DBGG/PIB','Dívida Bruta / PIB','Fiscal','BCB / SGS','rate']
];
const IMA_URL='https://www.anbima.com.br/informacoes/ima/arqs/ima_completo.xml';
const parseDate=v=>{const m=String(v||'').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);return m?m[3]+'-'+m[2]+'-'+m[1]:''};
const num=v=>{const x=Number(String(v??'').replace(/\./g,'').replace(',','.'));return Number.isFinite(x)?x:null};
const pct=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&b!==0?(a/b-1)*100:null;
const pp=v=>(v>=0?'+':'')+v.toLocaleString('pt-BR',{maximumFractionDigits:2})+' p.p.';

async function getSeries([key,id,label,fullLabel,category,source,kind]){
 const r=await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.'+id+'/dados/ultimos/20?formato=json',{headers:{Accept:'application/json','User-Agent':'RadarFIDC/10.0'}});
 if(!r.ok)throw new Error('BCB '+id+' HTTP '+r.status);
 const rows=await r.json(),hist=(Array.isArray(rows)?rows:[]).map(x=>({date:parseDate(x.data),value:Number(String(x.valor).replace(',','.'))})).filter(x=>x.date&&Number.isFinite(x.value)).sort((a,b)=>a.date.localeCompare(b.date));
 if(!hist.length)throw new Error('BCB '+id+' sem observações');
 const latest=hist.at(-1),previous=hist.at(-2)||null,change=previous?latest.value-previous.value:null,changePct=previous?pct(latest.value,previous.value):null;
 let display=latest.value.toLocaleString('pt-BR',{maximumFractionDigits:2})+'%';
 if(kind==='fx')display='R$ '+latest.value.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:4});
 if(kind==='debt')display='R$ '+(latest.value/1e6).toLocaleString('pt-BR',{maximumFractionDigits:2})+' tri';
 const item={key,label,fullLabel,category,value:latest.value,display,change,changePct,date:latest.date,source,status:'ok'};
 if(kind==='rate'&&Number.isFinite(change))item.deltaDisplay=pp(change);
 return item;
}
function attrs(text){const o={};for(const m of String(text).matchAll(/([A-Za-z0-9_]+)="([^"]*)"/g))o[m[1]]=m[2];return o}
function ima(xml,code,fullLabel){
 const fam=new RegExp('<FAMILIA\\s+INDICE="'+code.replace('-','\\-')+'">([\\s\\S]*?)<\\/FAMILIA>','i').exec(xml||'');
 if(!fam)return{key:code.toLowerCase().replace(/[^a-z]/g,''),label:code,fullLabel,category:'Renda Fixa',value:null,display:'n/d',change:null,changePct:null,date:'',source:'ANBIMA',status:'unavailable',note:'Sem total corrente no arquivo público IMA desta atualização.'};
 const date=/<TOTAIS\s+DT_REF="([^"]+)"/i.exec(fam[1])?.[1]||'',total=/<TOTAL\s+([^>]+)\/?>/i.exec(fam[1])?.[1]||'',a=attrs(total);
 const value=num(a.T_Num_Indice),daily=num(a.T_Var_Diaria),y=num(a.T_Yield);
 return{key:code.toLowerCase().replace(/[^a-z]/g,''),label:code,fullLabel,category:'Renda Fixa',value,display:Number.isFinite(value)?value.toLocaleString('pt-BR',{maximumFractionDigits:2}):'n/d',change:daily,changePct:daily,deltaDisplay:Number.isFinite(daily)?(daily>=0?'+':'')+daily.toLocaleString('pt-BR',{maximumFractionDigits:4})+'% dia':null,date:parseDate(date),source:'ANBIMA · IMA público',status:Number.isFinite(value)?'ok':'unavailable',note:Number.isFinite(y)?'yield '+y.toLocaleString('pt-BR',{maximumFractionDigits:2})+'%':''};
}
async function main(){
 const series=await Promise.all(BCB.map(getSeries));
 const xr=await fetch(IMA_URL,{headers:{Accept:'application/xml,text/xml,*/*','User-Agent':'RadarFIDC/10.0'}});if(!xr.ok)throw new Error('ANBIMA IMA HTTP '+xr.status);const xml=await xr.text();
 const items=[
  series[0],series[1],series[2],series[3],
  {key:'riscoBrasil',label:'RISCO BRASIL',fullLabel:'EMBI+Br',category:'Risco',value:null,display:'fonte pública interrompida',change:null,changePct:null,date:'2024-08',source:'IPEA / EMBI+Br',status:'stale',note:'Divulgação pública do EMBI+Br pelo IPEA interrompida em agosto de 2024; o Radar não substitui por cotação não oficial.'},
  series[4],series[5],
  ima(xml,'IRF-M','Prefixados · LTN / NTN-F'),
  ima(xml,'IMA-S','Pós-fixados · LFT / Selic'),
  ima(xml,'IMA-B','Inflação · NTN-B / IPCA'),
  ima(xml,'IMA-C','Inflação · NTN-C / IGP-M')
 ];
 const next={generatedAt:new Date().toISOString(),items,sources:{bcb:'Banco Central do Brasil — SGS/PTAX',anbima:'ANBIMA — IMA Resultados Diários',riskBrazil:'IPEA / EMBI+Br: divulgação pública interrompida em agosto de 2024'},methodology:'Ticker usa apenas fontes oficiais/públicas conectadas. IRF-M, IMA-S, IMA-B e IMA-C são índices ANBIMA de carteiras de títulos públicos federais. O Radar não preenche cotações ausentes com fontes não oficiais.'};
 await mkdir('data',{recursive:true});
 let previous=null;try{previous=JSON.parse(await readFile('data/macro-ticker.json','utf8'))}catch{}
 if(previous&&JSON.stringify(previous.items)===JSON.stringify(next.items)){console.log('Macro tape sem mudança.');return}
 await writeFile('data/macro-ticker.json',JSON.stringify(next,null,2)+'\n');
 console.log('Macro tape atualizado:',next.generatedAt);
}
main().catch(error=>{console.error(error);process.exitCode=1});
