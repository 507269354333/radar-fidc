import {fetchCvmDataset} from '../lib/cvm-data.js';
export default async function handler(req,res){try{const dataset=await fetchCvmDataset();res.setHeader('Cache-Control','s-maxage=21600, stale-while-revalidate=86400');res.status(200).json({...dataset,updatedAt:new Date().toISOString()})}catch(error){res.status(502).json({error:error.message,source:'CVM Dados Abertos'})}}
