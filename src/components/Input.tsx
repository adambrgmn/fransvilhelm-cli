import { Box, Text, useInput } from 'ink';
import React from 'react';

interface InputProps {
  label: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
}

export const Input: React.FC<InputProps> = ({ label, value, onChange }) => {
  useInput((input, key) => {
    if (input.match(/^[a-zA-Z0-9]$/)) {
      onChange(value + input);
    }

    if (key.backspace || key.delete) {
      onChange(value.slice(0, -1));
    }
  });

  let l = typeof label === 'string' || typeof label === 'number' ? <Text>{label}</Text> : label;

  return (
    <Box>
      <Box paddingRight={1}>{l}</Box>
      <Box>
        <Text>{value}_</Text>
      </Box>
    </Box>
  );
};
