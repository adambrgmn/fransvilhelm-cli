import { useEffect, useRef, useContext, MutableRefObject } from 'react';
import { StdinContext } from 'ink';

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
