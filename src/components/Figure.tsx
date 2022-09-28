import { Text, TextProps } from 'ink';

const figures = {
  arrowRight: '→',
  cross: '✖',
  tick: '✔',
  empty: ' ',
} as const;

export interface FigureProps {
  i: keyof typeof figures;
}

export const Figure: React.FC<FigureProps & TextProps> = ({ i, children, ...textProps }) => {
  return <Text {...textProps}>{figures[i]}</Text>;
};
