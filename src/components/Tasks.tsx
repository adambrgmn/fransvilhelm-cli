import React from 'react';
import { Box } from 'ink';

export enum TaskState {
  WAITING,
  RUNNING,
  RESOLVED,
  REJECTED,
}

export interface TaskDefinition {
  name: string;
  description: string;
  action: () => Promise<void>;
}

export interface Task extends TaskDefinition {
  state: TaskState;
  errorMessage?: string;
}

interface Props {
  tasks: TaskDefinition;
}

const prepareTasks = (tasks: TaskDefinition[]): Task[] => {
  return tasks.map(task => ({ ...task, state: TaskState.WAITING }));
};

const Tasks = ({ tasks }: Props) => {
  return <Box />;
};

export { Tasks };
