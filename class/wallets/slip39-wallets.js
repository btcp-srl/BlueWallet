import slip39 from 'slip39';

import { HDLegacyP2PKHWallet } from './hd-legacy-p2pkh-wallet';
import { HDSegwitP2SHWallet } from './hd-segwit-p2sh-wallet';
import { HDSegwitBech32Wallet } from './hd-segwit-bech32-wallet';

// collection of SLIP39 functions
const SLIP39Mixin = {
  _getSeed() {
    const master = slip39.recoverSecret(this.secret);
    const seed = Buffer.from(master);
    return seed;
  },

  validateMnemonic() {
    if (!this.secret.every(m => slip39.validateMnemonic(m))) return false;

    try {
      slip39.recoverSecret(this.secret);
    } catch (e) {
      return false;
    }
    return true;
  },

  setSecret(newSecret) {
    this.secret = newSecret
      .trim()
      .split('\n')
      .map(s =>
        s
          .trim()
          .toLowerCase()
          .replace(/[^a-zA-Z0-9]/g, ' ')
          .replace(/\s+/g, ' '),
      );
    return this;
  },
};

export class SLIP39LegacyP2PKHWallet extends HDLegacyP2PKHWallet {
  static type = 'SLIP39legacyP2PKH';
  static typeReadable = 'SLIP39 Legacy (P2PKH)';

  _getSeed = SLIP39Mixin._getSeed;
  validateMnemonic = SLIP39Mixin.validateMnemonic;
  setSecret = SLIP39Mixin.setSecret;
}

export class SLIP39SegwitP2SHWallet extends HDSegwitP2SHWallet {
  static type = 'SLIP39segwitP2SH';
  static typeReadable = 'SLIP39 SegWit (P2SH)';

  _getSeed = SLIP39Mixin._getSeed;
  validateMnemonic = SLIP39Mixin.validateMnemonic;
  setSecret = SLIP39Mixin.setSecret;
}

export class SLIP39SegwitBech32Wallet extends HDSegwitBech32Wallet {
  static type = 'SLIP39segwitBech32';
  static typeReadable = 'SLIP39 SegWit (Bech32)';

  _getSeed = SLIP39Mixin._getSeed;
  validateMnemonic = SLIP39Mixin.validateMnemonic;
  setSecret = SLIP39Mixin.setSecret;
}
