import { interpret } from 'xstate';
import { taskManagerMachine, Task, TaskManagerContext } from '../use-tasks';

const flushPromises = () => {
  return new Promise((res) => {
    setImmediate(res);
  });
};

const initService = (
  tasks: Task[],
  ctx: TaskManagerContext = { tasks: [], failOnRejected: false },
) => {
  let service = interpret(taskManagerMachine.withContext(ctx));
  service.start();

  for (let task of tasks) {
    // @ts-ignore
    service.send({ type: 'NEW_TASK', task });
  }

  return service;
};

it('resolves all tasks in sync', async () => {
  let tasks = [
    {
      name: 'Task 1',
      description: 'Task 1',
      action: () => Promise.resolve(),
    },
    {
      name: 'Task 2',
      description: 'Task 2',
      action: () => Promise.resolve(),
    },
    {
      name: 'Task 3',
      description: 'Task 3',
      action: () => Promise.resolve(),
    },
  ];
  let service = initService(tasks);

  expect(service.state.context.tasks).toHaveLength(3);

  for (let task of service.state.context.tasks) {
    expect(task.state.matches('idle')).toBeTruthy();
  }

  service.send('INIT');

  while (service.state.matches('pending')) {
    await flushPromises();
  }

  expect(
    service.state.context.tasks.filter((task) =>
      task.state.matches('resolved'),
    ),
  ).toHaveLength(3);

  service.stop();
});

it('manager will not fail if any task fails', async () => {
  let tasks = [
    {
      name: 'Task 1',
      description: 'Task 1',
      action: () => Promise.resolve(),
    },
    {
      name: 'Task 2',
      description: 'Task 2',
      action: () => Promise.reject(new Error('reject')),
    },
    {
      name: 'Task 3',
      description: 'Task 3',
      action: () => Promise.resolve(),
    },
  ];

  let service = initService(tasks);
  service.send('INIT');

  while (service.state.matches('pending')) {
    await flushPromises();
  }

  expect(
    service.state.context.tasks.filter((task) =>
      task.state.matches('resolved'),
    ),
  ).toHaveLength(2);

  expect(
    service.state.context.tasks.filter((task) =>
      task.state.matches('rejected'),
    ),
  ).toHaveLength(1);

  service.stop();
});

it('goes straight to "done" if no tasks are passed in', () => {
  let service = initService([]);
  service.send('INIT');
  expect(service.state.done).toBeTruthy();

  service.stop();
});

it('will skip all following tasks if failOnRejected is true', async () => {
  let tasks = [
    {
      name: 'Task 1',
      description: 'Task 1',
      action: () => Promise.resolve(),
    },
    {
      name: 'Task 2',
      description: 'Task 2',
      action: () => Promise.reject(new Error('reject')),
    },
    {
      name: 'Task 3',
      description: 'Task 3',
      action: () => Promise.resolve(),
    },
  ];

  let service = initService(tasks, { tasks: [], failOnRejected: true });
  service.send('INIT');

  while (service.state.matches('pending')) {
    await flushPromises();
  }

  expect(service.state.done).toBeTruthy();

  expect(
    service.state.context.tasks.filter((task) =>
      task.state.matches('resolved'),
    ),
  ).toHaveLength(1);

  expect(
    service.state.context.tasks.filter((task) =>
      task.state.matches('rejected'),
    ),
  ).toHaveLength(1);

  service.stop();
});
