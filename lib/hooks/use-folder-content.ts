import { promises as fs } from 'fs';
import * as path from 'path';
import { useState, useEffect } from 'react';
import { useIsMounted } from '@fransvilhelm/hooks';

export interface FolderItem {
  name: string;
  fullPath: string;
  type: 'directory' | 'file';
}

export const useFolderContent = (absolutePath: string): FolderItem[] => {
  const [items, setItems] = useState<FolderItem[]>([]);
  const isMounted = useIsMounted();

  useEffect(() => {
    (async () => {
      let content = await fs.readdir(absolutePath);
      let nextItems: FolderItem[] = [];

      for (let item of content) {
        if (item.includes('.DS_Store')) continue;
        let fullPath = path.join(absolutePath, item);
        let stat = await fs.stat(fullPath);
        nextItems.push({
          fullPath,
          name: item,
          type: stat.isDirectory() ? 'directory' : 'file',
        });
      }

      if (isMounted())
        setItems(
          nextItems.sort((a, b) =>
            a.name.toLowerCase() > b.name.toLowerCase()
              ? 1
              : a.name.toLowerCase() < b.name.toLowerCase()
              ? -1
              : 0,
          ),
        );
    })();
  }, [absolutePath, isMounted]);

  return items;
};
