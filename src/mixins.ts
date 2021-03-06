import { mapState } from 'vuex';
import numeral from 'numeral';
import prettyMs from 'pretty-ms';
import store from '@/store';
import config from '@/helpers/config';
import { shorten, bscscanLink } from '@/helpers/utils';

// @ts-ignore
const modules = Object.entries(store.state).map(module => module[0]);

export default {
  data() {
    return {
      config,
    };
  },
  computed: {
    ...mapState(modules),
  },
  methods: {
    _ms(number) {
      const diff = number * 1e3 - new Date().getTime();
      return prettyMs(diff);
    },
    _numeral(number, format = '(0.[00]a)') {
      return numeral(number).format(format);
    },
    _shorten(str: string, key: string): string {
      if (!str) return str;
      let limit;
      if (key === 'symbol') limit = 6;
      if (key === 'name') limit = 64;
      if (key === 'choice') limit = 12;
      if (limit)
        return str.length > limit ? `${str.slice(0, limit).trim()}...` : str;
      return shorten(str);
    },
    _ipfsUrl(ipfsHash: string): string {
      return `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
    },
    _bscscanLink(str: string, type: string): string {
      return bscscanLink(str, type);
    },
  },
};
