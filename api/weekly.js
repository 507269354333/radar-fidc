import {fetchCvmDataset} from '../lib/cvm-data.js';
import {fetchBcbDataset} from '../lib/bcb-data.js';
import {fetchAnbimaIndicators} from '../lib/anbima-data.js';
import {fetchCvmNews} from './news.js';
import {buildWeeklyReport} from '../lib/weekly.js';

export default async function handler(req,res){
  try{
    const cvm=await fetchCvmDataset();
    const report=buildWeeklyReport(cvm.items,new Date());
    const [bcbResult,anbimaResult,newsResult]=await Promise.allSettled([fetchBcbDataset(),fetchAnbimaIndicators(),fetchCvmNews()]);
    const bcb=bcbResult.status==='fulfilled'?bcbResult.value:null;
    const anbima=anbimaResult.status==='fulfilled'?anbimaResult.value:null;
    const news=newsResult.status==='fulfilled'?newsResult.value:[];
    res.setHeader('Cache-Control','s-maxage=21600, stale-while-revalidate=86400');
    res.status(200).json({
      ...report,
      market:'FIDC',
      sources:{cvm:{name:cvm.source,url:cvm.sourceUrl,updatedAt:cvm.sourceUpdatedAt},bcb:bcb?{name:bcb.source,url:bcb.sourceUrl,updatedAt:bcb.updatedAt}:null,anbima:anbima?{name:anbima.source,url:anbima.sourceUrl,updatedAt:anbima.sourceUpdatedAt}:null},
      macro:bcb?bcb.series:null,
      anbima:anbima?.indicators||null,
      regulatoryHighlights:news.slice(0,6)
    });
  }catch(error){res.status(502).json({error:error.message,source:'Radar FIDC'})}
}
