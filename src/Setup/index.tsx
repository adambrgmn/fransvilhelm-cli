import React, { useState } from 'react';
import { Box } from 'ink';
import { packages, Package } from './packages';
import { MultiSelect } from '../components/MultiSelect';

enum States {
  SELECT,
  RUN_TASKS,
}

const Setup = () => {
  const [state, setState] = useState(States.SELECT);
  const [selected, setSelected] = useState<Package[]>([]);

  return (
    <Box width={process.stdout.columns}>
      {state === States.SELECT && (
        <MultiSelect
          message="Select packages to setup and confirm with <enter>"
          choices={packages}
          onConfirm={(choices: Package[]) => {
            setSelected(choices);
            setState(States.RUN_TASKS);
          }}
        />
      )}
      {state === States.RUN_TASKS}
    </Box>
  );
};

export { Setup };
