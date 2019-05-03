import React from 'react';
import PropTypes from 'prop-types';
import { Text } from 'ink';

/// Hello world command
const Hello = ({ name }) => <Text>Hello, {name}!</Text>;

Hello.propTypes = {
  /// Name of the person to greet
  name: PropTypes.string,
};

Hello.defaultProps = {
  name: 'world',
};

export default Hello;
