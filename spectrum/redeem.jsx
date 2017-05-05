import React, { PropTypes, Component } from 'react';
import { Segment, Header, Divider } from 'semantic-ui-react';

import RedemptionInfo from './redemption_info.jsx';

const DefaultAddressSelector = require('@digix/spectrum/src/components/common/default_address_selector').default;
const KeystoreButtons = require('@digix/spectrum/src/components/keystores/keystore_buttons').default;


export default class Redeem extends Component {
  render() {
    // if activation block is passed
    // if (!active) { return 'Contract is not active'; }
    return (
      <div>
        {/* <AccountsModal content="Manage Accounts" icon="key" /> */}
        <DefaultAddressSelector
          {...{ fluid: false, button: false, inline: true, labeled: false }}
          preText="Selected account:"
          renderNoAccounts={() => (
            <div>
              <Divider hidden />
              <Header
                as="h3"
                content="No Keystores Added"
                subheader="Create or Import an Address to Begin"
              />
              <KeystoreButtons size="large" />
            </div>
          )}
        />
        <Divider hidden />
        <RedemptionInfo {...this.props} />
      </div>
    );
  }
}

Redeem.propTypes = { };
