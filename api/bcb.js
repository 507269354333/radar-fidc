import {fetchBcbDataset} from '../lib/bcb-data.js';
export default async function handler(req,res){try{const dataset=await fetchBcbDataset();res.setHeader('Cache-Control','s-maxage=21600, stale-while-revalidate=86400');res.status(dataset.available?200:502).json(dataset)}catch(error){res.status(502).json({error:error.message,source:'Banco Central do Brasil — SGS'})}}
