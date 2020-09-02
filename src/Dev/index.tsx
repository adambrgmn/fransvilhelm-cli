import React, { useState, useEffect } from 'react';
import * as path from 'path';
import * as os from 'os';
import { promises as fs } from 'fs';
import { Box, Text } from 'ink';
import execa from 'execa';
import which from 'which';
import clipboard from 'clipboardy';
import { useFolderContent, FolderItem } from '../hooks/useFolderContent';
import { Select } from '../components/Select';

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

const Dev: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<FolderItem>();
  const [folder, setFolder] = useState(initialFolder);
  const folderContent = useFolderContent(folder);

  let message = 'Select project';
  if (folder.replace(initialFolder, '')) {
    message +=
      ' (' + folder.replace(initialFolder, '').replace(/^\//, '') + ')';
  }

  useEffect(() => {
    if (selectedProject) {
      openProject(selectedProject).catch(() => {});
    }
  }, [selectedProject]);

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

export { Dev };
