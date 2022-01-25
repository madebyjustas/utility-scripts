// Type Declarations
interface Config {
  includeExt?: boolean;
  includeDirname?: boolean;
}

interface FileObject {
  path?: string;
  filename?: string;
  ext?: string | undefined | null;
  isDirectory?: boolean;
}

interface TempContent {
  directories: FileObject[];
  files: FileObject[];
}

// Node API Imports
import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Type Imports
import { Dirent } from 'fs';

// Variable Declarations
const __dirname = dirname(fileURLToPath(import.meta.url));

// Utils
function format(startingPath: string, file: Dirent, includeExt = false): FileObject {
  const result: FileObject = {
    path: join(startingPath, file.name),
    filename: file.name,
  }

  if (includeExt) {
    result.ext = (/\b\.\b/).test(file.name)
      ? file.name.split('.').at(-1) : null;
  }

  result.isDirectory = file.isDirectory();

  return result;
}

// |==== Exports ====|

// Main
export default async function crawlDirContent(path: string, config: Config) {
  const {
    includeExt = false, includeDirname = false
  } = config;
  const result: FileObject[] = [];
  const pathArgs = [path];

  if (includeDirname) pathArgs.unshift(__dirname);

  async function crawler(startingPath: string) {
    const directoryContent = await readdir(startingPath, { withFileTypes: true });
    const { directories, files }: TempContent = { directories: [], files: [] };

    for (const item of directoryContent) {
      const formated = format(startingPath, item, includeExt);

      if (item.isDirectory()) directories.push(formated);
      else files.push(formated);
    }

    for (const file of files) result.push(file);

    for (const directory of directories) {
      result.push(directory);
      await crawler(directory.path);
    }
  }

  await crawler(join(...pathArgs));

  return result;
}

// Filters
export function filterByExt(...exts: string[]) {
  return function(array: FileObject[]) {
    if (!exts.length) return array;

    const regex = new RegExp(`^(?:${exts.join('|')})$`);

    return array.filter((obj) => regex.test(obj.ext));
  }
}

export function showOnly(...keys: string[]) {
  return function(array: FileObject[]) {
    if (!keys.length) return array;

    if (keys.length === 1) {
      return array.map(obj => obj[keys[0]]);
    }

    return array.map((obj) => {
      const result = {};

      keys.forEach((key) => result[key] = obj[key]);

      return result;
    });
  }
}