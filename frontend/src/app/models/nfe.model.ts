export interface NfeData {
  chave: string;
  natOp: string;
  serie: string;
  nNF: string;
  dhEmi: string;
  tpNF: string; // 0-NFe, 1-NFe
  emit: NfeActor;
  dest: NfeActor;
  det: NfeItem[];
  total: NfeTotal;
}

export interface NfeActor {
  cnpj: string;
  xNome: string;
  xFant?: string;
  ender: NfeAddress;
  ie: string;
}

export interface NfeAddress {
  xLgr: string;
  nro: string;
  xBairro: string;
  cMun: string;
  xMun: string;
  uf: string;
  cep: string;
}

export interface NfeItem {
  cProd: string;
  xProd: string;
  ncm: string;
  cfop: string;
  uCom: string;
  qCom: number;
  vUnCom: number;
  vProd: number;
}

export interface NfeTotal {
  vBC: number;
  vICMS: number;
  vProd: number;
  vNF: number;
}
