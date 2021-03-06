const { Octokit } = require('@octokit/rest');
const { throttling } = require('@octokit/plugin-throttling');
const OctokitInstance = Octokit.plugin(throttling);

const getContents = ({ filepath, githubToken }) => {
	const octokit = new OctokitInstance({
		auth: `token ${githubToken}`,
		throttle: {
			onRateLimit: (retryAfter, options) => {
				if (options.request.retryCount === 0) {
					// only retries once
					return true;
				}
			},
			onAbuseLimit: (retryAfter, options) => {
				throw new Error(
					`Abuse detected for request ${options.method} ${
						options.url
					}`
				);
			}
		}
	});

	return async repository => {
		const owner = repository.split('/')[0];
		const repo = repository.split('/')[1];

		try {
			const repoData = await octokit.repos.getContent({
				owner,
				repo,
				path: filepath
			});

			// deal with case where path leads to a directory rather than a file
			if (repoData.data.path !== filepath) {
				throw new Error(
					`Incorrect value provided for <file>; '${filepath}' is not a file path`
				);
			} else {
				const decodedContent = Buffer.from(
					repoData.data.content,
					'base64'
				).toString('utf8');
				return decodedContent;
			}
		} catch (error) {
			if (error.status === 404) {
				throw new Error(
					`404 ERROR: file '${filepath}' not found in '${repository}'`
				);
			} else {
				throw error;
			}
		}
	};
};

module.exports = getContents;
