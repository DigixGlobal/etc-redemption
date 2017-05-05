import React, { PropTypes, Component } from 'react';
import { Grid, Header, Loader } from 'semantic-ui-react';

import Redeem from './redeem.jsx';
import ContractStatus from './contract_status.jsx';
import Explore from './explore.jsx';

export default class ContractInterface extends Component {
  componentDidMount() {
    this.startPoll();
  }
  componentWillUnmount() {
    this.stopPoll();
  }
  getStatus() {
    const { contract, web3 } = this.props;
    contract.rate.call();
    contract.totalSupply.call();
    web3.eth.getBlockNumber();
    contract.activationBlock.call();
    contract.totalTokensRedeemed.call();
    contract.totalWeiRedeemed.call();
    web3.eth.getBalance(contract.address);
  }
  startPoll() {
    const poll = () => {
      this.getStatus();
      this.timeout = setTimeout(poll, 1000 * 4);
    };
    poll();
  }
  stopPoll() {
    clearTimeout(this.timeout);
  }
  render() {
    const { contract, web3, network } = this.props;
    const rawData = {
      rate: contract.rate(),
      activationBlock: contract.activationBlock(),
      totalSupply: contract.totalSupply(),
      totalTokenRedeemed: contract.totalTokensRedeemed(),
      totalWeiRedeemed: contract.totalWeiRedeemed(),
      weiBalance: web3.eth.balance(contract.address),
      blockNumber: web3.eth.blockNumber(),
    };
    if (Object.values(rawData).some(v => v === undefined)) { return <Loader active inline />; }
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
        <Grid.Column>
          <Header content="Digix ETC Redemption Contract" subheader={contract.address} />
          <ContractStatus {...{ contract, web3, data }} />
        </Grid.Column>
        <Grid.Column>
          <Header content="Redeem" />
          <Redeem {...{ network, contract, web3, data }} />
        </Grid.Column>
        <Grid.Column width={16}>
          <Header content="Explore" />
          <Explore {...{ contract, web3, data }} />
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
