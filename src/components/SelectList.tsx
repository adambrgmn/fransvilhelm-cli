import { Box, useInput } from 'ink';
import { useState } from 'react';

import { Figure } from './Figure';

export interface SelectListItem {
  value: string;
  label: (current: boolean) => React.ReactNode;
}
interface SelectListProps {
  items: SelectListItem[];
  onSelect: (value: string) => void;
}
export const SelectList: React.FC<SelectListProps> = ({ items, onSelect }) => {
  let [index, setIndex] = useState(0);

  if (index >= items.length) {
    setIndex(items.length - 1);
  }

  useInput((_, key) => {
    if (key.downArrow) {
      setIndex((index + 1) % items.length);
    }

    if (key.upArrow) {
      setIndex((index + items.length - 1) % items.length);
    }

    if (key.return) {
      onSelect(items[index].value);
    }
  });

  return (
    <Box flexDirection="column">
      {items.map((item, i) => {
        let current = i === index;
        return (
          <Box key={item.value} flexDirection="row">
            <Box paddingX={1}>
              <Figure i={current ? 'arrowRight' : 'empty'} color="green" />
            </Box>
            <Box>{item.label(current)}</Box>
          </Box>
        );
      })}
    </Box>
  );
};
