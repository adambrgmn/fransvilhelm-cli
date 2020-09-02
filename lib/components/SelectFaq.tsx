import React from 'react';
import { Box, Text } from 'ink';

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
          <Box minWidth={faqPadding} marginRight={1}>
            <Text color="gray">{key}</Text>
          </Box>
          <Box>
            <Text color="gray">{value}</Text>
          </Box>
        </Box>
      ))}
    </Box>
  );
};
