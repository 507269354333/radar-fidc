export const BCB_SERIES = {
  selic: { id: 1178, label: 'Taxa Selic anualizada', unit: '%' },
  inadPJ: { id: 21083, label: 'Inadimplência da carteira de crédito PJ', unit: '%' },
  estoquePJ: { id: 20540, label: 'Saldo da carteira de crédito PJ', unit: 'R$ milhões' },
  spreadPJ: { id: 27632, label: 'Spread PJ não rotativo', unit: 'p.p.' }
};
const USER_AGENT = 'RadarFIDC/6.0 (dados oficiais BCB)';
const parseDate = value => { const match=String(value||'').match(/^(\d{2})\/(\d{2})\/(\d{4})$/); return match?`${match[3]}-${match[2]}-${match[1]}`:''; };

export async function fetchSeries(meta, fetchImpl=fetch, timeoutMs=8000) {
  const controller=new AbortController(), timer=setTimeout(()=>controller.abort(),timeoutMs);
  try {
    const url=`https://api.bcb.gov.br/dados/serie/bcdata.sgs.${meta.id}/dados/ultimos/2?formato=json`;
    const response=await fetchImpl(url,{headers:{'User-Agent':USER_AGENT,Accept:'application/json'},signal:controller.signal});
    if(!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload=await response.json(); if(!Array.isArray(payload)) throw new Error('resposta inválida');
    const history=payload.map(item=>({date:parseDate(item.data),value:Number(String(item.valor).replace(',','.'))})).filter(item=>item.date&&Number.isFinite(item.value)).sort((a,b)=>a.date.localeCompare(b.date));
    if(!history.length) throw new Error('sem observações válidas');
    const latest=history.at(-1), previous=history.at(-2)||null;
    return {...meta,latest,previous,change:previous?latest.value-previous.value:null,history};
  } catch(error) { if(error?.name==='AbortError') throw new Error(`timeout após ${timeoutMs} ms`); throw error; }
  finally { clearTimeout(timer); }
}

export async function fetchBcbDataset(fetchImpl=fetch, timeoutMs=8000) {
  const entries=Object.entries(BCB_SERIES), results=await Promise.allSettled(entries.map(([,meta])=>fetchSeries(meta,fetchImpl,timeoutMs)));
  const series={}; let available=0;
  results.forEach((result,index)=>{const [key,meta]=entries[index]; if(result.status==='fulfilled'){series[key]=result.value;available+=1}else series[key]={...meta,latest:null,previous:null,change:null,history:[],error:result.reason?.message||'indisponível'};});
  return {source:'Banco Central do Brasil — SGS',sourceUrl:'https://www.bcb.gov.br/estatisticas/indecoreestruturacao',updatedAt:new Date().toISOString(),partial:available<entries.length,available,series};
}
