import {fetchAnbimaIndicators} from '../lib/anbima-data.js';
export default async function handler(req,res){try{const data=await fetchAnbimaIndicators();res.setHeader('Cache-Control','s-maxage=21600, stale-while-revalidate=86400');res.status(200).json(data)}catch(error){res.status(502).json({error:error.message,source:'ANBIMA'})}}
