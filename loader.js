import { extname } from 'path';
import { URL } from 'url';

function getFormatNew(url, defaultFormat) {
	const { searchParams } = new URL(url);
	const exports = JSON.parse(searchParams.get('mock-esm-exports'));

	if (exports && url.split('?')[0] in exports) {
		return 'module';
	}

	if (url.startsWith('file:') && !extname(url)) {
		return 'commonjs';
	}

	return defaultFormat;
}

export function resolve(specifier, context, defaultResolver) {
	if (specifier.startsWith('mock-esm:')) {
		const [mockId, realSpecifier, parentURL, mockedModules] = JSON.parse(specifier.slice(9));
		const emulatedContext = { ...context, parentURL };

		const exports = Object.fromEntries(mockedModules.map(
			([specifier, exports]) => [defaultResolver(specifier, emulatedContext).url, [specifier, exports]]
		));

		const { url, format } = defaultResolver(realSpecifier, emulatedContext);

		// TODO: account for URL-s which already have query parameters
		const newUrl = `${url}?mock-esm-id=${mockId}&mock-esm-exports=${JSON.stringify(exports)}`;

		return {
			url: newUrl,
			format: getFormatNew(newUrl, format)
		};
	}

	const defaultResolverResult = defaultResolver(specifier, context);
	let { url } = defaultResolverResult;

	if (specifier !== 'mock-esm' && !url.startsWith('nodejs:') && !url.startsWith('node:') && typeof context.parentURL === 'string') {
		const { searchParams } = new URL(context.parentURL);
		const mockId = searchParams.get('mock-esm-id');

		if (mockId) {
			// TODO: account for URL-s which already have query parameters
			url = `${url}?mock-esm-id=${mockId}&mock-esm-exports=${searchParams.get('mock-esm-exports')}`
		}
	}

	return {
		url,
		format: getFormatNew(url, defaultResolverResult.format)
	};
}

export async function getSource(url, context, defaultGetSource) {
	return load(url, context, defaultGetSource)
}

export async function load(url, context, defaultGetSource) {
	const { searchParams } = new URL(url);
	const mockId = searchParams.get('mock-esm-id');

	if (mockId) {
		const mockedModules = JSON.parse(searchParams.get('mock-esm-exports'));
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
				source: `import { getMockedModuleExports } from 'mock-esm';

const ${temporaryVariableName} = getMockedModuleExports(${JSON.stringify(mockId)}, ${JSON.stringify(specifier)});

${exportsSource.join('\n')}
`
			};
		}
	}

	return defaultGetSource(url, context);
}

export function getFormat(url, context, defaultGetFormat) {
	const { searchParams } = new URL(url);
	const exports = JSON.parse(searchParams.get('mock-esm-exports'));

	if (exports && url.split('?')[0] in exports) {
		return {
			format: 'module'
		};
	}

	if (url.startsWith('file:') && !extname(url)) {
		return {
			format: 'commonjs'
		};
	}

	return defaultGetFormat(url, context);
}
