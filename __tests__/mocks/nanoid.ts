/**
 * Mock for nanoid ESM-only module
 * Used in integration tests to avoid ESM import issues
 */

let counter = 0;

export function nanoid(size = 21): string {
  counter++;
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  // Generate a unique ID with the requested size
  const base = `${timestamp}-${counter}-${random}`;
  return base.substring(0, size).padEnd(size, '0');
}

export const customAlphabet = (alphabet: string, defaultSize = 21) => {
  return (size = defaultSize) => {
    counter++;
    let result = '';
    for (let i = 0; i < size; i++) {
      result += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return result;
  };
};

export const urlAlphabet = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict';
