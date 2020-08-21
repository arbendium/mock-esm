const mocks = new Map();

export default async function(importModule, specifier, moduleMocks) {
	const mockId = Math.random().toString().split('.')[1];

	mocks.set(mockId, moduleMocks);

	const mockedModules = {};
	for (const mockedModuleSpecifier in moduleMocks) {
		mockedModules[mockedModuleSpecifier] = Object.keys(moduleMocks[mockedModuleSpecifier]);
	}

	const serialized = JSON.stringify([
		mockId,
		specifier,
		mockedModules
	]);

	return importModule(`mock-esm:${serialized}`);
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
