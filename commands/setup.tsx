import React from 'react';
import { Box } from 'ink';
import { MultiSelect } from '../lib/components/MultiSelect';
import { Tasks } from '../lib/components/Tasks';
import { packages } from '../lib/utils/packages/available-packages';
import { packagesToTasks } from '../lib/utils/packages/packages-to-tasks';
import { useTasks } from '../lib/hooks/use-tasks';

/// Setup standard development environment
const Setup: React.FC = () => {
  const [state, send] = useTasks();

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

export default Setup;
