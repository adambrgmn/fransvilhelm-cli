import { execa } from 'execa';

export const write = async (input: string) => execa('pbcopy', { input });
