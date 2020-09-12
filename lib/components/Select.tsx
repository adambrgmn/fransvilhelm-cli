import React, { useState, useEffect } from 'react';
import figures from 'figures';
import { Box, Text, useInput } from 'ink';

import { Choice } from './MultiSelect';
import { SelectFAQ, FaqItem } from './SelectFaq';

interface Props<C extends Choice> {
  choices: C[];
  message: string;
  onSelect: (choice: C) => void;
}

export const Select = <C extends Choice>({
  choices,
  message,
  onSelect,
}: Props<C>) => {
  const [index, setIndex] = useState(0);

  useInput((input, key) => {
    let nextIndex: number;
    switch (true) {
      case key.downArrow:
      case key.rightArrow:
        nextIndex = index + 1;
        return setIndex(nextIndex > choices.length - 1 ? 0 : nextIndex);
      case key.upArrow:
      case key.leftArrow:
        nextIndex = index - 1;
        return setIndex(nextIndex < 0 ? choices.length - 1 : nextIndex);
      case key.return:
        let choice = choices[index];
        return onSelect(choice);
      default:
        if (input.length === 1) {
          let idx = choices.findIndex(
            (item) => item.name.toLowerCase()[0] === input,
          );
          if (idx > -1) setIndex(idx);
        }
    }
  });

  useEffect(() => {
    if (index !== 0 && index > choices.length - 1) setIndex(choices.length - 1);
  }, [choices, index]);

  const faq: FaqItem[] = [
    ['Traverse:', 'Arrow keys'],
    ['Select:', '<space | enter>'],
    ['Search', 'Any charachter'],
  ];

  return (
    <Box flexDirection="column" width="100%">
      <Box marginBottom={1}>
        <Box marginRight={1}>
          <Text color="green">?</Text>
        </Box>
        <Box>
          <Text>{message}</Text>
        </Box>
      </Box>

      <Box marginBottom={1} flexDirection="column">
        {choices.map((choice, idx) => (
          <Box key={choice.name}>
            <Box marginRight={1} marginLeft={1}>
              <Text wrap="truncate">
                {idx === index ? figures.pointer : ' '}
              </Text>
            </Box>

            <Box>
              <Text color={idx === index ? 'green' : undefined}>
                {choice.name}{' '}
              </Text>
              {choice.description && (
                <Box>
                  <Text wrap="truncate" color="gray">
                    - {choice.description}
                  </Text>
                </Box>
              )}
            </Box>
          </Box>
        ))}
      </Box>

      <SelectFAQ faq={faq} />
    </Box>
  );
};
