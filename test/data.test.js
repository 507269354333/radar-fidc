import test from 'node:test';
import assert from 'node:assert/strict';
import {decodeOfficialCsv,parseCsv} from '../lib/csv.js';
import {buildCvmDataset,buildCvmMarketsDataset,classifyMarket} from '../lib/cvm-data.js';
import {fetchBcbDataset} from '../lib/bcb-data.js';
import {isRelevantTitle} from '../api/news.js';
import {previousFullWeek,buildWeeklyReport} from '../lib/weekly.js';
import {parseAnbimaIndicators} from '../lib/anbima-data.js';

test('decodifica CSV oficial Windows-1252 e campos entre aspas',()=>{
  const bytes=Buffer.from('Nome;Descrição\r\n"FIDC Alfa";"Crédito; estruturado"\r\n','latin1');
  const rows=parseCsv(decodeOfficialCsv(bytes));
  assert.deepEqual(rows,[{Nome:'FIDC Alfa','Descrição':'Crédito; estruturado'}]);
});

test('consolida classes da mesma oferta sem duplicar fundo ou componente',()=>{
  const base={Numero_Registro_Oferta:'CVM/SRE/001',Numero_Processo:'RJ-1',CNPJ_Emissor:'12.345.678/0001-90',Nome_Emissor:'FIDC TESTE',CNPJ_Lider:'11.111.111/0001-11',Nome_Lider:'BANCO TESTE S.A.',Rito_Oferta:'RCVM 160 (rito ordinário)',Tipo_Fundo_Investimento:'FIDC - Fundo de Investimento em Direitos Creditórios',Data_Registro_Oferta:'2026-09-10',Modalidade_Registro:'Concedido'};
  const senior={...base,Tipo_Ativo:'QUOTAS DE FIDC SÊNIOR',Classe_Ativo:'Sênior',Serie:'1',Valor_Total:'100.00'};
  const subordinada={...base,Tipo_Ativo:'QUOTAS DE FIDC SUBORDINADA',Classe_Ativo:'Subordinada',Serie:'1',Valor_Total:'50.00'};
  const automatic={Numero_Requerimento:'9000',Numero_Processo:'SRE/9000/2026',Rito_Requerimento:'Automático',Data_requerimento:'2026-09-12',Data_Registro:'2026-09-12',Status_Requerimento:'Registro Concedido',Valor_Mobiliario:'Cotas de FIDC',Publico_alvo:'Profissional',CNPJ_Emissor:'22.222.222/0001-22',Nome_Emissor:'FIDC AUTOMÁTICO',CNPJ_Lider:'11.111.111/0001-11',Nome_Lider:'BANCO TESTE SA',Valor_Total_Registrado:'200.00'};
  const dataset=buildCvmDataset([{row:senior,origin:'distribuicao'},{row:senior,origin:'distribuicao'},{row:subordinada,origin:'distribuicao'},{row:automatic,origin:'resolucao160'}],'2026-09-21');
  assert.equal(dataset.count,2);
  assert.equal(dataset.rawFidcRows,4);
  assert.equal(dataset.items.find(item=>item.registration==='CVM/SRE/001').volume,150);
  assert.equal(dataset.analytics.offersInMonth,2);
  assert.equal(dataset.analytics.volumeInMonth,350);
  assert.equal(dataset.analytics.leadersInMonth,1);
});

test('não classifica outros fundos por menção incidental a FIDC',()=>{
  const dataset=buildCvmDataset([{origin:'resolucao160',row:{Numero_Requerimento:'1',Valor_Mobiliario:'Cotas de FII',Nome_Emissor:'FUNDO QUE INVESTE EM FIDC',Data_Registro:'2026-09-01'}}],null);
  assert.equal(dataset.count,0);
});

test('BCB preserva séries disponíveis quando uma falha',async()=>{
  const mock=async url=>{
    if(url.includes('.27632/')) return {ok:false,status:503,json:async()=>({})};
    return {ok:true,status:200,json:async()=>[{data:'01/08/2026',valor:'1,20'},{data:'01/09/2026',valor:'1,30'}]};
  };
  const dataset=await fetchBcbDataset(mock,100);
  assert.equal(dataset.available,3);
  assert.equal(dataset.partial,true);
  assert.equal(dataset.series.selic.latest.value,1.3);
  assert.match(dataset.series.spreadPJ.error,/HTTP 503/);
});


test('filtro de notícias mantém apenas temas aderentes ao Radar FIDC',()=>{
  assert.equal(isRelevantTitle('CVM publica orientação sobre ofertas públicas de FIDC'),true);
  assert.equal(isRelevantTitle('Superintendência de Registro de Valores Mobiliários - SRE divulga ofício sobre Resolução CVM 160'),true);
  assert.equal(isRelevantTitle('Portal Dados Abertos CVM disponibiliza novo conjunto de dados nas informações sobre fundos de investimento'),false);
  assert.equal(isRelevantTitle('Programas Financiados pelo Fundo de Amparo ao Trabalhador (FAT)'),false);
  assert.equal(isRelevantTitle('Área técnica da CVM orienta sobre alavancagem em Fundos de Investimento Financeiro'),false);
  assert.equal(isRelevantTitle('CVM orienta mercado sobre FIAGRO em ofertas públicas'),true);
  assert.equal(isRelevantTitle('CVM publica atualização para fundos de investimento imobiliário - FII'),true);
});


test('relatório semanal usa a última semana fechada de segunda a domingo',()=>{
  assert.deepEqual(previousFullWeek(new Date('2026-09-21T12:00:00Z')),{start:'2026-09-14',end:'2026-09-20'});
  const items=[
    {id:'1',name:'FIDC A',date:'2026-09-18',leader:'BANCO A',leaderCnpj:'11.111.111/0001-11',volume:100,audience:'Profissional',rite:'Automático'},
    {id:'2',name:'FIDC B',date:'2026-09-17',leader:'BANCO A',leaderCnpj:'11.111.111/0001-11',volume:200,audience:'Profissional',rite:'Automático'},
    {id:'3',name:'FIDC C',date:'2026-09-16',leader:'BANCO B',leaderCnpj:'22.222.222/0001-22',volume:0,audience:'Qualificado',rite:'Automático'},
    {id:'4',name:'FIDC D',date:'2026-09-11',leader:'BANCO B',leaderCnpj:'22.222.222/0001-22',volume:50,audience:'Profissional',rite:'Automático'}
  ];
  const report=buildWeeklyReport(items,new Date('2026-09-21T12:00:00Z'));
  assert.equal(report.current.offers,3);
  assert.equal(report.current.volume,300);
  assert.equal(report.current.offersWithVolume,2);
  assert.equal(report.current.topLeaders[0].name,'BANCO A');
  assert.equal(report.prior.offers,1);
  assert.equal(report.changes.offersPct,200);
});

test('parser ANBIMA lê o quadro oficial sem inventar indicadores',()=>{
  const html='<div>Data e Hora da Última Atualização: 18/09/2026 - 16:39 h</div><table><tr><td>Estimativa SELIC</td><td>18/09/2026</td><td>13,65</td></tr><tr><td>Taxa SELIC do BC</td><td>18/09/2026</td><td>13,65</td></tr><tr><td>DI-B3</td><td>18/09/2026</td><td>13,65</td></tr><tr><td>IGP-M (ago/26)</td><td>Número Índice 1.206,897 Var % no mês -0,22</td></tr><tr><td>IGP-M Projeção (set/26)</td><td>0,95</td></tr><tr><td>IPCA (ago/26)</td><td>Número Índice 7.633,23 Var % no mês -0,32</td></tr><tr><td>IPCA Projeção (set/26)</td><td>0,56</td></tr><tr><td>Dólar Comercial Venda</td><td>18/09/2026</td><td>5,1575</td></tr></table>';
  const data=parseAnbimaIndicators(html);
  assert.equal(data.sourceUpdatedAt,'18/09/2026 16:39');
  assert.equal(data.indicators.selicEstimate.value,13.65);
  assert.equal(data.indicators.dollarSell.value,5.1575);
  assert.equal(data.indicators.ipcaProjection.value,0.56);
  assert.equal(data.indicators.igpmProjection.value,0.95);
  const mojibake=Buffer.from(html,'utf8').toString('latin1');
  const repaired=parseAnbimaIndicators(mojibake);
  assert.equal(repaired.sourceUpdatedAt,'18/09/2026 16:39');
  assert.equal(repaired.indicators.dollarSell.value,5.1575);
  assert.equal(repaired.indicators.ipcaProjection.value,0.56);
});


test('classifica FIDC, FIAGRO e FII apenas pelos campos oficiais',()=>{
  const common={Data_Registro:'2026-09-15',Status_Requerimento:'Registro Concedido',Rito_Requerimento:'Automático',Publico_alvo:'Profissional',Valor_Total_Registrado:'100'};
  assert.equal(classifyMarket({...common,Valor_Mobiliario:'Cotas de FIDC'},'resolucao160'),'FIDC');
  assert.equal(classifyMarket({...common,Valor_Mobiliario:'Cotas de FIAGRO'},'resolucao160'),'FIAGRO');
  assert.equal(classifyMarket({...common,Valor_Mobiliario:'Cotas de FII'},'resolucao160'),'FII');
  assert.equal(classifyMarket({Tipo_Fundo_Investimento:'FIAGRO - FIDC',Tipo_Ativo:'Cotas de FIDC'},'distribuicao'),'FIAGRO');
  assert.equal(classifyMarket({Nome_Emissor:'FII QUE INVESTE EM FIDC',Tipo_Fundo_Investimento:'Fundo de Ações'},'distribuicao'),'');
});

test('dataset multivertical mantém mercados separados e FIAGRO prevalece no histórico',()=>{
  const rows=[
    {origin:'resolucao160',row:{Numero_Requerimento:'1',Valor_Mobiliario:'Cotas de FIDC',Nome_Emissor:'FIDC A',CNPJ_Emissor:'11.111.111/0001-11',Data_Registro:'2026-09-15',Valor_Total_Registrado:'100'}},
    {origin:'resolucao160',row:{Numero_Requerimento:'2',Valor_Mobiliario:'Cotas de FIAGRO',Nome_Emissor:'FIAGRO B',CNPJ_Emissor:'22.222.222/0001-22',Data_Registro:'2026-09-15',Valor_Total_Registrado:'200'}},
    {origin:'distribuicao',row:{Numero_Registro_Oferta:'3',Tipo_Fundo_Investimento:'FIAGRO-FIDC',Tipo_Ativo:'Cotas de FIDC',Nome_Emissor:'FIAGRO HIST',CNPJ_Emissor:'33.333.333/0001-33',Data_Registro_Oferta:'2026-09-14',Valor_Total:'50'}},
    {origin:'resolucao160',row:{Numero_Requerimento:'4',Valor_Mobiliario:'Cotas de FII',Nome_Emissor:'FII C',CNPJ_Emissor:'44.444.444/0001-44',Data_Registro:'2026-09-15',Valor_Total_Registrado:'300'}}
  ];
  const dataset=buildCvmMarketsDataset(rows,'2026-09-21');
  assert.equal(dataset.markets.FIDC.count,1);
  assert.equal(dataset.markets.FIAGRO.count,2);
  assert.equal(dataset.markets.FII.count,1);
  assert.equal(dataset.overall.count,4);
  assert.equal(dataset.markets.FIAGRO.analytics.volumeInMonth,250);
});
