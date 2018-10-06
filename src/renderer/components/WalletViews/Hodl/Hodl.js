/** ***************************************************************************
 * Copyright © 2018 Monaize Singapore PTE. LTD.                               *
 *                                                                            *
 * See the AUTHORS, and LICENSE files at the top-level directory of this      *
 * distribution for the individual copyright holder information and the       *
 * developer policies on copyright and licensing.                             *
 *                                                                            *
 * Unless otherwise agreed in a custom licensing agreement, no part of the    *
 * Monaize Singapore PTE. LTD software, including this file may be copied,    *
 * modified, propagated or distributed except according to the terms          *
 * contained in the LICENSE file                                              *
 *                                                                            *
 * Removal or modification of this copyright notice is prohibited.            *
 *                                                                            *
 ******************************************************************************/

import bitcoinjs from 'bitcoinjs-lib';
import Select2 from '@/components/Utils/Select2/Select2.vue';
import SelectAwesome from '@/components/Utils/SelectAwesome/SelectAwesome.vue';
import { BigNumber } from 'bignumber.js';
import bitcore from 'bitcore-lib';
import axios from 'axios';

const { clipboard } = require('electron');
const moment = require('moment');
const electron = require('electron');


export default {
  name: 'hodl',
  components: {
    select2: Select2,
    'select-awesome': SelectAwesome
  },
  created () {
    this.select = this.$store.getters.getTickerForExpectedCoin('OOT');
  },
  mounted () {
    // initialize hodl wallet
    this.hodlData = this.fillHodlData()
    this.updateUnlockTime()
    this.getUtxos()
  },
  data () {
    return {
      hodlInput: {
        amount: '',
        // daysToLock: 60 // TESTING!
        daysToLock: 15
      },
      hodlData: {
        unlockTime: '',
        scriptAddress: '',
        redeemScript: '',
        myUtxos: []
      },
      unlockTimeDate: '',
      scriptAddress: '',
      redeemScript: '',
      validator: '',
      explorer: 'https://explorer.utrum.io/',
      isClipboard: false,
      satoshiNb: 100000000,
      blocks: 1,
      estimatedFee: 0,
      feeSpeed: 'fast',
      fees: [
        { id: 0, label: 'Very fast', speed: 'fast', value: 'veryFast' },
        { id: 1, label: 'Fast', speed: 'medium', value: 'fast' },
        { id: 2, label: 'Low', speed: 'slow', value: 'low' },
      ],
      videoConstraints: {
        width: {
          min: 265,
          ideal: 265,
          max: 265,
        },
        height: {
          min: 250,
          ideal: 250,
          max: 250,
        },
      },
      paused: false,
      readingQRCode: false,
      select: '',
      withdraw: {
        amount: null,
        address: '',
        coin: 'OOT',
      },
      history: [],
    };
  },
  methods: {
    // for the hodl address copy button
    onCopy() {
      const self = this;
      this.isClipboard = true;
      setTimeout(() => {
        self.isClipboard = false;
      }, 1000);
    },
    // open validation 3rd party software link on an external browser
    openValidator () {
      electron.shell.openExternal(`${this.validator}`);
    },
    // update hodl unlock time
    updateUnlockTime () {
      // convert days to seconds
      //var secondsToLock = (this.hodlInput.daysToLock * 86400) // TESTING!
      var secondsToLock = (this.hodlInput.daysToLock * 60) // TESTING!
      var unlockTime = (Date.now() / 1000 | 0) + secondsToLock
      this.hodlData.unlockTime = unlockTime
      this.unlockTimeDate = (
        this.dateFormat(unlockTime) + " (in " +
        //this.hodlInput.daysToLock + " days)" // TESTING!
        this.hodlInput.daysToLock + " minutes)" // TESTING!
      )
    },
    // method to retrieve hodl script from the hodl api
    getScript (url) {
      var vm = this
      vm.scriptAddress = "Loading..."
      vm.redeemScript = ""
      vm.validator = ""
      axios
        .get(url)
        .then(response => {
          // update hodl data object
          vm.hodlData["redeemScript"] = response.data["redeemScript"]
          vm.hodlData["scriptAddress"] = response.data["address"]
          // update gui data
          vm.scriptAddress = response.data["address"]
          vm.validator = 'https://deckersu.github.io/coinbin/?verify=' + response.data["redeemScript"]
        })
        .catch(e => {
          console.log(e)
        });
    },
    getUtxos () {
      var vm = this
      var url = vm.explorer + "insight-api-komodo/addr/" + vm.hodlData.address + "/utxo"
      console.log(url)
      axios
        .get(url)
        .then(response => {
          vm.hodlData.myUtxos = response.data
        })
        .catch(e => {
          console.log(e)
        });
    },
    buildTx () {
      console.log('building transaction...')
      this.getUtxos()
      var vm = this
      var utxos = vm.hodlData.myUtxos
      var toAddress = this.hodlData.scriptAddress
      var myAddress = vm.hodlData.address
      var amount = vm.hodlInput["amount"] * vm.satoshiNb
      vm.hodlInput["amount"] = ''
      var op_return = "REDEEM SCRIPT " + vm.hodlData.redeemScript
      var privateKey = vm.hodlData.privateKey

      var opts = { // https://bitcore.io/api/lib/transaction#serialization-checks
        disableDustOutputs: true
      }
      var transaction = new bitcore.Transaction()
        .from(utxos)
        .to(toAddress, amount)
        .change(myAddress)
        .addData(op_return)
        .sign(privateKey)
      console.log(transaction.serialize(opts))
      return transaction
    },
    // hodl script creation
    hodlCreate () {
      var vm = this

      // update unlock time to now
      vm.updateUnlockTime()

      vm.hodlData["scriptAddress"] = ''
      vm.hodlData["redeemScript"] = ''
      vm.hodlInput.daysToLock = ''

      var url = vm.explorer + "hodl-api/create/"
      url += vm.hodlData.publicKey
      url += "/" + vm.hodlData.unlockTime
      vm.getScript(url)
    },
    // here we store hodl related data
    fillHodlData () {
      var dict = {};

      var privateKey = new bitcore.PrivateKey(this.wallet.privKey.toString('hex'));
      dict["privateKey"] = privateKey.toString();

      var publicKey = new bitcore.PublicKey(privateKey);
      dict["publicKey"] = publicKey.toString();

      var address = publicKey.toAddress();
      dict["address"] = address.toString();

      return dict;
    },
    dateFormat (time) {
      const blockchainDateUtc = moment.utc(time * 1000);
      const dateString = moment(blockchainDateUtc).local().format('hh:mm A MM/DD/YYYY');
      return dateString;
    }
  },
  computed: {
    // get bitcoinjs-lib wallet
    wallet () {
      return this.$store.getters.getWalletByTicker(this.select);
    }
  }
}
