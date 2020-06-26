import React, { useState, useEffect, useRef } from 'react';
import * as path from 'path';
import * as os from 'os';
import { promises as fs } from 'fs';
import { Box, Text, Color } from 'ink';
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
  const hasOpenedRef = useRef(false);

  let message = 'Select project';
  if (folder.replace(initialFolder, '')) {
    message +=
      ' (' + folder.replace(initialFolder, '').replace(/^\//, '') + ')';
  }

  useEffect(() => {
    if (selectedProject && !hasOpenedRef.current) {
      openProject(selectedProject).catch(() => {});
    }
  }, [selectedProject]);

  return (
    <Box flexDirection="column">
      {!selectedProject && (
        <Select
          key={folder}
          message={message}
          choices={folderContent.filter(item => item.type === 'directory')}
          onSelect={async choice => {
            if (
              choice.type === 'directory' &&
              (await isProject(choice.fullPath))
            ) {
              return setSelectedProject(choice);
            }

            if (choice.type === 'directory') {
              return setFolder(choice.fullPath);
            }
          }}
        />
      )}
      {selectedProject && (
        <Box flexDirection="column">
          <Text>
            Selected project{' '}
            <Color blue>
              {selectedProject.fullPath.replace(initialFolder + '/', '')}
            </Color>
          </Text>
          <Color grey>Projects full path added to clipboard</Color>
        </Box>
      )}
    </Box>
  );
};

export { Dev };
