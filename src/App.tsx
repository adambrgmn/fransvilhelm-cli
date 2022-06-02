import * as os from 'node:os';
import * as path from 'node:path';

import { useMachine } from '@xstate/react';
import figure from 'figures';
import { Box, Text, useApp, useInput } from 'ink';
import { matchSorter } from 'match-sorter';
import React, { Suspense, useEffect, useLayoutEffect, useMemo, useState } from 'react';

import { SpinnerBox } from './components/Spinner';
import { machine } from './machine';
import { Project } from './types';
import { findProjects } from './utils/find-projects';
import { createSuspenseCache } from './utils/suspense-cache';

export const App: React.FC = () => {
  const [state, send] = useMachine(machine);
  const app = useApp();

  useEffect(() => {
    if (!state.done) return;
    if (state.matches('success')) return app.exit();

    let error = state.context.error instanceof Error ? state.context.error : new Error('Unknown error');
    return app.exit(error);
  }, [app, state]);

  return (
    <Suspense fallback={<SpinnerBox />}>
      {state.matches('select') ? <Projects onSelect={(project) => send({ type: 'SELECT', payload: project })} /> : null}
      {state.matches('acting') ? <SpinnerBox /> : null}
      {state.matches('success') ? <Success project={state.context.selected as Project} /> : null}
      {state.matches('error') ? <Failure error={state.context.error} /> : null}
    </Suspense>
  );
};

const Success: React.FC<{ project: Project }> = ({ project }) => {
  return (
    <Box>
      <Text>
        {figure.tick} Project "{project.name}" opened in editor
      </Text>
      <Text>
        {figure.tick} Project path copied to clipboard ({project.path})
      </Text>
    </Box>
  );
};

const Failure: React.FC<{ error: unknown }> = ({ error }) => {
  let message = error instanceof Error ? error.message : 'Unknown error';

  return (
    <Box>
      <Box>
        <Text>An error occured while opening the project</Text>
      </Box>
      <Box>
        <Text>{message}</Text>
      </Box>
      <Box>
        <Text>{(error as any).toString()}</Text>
      </Box>
    </Box>
  );
};

interface ProjectsProps {
  onSelect: (project: Project) => void;
}

const projectsCache = createSuspenseCache((key: string) => findProjects([key]));

const Projects: React.FC<ProjectsProps> = ({ onSelect }) => {
  let projects = projectsCache.read(path.join(os.homedir(), 'Developer'));

  let [filter, setFilter] = useState('');

  let selectableItems = useMemo(() => {
    let p = projects.map<SelectListItem>((project) => {
      let parent = path.basename(path.dirname(project.path));
      return {
        value: project.path,
        label: (current) => (
          <Box key={project.path}>
            <Text color="gray">{parent}/</Text>
            <Text color={current ? 'green' : 'white'}>{project.name}</Text>
          </Box>
        ),
      };
    });

    if (filter === '') return p;
    return matchSorter(p, filter, { keys: ['value'] });
  }, [filter, projects]);

  return (
    <Box flexDirection="column">
      <Box>
        <Box paddingRight={1}>
          <Text>Filter:</Text>
        </Box>
        <Input value={filter} onChange={setFilter} />
      </Box>
      <SelectList
        items={selectableItems}
        onSelect={(value) => {
          let project = projects.find((p) => p.path === value);
          if (project != null) onSelect(project);
        }}
      />
    </Box>
  );
};

interface SelectListItem {
  value: string;
  label: (current: boolean) => React.ReactNode;
}

interface SelectListProps {
  items: SelectListItem[];
  onSelect: (value: string) => void;
}

const SelectList: React.FC<SelectListProps> = ({ items, onSelect }) => {
  let [index, setIndex] = useState(0);

  useInput((_, key) => {
    if (key.downArrow) {
      setIndex((index + 1) % items.length);
    }

    if (key.upArrow) {
      setIndex((index + items.length - 1) % items.length);
    }

    if (key.return) {
      onSelect(items[index].value);
    }
  });

  useLayoutEffect(() => {
    if (index >= items.length) setIndex(items.length - 1);
  }, [index, items.length]);

  return (
    <Box flexDirection="column">
      {items.map((item, i) => {
        let current = i === index;
        return (
          <Box key={item.value} flexDirection="row">
            <Box paddingX={1}>
              <Text color="green">{current ? figure.arrowRight : ' '}</Text>
            </Box>
            <Box>{item.label(current)}</Box>
          </Box>
        );
      })}
    </Box>
  );
};

interface InputProps {
  value: string;
  onChange: (value: string) => void;
}

const Input: React.FC<InputProps> = ({ value, onChange }) => {
  useInput((input, key) => {
    if (input.match(/^[a-zA-Z0-9]$/)) {
      onChange(value + input);
    }

    if (key.backspace || key.delete) {
      onChange(value.slice(0, -1));
    }
  });

  return (
    <Box>
      <Text>{value}_</Text>
    </Box>
  );
};
