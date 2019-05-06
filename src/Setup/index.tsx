import React, { useState } from 'react';
import { Box } from 'ink';
import { packages, Package } from './packages';
import { MultiSelect } from '../components/MultiSelect';
import { Tasks } from '../components/Tasks';
import { TaskDefinition } from '../hooks/use-task-runner';
import { packagesToTasks } from './packages-to-tasks';

enum States {
  SELECT,
  RUN_TASKS,
}

const Setup = () => {
  const [state, setState] = useState(States.SELECT);
  const [tasks, setTasks] = useState<TaskDefinition[]>([]);

  return (
    <Box width={process.stdout.columns}>
      {state === States.SELECT && (
        <MultiSelect
          message="Select packages to setup and confirm with <enter>"
          choices={packages}
          onConfirm={async (choices: Package[]) => {
            setTasks(await packagesToTasks(choices));
            setState(States.RUN_TASKS);
          }}
        />
      )}
      {state === States.RUN_TASKS && <Tasks tasks={tasks} onDone={() => {}} />}
    </Box>
  );
};

export { Setup };
