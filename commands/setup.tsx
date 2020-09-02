import React, { useState } from 'react';
import { Box, useApp } from 'ink';
import { MultiSelect } from '../lib/components/MultiSelect';
import { Tasks } from '../lib/components/Tasks';
import { Spinner } from '../lib/components/Spinner';
import { TaskDefinition } from '../lib/hooks/use-task-runner';
import { packages, Package } from '../lib/utils/packages';
import { packagesToTasks } from '../lib/utils/packages-to-tasks';

enum States {
  SELECT,
  RUN_TASKS,
  LOADING,
}

/// Setup standard development environment
const Setup: React.FC = () => {
  const [state, setState] = useState(States.SELECT);
  const [tasks, setTasks] = useState<TaskDefinition[]>([]);
  const { exit } = useApp();

  return (
    <Box width={process.stdout.columns}>
      {state === States.SELECT && (
        <MultiSelect
          message="Select packages to setup and confirm with <enter>"
          choices={packages}
          onConfirm={async (choices: Package[]) => {
            setState(States.LOADING);
            setTasks(await packagesToTasks(choices));
            setState(States.RUN_TASKS);
          }}
        />
      )}
      {state === States.LOADING && <Spinner name="dots" />}
      {state === States.RUN_TASKS && (
        <Tasks tasks={tasks} onDone={() => exit()} />
      )}
    </Box>
  );
};

export default Setup;
