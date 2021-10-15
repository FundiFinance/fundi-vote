import Web3 from 'web3';
import spaces from '@/spaces/fundi/index.json';
import config from '@/helpers/config';
import {AbiItem} from 'web3-utils'

import abi from '@/helpers/abi/ffAbi.json';

const rpc_url = config.networks[config.chainId].rpc_url;

export const getBalance = async (address) => {
  const web3 = new Web3(rpc_url);
  const bep20Contract = new web3.eth.Contract(abi as AbiItem[], spaces.address);

  try {
    const balance = await bep20Contract.methods.balanceOf(address).call();
    return balance;
  } catch (error) {
    console.log('[getBalance] error ==>', error);
  }

  return undefined;
};
