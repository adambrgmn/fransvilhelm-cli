import React from 'react';
import { Box, Text } from 'ink';
import figures from 'figures';

import { TaskInterpreter } from '../hooks/use-tasks';
import { Spinner } from './Spinner';

interface Props {
  tasks: TaskInterpreter[];
}

const Idle = () => <Text> </Text>;

const Pending = () => (
  <Box>
    <Spinner name="dots" />
  </Box>
);

const Resolved = () => (
  <Box>
    <Text color="green">{figures.tick}</Text>
  </Box>
);

const Rejected = () => (
  <Box>
    <Text color="red">{figures.cross}</Text>
  </Box>
);

const Tasks = ({ tasks }: Props) => {
  return (
    <Box flexDirection="column">
      <Box flexDirection="column">
        {tasks.map((task) => (
          <React.Fragment key={task.id}>
            <Box>
              <Box marginRight={1}>
                {task.state.matches('idle') && <Idle />}
                {task.state.matches('pending') && <Pending />}
                {task.state.matches('resolved') && <Resolved />}
                {task.state.matches('rejected') && <Rejected />}
              </Box>
              <Box>
                <Text color={task.state.matches('idle') ? 'gray' : undefined}>
                  {task.state.context.description}
                </Text>
              </Box>
            </Box>
            {task.state.matches('rejected') && (
              <Box paddingLeft={4} marginBottom={1}>
                <Text color="red">
                  <Text bold>!</Text>{' '}
                  {task.state.context.error ?? 'foo bar baz'}
                </Text>
              </Box>
            )}
          </React.Fragment>
        ))}
      </Box>
    </Box>
  );
};

export { Tasks };
