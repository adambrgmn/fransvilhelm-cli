import React from 'react';
import { Box } from 'ink';
import figures from 'figures';
import {
  useTaskRunner,
  TaskDefinition,
  TaskState,
} from '../hooks/use-task-runner';
import { Spinner } from './Spinner';
import { Color } from 'ink';

interface Props {
  tasks: TaskDefinition[];
}

const Idle = () => <Box> </Box>;

const Pending = () => (
  <Box>
    <Spinner name="dots" />
  </Box>
);

const Resolved = () => (
  <Box>
    <Color green>{figures.tick}</Color>
  </Box>
);

const Rejected = () => (
  <Box>
    <Color red>{figures.cross}</Color>
  </Box>
);

const Tasks = ({ tasks }: Props) => {
  const state = useTaskRunner(tasks);

  return (
    <Box flexDirection="column">
      {state.tasks.map(task => (
        <Box key={task.id}>
          <Box marginRight={1}>
            {task.state === TaskState.IDLE && <Idle />}
            {task.state === TaskState.PENDING && <Pending />}
            {task.state === TaskState.RESOLVED && <Resolved />}
            {task.state === TaskState.REJECTED && <Rejected />}
          </Box>
          <Box marginRight={1}>
            <Color gray={task.state === TaskState.IDLE}>{task.name}</Color>
          </Box>
          {task.errorMessage && (
            <Box>
              <Color gray>({task.errorMessage})</Color>
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
};

export { Tasks };
