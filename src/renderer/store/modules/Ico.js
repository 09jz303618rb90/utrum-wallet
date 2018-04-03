import * as _ from 'lodash';
import axios from 'axios';
import bitcoinjs from 'bitcoinjs-lib';
import { Wallet }  from 'libwallet-mnz';

const state = {
  associatedTxs: [],
  pendingSwaps: [],
};

const mutations = {
  UPDATE_ASSOCIATED_TXS(state, associations) {
    state.associatedTxs = associations;
  },
  ADD_PENDING_TX(state, newPendingTx) {
    state.pendingSwaps.unshift(newPendingTx);
  },
  DELETE_PENDING_TX(state, pendingTxHash) {
    state.pendingSwaps = _.filter(state.pendingSwaps, (pendingSwap) => {
      return pendingSwap.cryptoTx.tx_hash !== pendingTxHash;
    });
  },
};

const actions = {
  buyAsset({ commit, rootGetters, dispatch }, { wallet, amount, fee, coupon, amountMnz }) {
    const walletBuy = wallet;
    const amountBuy = amount;
    const couponBuy = coupon;
    const feeBuy = fee;
    const amountMnzBuy = amountMnz;

    return new Promise((resolve, reject) => {
      wallet.electrum.listUnspent(wallet.address).then(response => {
        const wallet = new Wallet(walletBuy.privKey, walletBuy.coin, rootGetters.isTestMode);
        // const pubKeysBuy = rootGetters.getPubKeysBuy;
        let pubKeyAddress = '';

        // Object.keys(pubKeysBuy).forEach(ticker => {
        //   if (ticker === walletBuy.ticker.toLowerCase()) {
        //     pubKeyAddress = pubKeysBuy[ticker];
        //   }
        // });
        _.mapKeys(rootGetters.getPubKeysBuy, (value, key) => {
          if (key === walletBuy.ticker.toLowerCase()) {
            pubKeyAddress = value;
          }
        });
        const xpub = bitcoinjs.HDNode.fromBase58(pubKeyAddress, wallet.coin.network);
        const index = Math.floor(Math.random() * 10);
        const address = xpub.derivePath(`0/${index}`).keyPair.getAddress();
        console.log("Network: ", wallet.coin.network);
        console.log("pubKeyAddress: ", pubKeyAddress);
        console.log("Response: ", response.data);
        console.log("Addr: ", address);
        console.log("Wallet: ", wallet);

<<<<<<< HEAD
        const tx = wallet.prepareTx(response.data, address, amountBuy, feeBuy, couponBuy);

        axios.post('http://localhost:8000', {
          ticker: walletBuy.ticker,
          test: rootGetters.isTestMode,
          method: 'blockchain.transaction.broadcast',
          params: [tx],
        })
        .then((response) => {
          console.log("BUYING ", response.data);
          const localCryptoTx = generateLocalTx(walletBuy.address, amountBuy, response.data);
          const localMnzTx = generateLocalMnz(amountMnzBuy);
          commit('ADD_PENDING_TX', { mnzTx: localMnzTx, cryptoTx: localCryptoTx, ticker: walletBuy.ticker });
=======
        const tx = wallet.prepareTx(response, newAddress(xpub, index), amountBuy, feeBuy, couponBuy);

        wallet.electrum.broadcast(tx).then((response) => {
          dispatch('addTxLocal', {
            walletBuy: walletBuy,
            txHash: response,
            amountBuy: amountBuy,
            amountMnzBuy: amountMnzBuy,
          }, { root: true });
>>>>>>> feat: first preview
          resolve(response);
        })
        .catch(error => {
          console.log("CATCH: ", error);
          reject(error);
        });
      });
    });
  },
};

const getters = {
  getSwapList: (state) => {
    return state.pendingSwaps.concat(state.associatedTxs);
  },
};

const generateLocalTx = (address, amount, txHash) => {
  const nowDate = new Date();
  const now = (nowDate.getTime() / 1000) + (nowDate.getTimezoneOffset() * 60);

  return {
    address: address,
    amount: amount,
    time: now,
    tx_hash: txHash,
  };
};

const generateLocalMnz = (amount) => {
  return {
    amount: amount,
  };
};


export default {
  state,
  mutations,
  actions,
  getters,
};
