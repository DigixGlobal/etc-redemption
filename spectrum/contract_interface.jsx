import React, { PropTypes, Component } from 'react';
import { Container, Grid, Header, Loader } from 'semantic-ui-react';

import Redeem from './redeem.jsx';
import ContractStatus from './contract_status.jsx';
import ExplorerTable from './explorer_table.jsx';
import AddressSearch from './address_search.jsx';

export default class ContractInterface extends Component {
  constructor(props) {
    super(props);
    this.getStatus = this.getStatus.bind(this);
  }
  componentDidMount() {
    this.startPoll();
  }
  componentWillUnmount() {
    this.stopPoll();
  }
  getStatus() {
    const { contract, web3 } = this.props;
    return Promise.all([
      contract.rate.call(),
      contract.totalSupply.call(),
      web3.eth.getBlockNumber(),
      contract.activationBlock.call(),
      contract.totalTokensRedeemed.call(),
      contract.totalWeiRedeemed.call(),
      web3.eth.getBalance(contract.address),
    ]);
  }
  startPoll() {
    const poll = () => {
      this.getStatus().then(() => {
        this.updated = true;
        if (!this.unmounted) {
          this.timeout = setTimeout(poll, 1000 * 4);
        }
      });
    };
    poll();
  }
  stopPoll() {
    this.unmounted = true;
    clearTimeout(this.timeout);
  }
  render() {
    const { contract, web3, network } = this.props;
    const loader = <Loader active inline />;
    if (!contract || !web3) { return loader; }
    const rawData = {
      rate: contract.rate(),
      activationBlock: contract.activationBlock(),
      totalSupply: contract.totalSupply(),
      totalTokenRedeemed: contract.totalTokensRedeemed(),
      totalWeiRedeemed: contract.totalWeiRedeemed(),
      weiBalance: web3.eth.balance(contract.address),
      blockNumber: web3.eth.blockNumber(),
    };
    // console.log(rawData);
    if (Object.values(rawData).some(v => v === undefined)) { return loader; }
    // decorate with calculated args
    const totalTokenExisted = rawData.totalSupply.add(rawData.totalTokenRedeemed);
    const totalWeiSupply = totalTokenExisted.mul(rawData.rate);
    const weiRemaining = totalWeiSupply.sub(rawData.totalWeiRedeemed);
    // TODO this is made up! actually get the multisig address
    const multiSigBalance = totalWeiSupply.sub(rawData.weiBalance);
    // console.log(' 21wtf', rawData.weiBalance.div(totalWeiSupply).mul(100));
    const data = {
      ...rawData,
      totalWeiSupply,
      multiSigBalance,
      totalTokenExisted,
      active: rawData.activationBlock > 0 && rawData.activationBlock.lte(rawData.blockNumber),
      etcRedeemed: rawData.totalWeiRedeemed.div(1e18).toFormat(0),
      etcRemaining: weiRemaining.div(1e18).toFormat(0),
      etcPercent: 100 - rawData.totalTokenRedeemed.div(totalTokenExisted).mul(100).round().toNumber(),
      etcBalance: rawData.weiBalance.div(1e18).toFormat(0),
      topUpPercent: rawData.weiBalance.div(weiRemaining).mul(100).round().toNumber(),
      multiSigEtc: multiSigBalance.div(1e18).toFormat(0),
      multiSigPercent: multiSigBalance.div(weiRemaining).mul(100).round().toNumber(0),
    };
    return (
      <Grid stackable columns={2}>
        <Grid.Column width={16}>
          <Container text textAlign="center">
            <Header content="Digix ETC Redemption Contract" subheader={contract.address} />
            <Redeem {...{ network, contract, web3, data }} />
          </Container>
        </Grid.Column>
        <Grid.Column>
          <Header content="Contract Info" />
          <ContractStatus {...{ contract, web3, data, getStatus: this.getStatus }} />
        </Grid.Column>
        <Grid.Column>
          <Header content="Address Info" />
          <AddressSearch {...{ contract, web3, data }} />
          <Header content="Snapshot Balances" />
          <ExplorerTable {...{ contract, web3, data }} />
        </Grid.Column>
      </Grid>
    );
  }
}

ContractInterface.propTypes = {
  contract: PropTypes.object.isRequired,
  web3: PropTypes.object.isRequired,
  network: PropTypes.object.isRequired,
};
