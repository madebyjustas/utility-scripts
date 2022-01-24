// Exports
export default function splitByCap(str: string): string[] {
  let words: any[] = [], word = -1;

  if ((/^[^A-Z]/).test(str)) {
    words.push([]);
    word++;
  }

  for (const char of str) {
    if ((/[A-Z]/).test(char)) {
      words.push([]);
      word++;
    }

    words[word].push(char);
  }

  words = words.map((wordArr: string[]) => wordArr.join(''));

  return words;
}