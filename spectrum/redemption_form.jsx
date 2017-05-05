import React, { PropTypes, Component } from 'react';
import { Form } from 'semantic-ui-react';

const AddressInput = require('@digix/spectrum/src/components/common/address_input').default;

export default class RedemptionForm extends Component {
  render() {
    const { formChange, formData } = this.props;
    return (
      <Form.Field>
        <AddressInput showQrScanner placeholder="e.g. `0x123...456`" label="To" name="to" {...{ formChange, formData }} />
      </Form.Field>
    );
  }
}

RedemptionForm.propTypes = {

};
