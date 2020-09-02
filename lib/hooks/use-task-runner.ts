import { useReducer, useEffect } from 'react';
import { nanoid } from 'nanoid';
import { usePromise, AsyncState } from '@fransvilhelm/hooks';
import { allPass, clamp } from '../utils';

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
}

export enum Actions {
  SET_CURRENT_PENDING,
  SET_CURRENT_RESOLVED,
  SET_CURRENT_REJECTED,
}

export type Action =
  | { type: Actions.SET_CURRENT_PENDING }
  | { type: Actions.SET_CURRENT_RESOLVED }
  | { type: Actions.SET_CURRENT_REJECTED; payload: { message: string } };

export interface TaskError {
  task: Task;
  error: { message: string };
}

export interface State {
  tasks: Task[];
  errors: TaskError[];
  current: number;
}

const reducer = (state: State, action: Action) => {
  const maxCurrent = state.tasks.length - 1;
  const currentTask = state.tasks[state.current];

  const setTaskState = (id: string, nextState: TaskState): Task[] => {
    return state.tasks.map((task: Task) => {
      if (task.id === id && task.state !== nextState) {
        return { ...task, state: nextState };
      }

      return task;
    });
  };

  switch (action.type) {
    case Actions.SET_CURRENT_PENDING:
      return {
        ...state,
        tasks: setTaskState(currentTask.id, TaskState.PENDING),
      };

    case Actions.SET_CURRENT_RESOLVED:
      return {
        ...state,
        current: clamp(state.current + 1, 0, maxCurrent),
        tasks: setTaskState(currentTask.id, TaskState.RESOLVED),
      };

    case Actions.SET_CURRENT_REJECTED:
      return {
        ...state,
        current: clamp(state.current + 1, 0, maxCurrent),
        tasks: setTaskState(currentTask.id, TaskState.REJECTED),
        errors: [...state.errors, { task: currentTask, error: action.payload }],
      };

    default:
      return state;
  }
};

type OnDoneCallback = (tasks: Task[]) => void;

/**
 * `useTaskRunner` will run the actions of a set of tasks, defined as
 * `TaskDefinition`s, in serial and report the current state of the tasks.
 *
 * @param {TaskDefinition[]} taskDefinitions A set of tasks with name and action to run
 * @param {OnDoneCallback} onDone Callback fired once all tasks are settled (resolved or rejected)
 * @returns {State} The current state with tasks and index of current task being proccessed
 */
export const useTaskRunner = (
  taskDefinitions: TaskDefinition[],
  onDone: OnDoneCallback,
): State => {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    tasks: prepareTasks(taskDefinitions),
    errors: [],
    current: 0,
  }));

  const { tasks, current } = state;

  const { action: currentAction } = tasks[current];
  const [currentPromiseState, , error] = usePromise(currentAction, [
    currentAction,
  ]);

  useEffect(() => {
    switch (currentPromiseState) {
      case AsyncState.pending:
        return dispatch({ type: Actions.SET_CURRENT_PENDING });

      case AsyncState.fullfilled:
        return dispatch({ type: Actions.SET_CURRENT_RESOLVED });

      case AsyncState.rejected:
        return dispatch({ type: Actions.SET_CURRENT_REJECTED, payload: error });

      default:
    }
  }, [currentPromiseState, error]);

  useEffect(() => {
    const allSettled = allPass(
      tasks,
      (t) => t.state === TaskState.RESOLVED || t.state === TaskState.REJECTED,
    );

    if (allSettled) onDone(tasks);
  }, [tasks, onDone]);

  return state;
};

const prepareTasks = (tasks: TaskDefinition[]): Task[] => {
  return tasks.map((task) => ({
    id: nanoid(),
    state: TaskState.IDLE,
    ...task,
  }));
};
