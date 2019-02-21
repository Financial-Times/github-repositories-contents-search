const nock = require('nock');

const createStandardInput = require('../helpers/create-standard-input');
const { base64EncodeObj } = require('../helpers/base64');
const packageEnginesCommand = require('../../src/commands/package_engines');
const repo = 'Financial-Times/next-front-page';

describe('package:engines command handler', () => {
	let standardInput;
	const packageEnginesHandler = packageEnginesCommand.handler;

	beforeEach(() => {
		standardInput = createStandardInput(repo);
		nockScope = nock('https://api.github.com/repos');
		// NB comment out this spy on console.error if you want to see errors during your tests
		jest.spyOn(console, 'error')
			.mockImplementation()
			.mockName('console.error');
		jest.spyOn(console, 'log')
			.mockImplementation()
			.mockName('console.log');
	});

	afterEach(() => {
		nock.cleanAll();
		jest.resetAllMocks();
		standardInput.teardown();
	});

	test('repository not found', async () => {
		const invalidRepo = 'Financial-Times/invalid';
		standardInput = createStandardInput(invalidRepo);
		nockScope.get(`/${invalidRepo}/contents/package.json`).reply(404, {
			message: 'Not Found'
		});
		await packageEnginesHandler();
		expect(console.error).toBeCalledWith(
			expect.stringContaining('404 ERROR')
		);
	});

	test('engines in package.json, logs repository and version', async () => {
		nockScope.get(`/${repo}/contents/package.json`).reply(200, {
			type: 'file',
			content: base64EncodeObj({
				engines: {
					node: '~10.15.0'
				}
			}),
			path: 'package.json'
		});
		await packageEnginesHandler();

		expect(console.log).toBeCalledWith(
			expect.stringContaining('Financial-Times/next-front-page')
		);
		expect(console.log).toBeCalledWith(expect.stringContaining('~10.15.0'));
	});

	test('multiple engines in package.json, logs repositories and versions', async () => {
		nockScope.get(`/${repo}/contents/package.json`).reply(200, {
			type: 'file',
			content: base64EncodeObj({
				engines: {
					node: '~10.15.0',
					npm: '6.8.0'
				}
			}),
			path: 'package.json'
		});
		await packageEnginesHandler();

		expect(console.log).toBeCalledWith(
			expect.stringContaining('Financial-Times/next-front-page')
		);
		expect(console.log).toBeCalledWith(
			expect.stringContaining('node@~10.15.0')
		);
		expect(console.log).toBeCalledWith(
			expect.stringContaining('npm@6.8.0')
		);
	});

	test('search specific engine in package.json, only logs that repository and version', async () => {
		nockScope.get(`/${repo}/contents/package.json`).reply(200, {
			type: 'file',
			content: base64EncodeObj({
				engines: {
					node: '~10.15.0',
					npm: '6.8.0'
				}
			}),
			path: 'package.json'
		});
		await packageEnginesHandler({
			search: 'node'
		});

		expect(console.log).toBeCalledWith(
			expect.stringContaining('Financial-Times/next-front-page')
		);
		expect(console.log).toBeCalledWith(
			expect.stringContaining('node@~10.15.0')
		);
		expect(console.log).not.toBeCalledWith(
			expect.stringContaining('npm@6.8.0')
		);
	});

	test('search specific engine in package.json, only shows repos that match', async () => {
		nockScope.get(`/${repo}/contents/package.json`).reply(200, {
			type: 'file',
			content: base64EncodeObj({
				engines: {
					node: '~10.15.0',
					npm: '6.8.0'
				}
			}),
			path: 'package.json'
		});
		await packageEnginesHandler({
			search: '8.0.0'
		});

		expect(console.log).not.toBeCalledWith(
			expect.stringContaining('Financial-Times/next-front-page')
		);
	});

	test('search specific version number in package.json, only logs that repository and version', async () => {
		nockScope.get(`/${repo}/contents/package.json`).reply(200, {
			type: 'file',
			content: base64EncodeObj({
				engines: {
					node: '~10.15.0',
					npm: '6.8.0'
				}
			}),
			path: 'package.json'
		});
		await packageEnginesHandler({
			search: '6.8.0'
		});

		expect(console.log).toBeCalledWith(
			expect.stringContaining('Financial-Times/next-front-page')
		);
		expect(console.log).not.toBeCalledWith(
			expect.stringContaining('node@~10.15.0')
		);
		expect(console.log).toBeCalledWith(
			expect.stringContaining('npm@6.8.0')
		);
	});

	test('engines value not found in package.json', async () => {
		nockScope.get(`/${repo}/contents/package.json`).reply(200, {
			type: 'file',
			content: base64EncodeObj({}),
			path: 'package.json'
		});
		await packageEnginesHandler();
		expect(console.log).not.toBeCalled();
	});

	test('when 3 repos are tested and a limit of 2 is specified, only 2 repos are logged', async () => {
		const repositories = [
			'Financial-Times/next-front-page',
			'Financial-Times/next-signup',
			'Financial-Times/n-gage'
		];
		const repositoriesForStdIn = repositories.join('\n');
		standardInput = createStandardInput(repositoriesForStdIn);
		repositories.forEach(repo => {
			nockScope.get(`/${repo}/contents/package.json`).reply(200, {
				type: 'file',
				content: base64EncodeObj({
					engines: {
						node: '~10.15.0'
					}
				}),
				path: 'package.json'
			});
		});
		await packageEnginesHandler({
			limit: 2
		});
		expect(console.log).toHaveBeenCalledTimes(2);
	});

	test('when 2 repos are tested and a limit of 2 is specified, 2 repos are logged', async () => {
		const repositories = [
			'Financial-Times/next-front-page',
			'Financial-Times/next-signup'
		];
		const repositoriesForStdIn = repositories.join('\n');
		standardInput = createStandardInput(repositoriesForStdIn);
		repositories.forEach(repo => {
			nockScope.get(`/${repo}/contents/package.json`).reply(200, {
				type: 'file',
				content: base64EncodeObj({
					engines: {
						node: '~10.15.0'
					}
				}),
				path: 'package.json'
			});
		});
		await packageEnginesHandler({
			limit: 2
		});
		expect(console.log).toHaveBeenCalledTimes(2);
	});

	test('when 1 repos is tested and a limit of 2 is specified, 1 repo is logged', async () => {
		nockScope.get(`/${repo}/contents/package.json`).reply(200, {
			type: 'file',
			content: base64EncodeObj({
				engines: {
					node: '~10.15.0'
				}
			}),
			path: 'package.json'
		});
		await packageEnginesHandler({ limit: 2 });

		expect(console.log).toHaveBeenCalledTimes(1);
	});
});
