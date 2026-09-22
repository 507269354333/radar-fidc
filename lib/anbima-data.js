export const ANBIMA_INDICATORS_URL='https://www.anbima.com.br/informacoes/indicadores/';
const USER_AGENT='RadarFIDC/6.1 (indicadores oficiais ANBIMA)';
const entities=s=>s.replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/&ordm;/gi,'º').replace(/&ccedil;/gi,'ç').replace(/&atilde;/gi,'ã').replace(/&otilde;/gi,'õ').replace(/&aacute;/gi,'á').replace(/&eacute;/gi,'é').replace(/&iacute;/gi,'í').replace(/&oacute;/gi,'ó').replace(/&uacute;/gi,'ú');
export const htmlToText=html=>entities(String(html||'').replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ').trim();
const number=v=>{if(!v)return null;const n=Number(String(v).replace(/\./g,'').replace(',','.'));return Number.isFinite(n)?n:null};
const capture=(text,regex)=>{const m=text.match(regex);return m?{date:m[1]||null,value:number(m[2])}:null};

export function parseAnbimaIndicators(html){
  const text=htmlToText(html);
  const updated=text.match(/Data e Hora da [ÚU]ltima Atualiza[cç][aã]o:\s*(\d{2}\/\d{2}\/\d{4})\s*-\s*([0-2]\d:[0-5]\d)/i);
  const selic=capture(text,/Estimativa\s+SELIC[^0-9]*(\d{2}\/\d{2}\/\d{4})\s+([\d.,]+)/i);
  const selicBc=capture(text,/Taxa\s+SELIC\s+do\s+BC[^0-9]*(\d{2}\/\d{2}\/\d{4})\s+([\d.,]+)/i);
  const di=capture(text,/DI-?B3[^0-9]*(\d{2}\/\d{2}\/\d{4})\s+([\d.,]+)/i);
  const usd=capture(text,/D[oó]lar\s+Comercial\s+Venda[^0-9]*(\d{2}\/\d{2}\/\d{4})\s+([\d.,]+)/i);
  const ipcaProj=text.match(/IPCA[\s\S]{0,260}?Proje[cç][aã]o\s*\([^)]*\)\s*([\d.,]+)/i);
  const igpmProj=text.match(/IGP-M[\s\S]{0,260}?Proje[cç][aã]o\s*\([^)]*\)\s*([\d.,]+)/i);
  return {
    source:'ANBIMA — Quadro de Indicadores',sourceUrl:ANBIMA_INDICATORS_URL,
    sourceUpdatedAt:updated?`${updated[1]} ${updated[2]}`:null,
    indicators:{
      selicEstimate:selic?{...selic,label:'Estimativa Selic',unit:'% a.a.'}:null,
      selicBc:selicBc?{...selicBc,label:'Selic BCB',unit:'% a.a.'}:null,
      diB3:di?{...di,label:'DI-B3',unit:'% a.a.'}:null,
      dollarSell:usd?{...usd,label:'Dólar comercial venda',unit:'R$/US$'}:null,
      ipcaProjection:ipcaProj?{date:null,value:number(ipcaProj[1]),label:'IPCA projetado',unit:'%'}:null,
      igpmProjection:igpmProj?{date:null,value:number(igpmProj[1]),label:'IGP-M projetado',unit:'%'}:null
    }
  };
}

export async function fetchAnbimaIndicators(fetchImpl=fetch,timeoutMs=9000){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
    const response=await fetchImpl(ANBIMA_INDICATORS_URL,{headers:{'User-Agent':USER_AGENT,Accept:'text/html'},signal:controller.signal});
    if(!response.ok)throw new Error(`ANBIMA indicadores: HTTP ${response.status}`);
    const data=parseAnbimaIndicators(await response.text());
    const available=Object.values(data.indicators).filter(Boolean).length;
    if(!available)throw new Error('ANBIMA indicadores: formato não reconhecido');
    return {...data,available,updatedAt:new Date().toISOString()};
  }catch(error){if(error?.name==='AbortError')throw new Error(`ANBIMA indicadores: timeout após ${timeoutMs} ms`);throw error}finally{clearTimeout(timer)}
}
