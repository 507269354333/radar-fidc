const digits=v=>String(v||'').replace(/\D/g,'');
const normalize=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim();
const validDate=v=>/^\d{4}-\d{2}-\d{2}$/.test(String(v||''));
const leaderKey=item=>digits(item?.leaderCnpj)?'CNPJ:'+digits(item.leaderCnpj):item?.leader?'NOME:'+normalize(item.leader):'';
const monthRows=items=>{const map=new Map();for(const item of items){if(!validDate(item.date))continue;const month=item.date.slice(0,7),row=map.get(month)||{month,count:0,volume:0};row.count++;if(Number.isFinite(item.volume)&&item.volume>0)row.volume+=item.volume;map.set(month,row)}return[...map.values()].sort((a,b)=>a.month.localeCompare(b.month)).slice(-18)};
const compactOffer=item=>({id:item.id,market:item.market,name:item.name,cnpj:item.cnpj,registration:item.registration,processNumber:item.processNumber,leader:item.leader,leaderCnpj:item.leaderCnpj,volume:item.volume,date:item.date,rite:item.rite,audience:item.audience,status:item.status,publications:(item.publications||[]).slice(0,6)});

export function buildCoordinatorSnapshots(dataset){
 const markets=['FIDC','FIAGRO','FII'],allGroups=new Map();
 for(const market of markets)for(const item of dataset.markets[market].items||[]){const key=leaderKey(item);if(!key)continue;const row=allGroups.get(key)||{key,itemsByMarket:{FIDC:[],FIAGRO:[],FII:[]}};row.itemsByMarket[market].push(item);allGroups.set(key,row)}
 const out={};
 for(const market of markets){
  const latestMonth=dataset.markets[market].analytics?.latestMonth||'',start=latestMonth?new Date(latestMonth+'-01T00:00:00Z'):null;if(start)start.setUTCMonth(start.getUTCMonth()-11);const cutoff=start?start.toISOString().slice(0,7):'';
  const coordinators=[];
  for(const group of allGroups.values()){
   const rows=[...(group.itemsByMarket[market]||[])].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
   if(!rows.length)continue;
   const label=rows.map(x=>x.leader).filter(Boolean).sort((a,b)=>b.length-a.length)[0]||rows[0].leaderCnpj||'Não informado';
   const trail=rows.filter(x=>x.date&&x.date.slice(0,7)>=cutoff),vol=trail.filter(x=>Number.isFinite(x.volume)&&x.volume>0),sum=vol.reduce((s,x)=>s+x.volume,0);
   const byMarket=markets.map(key=>{const other=group.itemsByMarket[key]||[],pos=other.filter(x=>Number.isFinite(x.volume)&&x.volume>0);return{market:key,count:other.length,volume:pos.reduce((s,x)=>s+x.volume,0)}});
   coordinators.push({key:group.key,name:label,cnpj:rows.find(x=>x.leaderCnpj)?.leaderCnpj||'',stats12m:{offers:trail.length,volume:sum,offersWithVolume:vol.length,averageTicket:vol.length?sum/vol.length:null},byMonth:monthRows(rows),recentOffers:rows.slice(0,30).map(compactOffer),byMarket});
  }
  coordinators.sort((a,b)=>b.stats12m.offers-a.stats12m.offers||b.stats12m.volume-a.stats12m.volume||a.name.localeCompare(b.name,'pt-BR'));
  out[market]={market,generatedAt:new Date().toISOString(),source:{name:dataset.source,url:dataset.sourceUrl,updatedAt:dataset.sourceUpdatedAt},coordinators};
 }
 return out;
}

export function findCoordinator(snapshot,{cnpj,name}={}){
 const c=digits(cnpj),n=normalize(name);
 return(snapshot?.coordinators||[]).find(x=>c?digits(x.cnpj)===c:normalize(x.name)===n)||null;
}
