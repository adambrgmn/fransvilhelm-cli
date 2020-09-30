import * as path from 'path';
import * as os from 'os';
import { promises as fs } from 'fs';

import React, { useState, useEffect } from 'react';
import { Box, Text, useApp } from 'ink';
import execa from 'execa';
import which from 'which';
import clipboard from 'clipboardy';

import { useFolderContent, FolderItem } from '../lib/hooks/use-folder-content';
import { Select } from '../lib/components/Select';

const isProject = async (folderPath: string): Promise<boolean> => {
  let content = await fs.readdir(folderPath);
  return content.includes('.git') || content.includes('package.json');
};

const openProject = async (project: FolderItem) => {
  let program = await which('code');
  await execa(program, [project.fullPath]);
  await clipboard.write('cd ' + project.fullPath);
};

let initialFolder = path.join(os.homedir(), '/Development');

/// Open dev projects
const Dev = () => {
  const [selectedProject, setSelectedProject] = useState<FolderItem>();
  const [folder, setFolder] = useState(initialFolder);
  const folderContent = useFolderContent(folder);
  const { exit } = useApp();

  let message = 'Select project';
  if (folder.replace(initialFolder, '')) {
    message += ' (' + folder.replace(initialFolder + '/', '') + ')';
  }

  useEffect(() => {
    if (selectedProject) {
      openProject(selectedProject)
        .then(() => exit())
        .catch((err) => exit(err));
    }
  }, [exit, selectedProject]);

  return (
    <Box flexDirection="column">
      {!selectedProject && (
        <Select
          key={folder}
          message={message}
          choices={folderContent.filter((item) => item.type === 'directory')}
          onSelect={async (choice) => {
            if (await isProject(choice.fullPath)) {
              return setSelectedProject(choice);
            }

            return setFolder(choice.fullPath);
          }}
          onCancel={() => {
            setFolder((current) => {
              if (current === initialFolder) return current;
              return path.dirname(current);
            });
          }}
        />
      )}
      {selectedProject && (
        <Box flexDirection="column">
          <Text>
            Selected project{' '}
            <Text color="blue">
              {selectedProject.fullPath.replace(initialFolder + '/', '')}
            </Text>
          </Text>
          <Text color="grey">Projects full path added to clipboard</Text>
        </Box>
      )}
    </Box>
  );
};

export default Dev;
