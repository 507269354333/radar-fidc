import {fetchMacroTicker} from '../lib/macro-ticker.js';
export default async function handler(req,res){
 try{
  const data=await fetchMacroTicker();
  res.setHeader('Cache-Control','s-maxage=1800, stale-while-revalidate=21600');
  res.status(200).json(data);
 }catch(error){res.status(502).json({error:error.message,source:'Radar Macro Tape'})}
}
