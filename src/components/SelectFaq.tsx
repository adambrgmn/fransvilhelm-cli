import React from 'react';
import { Box, Color } from 'ink';

export type FaqItem = [string, string];

interface Props {
  faq: FaqItem[];
}

export const SelectFAQ: React.FC<Props> = ({ faq }) => {
  const faqPadding = Math.max(...faq.map(([key]) => key.length));
  return (
    <Box flexDirection="column">
      {faq.map(([key, value]) => (
        <Box marginLeft={1} key={key}>
          <Color gray>
            <Box minWidth={faqPadding} marginRight={1}>
              {key}
            </Box>
            <Box>{value}</Box>
          </Color>
        </Box>
      ))}
    </Box>
  );
};
