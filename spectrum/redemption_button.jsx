import React, { PropTypes, Component } from 'react';
import { Form, Divider, Button, Label } from 'semantic-ui-react';

const CryptoPrice = require('@digix/spectrum/src/components/common/crypto_price').default;
const TransactionModal = require('@digix/spectrum/src/components/transactions/transaction_modal').default;
const AddressInput = require('@digix/spectrum/src/components/common/address_input').default;

export default class RedemptionButton extends Component {
  shouldComponentUpdate(nextProps) {
    const { defaultAddress: { address }, dgdrBalance } = this.props || {};
    const { defaultAddress: { address: newAddress }, dgdrBalance: newDgdrBalance } = nextProps;
    return address !== newAddress || dgdrBalance !== newDgdrBalance;
  }
  render() {
    const { web3, network, dgdrBalance, defaultAddress, etcBalance } = this.props;
    return (
      <div>
        {!!dgdrBalance && <Label size="large" basic color="green" content={`You have ${dgdrBalance} DGDR`} icon="checkmark" />}
        <Divider hidden />
        <TransactionModal
          {...{ web3, network }}
          header="ETC Redemption"
          data={{ from: defaultAddress.address, gas: 200000 }}
          handleTransaction={this.props.handleRedeem}
          onMined={this.props.handleMined}
          form={({ formChange, formData }) => {
            return (
              <Form.Field>
                <AddressInput
                  showQrScanner
                  placeholder="e.g. `0x123...456`"
                  label="Receipient"
                  name="recipient"
                  {...{ formChange, formData }}
                />
              </Form.Field>
            );
          }}
          trigger={!etcBalance ?
            <Button
              fluid
              disabled
              basic
              content="Selected account has no DGDR balance"
              size="huge"
              icon="frown"
            />
          :
            <Button
              fluid
              size="huge"
              color="red"
              content={`Redeem for ${etcBalance} ETC`}
              icon="smile"
              onClick={e => e.preventDefault()}
            />
          }
        />
        {!!etcBalance && <CryptoPrice textAlign="center" basic pointing size="large" symbol="ETC" amount={etcBalance} />}
      </div>
    );
  }
}

RedemptionButton.propTypes = {
  web3: PropTypes.object.isRequired,
  network: PropTypes.object.isRequired,
  dgdrBalance: PropTypes.object.isRequired,
  defaultAddress: PropTypes.object.isRequired,
  etcBalance: PropTypes.object.isRequired,
  handleRedeem: PropTypes.func.isRequired,
  handleMined: PropTypes.func.isRequired,
};
