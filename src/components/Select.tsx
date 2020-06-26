import React, { useState, useEffect } from 'react';
import figures from 'figures';
import { Choice } from './MultiSelect';
import { Box, Color } from 'ink';
import { SelectFAQ, FaqItem } from './SelectFaq';
import { useStdinInput, Keys } from '../hooks/use-stdin-input';

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

  useStdinInput(key => {
    let nextIndex: number;
    switch (key) {
      case Keys.ARROW_DOWN:
      case Keys.ARROW_RIGHT:
        nextIndex = index + 1;
        return setIndex(nextIndex > choices.length - 1 ? 0 : nextIndex);
      case Keys.ARROW_UP:
      case Keys.ARROW_LEFT:
        nextIndex = index - 1;
        return setIndex(nextIndex < 0 ? choices.length - 1 : nextIndex);
      case Keys.ENTER:
      case Keys.SPACE:
        let choice = choices[index];
        return onSelect(choice);
      default:
        if (key.length === 1) {
          let idx = choices.findIndex(
            item => item.name.toLowerCase()[0] === key,
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
          <Color green>?</Color>
        </Box>
        <Box>{message}</Box>
      </Box>

      <Box marginBottom={1} flexDirection="column">
        {choices.map((choice, idx) => (
          <Box key={choice.name} textWrap="truncate">
            <Box marginRight={1} marginLeft={1}>
              {idx === index ? figures.pointer : ' '}
            </Box>

            <Box>
              <Color green={idx === index}>{choice.name} </Color>
              {choice.description && (
                <Box textWrap="truncate">
                  <Color gray>- {choice.description}</Color>
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
