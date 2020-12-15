import React, { useState, useEffect, useMemo } from 'react';
import figures from 'figures';
import { Box, Text, useInput } from 'ink';
import { matchSorter } from 'match-sorter';

import { Choice } from './MultiSelect';
import { SelectFAQ, FaqItem } from './SelectFaq';

interface Props<C extends Choice> {
  choices: C[];
  message: string;
  onSelect: (choice: C) => void;
  onCancel?: () => void;
}

export const Select = <C extends Choice>({
  choices,
  message,
  onSelect,
  onCancel,
}: Props<C>) => {
  const [index, setIndex] = useState(0);
  const [search, setSearch] = useState('');

  const matchedChoices = useMemo(() => {
    if (search.length === 0) return choices;
    return matchSorter(choices, search, { keys: ['name'] });
  }, [choices, search]);

  let maxIndex = matchedChoices.length - 1;

  useInput((input, key) => {
    let nextIndex: number;
    switch (true) {
      case key.downArrow:
      case key.rightArrow:
        nextIndex = index + 1;
        return setIndex(nextIndex > maxIndex ? 0 : nextIndex);
      case key.upArrow:
      case key.leftArrow:
        nextIndex = index - 1;
        return setIndex(nextIndex < 0 ? maxIndex : nextIndex);
      case key.return:
        let choice = matchedChoices[index];
        return onSelect(choice);
      case key.backspace:
      case key.delete:
        if (search.length > 0) setSearch(search.slice(0, -1));
        else if (onCancel) onCancel();
        break;
      default:
        setSearch((s) => s + input.toLowerCase());
    }
  });

  useEffect(() => {
    setIndex((i) => Math.max(0, Math.min(i, maxIndex)));
  }, [maxIndex]);

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
          <Text color="gray"> {search}</Text>
        </Box>
      </Box>

      <Box marginBottom={1} flexDirection="column">
        {matchedChoices.map((choice, idx) => (
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
