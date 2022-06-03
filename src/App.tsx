import * as os from 'node:os';
import * as path from 'node:path';

import clipboardy from 'clipboardy';
import { execa } from 'execa';
import figure from 'figures';
import { Box, Text, useApp, useInput } from 'ink';
import { matchSorter } from 'match-sorter';
import React, { Fragment, useLayoutEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider, useMutation, useQuery } from 'react-query';

import { SpinnerBox } from './components/Spinner';
import { Project } from './types';
import { findProjects } from './utils/find-projects';

const ROOTS = [path.join(os.homedir(), 'Developer')];

export const App: React.FC = () => {
  const app = useApp();
  const mutation = useMutation(
    async (project: Project) => {
      await execa(process.env.EDITOR ?? 'code', [project.path]);
      await clipboardy.write(project.path);
      return project;
    },
    {
      onSuccess: () => {
        setTimeout(() => app.exit());
      },
      onError: (error) => {
        setTimeout(() => app.exit(error instanceof Error ? error : new Error('Unknown error')));
      },
    },
  );

  return (
    <Fragment>
      {mutation.status === 'idle' ? <Projects roots={ROOTS} onSelect={mutation.mutate} /> : null}
      {mutation.status === 'loading' ? <SpinnerBox /> : null}
      {mutation.status === 'success' ? <Success project={mutation.data} /> : null}
      {mutation.status === 'error' ? <Failure error={mutation.error} /> : null}
    </Fragment>
  );
};

const queryClient = new QueryClient();
export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

const Success: React.FC<{ project: Project }> = ({ project }) => {
  return (
    <Box flexDirection="column" paddingLeft={1}>
      <Text>
        <Text color="green">{figure.tick}</Text> Project <Text color="blue">{project.name}</Text> opened in editor
      </Text>
      <Text>
        <Text color="green">{figure.tick}</Text> Project path copied to clipboard:
        <Text color="blue"> {project.path.replace(os.homedir(), '~')}</Text>
      </Text>
    </Box>
  );
};

const Failure: React.FC<{ error: unknown }> = ({ error }) => {
  let message = error instanceof Error ? error.message : 'Unknown error';

  return (
    <Box flexDirection="column">
      <Box>
        <Text color="gray">
          <Text color="red">{figure.cross}</Text> An error occured while opening the project
        </Text>
      </Box>
      <Box marginBottom={1}>
        <Text color="red">{message}</Text>
      </Box>
      <Box>
        <Text color="gray">{JSON.stringify(error, null, 2)}</Text>
      </Box>
    </Box>
  );
};

interface ProjectsProps {
  roots: string[];
  onSelect: (project: Project) => void;
}

const Projects: React.FC<ProjectsProps> = ({ roots, onSelect }) => {
  let [filter, setFilter] = useState('');
  let query = useQuery(['projects', ...roots], () => findProjects(roots));

  let selectableItems = useMemo(() => {
    if (query.status !== 'success') return [];

    let projects = query.data.map<SelectListItem>((project) => {
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

    if (filter === '') return projects;
    return matchSorter(projects, filter, { keys: ['value'] });
  }, [filter, query]);

  if (query.status === 'loading') return <SpinnerBox />;

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
          let project = query.data?.find((p) => p.path === value);
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
