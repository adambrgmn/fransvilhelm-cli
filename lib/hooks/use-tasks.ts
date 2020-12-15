import {
  createMachine,
  assign,
  DoneInvokeEvent,
  spawn,
  Interpreter,
  send,
  sendParent,
} from 'xstate';
import { useMachine } from '@xstate/react';

export type Task = {
  name: string;
  description: string;
  action: () => Promise<any>;
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

export type TaskInterpreter = Interpreter<
  TaskContext,
  any,
  TaskEvent,
  TaskState
>;

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
      rejected: { type: 'final', entry: sendParent('REJECTED') },
      resolved: { type: 'final', entry: sendParent('RESOLVED') },
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

export type TaskManagerContext = {
  tasks: TaskInterpreter[];
  failOnRejected: boolean;
};

type TaskManagerEvent =
  | { type: 'NEW_TASK'; task: Task }
  | { type: 'INIT' }
  | { type: 'RESOLVED' }
  | { type: 'REJECTED' };

type TaskManagerState =
  | {
      value: 'idle';
      context: { tasks: TaskInterpreter[]; failOnRejected: boolean };
    }
  | {
      value: 'pending';
      context: { tasks: TaskInterpreter[]; failOnRejected: boolean };
    }
  | {
      value: 'done';
      context: { tasks: TaskInterpreter[]; failOnRejected: boolean };
    };

const defaultContext: TaskManagerContext = {
  tasks: [],
  failOnRejected: false,
};

const initChild = send<TaskManagerContext, any, any>(
  { type: 'INIT' },
  {
    // @ts-ignore
    to: (context) =>
      context.tasks.find((task) =>
        task.state.matches('idle'),
      ) as TaskInterpreter,
  },
);

export const taskManagerMachine = createMachine<
  TaskManagerContext,
  TaskManagerEvent,
  TaskManagerState
>(
  {
    id: 'task-manager',
    initial: 'idle',
    strict: true,
    context: defaultContext,
    states: {
      idle: {
        on: {
          NEW_TASK: {
            actions: assign({
              // @ts-ignore
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
        entry: initChild,
        on: {
          RESOLVED: [
            {
              cond: 'hasIdleTask',
              actions: initChild,
            },
            { target: 'done' },
          ],
          REJECTED: [
            {
              cond: 'failOnRejected',
              target: 'done',
            },
            {
              cond: 'hasIdleTask',
              actions: initChild,
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
      failOnRejected: (context) => context.failOnRejected,
    },
  },
);

export function useTasks(ctx?: Partial<TaskManagerContext>) {
  return useMachine(
    taskManagerMachine.withContext({ ...defaultContext, ...ctx }),
  );
}
