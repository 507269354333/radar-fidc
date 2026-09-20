export default async function handler(req,res){try{
 const symbols='^BVSP,IFIX.SA,USDBRL=X'; const url=`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols)}`;
 const r=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0'}});if(!r.ok)throw new Error('Fonte de cotações indisponível');const j=await r.json();const q=(j.quoteResponse?.result||[]).map(x=>({symbol:x.symbol,name:x.shortName||x.longName||x.symbol,price:x.regularMarketPrice,changePct:x.regularMarketChangePercent,time:x.regularMarketTime}));
 res.setHeader('Cache-Control','s-maxage=60, stale-while-revalidate=300');res.status(200).json({source:'provedor público de cotações (MVP; sujeito a termos/licenciamento)',quotes:q,updatedAt:new Date().toISOString()});
}catch(e){res.status(502).json({error:e.message,quotes:[]})}}
