import React, { PropTypes, Component } from 'react';
import { Header, Segment, Table, Icon } from 'semantic-ui-react';
import { balances, toBlock } from '../scripts/data/balances-3670542-1494231029659.json';
import { minimumDgdWei } from '../scripts/helpers/config.json';

const PaginationMenu = require('@digix/spectrum/src/components/common/pagination_menu').default;

const ipfsLink = 'https://ipfs.infura.io/ipfs/QmYuPWEzBJKU37ZEQAsV7wtemv8sWzygfw6vBYdvetNrRL';

const items = Object.keys(balances).reduce((a, b) => {
  return a.concat([{ ...balances[b], address: b }]);
}, []).sort((a, b) => b.combined - a.combined);

export default class ExplorerTable extends Component {
  constructor(props) {
    super(props);
    this.state = { page: 0, pageSize: 10 };
    this.handleNavigate = this.handleNavigate.bind(this);
  }
  handleNavigate(dir) {
    this.setState({ page: this.state.page + dir });
  }
  render() {
    const { data } = this.props;
    const { page, pageSize } = this.state;
    const start = page * pageSize;
    const end = start + pageSize;
    return (
      <div>
        <Header>
          Snapshot Balances
          <Header.Subheader>
            DGD balances copied from block <a href={ipfsLink} target="_blank" >{toBlock}</a>
          </Header.Subheader>
        </Header>
        <Segment>
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Address</Table.HeaderCell>
                <Table.HeaderCell>DGDR</Table.HeaderCell>
                <Table.HeaderCell>ETC Equivalent</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {items.slice(start, end).map(item => (
                <Table.Row key={item.address}>
                  <Table.Cell style={{ maxWidth: '10em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.combined < minimumDgdWei && <Icon name="remove" color="red" />}
                    {item.contract && <Icon name="file text" color="blue" />}
                    {' '}{item.unclaimedDgdWei && <Icon name="clock" color="orange" />}
                    {' '}{item.address}
                  </Table.Cell>
                  <Table.Cell>{(item.combined / 1e9).toFixed(4)}</Table.Cell>
                  <Table.Cell>{((item.combined * data.rate) / 1e18).toFixed(4)}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
          <PaginationMenu
            fluid widths={3}
            currentPage={page}
            itemsPerPage={pageSize}
            total={items.length}
            handleNavigate={this.handleNavigate}
          />
        </Segment>
      </div>
    );
  }
}

ExplorerTable.propTypes = {
  data: PropTypes.object.isRequired,
};
