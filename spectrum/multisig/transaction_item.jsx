import React, { PropTypes, Component } from 'react';
import { Table, Icon } from 'semantic-ui-react';

export default class TransactionItem extends Component {
  componentDidMount() {
    // get this tx id
    this.props.contract.transactions.call(this.props.index);
  }
  render() {
    const { destination, value, data, executed } = this.props.contract.transactions(this.props.index) || {};
    return (
      <Table.Row>
        <Table.Cell>{this.props.index}</Table.Cell>
        <Table.Cell>{destination}</Table.Cell>
        <Table.Cell>{value && value.toNumber()}</Table.Cell>
        <Table.Cell>{data}</Table.Cell>
        <Table.Cell><Icon name={executed ? 'checkmark' : 'remove'} /></Table.Cell>
      </Table.Row>
    );
  }
}

TransactionItem.propTypes = {
  index: PropTypes.number,
  contract: PropTypes.object.isRequired,
};
