const { packageEnginesSearch } = require('../lib/ebi');

// NOTE: Assumes you have `GITHUB_PERSONAL_ACCESS_TOKEN` environment variable set
const { GITHUB_PERSONAL_ACCESS_TOKEN } = process.env;

const repos = [
	'Financial-Times/ebi',
	'Financial-Times/tako',
	'Financial-Times/not-found-error'
];

const resultsSummary = results =>
	results.map(({ type, repository }) => `${type}: ${repository}`);

async function packageEnginesResults() {
	const { getResults } = await packageEnginesSearch({
		token: GITHUB_PERSONAL_ACCESS_TOKEN,
		search: 'node'
	})(repos);

	const {
		allResults,
		searchMatches,
		searchNoMatches,
		searchErrors
	} = await getResults();

	console.log(
		'packageEnginesSearch: searchMatches',
		resultsSummary(searchMatches)
	);
	console.log(
		'packageEnginesSearch: searchNoMatches',
		resultsSummary(searchNoMatches)
	);
	console.log(
		'packageEnginesSearch: searchErrors',
		resultsSummary(searchErrors)
	);
	console.log('packageEnginesSearch: allResults', resultsSummary(allResults));
}

async function packageEnginesResultsAsync() {
	const { resultsAsync } = await packageEnginesSearch({
		token: GITHUB_PERSONAL_ACCESS_TOKEN,
		search: 'node'
	})(repos);

	const allResults = await Promise.all(
		resultsAsync.map(promise => {
			return promise.catch(e => e);
		})
	);

	console.log(
		'packageEnginesSearchAsync: allResults',
		resultsSummary(allResults)
	);
}

packageEnginesResults();
packageEnginesResultsAsync();
