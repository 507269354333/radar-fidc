import test from 'node:test';
import assert from 'node:assert/strict';
import {decodeOfficialCsv,parseCsv} from '../lib/csv.js';
import {buildCvmDataset} from '../lib/cvm-data.js';
import {fetchBcbDataset} from '../lib/bcb-data.js';

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
