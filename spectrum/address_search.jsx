import React, { PropTypes, Component } from 'react';

const AddressInput = require('@digix/spectrum/src/components/common/address_input').default;
const { isAddress } = require('@digix/spectrum/src/helpers/stringUtils');

export default class AddressSearch extends Component {
  constructor(props) {
    super(props);
    this.state = { address: '' };
    this.handleAddressChange = this.handleAddressChange.bind(this);
  }
  handleAddressChange({ target: { value: address } }) {
    this.setState({ valid: isAddress(address), address });
  }
  render() {
    const { valid, address } = this.state;
    // const { contract } = this.props;
    return (
      <div>
        <AddressInput placeholder="Enter address to check info" onChange={this.handleAddressChange} value={address} />
        {/* {valid && address && <UserInfo contract={contract} address={address} />} */}
      </div>
    );
  }
}

AddressSearch.propTypes = {
  contract: PropTypes.object.isRequired,
};
