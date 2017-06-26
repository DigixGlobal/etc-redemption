import React, { PropTypes, Component } from 'react';
import { Divider, Container, Grid, Header, Loader } from 'semantic-ui-react';

import Redeem from './redeem.jsx';
import ContractStatus from './contract_status.jsx';
import ExplorerTable from './explorer_table.jsx';
import AddressSearch from './address_search.jsx';

const topUpAddresses = [
  '0xA876e0Bb91a5277be74b340De60c7BE818DC37e8',
  '0xEB11C580781B9339fD0668A3883f7fe1dB38B592',
  '0x6dF098fEc80FC5Fec8D045c4eA8cc9429C90A357',
  '0x50092395418bE5f4Ad1E720a0724F334758C3158',
];

export default class ContractInterface extends Component {
  constructor(props) {
    super(props);
    this.state = { loading: true };
    this.getStatus = this.getStatus.bind(this);
  }
  componentDidMount() {
    this.getStatus();
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
      web3.eth.getBalance(topUpAddresses[0]),
      web3.eth.getBalance(topUpAddresses[1]),
      web3.eth.getBalance(topUpAddresses[2]),
      web3.eth.getBalance(topUpAddresses[3]),
    ]).then(() => this.setState({ loading: false }));
  }
  getData() {
    const { contract, web3 } = this.props;
    const rate = contract.rate();
    const activationBlock = contract.activationBlock();
    const totalSupply = contract.totalSupply();
    const totalTokenRedeemed = contract.totalTokensRedeemed();
    const totalWeiRedeemed = contract.totalWeiRedeemed();
    const weiBalance = web3.eth.balance(contract.address);
    const blockNumber = web3.eth.blockNumber();
    const totalTokenExisted = totalSupply.add(totalTokenRedeemed);
    const totalWeiSupply = totalTokenExisted.mul(rate);
    const weiRemaining = totalWeiSupply.sub(totalWeiRedeemed);
    // calculate top up balance
    const topUpWei = web3.eth.balance(topUpAddresses[0])
    .plus(web3.eth.balance(topUpAddresses[1]))
    .plus(web3.eth.balance(topUpAddresses[2]))
    .plus(web3.eth.balance(topUpAddresses[3]));
    const topUpBalance = topUpWei.shift(-18).toFormat(4);
    // get each of the top up accounts
    // transform
    const active = activationBlock > 0 && activationBlock.lte(blockNumber);
    const etcRedeemed = totalWeiRedeemed.shift(-18).toFormat(4);
    const etcRemaining = weiRemaining.shift(-18).toFormat(4);
    const etcBalance = weiBalance.shift(-18).toFormat(4);
    const toppedUpPercent = weiRemaining.toNumber() ? weiBalance.div(weiRemaining).mul(100).toFormat(0) : 0;
    const topUpPercent = topUpWei.toNumber() < totalWeiSupply.toNumber() ? topUpWei.div(totalWeiSupply).mul(100).toFormat(0) : 100;
    const etcPercent = weiRemaining.toNumber() ? 100 - totalWeiRedeemed.div(totalWeiSupply).mul(100).toFormat(2) : 0;
    const currentBlock = web3.eth.blockNumber();
    return { currentBlock, rate, activationBlock, totalSupply, totalTokenRedeemed, totalWeiRedeemed, weiBalance, blockNumber, totalTokenExisted, totalWeiSupply, weiRemaining, topUpBalance, active, etcRedeemed, etcRemaining, etcPercent, etcBalance, toppedUpPercent, topUpPercent };
  }
  render() {
    const { contract, web3, network } = this.props;
    if (!contract || !web3 || this.state.loading) { return <Loader active inline />; }
    const data = this.getData();
    return (
      <Grid stackable columns={2}>
        <Grid.Column width={16}>
          <Container text textAlign="center">
            <Header>
              Digix ETC Redemption Contract
              <Header.Subheader>
                Redeem ETC by burning DGDR (
                  <a href="https://github.com/DigixGlobal/etc-redemption" rel="noopener noreferrer" target="_blank">more info</a>
                )
              </Header.Subheader>
            </Header>
            <Redeem {...{ network, contract, web3, data }} />
          </Container>
        </Grid.Column>
        <Grid.Column>
          <ContractStatus {...{ network, contract, web3, data, getStatus: this.getStatus }} />
        </Grid.Column>
        <Grid.Column>
          <AddressSearch {...{ contract, web3, data }} />
          <Divider hidden />
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
