const mocks = new Map();

export default function(importModule, specifier, moduleMocks) {
	const mockId = Math.random().toString().split('.')[1];

	mocks.set(mockId, moduleMocks);

	const exports = Object.entries(moduleMocks)
		.map(([specifier, exports]) => [specifier, Object.keys(exports)])

	if (Array.isArray(specifier)) {
		return specifier.map(specifier => importModule(`mock-esm:${JSON.stringify([mockId, specifier, exports])}`));
	}

	return importModule(`mock-esm:${JSON.stringify([mockId, specifier, exports])}`);
}

export function getMockedModuleExports(mockId, mockedModuleSpecifier) {
	const mock = mocks.get(mockId);
	if (!mock) {
		throw new Error(`Mock ${mockId} not exist`);
	}

	if (!(mockedModuleSpecifier in mock)) {
		throw new Error(`Module ${mockedModuleSpecifier} is not in ${mockId} mocked`);
	}

	return mock[mockedModuleSpecifier];
}
