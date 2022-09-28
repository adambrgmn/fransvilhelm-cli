import { Box, BoxProps, Text, TextProps } from 'ink';
import { useEffect, useState } from 'react';

const spinners = {
  dots: {
    interval: 80,
    frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  },
} as const;

type SpinnerName = keyof typeof spinners;

interface Props {
  spinner?: SpinnerName;
  interval?: number;
}

export const Spinner: React.FC<Props & TextProps> = ({ spinner = 'dots', interval, ...props }) => {
  let instance = spinners[spinner];
  let finalInterval = interval ?? instance.interval;
  let [frame, setFrame] = useState(0);

  useEffect(() => {
    let intervalId = setInterval(() => {
      setFrame((prev) => (prev + 1) % instance.frames.length);
    }, finalInterval);

    return () => clearInterval(intervalId);
  }, [finalInterval, instance.frames.length]);

  let char = instance.frames[frame];
  return <Text {...props}>{char}</Text>;
};

export const SpinnerBox: React.FC<Props & BoxProps> = ({ spinner, interval, ...props }) => {
  return (
    <Box {...props}>
      <Spinner spinner={spinner} interval={interval} />
    </Box>
  );
};
