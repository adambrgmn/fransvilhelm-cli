import React from 'react';
import { Box, Color, Text } from 'ink';
import figures from 'figures';
import {
  useTaskRunner,
  Task,
  TaskDefinition,
  TaskState,
} from '../hooks/use-task-runner';
import { Spinner } from './Spinner';

interface Props {
  tasks: TaskDefinition[];
  onDone: (tasks: Task[]) => void;
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

const Tasks = ({ tasks, onDone }: Props) => {
  const state = useTaskRunner(tasks, onDone);

  return (
    <Box flexDirection="column">
      <Box flexDirection="column">
        {state.tasks.map((task) => (
          <Box key={task.id}>
            <Box marginRight={1}>
              {task.state === TaskState.IDLE && <Idle />}
              {task.state === TaskState.PENDING && <Pending />}
              {task.state === TaskState.RESOLVED && <Resolved />}
              {task.state === TaskState.REJECTED && <Rejected />}
            </Box>
            <Box>
              <Color gray={task.state === TaskState.IDLE}>{task.name}</Color>
            </Box>
          </Box>
        ))}
      </Box>
      <Box flexDirection="column" marginTop={1}>
        {state.errors.length > 0 && (
          <Box>
            <Rejected /> <Text bold>Errors:</Text>
          </Box>
        )}
        {state.errors.map(({ task, error }) => (
          <Box key={task.id}>
            <Box marginLeft={2} marginRight={1}>
              {task.name}:
            </Box>
            <Box>
              <Color red>{error.message}</Color>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export { Tasks };
