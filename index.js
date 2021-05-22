const mocks = new Map();

let mockIdCounter = 0;

export default function(parentUrl, moduleMocks) {
	const mockId = String(++mockIdCounter);

	mocks.set(mockId, moduleMocks);

	const exports = Object.entries(moduleMocks)
		.map(([specifier, exports]) => [specifier, Object.keys(exports)])

	return {
		load(specifier) {
			return import(`mock-esm:${JSON.stringify([mockId, specifier, parentUrl, exports])}`);
		},
		cleanup() {
			mocks.delete(mockId);
		}
	}
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
