import React, { PropTypes, Component } from 'react';

import AddressSearch from './address_search.jsx';

export default class Explore extends Component {
  render() {
    return (
      <div>
        <AddressSearch {...this.props} />
        <p>paginated table goes here</p>
      </div>
    );
  }
}

Explore.propTypes = {

};
