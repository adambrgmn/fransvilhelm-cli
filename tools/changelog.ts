import githubChangelogFunctions from '@changesets/changelog-github';
import { getInfo } from '@changesets/get-github-info';

const changelogFunctions: typeof githubChangelogFunctions = {
  ...githubChangelogFunctions,
  getReleaseLine: async (changeset, _, options) => {
    if (!options || !options.repo) {
      throw new Error(
        'Please provide a repo to this changelog generator like this:\n"changelog": ["@changesets/changelog-github", { "repo": "org/repo" }]',
      );
    }
    const [firstLine, ...futureLines] = changeset.summary
      .split('\n')
      .map((l) => l.trimRight());

    if (changeset.commit) {
      let { links } = await getInfo({
        repo: options.repo,
        commit: changeset.commit,
      });

      let { pull, commit, user } = links;
      let init = `- ${firstLine} (by ${user ?? '(unknown)'} in ${
        pull ?? commit
      })`;
      let rest = futureLines.map((l) => `  ${l}`).join('\n');
      return `\n\n${init}\n${rest}`;
    } else {
      return `\n\n- ${firstLine}\n${futureLines
        .map((l) => `  ${l}`)
        .join('\n')}`;
    }
  },
};

export default changelogFunctions;
