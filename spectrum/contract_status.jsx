import React, { PropTypes, Component } from 'react';
import { Segment, Table, Message, Icon, Progress } from 'semantic-ui-react';

const Advanced = require('@digix/spectrum/src/components/common/advanced').default;

export default class ContractStatus extends Component {
  renderStatus() {
    const { data: { active, activationBlock, blockNumber } } = this.props;
    if (active) {
      return (
        <Message
          positive
          header="Contract is now active"
          content="Redemptions and transfers are allowed"
          icon="calendar check"
        />
      );
    }
    if (activationBlock > 0) {
      const blocksToGo = activationBlock.sub(blockNumber);
      const estimatedTime = blocksToGo.mul(4).div(60).toFormat(0);
      return (
        <Message
          warning
          header={`Contract activates on block ${activationBlock.toFormat(0)}`}
          content={`You will be able to redeem in ${blocksToGo} blocks (about ${estimatedTime} minutes)`}
          icon="calendar times"
        />
      );
    }
    return (
      <Message
        negative
        header="Activation block not set"
        content="Contract is in maintenance mode"
        icon="wrench"
      />
    );
  }
  render() {
    const { data } = this.props;
    return (
      <Segment>
        {this.renderStatus()}
        <Progress progress percent={data.etcPercent} color="green">
          {data.etcRemaining} ETC remaining ({data.etcRedeemed} claimed)
        </Progress>
        <Progress progress percent={data.topUpPercent} color="orange">
          {data.etcBalance} ETC hot balance remaining <a href="#"><Icon name="info circle" /></a>
        </Progress>
        <Progress progress percent={data.multiSigPercent} color="blue">
          {data.multiSigEtc} ETC cold balance remaining <a href="#"><Icon name="info circle" /></a>
        </Progress>
        {/* TODO calculator input box */}

        <Table>
          <Table.Body>
            <Table.Row>
              <Table.Cell>Activation Block</Table.Cell>
              <Table.Cell>{data.activationBlock.toFormat(0)}</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>Total DGDR created</Table.Cell>
              <Table.Cell>{data.totalTokenExisted.div(1e9).toNumber()}</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>ETC balance</Table.Cell>
              <Table.Cell>{data.weiBalance.div(1e18).toNumber()}</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>ETC to be distributed (incl. redeemed)</Table.Cell>
              <Table.Cell>{data.totalTokenExisted.mul(data.rate).div(1e18).toFormat(2)}</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>DGDR redeemed</Table.Cell>
              <Table.Cell>{data.totalTokenRedeemed.div(1e9).toNumber()}</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>ETC funded (balance + redeeemed)</Table.Cell>
              <Table.Cell>{data.totalWeiRedeemed.add(data.weiBalance).div(1e18).toFormat(2)}</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>Exchange Rate</Table.Cell>
              <Table.Cell>1 DGDR = {data.rate.mul(1e9).div(1e18).toNumber()} ETC</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>Exchange Rate (wei per DGDR / 1e9)</Table.Cell>
              <Table.Cell>{data.rate.toFormat(0)}</Table.Cell>
            </Table.Row>
          </Table.Body>
          {/* TODO Cold Storage */}
        </Table>
        <Advanced title="JSON">
          <pre><code>
            {JSON.stringify(data, null, 2)}
          </code></pre>
        </Advanced>
      </Segment>
    );
  }
}

ContractStatus.propTypes = {
  contract: PropTypes.object.isRequired,
  web3: PropTypes.object.isRequired,
  data: PropTypes.object.isRequired,
};
