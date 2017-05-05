import React, { PropTypes, Component } from 'react';

import RedemptionInfo from './redemption_info.jsx';

const DefaultAddressSelector = require('@digix/spectrum/src/components/common/default_address_selector').default;


export default class Redeem extends Component {
  render() {
    // if activation block is passed
    // if (!active) { return 'Contract is not active'; }
    return (
      <div>
        <DefaultAddressSelector />
        <RedemptionInfo {...this.props} />
      </div>
    );
  }
}

Redeem.propTypes = {
  contract: PropTypes.object.isRequired,
  web3: PropTypes.object.isRequired,
};
