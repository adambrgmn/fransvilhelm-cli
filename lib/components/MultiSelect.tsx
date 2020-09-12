import React, { useReducer, Reducer } from 'react';
import { Box, Text, useInput } from 'ink';
import figures from 'figures';

import { SelectFAQ, FaqItem } from './SelectFaq';

export interface Choice {
  name: string;
  description?: string;
}

interface State<C extends Choice> {
  choices: C[];
  selected: C[];
  current: number;
}

enum Actions {
  ADD_CHOICE,
  REMOVE_CHOICE,
  ADD_ALL,
  REMOVE_ALL,
  TRAVERSE_UP,
  TRAVERSE_DOWN,
}

type Action<C extends Choice> =
  | { type: Actions.ADD_CHOICE; payload: { choice: C } }
  | { type: Actions.REMOVE_CHOICE; payload: { choice: C } }
  | { type: Actions.ADD_ALL }
  | { type: Actions.REMOVE_ALL }
  | { type: Actions.TRAVERSE_UP }
  | { type: Actions.TRAVERSE_DOWN };

const reducer = <C extends Choice>(
  state: State<C>,
  action: Action<C>,
): State<C> => {
  switch (action.type) {
    case Actions.ADD_CHOICE:
      return {
        ...state,
        selected: [...state.selected, action.payload.choice],
      };

    case Actions.REMOVE_CHOICE:
      return {
        ...state,
        selected: state.selected.filter(
          (p) => p.name !== action.payload.choice.name,
        ),
      };

    case Actions.ADD_ALL:
      return {
        ...state,
        selected: state.choices,
      };

    case Actions.REMOVE_ALL:
      return {
        ...state,
        selected: [],
      };

    case Actions.TRAVERSE_UP:
      const nextCurrent =
        state.current - 1 < 0 ? state.choices.length - 1 : state.current - 1;
      return {
        ...state,
        current: nextCurrent,
      };

    case Actions.TRAVERSE_DOWN:
      return {
        ...state,
        current: (state.current + 1) % state.choices.length,
      };
    default:
      return state;
  }
};

const useMultiSelect = <C extends Choice>({
  choices,
  onConfirm,
}: {
  choices: C[];
  onConfirm: (selected: C[]) => void;
}) => {
  const [state, dispatch] = useReducer<Reducer<State<C>, Action<C>>>(reducer, {
    choices,
    selected: [],
    current: 0,
  });

  useInput((input, key) => {
    switch (true) {
      case key.downArrow:
      case key.rightArrow:
        return dispatch({ type: Actions.TRAVERSE_DOWN });

      case key.upArrow:
      case key.leftArrow:
        return dispatch({ type: Actions.TRAVERSE_UP });

      case key.return:
        return onConfirm(state.selected);
      default:
    }

    switch (input.toLowerCase()) {
      case 'a':
        return dispatch({ type: Actions.ADD_ALL });

      case 'd':
        return dispatch({ type: Actions.REMOVE_ALL });

      case ' ':
        const currentChoice = state.choices[state.current];
        const isSelected =
          state.selected.findIndex((sc) => sc.name === currentChoice.name) > -1;

        if (isSelected) {
          return dispatch({
            type: Actions.REMOVE_CHOICE,
            payload: { choice: currentChoice },
          });
        } else {
          return dispatch({
            type: Actions.ADD_CHOICE,
            payload: { choice: currentChoice },
          });
        }
    }
  });

  return state;
};

interface Props<C> {
  message: string;
  choices: C[];
  onConfirm: (selected: C[]) => void;
}

const MultiSelect = <C extends Choice>({
  message,
  choices,
  onConfirm,
}: Props<C>) => {
  const state = useMultiSelect({ choices, onConfirm });
  const faq: FaqItem[] = [
    ['Traverse:', 'Arrow keys'],
    ['Select:', '<space>'],
    ['Confirm:', '<enter>'],
    ['Select all:', '<a>'],
    ['Deselect all:', '<d>'],
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
        {state.choices.map((choice: Choice, i) => {
          const current = state.current === i;
          const selected =
            state.selected.findIndex((sp) => sp.name === choice.name) > -1;

          return (
            <Box key={choice.name}>
              <Box marginRight={1} marginLeft={1}>
                <Text wrap="truncate">{current ? figures.pointer : ' '}</Text>
              </Box>

              <Box marginRight={2}>
                <Text wrap="truncate" color={selected ? 'green' : undefined}>
                  {selected ? figures.circleFilled : figures.circle}
                </Text>
              </Box>

              <Box>
                <Text>{choice.name} </Text>
                <Box>
                  <Text wrap="truncate" color="gray">
                    - {choice.description}
                  </Text>
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>

      <SelectFAQ faq={faq} />
    </Box>
  );
};

export { MultiSelect };
