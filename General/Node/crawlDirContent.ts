// |==== Type Declarations ====|

// Interfaces
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

// Union Types
type StrOrFileArr = string[] | FileObject[];

type StrOrStrArr = string | string[];

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

function filterTemplate(
  data: StrOrStrArr,
  singleFn: (array: FileObject[]) => StrOrFileArr,
  manyFn: (array: FileObject[]) => StrOrFileArr,
  array: FileObject[]
) {
  let result: StrOrFileArr = array;

  if (typeof data === 'string') {
    result = singleFn(array);
  } else if (Array.isArray(data) && data.length) {
    result = manyFn(array);
  }

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
export function filterByExt(exts: StrOrStrArr) {
  return filterTemplate.bind(null, exts, (array: FileObject[]) => {
    return array.filter((obj) =>
      obj.ext === exts
    );
  }, (array: FileObject[]) => {
    let result = [];

    (exts as string[]).forEach((ext) => {
      result = [
        ...result,
        ...array.filter((obj) => obj.ext === ext)
      ];
    });

    return result;
  });
}

export function showOnly(keys: StrOrStrArr) {
  return filterTemplate.bind(null, keys, (array: FileObject[]) => {
    return array.map((obj) => obj[keys]);
  }, (array: FileObject[]) => {
    return array.map((obj) => {
      const result = {};

      (keys as string[]).forEach((key) => result[key] = obj[key]);

      return result;
    });
  });
}