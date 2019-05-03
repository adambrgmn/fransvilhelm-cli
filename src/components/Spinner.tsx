import React, { useState } from 'react';
import spinners, { SpinnerName } from 'cli-spinners';
import { useInterval } from '@fransvilhelm/hooks';
import { Text } from 'ink';

interface Props {
  name: SpinnerName;
}

const Spinner = ({ name }: Props) => {
  const spinner = spinners[name];
  const [index, setIndex] = useState(0);

  useInterval(() => {
    const frameLength = spinner.frames.length;
    const nextIndex = (index + 1) % frameLength;
    setIndex(nextIndex);
  }, spinner.interval);

  return <Text>{spinner.frames[index]}</Text>;
};

export { Spinner };
