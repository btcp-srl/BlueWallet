import Frisbee from 'frisbee';
import url from 'url';

export default class AOPP {
  constructor(uri) {
    this.uri = uri;
    const { protocol, query } = url.parse(uri, true); // eslint-disable-line node/no-deprecated-api

    if (protocol !== 'aopp:') throw new Error('Unsupported protocol');
    if (query.v !== '0') throw new Error('Unsupported version');
    if (!query.msg) throw new Error('Message required');
    if (query.msg.lenth > 1024) throw new Error('Message is too big');
    if (query.asset && query.asset !== 'btc') throw new Error('Unsupported asset');
    if (query.format) {
      if (!['any', 'p2pkh', 'p2wpkh', 'p2sh'].includes(query.format)) {
        throw new Error('Unsupported address format');
      }
    } else {
      query.format = 'any';
    }
    if (!query.callback) throw new Error('Callback required');

    this.v = Number(query.v);
    this.msg = query.msg;
    this.format = query.format;
    this.callback = query.callback;

    this._api = new Frisbee({
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
  }

  async send({ address, signature }) {
    const res = await this._api.post(this.callback, {
      body: {
        version: this.v,
        address,
        signature,
      },
    });

    if (res.err) throw res.err;
  }
}
