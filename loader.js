import { extname } from 'node:path';
import { URL } from 'node:url';

/**
 * @param {string} url
 * @param {string | null | undefined} defaultFormat
 * @returns {string | null | undefined}
 */
function getFormat(url, defaultFormat) {
	const { searchParams } = new URL(url);
	const exports = JSON.parse(/** @type {string} */(searchParams.get('mock-esm-exports')));

	if (exports && url.split('?')[0] in exports) {
		return 'module';
	}

	if (url.startsWith('file:') && !extname(url)) {
		return 'commonjs';
	}

	return defaultFormat;
}

/**
 * @type {import('node:module').ResolveHook}
 */
export async function resolve(specifier, context, defaultResolver) {
	if (specifier.startsWith('mock-esm:')) {
		/** @type {[string, string, string, [string, string[]][]]} */
		const [mockId, realSpecifier, parentURL, mockedModules] = JSON.parse(specifier.slice(9));
		const emulatedContext = { ...context, parentURL };

		const [{ url, format }, resolveResults] = await Promise.all([
			defaultResolver(realSpecifier, emulatedContext),
			Promise.all(mockedModules.map(
				async ([specifier, exports]) => [(await defaultResolver(specifier, emulatedContext)).url, [specifier, exports]]
			))
		]);

		const exports = Object.fromEntries(resolveResults);

		// TODO: account for URL-s which already have query parameters
		const newUrl = `${url}?mock-esm-id=${mockId}&mock-esm-exports=${encodeURIComponent(JSON.stringify(exports))}`;

		return {
			url: newUrl,
			format: getFormat(newUrl, format)
		};
	}

	const defaultResolverResult = await defaultResolver(specifier, context);
	let { url } = defaultResolverResult;

	if (specifier !== '@arbendium/mock-esm' && !url.startsWith('nodejs:') && !url.startsWith('node:') && typeof context.parentURL === 'string') {
		const { searchParams } = new URL(context.parentURL);
		const mockId = searchParams.get('mock-esm-id');

		if (mockId) {
			// TODO: account for URL-s which already have query parameters
			url = `${url}?mock-esm-id=${mockId}&mock-esm-exports=${encodeURIComponent(/** @type {string} */(searchParams.get('mock-esm-exports')))}`
		}
	}

	return {
		url,
		format: getFormat(url, defaultResolverResult.format)
	};
}

/**
 * @type {import('node:module').LoadHook}
 */
export async function load(url, context, nextLoad) {
	const { searchParams } = new URL(url);
	const mockId = searchParams.get('mock-esm-id');

	if (mockId) {
		/** @type {Record<string, [string, string[]]>} */
		const mockedModules = JSON.parse(/** @type {string} */(searchParams.get('mock-esm-exports')));
		const realUrl = url.split('?')[0];

		if (realUrl in mockedModules) {
			const [specifier, exports] = mockedModules[realUrl];

			let temporaryVariableName = '_';
			while (exports.includes(temporaryVariableName)) {
				temporaryVariableName += '_';
			}

			const exportsSource = exports.map(
				exportName => exportName === 'default'
					? `export default ${temporaryVariableName}.default;`
					: `export const ${exportName} = ${temporaryVariableName}.${exportName};`
			);

			return {
				format: context.format,
				shortCircuit: true,
				source: `import { getMockedModuleExports } from '@arbendium/mock-esm';

const ${temporaryVariableName} = getMockedModuleExports(${JSON.stringify(mockId)}, ${JSON.stringify(specifier)});

${exportsSource.join('\n')}
`
			};
		}
	}

	return nextLoad(url, context);
}
