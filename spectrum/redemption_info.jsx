import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';
import { Form, Divider, Button, Label } from 'semantic-ui-react'


const { getDefaultAddress } = require('@digix/spectrum/src/selectors');
const CryptoPrice = require('@digix/spectrum/src/components/common/crypto_price').default;
const TransactionModal = require('@digix/spectrum/src/components/transactions/transaction_modal').default;
const AddressInput = require('@digix/spectrum/src/components/common/address_input').default;
const { isAddress } = require('@digix/spectrum/src/helpers/stringUtils');

class RedemptionInfo extends Component {
  constructor(props) {
    super(props);
    this.state = { address: '' };
    this.handleRedeem = this.handleRedeem.bind(this);
    this.handleMined = this.handleMined.bind(this);
  }
  componentDidMount() {
    this.getBalances();
  }
  componentWillReceiveProps({ defaultAddress: { address: nextAddress } }) {
    const { defaultAddress: { address } } = this.props;
    if (address && nextAddress && address !== nextAddress) {
      console.log('triggering');
      this.getBalances(nextAddress);
    }
  }
  getBalances(nextAddress) {
    const { contract, defaultAddress: { address } } = this.props;
    contract.balanceOf.call(nextAddress || address);
    contract.redeemedOf.call(nextAddress || address);
  }
  handleRedeem(data) {
    const { recipient, ...params } = data;
    const { contract } = this.props;
    if (!isAddress(recipient)) { throw new Error('You must enter recipient address'); }
    return contract.redeem.sendTransaction(recipient, { ...params, ui: { type: 'digixEtcRedemption' } });
  }
  handleMined(txInfo) {
    const { formData } = txInfo;
    this.getBalances(formData.recipient);
    this.getBalances(formData.from);
  }
  render() {
    const { web3, defaultAddress, data, contract, network } = this.props;
    if (!defaultAddress) { return <p>No addresses</p>; }
    const balanceOf = contract.balanceOf(defaultAddress.address);
    const redeemedOf = contract.redeemedOf(defaultAddress.address);
    const dgdrBalance = balanceOf && balanceOf.toNumber() && balanceOf.div(1e9).toFormat(2);
    const etcBalance = balanceOf && balanceOf.toNumber() && balanceOf.mul(data.rate).div(1e18).toFormat(2);
    const etcRedeemed = redeemedOf && redeemedOf.toNumber() && redeemedOf.mul(data.rate).div(1e18).toFormat(2);
    return (
      <Form>
        <Form.Field style={{ textAlign: 'center' }}>
          <Divider hidden />
          {etcBalance ?
            <div>
              <Label size="large" content={`You have ${dgdrBalance} DGDR`} />
              <Divider hidden />
              <TransactionModal
                {...{ web3, network }}
                header="ETC Redemption"
                data={{ from: defaultAddress.address, gas: 46571 * 1.5 }}
                handleTransaction={this.handleRedeem}
                onMined={this.handleMined}
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
                trigger={
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
              <CryptoPrice textAlign="center" basic pointing size="large" symbol="ETC" amount={etcBalance} />
            </div>
          :
            <Button
              fluid
              disabled
              content="Selected account has no balance"
              size="large"
              icon="frown"
            />
          }
          <Divider hidden />
          {!!etcRedeemed &&
            <Label content={`You have already redeeemd ${etcRedeemed} ETC`} size="large" />
          }
        </Form.Field>
      </Form>
    );
  }
}

RedemptionInfo.propTypes = {
  defaultAddress: PropTypes.object.isRequired,
  contract: PropTypes.object.isRequired,
  web3: PropTypes.object.isRequired,
  data: PropTypes.object.isRequired,
  network: PropTypes.object.isRequired,
};

export default connect(state => ({ defaultAddress: getDefaultAddress(state) }))(RedemptionInfo);
