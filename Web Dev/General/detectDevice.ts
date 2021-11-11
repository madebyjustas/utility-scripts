// Types
interface Config {
  whitelist?: string[];
  blacklist?: string[];
}

interface Data {
  [key: string]: number;
}

// Data
const regexs = {
  mobile: /Mobile/,
  tv: /TV/,
  console: /PlayStation|PLAYSTATION|Xbox|Nintendo/
}


// Functions
function detectDevice(userAgent: string) {
  for (const regex in regexs) {
    if (regexs[regex].test(userAgent)) {
      return regex;
    }
  }
}

function processList(mode: string, result: string, listArr: string[]): string {
  const processModifiers = {
    whitelist() {
      if (listArr.includes(result)) return result;
    },
    blacklist() {
      if (!listArr.includes(result)) return result;
    }
  }

  return processModifiers[mode]();
}

// Exports
export default function main(userAgent: string, config: Config = { whitelist: [], blacklist: [] }) {
  const { whitelist, blacklist } = config;

  const initialDetection = detectDevice(userAgent) ?? 'other';
  let mode = '';
  let result: string;

  if (whitelist?.length) mode = 'whitelist';
  else if (blacklist?.length) mode = 'blacklist';

  result = mode ?
    (processList(mode, initialDetection, config[mode]) ?? 'other')
    : initialDetection;

  return result;
}

export function generateCounter() { // Device Connection Counter
  const data: Data = {}

  return {
    getData() {
      return data;
    },
    incrementData(device: string) {
      if (device in data) data[device]++;
      else data[device] = 1;
    }
  }
}

export function generateMiddleware() { // Express Middleware
  const { incrementData, getData } = generateCounter();

  return {
    detectDeviceMiddleware(req: any, _: any, next: any) {
      incrementData(
        main(req.get('user-agent'))
      );

      next();
    },
    getData
  }
}