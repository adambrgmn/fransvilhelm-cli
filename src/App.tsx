import * as os from 'node:os';
import * as path from 'node:path';

import figure from 'figures';
import { Box, Text, useInput } from 'ink';
import { matchSorter } from 'match-sorter';
import React, { Suspense, useLayoutEffect, useMemo, useState } from 'react';

import { SpinnerBox } from './components/Spinner';
import { findProjects } from './utils/find-projects';
import { createSuspenseCache } from './utils/suspense-cache';

export const App: React.FC = () => {
  return (
    <Suspense fallback={<SpinnerBox />}>
      <Projects />
    </Suspense>
  );
};

const projectsCache = createSuspenseCache((key: string) => findProjects([key]));

const Projects: React.FC = () => {
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
      <SelectList items={selectableItems} onSelect={() => {}} />
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
