import clipboardy from 'clipboardy';
import { execa } from 'execa';
import { assign, createMachine } from 'xstate';

import { Project } from './types';

interface Context {
  selected: Project | null;
  error: unknown | null;
}

type Events = { type: 'SELECT'; payload: Project };

export const machine = createMachine(
  {
    context: { selected: null, error: null },
    tsTypes: {} as import('./machine.typegen').Typegen0,
    schema: { context: {} as Context, events: {} as Events },
    id: 'fransvilhelm',
    initial: 'select',
    states: {
      select: {
        on: {
          SELECT: {
            actions: 'setSelected',
            target: 'acting',
          },
        },
      },
      acting: {
        invoke: {
          src: 'handleSelected',
          id: 'act',
          onDone: [{ target: 'success' }],
          onError: [{ target: 'error' }],
        },
      },
      success: {
        type: 'final',
      },
      error: {
        entry: 'setError',
        type: 'final',
      },
    },
  },
  {
    actions: {
      setSelected: assign({
        selected: (_, event) => event.payload,
      }),
      setError: assign({
        error: (_, event) => event.data,
      }),
    },
    services: {
      handleSelected: async (_, event) => {
        let project = event.payload;
        await execa('code', [project.path]);
        await clipboardy.write(project.path);
      },
    },
  },
);
