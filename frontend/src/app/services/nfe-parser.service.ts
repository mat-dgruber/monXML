import { Injectable } from '@angular/core';
import {
  NfeData,
  NfeActor,
  NfeAddress,
  NfeItem,
  NfeTotal,
} from '../models/nfe.model';

@Injectable({
  providedIn: 'root',
})
export class NfeParserService {
  parse(xmlContent: string): NfeData | null {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlContent, 'text/xml');

    // Simplistic error check
    if (doc.getElementsByTagName('parsererror').length > 0) {
      return null;
    }

    // Helper to safely get tag text
    const getText = (parent: Element | Document, tag: string): string => {
      const els = parent.getElementsByTagName(tag);
      return els.length > 0 ? els[0].textContent || '' : '';
    };

    const getTag = (
      parent: Element | Document,
      tag: string,
    ): Element | null => {
      const els = parent.getElementsByTagName(tag);
      return els.length > 0 ? els[0] : null;
    };

    // InfNFe
    const infNFe = getTag(doc, 'infNFe');
    if (!infNFe) return null;

    const id = infNFe.getAttribute('Id') || '';
    const chave = id.replace('NFe', '');

    // Ide
    const ide = getTag(infNFe, 'ide');
    const natOp = ide ? getText(ide, 'natOp') : '';
    const serie = ide ? getText(ide, 'serie') : '';
    const nNF = ide ? getText(ide, 'nNF') : '';
    const dhEmi = ide ? getText(ide, 'dhEmi') : '';
    const tpNF = ide ? getText(ide, 'tpNF') : '';

    // Emit
    const emitEl = getTag(infNFe, 'emit');
    const emit = this.parseActor(emitEl);

    // Dest
    const destEl = getTag(infNFe, 'dest');
    const dest = this.parseActor(destEl);

    // Det (Items)
    const detEls = infNFe.getElementsByTagName('det');
    const items: NfeItem[] = [];
    for (let i = 0; i < detEls.length; i++) {
      const det = detEls[i];
      const prod = getTag(det, 'prod');
      if (prod) {
        items.push({
          cProd: getText(prod, 'cProd'),
          xProd: getText(prod, 'xProd'),
          ncm: getText(prod, 'NCM'),
          cfop: getText(prod, 'CFOP'),
          uCom: getText(prod, 'uCom'),
          qCom: parseFloat(getText(prod, 'qCom') || '0'),
          vUnCom: parseFloat(getText(prod, 'vUnCom') || '0'),
          vProd: parseFloat(getText(prod, 'vProd') || '0'),
        });
      }
    }

    // Total
    const totalEl = getTag(infNFe, 'total');
    const icmsTot = totalEl ? getTag(totalEl, 'ICMSTot') : null;
    const total: NfeTotal = {
      vBC: parseFloat(icmsTot ? getText(icmsTot, 'vBC') : '0'),
      vICMS: parseFloat(icmsTot ? getText(icmsTot, 'vICMS') : '0'),
      vProd: parseFloat(icmsTot ? getText(icmsTot, 'vProd') : '0'),
      vNF: parseFloat(icmsTot ? getText(icmsTot, 'vNF') : '0'),
    };

    return {
      chave,
      natOp,
      serie,
      nNF,
      dhEmi,
      tpNF,
      emit,
      dest,
      det: items,
      total,
    };
  }

  private parseActor(el: Element | null): NfeActor {
    if (!el)
      return {
        cnpj: '',
        xNome: '',
        ender: {
          xLgr: '',
          nro: '',
          xBairro: '',
          cMun: '',
          xMun: '',
          uf: '',
          cep: '',
        },
        ie: '',
      };

    const getText = (parent: Element, tag: string) => {
      const els = parent.getElementsByTagName(tag);
      return els.length > 0 ? els[0].textContent || '' : '';
    };

    const enderEl =
      el.getElementsByTagName('enderEmit')[0] ||
      el.getElementsByTagName('enderDest')[0];

    return {
      cnpj: getText(el, 'CNPJ'),
      xNome: getText(el, 'xNome'),
      xFant: getText(el, 'xFant'),
      ie: getText(el, 'IE'),
      ender: {
        xLgr: enderEl ? getText(enderEl, 'xLgr') : '',
        nro: enderEl ? getText(enderEl, 'nro') : '',
        xBairro: enderEl ? getText(enderEl, 'xBairro') : '',
        cMun: enderEl ? getText(enderEl, 'cMun') : '',
        xMun: enderEl ? getText(enderEl, 'xMun') : '',
        uf: enderEl ? getText(enderEl, 'UF') : '',
        cep: enderEl ? getText(enderEl, 'CEP') : '',
      },
    };
  }
}
