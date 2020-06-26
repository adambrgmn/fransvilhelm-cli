import { useEffect, useRef, useContext, MutableRefObject } from 'react';
import { StdinContext } from 'ink';

export enum Keys {
  ARROW_UP = '\u001B[A',
  ARROW_DOWN = '\u001B[B',
  ARROW_RIGHT = '\u001b[C',
  ARROW_LEFT = '\u001b[D',
  ENTER = '\r',
  SPACE = ' ',
  A = 'a',
  D = 'd',
}

type Callback = (input: string) => void;

const useStdinInput = (callback: Callback): void => {
  const cb: MutableRefObject<Callback> = useRef(callback);
  const { stdin, setRawMode } = useContext(StdinContext);

  useEffect(() => {
    cb.current = callback;
  }, [callback]);

  useEffect(() => {
    const handler = (data: Buffer) => {
      const input = data.toString('utf-8');
      cb.current(input);
    };

    if (setRawMode) setRawMode(true);
    stdin.on('data', handler);

    return () => {
      stdin.off('data', handler);
      if (setRawMode) setRawMode(false);
    };
  }, [setRawMode, stdin]);
};

export { useStdinInput };
