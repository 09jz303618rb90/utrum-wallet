import ExplorerLink from '@/components/Utils/ExplorerLink/ExplorerLink.vue';

const sb = require('satoshi-bitcoin');
const moment = require('moment');

export default {
  name: 'transaction-history',
  props: ['fromTokenSale', 'coin'],
  data() {
    return {
      sortBy: 'time',
      sortDesc: true,
    };
  },
  components: {
    explorer: ExplorerLink,
  },
  methods: {
    getRow(value) {
      return value;
    },
    myRowClickHandler(record) {
      this.$swal('Swap info', JSON.stringify(record));
    },
    satoshiToBitcoin(amount) {
      return sb.toBitcoin(amount);
    },
    getColorAmount(amount) {
      return (amount > 0) ? 'positiveColor' : 'negativeColor';
    },
    dateFormat(value) {
      const blockchainDateUtc = moment.utc(value * 1000);
      const dateString = moment(blockchainDateUtc).local().format('hh:mm A DD/MM/YYYY');
      return dateString;
    },
    getIconFromTicker(value) {
      return require(`@/assets/icon-${value}.svg`); // eslint-disable-line
    },
    getPrice(value) {
      const amountMnz = value.item.amount;
      let amountOrigin = 0;

      const txOrigin = this.$store.getters
        .getWalletTxs(value.item.origin.ticker)
        .filter(el => value.item.origin.txHash === el.tx_hash.substring(0, 9));
      amountOrigin = txOrigin[0].amount;

      return Math.abs(amountOrigin / amountMnz).toFixed(8);
    },
    getTotalPrice(value) {
      let amountOrigin = 0;

      const txOrigin = this.$store.getters
        .getWalletTxs(value.item.origin.ticker)
        .filter(el => value.item.origin.txHash === el.tx_hash.substring(0, 9));
      amountOrigin = txOrigin[0].amount;

      return Math.abs(sb.toBitcoin(amountOrigin));
    },
    getStatus(value) {
      return (value < 0) ? 'Pending' : 'Done';
    },
  },
  mounted() {
    this.$store.dispatch('buildTxHistory', this.wallet);
  },
  computed: {
    wallet() {
      return this.$store.getters.getWalletByTicker(this.coin.ticker);
    },
    txHistory() {
      return this.fromTokenSale ? this.$store.getters.getHistoryBuy
       : this.$store.getters.getWalletTxs(this.coin.ticker);
    },
    fields()  {
      if (this.fromTokenSale) {
        return [
          {
            key: 'time',
            label: 'Date / Hours',
            sortable: true,
          },
          {
            key: 'origin',
            label: 'Type',
            sortable: true,
          },
          {
            key: 'amount',
            label: 'Amount (MNZ)',
            sortable: true,
          },
          {
            key: 'origin.txHash',
            label: 'Price',
            sortable: true,
          },
          {
            key: 'item',
            label: 'Total',
            sortable: true,
          },
          {
            key: 'height',
            label: 'Status',
            sortable: true,
          },
        ];
      }
      return [
        {
          key: 'height',
          label: 'Block Height',
          sortable: true,
        },
        {
          key: 'amount',
          label: `Amount (${this.coin.ticker})`,
          sortable: true,
        },
      ];
    },
  },
};
