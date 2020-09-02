import React from 'react';
import PropTypes from 'prop-types';
import { Box } from 'ink';
import { MultiSelect } from '../lib/components/MultiSelect';
import { Tasks } from '../lib/components/Tasks';
import { packages } from '../lib/utils/packages/available-packages';
import { packagesToTasks } from '../lib/utils/packages/packages-to-tasks';
import { useTasks } from '../lib/hooks/use-tasks';

interface Props {
  failOnRejected?: boolean;
}

/// Setup standard development environment
const Setup = ({ failOnRejected = true }: Props) => {
  const [state, send] = useTasks({ failOnRejected });

  return (
    <Box width="100%">
      {state.matches('idle') && (
        <MultiSelect
          message="Select packages to setup and confirm with <enter>"
          choices={packages}
          onConfirm={async (choices) => {
            let newTasks = packagesToTasks(choices);
            for (let task of newTasks) send({ type: 'NEW_TASK', task });
            send({ type: 'INIT' });
          }}
        />
      )}
      {(state.matches('pending') || state.matches('done')) && (
        <Tasks tasks={state.context.tasks} />
      )}
    </Box>
  );
};

Setup.propTypes = {
  /// Fail on first rejected task
  failOnRejected: PropTypes.bool,
};

Setup.defaultProps = {
  failOnRejected: true,
};

export default Setup;
