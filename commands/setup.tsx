import React, { useState } from 'react';
import { Box } from 'ink';
import { MultiSelect } from '../lib/components/MultiSelect';
import { Tasks } from '../lib/components/Tasks';
import { Spinner } from '../lib/components/Spinner';
import { packages, Package } from '../lib/utils/packages';
import { packagesToTasks } from '../lib/utils/packages-to-tasks';
import { useTasks } from '../lib/hooks/use-tasks';

enum States {
  SELECT,
  RUN_TASKS,
  LOADING,
}

/// Setup standard development environment
const Setup: React.FC = () => {
  const [state, setState] = useState(States.SELECT);
  const { addTask, runTasks, tasks } = useTasks();

  return (
    <Box width={process.stdout.columns}>
      {state === States.SELECT && (
        <MultiSelect
          message="Select packages to setup and confirm with <enter>"
          choices={packages}
          onConfirm={async (choices: Package[]) => {
            setState(States.LOADING);
            let newTasks = await packagesToTasks(choices);
            for (let task of newTasks) addTask(task);
            runTasks();
            setState(States.RUN_TASKS);
          }}
        />
      )}
      {state === States.LOADING && <Spinner name="dots" />}
      {state === States.RUN_TASKS && <Tasks tasks={tasks} />}
    </Box>
  );
};

export default Setup;
