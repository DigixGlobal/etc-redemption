import React, { PropTypes, Component } from 'react';
import { Table } from 'semantic-ui-react';
import TransactionItem from './transaction_item.jsx';

export default class MultisigTxList extends Component {
  componentDidMount() {
    const { contract } = this.props;
    contract.getTransactionCount.call(true, true).then(r => console.log(r));
    contract.getOwners.call();
  }
  render() {
    const { contract } = this.props;
    const txCount = contract.getTransactionCount(true, true);
    return (
      <div>
        <pre>
          <code>
            {`
    // button for new tx
    // list transactions
    // confirm transaction
    ${JSON.stringify({
      txCount,
      address: contract.address,
      owners: contract.getOwners(),
    }, null, 2)}
            `}
          </code>
        </pre>
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>ID</Table.HeaderCell>
              <Table.HeaderCell>Destination</Table.HeaderCell>
              <Table.HeaderCell>Value (wei)</Table.HeaderCell>
              <Table.HeaderCell>Data</Table.HeaderCell>
              <Table.HeaderCell>Executed</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {txCount && new Array(txCount.toNumber()).fill().map((n, i) => {
              return <TransactionItem key={i} index={i} {...this.props} />;
            })}
          </Table.Body>
        </Table>
      </div>
    );
  }
}

MultisigTxList.propTypes = {

};
