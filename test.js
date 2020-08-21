import assert from 'assert';
import mock from 'mock-esm'; // has to be imported using this exact module specifier

async function run() {
	const mockValue1 = Symbol();
	const mockValue2 = Symbol();
	const mockValue3 = Symbol();
	const mockValue4 = Symbol();

	const app = await mock(specifier => import(specifier), './test-app/index.js', {
		'./test-app/mocked-module.js': {
			default: mockValue1,
			someExport: mockValue2
		},
		'./test-app/mocked-cjs-module.cjs': {
			default: mockValue3,
			someExport: mockValue4
		}
	})

	assert.equal(app.nonMockedModule.default, 'koer');
	assert.equal(app.nonMockedCjsModule.default, 'kass');
	assert.equal(app.mockedModule.default, mockValue1);
	assert.equal(app.mockedModule.someExport, mockValue2);
	assert.equal(app.mockedCjsModule.default, mockValue3);
	assert.equal(app.mockedCjsModule.someExport, mockValue4);
}

run().catch(console.error);
