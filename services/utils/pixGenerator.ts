
// Implementação baseada no padrão EMV BR Code para Pix

// Calcula CRC16 CCITT (polinômio 0x11021, sem inversão de bits)
function crc16(payload: string): string {
    const polinomio = 0x1021;
    let resultado = 0xFFFF;
  
    for (let i = 0; i < payload.length; i++) {
      resultado ^= payload.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        if ((resultado << 1) & 0x10000) {
          resultado = ((resultado << 1) ^ polinomio) & 0xFFFF;
        } else {
          resultado = (resultado << 1) & 0xFFFF;
        }
      }
    }
  
    return resultado.toString(16).toUpperCase().padStart(4, '0');
  }
  
  interface PixParams {
      nome: string;
      chave: string;
      valor: number;
      cidade: string;
      txid?: string;
  }
  
  // Gera payload Pix conforme padrão EMV
  export function gerarPayloadPix({ nome, chave, valor, cidade, txid = 'VPN123' }: PixParams): string {
    const formatID = '000201';
    const merchantCategoryCode = '52040000';
    const transactionCurrency = '5303986';
  
    const valorFmt = valor.toFixed(2);
    const transactionAmount = `54${valorFmt.length.toString().padStart(2, '0')}${valorFmt}`;
    const countryCode = '5802BR';
  
    const nomeLimpo = nome.toUpperCase().slice(0, 25);
    const cidadeLimpa = cidade.toUpperCase().slice(0, 15);
  
    const merchantName = `59${nomeLimpo.length.toString().padStart(2, '0')}${nomeLimpo}`;
    const merchantCity = `60${cidadeLimpa.length.toString().padStart(2, '0')}${cidadeLimpa}`;
    
    // TXID
    const txidFmt = `05${txid.length.toString().padStart(2, '0')}${txid}`;
    const additionalDataField = `62${(txidFmt.length).toString().padStart(2, '0')}${txidFmt}`;
  
    // GUI + Chave
    const gui = `0014BR.GOV.BCB.PIX01${chave.length.toString().padStart(2, '0')}${chave}`;
    const merchantAccount = `26${(gui.length).toString().padStart(2, '0')}${gui}`;
  
    const semCRC = formatID + merchantAccount + merchantCategoryCode + transactionCurrency +
                   transactionAmount + countryCode + merchantName + merchantCity +
                   additionalDataField + '6304';
  
    const crc = crc16(semCRC);
  
    return semCRC + crc;
  }
