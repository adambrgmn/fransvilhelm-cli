import { extractGithubRepo } from '../';

describe('utils.extractGithubRepo', () => {
  it('extracts github repo properly', () => {
    expect(
      extractGithubRepo('git@github.com:adambrgmn/fransvilhelm-cli.git'),
    ).toEqual({
      user: 'adambrgmn',
      repo: 'fransvilhelm-cli',
    });

    expect(
      extractGithubRepo('https://github.com/adambrgmn/fransvilhelm-cli.git'),
    ).toEqual({
      user: 'adambrgmn',
      repo: 'fransvilhelm-cli',
    });

    expect(
      extractGithubRepo('https://github.com/adam_brgmn/fransvilhelm_cli.git'),
    ).toEqual({
      user: 'adam_brgmn',
      repo: 'fransvilhelm_cli',
    });
  });
});
