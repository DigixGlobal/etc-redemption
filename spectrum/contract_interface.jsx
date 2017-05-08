import React, { PropTypes, Component } from 'react';
import { Divider, Container, Grid, Header, Loader } from 'semantic-ui-react';

import Redeem from './redeem.jsx';
import ContractStatus from './contract_status.jsx';
import ExplorerTable from './explorer_table.jsx';
import AddressSearch from './address_search.jsx';

export default class ContractInterface extends Component {
  constructor(props) {
    super(props);
    this.state = {};
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
    const { contract, web3 } = this.props;
    const poll = () => {
      this.getStatus().then(() => {
        this.updated = true;
        if (!this.unmounted) {
          this.timeout = setTimeout(poll, 1000 * 4);
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
          // TODO this is made up! actually get the multisig address
          const multiSigBalance = totalWeiSupply.sub(weiBalance);
          const active = activationBlock > 0 && activationBlock.lte(blockNumber);
          const etcRedeemed = totalWeiRedeemed.shift(-18).toFormat(4);
          const etcRemaining = weiRemaining.shift(-18).toFormat(4);
          const etcPercent = 100 - totalTokenRedeemed.div(totalTokenExisted).mul(100).toFormat(2);
          const etcBalance = weiBalance.shift(-18).toFormat(4);
          const topUpPercent = weiBalance.div(weiRemaining).mul(100).toFormat(0);
          const multiSigEtc = multiSigBalance.shift(-18).toFormat(4);
          const multiSigPercent = multiSigBalance.div(weiRemaining).mul(100).toFormat(0);
          this.setState({ data: {
            rate,
            activationBlock,
            totalSupply,
            totalTokenRedeemed,
            totalWeiRedeemed,
            weiBalance,
            blockNumber,
            totalTokenExisted,
            totalWeiSupply,
            weiRemaining,
            multiSigBalance,
            active,
            etcRedeemed,
            etcRemaining,
            etcPercent,
            etcBalance,
            topUpPercent,
            multiSigEtc,
            multiSigPercent,
          } });
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
    const { data } = this.state;
    if (!contract || !web3 || !data) { return <Loader active inline />; }
    return (
      <Grid stackable columns={2}>
        <Grid.Column width={16}>
          <Container text textAlign="center">
            <Header
              content="DRY RUN Digix ETC Redemption Contract"
              subheader="Test contract on ETC chain with lowered withdraw rate"
            />
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
