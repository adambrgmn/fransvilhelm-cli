import {
  createMachine,
  assign,
  DoneInvokeEvent,
  spawn,
  Interpreter,
  send,
  sendParent,
  State,
} from 'xstate';
import { useMachine } from '@xstate/react';
import { useCallback } from 'react';

export type Task = {
  name: string;
  description: string;
  action: () => Promise<any>;
};

type TaskSchema = {
  states: {
    idle: {};
    pending: {};
    rejected: {};
    resolved: {};
  };
};

type TaskEvent = { type: 'INIT' };

interface TaskContext {
  description: string;
  error?: string;
}

type TaskState =
  | { value: 'idle'; context: { description: string } }
  | { value: 'pending'; context: { description: string } }
  | { value: 'rejected'; context: { description: string; error: string } }
  | { value: 'resolved'; context: { description: string } };

export type TaskInterpreter = Interpreter<TaskContext, TaskSchema, TaskEvent>;

export const taskMachine = createMachine<TaskContext, TaskEvent, TaskState>(
  {
    id: 'task',
    initial: 'idle',
    strict: true,
    states: {
      idle: { on: { INIT: 'pending' } },
      pending: {
        invoke: {
          id: 'runTask',
          src: 'runTask',
          onDone: 'resolved',
          onError: {
            target: 'rejected',
            actions: assign({
              error: (_, event: DoneInvokeEvent<Error>) => {
                return event.data.message;
              },
            }),
          },
        },
      },
      rejected: { type: 'final', entry: sendParent('DONE') },
      resolved: { type: 'final', entry: sendParent('DONE') },
    },
  },
  {
    services: {
      runTask: async () => {
        throw new Error('No task action defined');
      },
    },
  },
);

type TaskManagerContext = {
  tasks: TaskInterpreter[];
};

type TaskManagerEvent =
  | { type: 'NEW_TASK'; task: Task }
  | { type: 'INIT' }
  | { type: 'DONE' };

type TaskManagerState =
  | {
      value: 'idle';
      context: { tasks: TaskInterpreter[] };
    }
  | {
      value: 'pending';
      context: { tasks: TaskInterpreter[] };
    }
  | {
      value: 'done';
      context: { tasks: TaskInterpreter[] };
    };

export const taskManagerMachine = createMachine<
  TaskManagerContext,
  TaskManagerEvent,
  TaskManagerState
>(
  {
    id: 'task-manager',
    initial: 'idle',
    strict: true,
    context: {
      tasks: [],
    },
    states: {
      idle: {
        on: {
          NEW_TASK: {
            actions: assign({
              tasks: (context, event) => [
                ...context.tasks,
                spawn(
                  taskMachine.withContext(event.task).withConfig({
                    services: { runTask: event.task.action },
                  }),
                ),
              ],
            }),
          },
          INIT: [
            { cond: 'hasIdleTask', target: 'pending' },
            { target: 'done' },
          ],
        },
      },
      pending: {
        entry: send(
          { type: 'INIT' },
          {
            // @ts-ignore
            to: (context) =>
              context.tasks.find((task) =>
                task.state.matches('idle'),
              ) as TaskInterpreter,
          },
        ),
        on: {
          DONE: [
            {
              cond: 'hasIdleTask',
              internal: true,
              actions: send(
                { type: 'INIT' },
                {
                  // @ts-ignore
                  to: (context) =>
                    context.tasks.find((task) =>
                      task.state.matches('idle'),
                    ) as TaskInterpreter,
                },
              ),
            },
            { target: 'done' },
          ],
        },
      },
      done: { type: 'final' },
    },
  },
  {
    guards: {
      hasIdleTask: (context) => {
        return (
          context.tasks.findIndex((task) => task.state.matches('idle')) > -1
        );
      },
    },
  },
);

export function useTasks() {
  return useMachine(taskManagerMachine);
}
