const DAY=86400000;
const iso=d=>d.toISOString().slice(0,10);
const safeDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(String(value||''))?String(value):'';
const finitePositive=value=>Number.isFinite(value)&&value>0;
const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim();

export function previousFullWeek(reference=new Date()){
  const ref=new Date(reference);
  if(Number.isNaN(ref.valueOf())) throw new Error('Data de referência inválida');
  const day=new Date(Date.UTC(ref.getUTCFullYear(),ref.getUTCMonth(),ref.getUTCDate()));
  const sinceMonday=(day.getUTCDay()+6)%7;
  const currentMonday=new Date(day.valueOf()-sinceMonday*DAY);
  const end=new Date(currentMonday.valueOf()-DAY);
  const start=new Date(end.valueOf()-6*DAY);
  return {start:iso(start),end:iso(end)};
}

function previousWindow(window){
  const start=new Date(`${window.start}T00:00:00Z`);
  const end=new Date(`${window.end}T00:00:00Z`);
  return {start:iso(new Date(start.valueOf()-7*DAY)),end:iso(new Date(end.valueOf()-7*DAY))};
}

function inWindow(item,window){const date=safeDate(item?.date);return date&&date>=window.start&&date<=window.end}
function pctChange(current,previous){if(!Number.isFinite(current)||!Number.isFinite(previous)||previous===0)return null;return (current-previous)/previous*100}
function textCount(values){const map=new Map();for(const value of values){const clean=String(value||'').trim();if(clean)map.set(clean,(map.get(clean)||0)+1)}return [...map.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'pt-BR')).map(([name,count])=>({name,count}))}
function coordinatorKey(item){return item.leaderCnpj?`CNPJ:${String(item.leaderCnpj).replace(/\D/g,'')}`:item.leader?`NOME:${normalize(item.leader)}`:''}
function coordinatorRanking(items){
  const groups=new Map();
  for(const item of items){
    const key=coordinatorKey(item);if(!key)continue;
    const row=groups.get(key)||{name:item.leader||item.leaderCnpj,cnpj:item.leaderCnpj||'',count:0,volume:0};
    row.count+=1;if(finitePositive(item.volume))row.volume+=item.volume;if((item.leader||'').length>(row.name||'').length)row.name=item.leader;groups.set(key,row);
  }
  return [...groups.values()].sort((a,b)=>b.count-a.count||b.volume-a.volume||a.name.localeCompare(b.name,'pt-BR'));
}
function dayRanking(items){const rows=textCount(items.map(x=>x.date));return rows.map(row=>({date:row.name,count:row.count}))}
function compactOffer(item){return {id:item.id,name:item.name,cnpj:item.cnpj,registration:item.registration,processNumber:item.processNumber,leader:item.leader||item.leaderCnpj,volume:item.volume,date:item.date,rite:item.rite,audience:item.audience,status:item.status}}
function summarizeWindow(items,window){
  const rows=items.filter(item=>inWindow(item,window));
  const withVolume=rows.filter(item=>finitePositive(item.volume));
  const volume=withVolume.reduce((sum,item)=>sum+item.volume,0);
  const leaders=coordinatorRanking(rows);
  const topOffers=[...withVolume].sort((a,b)=>b.volume-a.volume).slice(0,8).map(compactOffer);
  const professional=rows.filter(item=>normalize(item.audience).includes('PROFISSION')).length;
  const top3Count=leaders.slice(0,3).reduce((sum,item)=>sum+item.count,0);
  return {
    period:window,
    offers:rows.length,
    offersWithVolume:withVolume.length,
    volume,
    averageTicket:withVolume.length?volume/withVolume.length:null,
    leaders:leaders.length,
    topLeaders:leaders.slice(0,10),
    topOffers,
    byAudience:textCount(rows.map(item=>item.audience||'Não informado')),
    byRite:textCount(rows.map(item=>item.rite||'Não informado')),
    byStatus:textCount(rows.map(item=>item.status||'Não informado')),
    professionalShare:rows.length?professional/rows.length:null,
    top3Concentration:rows.length?top3Count/rows.length:null,
    busiestDays:dayRanking(rows).slice(0,3)
  };
}

export function buildWeeklyReport(items,reference=new Date()){
  const period=previousFullWeek(reference),priorPeriod=previousWindow(period);
  const current=summarizeWindow(items,period),prior=summarizeWindow(items,priorPeriod);
  const offerChangePct=pctChange(current.offers,prior.offers),volumeChangePct=pctChange(current.volume,prior.volume);
  const top=current.topLeaders[0];
  const observations=[];
  if(current.offers){
    if(offerChangePct===null) observations.push(`${current.offers} ofertas FIDC registradas na semana; não há base comparável suficiente para variação percentual.`);
    else observations.push(`Atividade semanal de ${current.offers} ofertas, ${Math.abs(offerChangePct).toFixed(1).replace('.',',')}% ${offerChangePct>=0?'acima':'abaixo'} da semana anterior.`);
    if(current.offersWithVolume) observations.push(`Volume informado de R$ ${Math.round(current.volume).toLocaleString('pt-BR')} em ${current.offersWithVolume} ofertas com valor positivo; ticket médio de R$ ${Math.round(current.averageTicket).toLocaleString('pt-BR')}.`);
    if(top) observations.push(`${top.name} liderou por quantidade de registros (${top.count}); os três coordenadores mais presentes concentraram ${(current.top3Concentration*100).toFixed(1).replace('.',',')}% das ofertas da semana.`);
    if(Number.isFinite(current.professionalShare)) observations.push(`${(current.professionalShare*100).toFixed(1).replace('.',',')}% das ofertas da semana foram destinadas a investidores profissionais, conforme o campo oficial de público-alvo.`);
  } else observations.push('Nenhuma oferta FIDC com data de registro/requerimento foi identificada no período semanal selecionado.');
  return {
    generatedAt:new Date().toISOString(),
    current,
    prior,
    changes:{offersPct:offerChangePct,volumePct:volumeChangePct},
    observations,
    methodology:'Semana fechada de segunda a domingo. São consideradas as datas oficiais usadas pelo Radar: registro e, quando ausente, requerimento/protocolo. Volumes semanais somam somente valores positivos informados na base CVM.'
  };
}
