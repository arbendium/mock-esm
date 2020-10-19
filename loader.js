import { extname } from 'path';
import { URL } from 'url';

const mocks = new Map();

export function resolve(specifier, context, defaultResolver) {
	if (specifier.startsWith('mock-esm:')) {
		const [mockId, realSpecifier, mockedModules] = JSON.parse(specifier.slice(9));

		for (const mockedModuleSpecifier in mockedModules) {
			const { url } = defaultResolver(mockedModuleSpecifier, context);
			mocks.set(`${url}?mock-esm-id=${mockId}`, {
				mockId,
				specifier: mockedModuleSpecifier,
				exports: mockedModules[mockedModuleSpecifier]
			});
		}

		const { url } = defaultResolver(realSpecifier, context);
		return {
			// TODO: account for URL-s which already have query parameters
			url: `${url}?mock-esm-id=${mockId}`
		};
	}

	const { url } = defaultResolver(specifier, context);

	if (specifier !== 'mock-esm' && !url.startsWith('nodejs:') && !url.startsWith('node:') && typeof context.parentURL === 'string') {
		const { searchParams } = new URL(context.parentURL);
		const mockId = searchParams.get('mock-esm-id');

		if (typeof mockId === 'string') {
			return {
				// TODO: account for URL-s w,hich already have query parameters
				url: `${url}?mock-esm-id=${mockId}`
			};
		}
	}

	return { url };
}

export async function getSource(url, context, defaultGetSource) {
	const mockedModule = mocks.get(url);
	if (mockedModule) {
		let temporaryVariableName = '_';
		while(mockedModule.exports.includes(temporaryVariableName)) {
			temporaryVariableName += '_';
		}

		const exportsSource = mockedModule.exports.map(
			exportName => exportName === 'default'
				? `export default ${temporaryVariableName}.default;`
				: `export const ${exportName} = ${temporaryVariableName}.${exportName};`
		);

		return {
			source: `import { getMockedModuleExports } from 'mock-esm';

const ${temporaryVariableName} = getMockedModuleExports(${JSON.stringify(mockedModule.mockId)}, ${JSON.stringify(mockedModule.specifier)});

${exportsSource.join('\n')}
`
		};
	}

	return defaultGetSource(url, context);
}

export function getFormat(url, context, defaultGetFormat) {
	if (mocks.has(url)) {
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
