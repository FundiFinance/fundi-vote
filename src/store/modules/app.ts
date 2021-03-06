import client from '@/helpers/client';
import ipfs from '@/helpers/ipfs';
import { formatProposal, formatProposals, isEmpty } from '@/helpers/utils';
import { getBalance } from '@/helpers/balance';
import { version } from '@/../package.json';

const mutations = {
  SEND_REQUEST() {
    console.debug('SEND_REQUEST');
  },
  SEND_SUCCESS() {
    console.debug('SEND_SUCCESS');
  },
  SEND_FAILURE(_state, payload) {
    console.debug('SEND_FAILURE', payload);
  },
  GET_PROPOSALS_REQUEST() {
    console.debug('GET_PROPOSALS_REQUEST');
  },
  GET_PROPOSALS_SUCCESS() {
    console.debug('GET_PROPOSALS_SUCCESS');
  },
  GET_PROPOSALS_FAILURE(_state, payload) {
    console.debug('GET_PROPOSALS_FAILURE', payload);
  },
  GET_PROPOSAL_REQUEST() {
    console.debug('GET_PROPOSAL_REQUEST');
  },
  GET_PROPOSAL_SUCCESS() {
    console.debug('GET_PROPOSAL_SUCCESS');
  },
  GET_PROPOSAL_FAILURE(_state, payload) {
    console.debug('GET_PROPOSAL_FAILURE', payload);
  },
  GET_HOLDERS_REQUEST() {
    console.debug('GET_HOLDERS_REQUEST');
  },
  GET_HOLDERS_SUCCESS() {
    console.debug('GET_HOLDERS_SUCCESS');
  },
  GET_HOLDERS_FAILURE(_state, payload) {
    console.debug('GET_HOLDERS_FAILURE', payload);
  },
};

const actions = {
  send: async ({ commit, dispatch, rootState }, { token, type, payload }) => {
    commit('SEND_REQUEST');
    try {
      const msg: any = {
        address: rootState.web3.account,
        msg: JSON.stringify({
          version,
          timestamp: (Date.now() / 1e3).toFixed(),
          token,
          type,
          payload,
        }),
      };
      msg.sig = await dispatch('signMessage', [msg.address, msg.msg]);
      const result = await client.request('message', msg);
      commit('SEND_SUCCESS');
      dispatch('notify', ['green', `Your ${type} is in!`]);
      return result;
    } catch (e) {
      commit('SEND_FAILURE', e);
      const errorMessage =
        e && e.error_description
          ? `Oops, ${e.error_description}`
          : 'Oops, something went wrong!';

      dispatch('notify', ['red', errorMessage]);
      return;
    }
  },

  getProposals: async ({ commit }, space) => {
    commit('GET_PROPOSALS_REQUEST');
    try {
      const proposals: any = await client.request(`${space.address}/proposals`);

      if (proposals && !isEmpty(proposals)) {
        Object.keys(proposals).forEach(k => {
          proposals[k].score = proposals[k].score || 0;
        });
      }

      commit('GET_PROPOSALS_SUCCESS');
      return formatProposals(proposals);
    } catch (e) {
      commit('GET_PROPOSALS_FAILURE', e);
    }
  },

  getProposal: async ({ commit }, { space, id, address }) => {
    commit('GET_PROPOSAL_REQUEST');
    try {
      const result: any = {};

      // -- Fetch proposal
      const [proposal, votes] = await Promise.all([
        ipfs.get(id),
        client.request(`${space.address}/proposal/${id}`),
      ]);
      result.proposal = formatProposal(proposal);
      result.proposal.ipfsHash = id;
      result.votes = votes;
      // !- Fetch proposal

      // -- Fetch power
      const payload = result.proposal.msg.payload;
      const snapshot = payload.start;

      let res: any;
      let scores;
      try {
        res = await client.request(`${space.token}/snapshot/${snapshot}`);
        scores = await ipfs.get(res[snapshot]);
      } catch (err) {
        res = await client.request(`${space.address}/snapshot/holders`);
        if (res.holders) {
          scores = await ipfs.get(res.holders);
        } else {
          res = await getBalance(address);
          const map = new Map();
          // try {
          //   await Promise.all(Object.keys(votes).map(key => (async function () {
          //     console.log('key ==>', key);
          //     let balance = await getBalance(key) / 1e18;
          //     console.log('balance ==>', key, balance);
          //     map.set(key.toLowerCase(), balance);
          //     return;
          //   })))
          // } catch (err1) {
          //   console.log('err1 ==>', err1);
          // }
          
          scores = map;
          for(const key of Object.keys(votes as Array<any>)) {
            scores = {
              ...scores,
              [key.toLowerCase()]: await getBalance(key.toLowerCase()) / 1e18
            }
          }
          scores = {
            ...scores,
            [address.toLowerCase()]: res / 1e18
          };
        }
      }

      try {
        // FIXME: BigNum to avoid parse issues
        Object.keys(scores).forEach(k => (scores[k] = parseFloat(scores[k])));
  
        result.scores = scores;
        result.totalScore = Object.values(scores).reduce((a, b: any) => a + b, 0);
        result.score = scores[address.toLowerCase()];
        // !- Fetch power
  
        // -- Calculate results
        Object.keys(result.votes).forEach(k => {
          result.votes[k].score = scores[k.toLowerCase()];
          if (result.votes[k].score === undefined) {
            delete result.votes[k];
          }
        });

      } catch (err) {
        console.log('score calculation', err);
      }

      result.results = {};

      result.results.totalVotes = payload.choices.map(
        (choice, i) =>
          Object.values(result.votes).filter(
            (vote: any) => vote.msg.payload.choice === i + 1
          ).length
      );

      result.results.totalScores = payload.choices.map((choice, i) =>
        Object.values(result.votes)
          .filter((vote: any) => vote.msg.payload.choice === i + 1)
          .reduce((a, b: any) => a + (b.score > 1000 ? 1000 : b.score), 0)
      );

      result.results.totalVoteScores = result.results.totalScores.reduce(
        (a, b: any) => a + b,
        0
      );

      // !- Calculate results

      commit('GET_PROPOSAL_SUCCESS');
      return result;
    } catch (e) {
      console.log('Error ==>', e);
      commit('GET_PROPOSAL_FAILURE', e);
    }
  },
  getHolders: async ({ commit }, space) => {
    commit('GET_HOLDERS_REQUEST');
    try {
      // -- Fetch /holders snapshot
      const snapshot: any = await client.request(
        `${space.address}/snapshot/holders`
      );
      // !- Fetch /holders snapshot

      // -- Fetch address:BIFI
      const holders = await ipfs.get(snapshot.holders);
      // !- Fetch address:BIFI

      commit('GET_HOLDERS_SUCCESS');
      return holders;
    } catch (e) {
      commit('GET_HOLDERS_FAILURE', e);
      return;
    }
  },
};

export default {
  mutations,
  actions,
};
