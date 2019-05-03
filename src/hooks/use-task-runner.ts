import { useReducer, useEffect, useCallback } from 'react';
import nanoid from 'nanoid';
import { useIsMounted } from '@fransvilhelm/hooks';

export enum TaskState {
  IDLE,
  PENDING,
  RESOLVED,
  REJECTED,
}

export interface TaskDefinition {
  name: string;
  description: string;
  action: () => Promise<void>;
}

export interface Task extends TaskDefinition {
  id: string;
  state: TaskState;
  errorMessage?: string;
}

export enum Actions {
  SET_PENDING,
  SET_RESOLVED,
  SET_REJECTED,
}

export type Action =
  | { type: Actions.SET_PENDING; payload: { id: string } }
  | { type: Actions.SET_RESOLVED; payload: { id: string } }
  | { type: Actions.SET_REJECTED; payload: { id: string; message: string } };

export interface State {
  tasks: Task[];
  current: number;
}

const reducer = (state: State, action: Action) => {
  switch (action.type) {
    case Actions.SET_PENDING:
      return {
        ...state,
        tasks: state.tasks.map(task => {
          if (task.id === action.payload.id) {
            return { ...task, state: TaskState.PENDING };
          }

          return task;
        }),
      };

    case Actions.SET_RESOLVED:
      return {
        ...state,
        current: state.current + 1,
        tasks: state.tasks.map(task => {
          if (task.id === action.payload.id) {
            return { ...task, state: TaskState.RESOLVED };
          }

          return task;
        }),
      };

    case Actions.SET_REJECTED:
      return {
        ...state,
        current: state.current + 1,
        tasks: state.tasks.map(task => {
          if (task.id === action.payload.id) {
            return {
              ...task,
              state: TaskState.REJECTED,
              errorMessage: action.payload.message,
            };
          }

          return task;
        }),
      };

    default:
      return state;
  }
};

export const useTaskRunner = (tasks: TaskDefinition[]): State => {
  const isMounted = useIsMounted();
  const [state, dispatch] = useReducer(reducer, {
    tasks: prepareTasks(tasks),
    current: 0,
  });

  const runNextTask = useCallback(async () => {
    const hasPendingTask =
      state.tasks.findIndex(t => t.state === TaskState.PENDING) > -1;

    if (hasPendingTask) return;

    const nextTaskIndex = state.current;
    const nextTask = state.tasks[nextTaskIndex];
    if (!nextTask) return;

    dispatch({ type: Actions.SET_PENDING, payload: nextTask });

    try {
      await nextTask.action();
      if (isMounted()) {
        dispatch({ type: Actions.SET_RESOLVED, payload: nextTask });
      }
    } catch (err) {
      if (isMounted()) {
        dispatch({
          type: Actions.SET_REJECTED,
          payload: { id: nextTask.id, message: err.message },
        });
      }
    }
  }, [state, isMounted]);

  useEffect(() => {
    runNextTask();
  }, [runNextTask]);

  return state;
};

const prepareTasks = (tasks: TaskDefinition[]): Task[] =>
  tasks.map(task => ({
    id: nanoid(),
    state: TaskState.IDLE,
    ...task,
  }));
