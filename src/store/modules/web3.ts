import Vue from 'vue';
import { getInstance } from '@snapshot-labs/lock/plugins/vue';
import { Web3Provider } from '@ethersproject/providers';
import { Contract } from '@ethersproject/contracts';
import { getAddress } from '@ethersproject/address';
import spaces from '@/spaces';
import abi from '@/helpers/abi';
import config from '@/helpers/config';
import rpcProvider from '@/helpers/rpc';
import { formatUnits } from '@ethersproject/units';

let auth;
let web3;

const state = {
  account: null,
  name: null,
  balances: {},
  blockNumber: 0,
  spaces: {},
  network: config.networks['56'],
};

const mutations = {
  LOGOUT(_state) {
    Vue.set(_state, 'account', null);
    Vue.set(_state, 'name', null);
    Vue.set(_state, 'balances', {});
    console.debug('LOGOUT');
  },
  LOAD_PROVIDER_REQUEST() {
    console.debug('LOAD_PROVIDER_REQUEST');
  },
  LOAD_PROVIDER_SUCCESS(_state, payload) {
    Vue.set(_state, 'account', payload.account);
    Vue.set(_state, 'name', payload.name);
    console.debug('LOAD_PROVIDER_SUCCESS');
  },
  LOAD_PROVIDER_FAILURE(_state, payload) {
    Vue.set(_state, 'account', null);
    console.debug('LOAD_PROVIDER_FAILURE', payload);
  },
  HANDLE_CHAIN_CHANGED(_state, chainId) {
    // FIXME: TrustWallet is sending 86 instead of 56
    if (chainId === 86) { chainId = 56; }
    
    Vue.set(_state, 'network', config.networks[chainId]);
    Vue.set(_state, 'spaces', spaces[chainId]);
    Vue.set(_state, 'chainId', chainId);
    console.debug('HANDLE_CHAIN_CHANGED', chainId);
  },
  HANDLE_ACCOUNTS_CHANGED(_state, payload) {
    Vue.set(_state, 'account', payload);
    console.debug('HANDLE_ACCOUNTS_CHANGED', payload);
  },
  HANDLE_CLOSE_CHANGED() {
    console.debug('HANDLE_CLOSE_CHANGED');
  },
  LOOKUP_ADDRESS_SUCCESS() {
    console.debug('LOOKUP_ADDRESS_SUCCESS');
  },
  RESOLVE_NAME_SUCCESS() {
    console.debug('RESOLVE_NAME_SUCCESS');
  },
  SEND_TRANSACTION_REQUEST() {
    console.debug('SEND_TRANSACTION_REQUEST');
  },
  SEND_TRANSACTION_SUCCESS() {
    console.debug('SEND_TRANSACTION_SUCCESS');
  },
  SEND_TRANSACTION_FAILURE(_state, payload) {
    console.debug('SEND_TRANSACTION_FAILURE', payload);
  },
  SIGN_MESSAGE_REQUEST() {
    console.debug('SIGN_MESSAGE_REQUEST');
  },
  SIGN_MESSAGE_SUCCESS() {
    console.debug('SIGN_MESSAGE_SUCCESS');
  },
  SIGN_MESSAGE_FAILURE(_state, payload) {
    console.debug('SIGN_MESSAGE_FAILURE', payload);
  },
  GET_BLOCK_REQUEST() {
    console.debug('GET_BLOCK_REQUEST');
  },
  GET_BLOCK_SUCCESS(_state, payload) {
    Vue.set(_state, 'blockNumber', payload);
    console.debug('GET_BLOCK_SUCCESS', payload);
  },
  GET_BLOCK_FAILURE(_state, payload) {
    console.debug('GET_BLOCK_FAILURE', payload);
  },
};

const actions = {
  login: async ({ commit, dispatch }, connector = 'injected') => {
    auth = getInstance();
    await auth.login(connector);
    if (auth.provider) {
      web3 = new Web3Provider(auth.provider);
      await dispatch('loadProvider');
    } else {
      commit('HANDLE_CHAIN_CHANGED', 1);
    }
  },
  logout: async ({ commit }) => {
    Vue.prototype.$auth.logout();
    commit('LOGOUT');
  },
  loadProvider: async ({ commit, dispatch }) => {
    commit('LOAD_PROVIDER_REQUEST');
    try {
      if (auth.provider.removeAllListeners) auth.provider.removeAllListeners();
      if (auth.provider.on) {
        auth.provider.on('chainChanged', async chainId => {
          commit('HANDLE_CHAIN_CHANGED', parseInt(formatUnits(chainId, 0)));
        });
        auth.provider.on('accountsChanged', async accounts => {
          if (accounts.length !== 0) {
            commit('HANDLE_ACCOUNTS_CHANGED', accounts[0]);
            await dispatch('loadProvider');
          }
        });
        auth.provider.on('disconnect', async () => {
          commit('HANDLE_CLOSE');
        });
      }
      const [network, accounts] = await Promise.all([
        web3.getNetwork(),
        web3.listAccounts(),
      ]);
      commit('HANDLE_CHAIN_CHANGED', network.chainId);
      const account = accounts.length > 0 ? accounts[0] : null;
      const name = await dispatch('lookupAddress', account);
      commit('LOAD_PROVIDER_SUCCESS', {
        account,
        name,
      });
    } catch (e) {
      commit('LOAD_PROVIDER_FAILURE', e);
      return Promise.reject();
    }
  },
  lookupAddress: async ({ commit }, address) => {
    // FIXME: remove once BNS is implemented
    return;

    try {
      const name = await rpcProvider.lookupAddress(address);
      commit('LOOKUP_ADDRESS_SUCCESS', name);
      return name;
    } catch (e) {
      return Promise.reject();
    }
  },
  resolveName: async ({ commit }, name) => {
    // FIXME: remove once BNS is implemented
    return;

    try {
      const address = await rpcProvider.resolveName(name);
      commit('RESOLVE_NAME_SUCCESS', address);
      return address;
    } catch (e) {
      return Promise.reject();
    }
  },
  sendTransaction: async (
    { commit },
    [contractType, contractAddress, action, params]
  ) => {
    commit('SEND_TRANSACTION_REQUEST');
    try {
      const signer = web3.getSigner();
      const contract = new Contract(
        getAddress(contractAddress),
        abi[contractType],
        web3
      );
      const contractWithSigner = contract.connect(signer);
      const overrides = {};
      // overrides.gasLimit = 12e6;
      const tx = await contractWithSigner[action](...params, overrides);
      await tx.wait();
      commit('SEND_TRANSACTION_SUCCESS');
      return tx;
    } catch (e) {
      commit('SEND_TRANSACTION_FAILURE', e);
      return Promise.reject();
    }
  },
  signMessage: async ({ commit }, [address, message]) => {
    commit('SIGN_MESSAGE_REQUEST');
    try {
      let sig;
      // workaround for Binance Chain wallet, use bnbSign()
      if (web3.provider.bnbSign) {
        const bnbSig = await web3.provider.bnbSign(address, message);
        sig = bnbSig.signature;
      } else {
        const signer = web3.getSigner();
        sig = await signer.signMessage(message);
      }
      commit('SIGN_MESSAGE_SUCCESS');
      return sig;
    } catch (e) {
      commit('SIGN_MESSAGE_FAILURE', e);
      return Promise.reject(e);
    }
  },
  getBlockNumber: async ({ commit }) => {
    commit('GET_BLOCK_REQUEST');
    try {
      // @ts-ignore
      const blockNumber: any = await rpcProvider.getBlockNumber();
      commit('GET_BLOCK_SUCCESS', parseInt(blockNumber));
      return blockNumber;
    } catch (e) {
      commit('GET_BLOCK_FAILURE', e);
      return Promise.reject();
    }
  },
};

export default {
  state,
  mutations,
  actions,
};
