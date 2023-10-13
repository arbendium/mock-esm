import { register } from "node:module";
register("./loader.js", import.meta.url);

import assert from 'assert';
import mock from 'mock-esm'; // has to be imported using this exact module specifier

const mockValue1 = Symbol();
const mockValue2 = Symbol();
const mockValue3 = Symbol();
const mockValue4 = Symbol();

const { load } = mock(import.meta.url, {
	'./test-app/mocked-module.js': {
		default: mockValue1,
		someExport: mockValue2
	},
	'./test-app/mocked-cjs-module.cjs': {
		default: mockValue3,
		someExport: mockValue4
	}
});

const app = await load('./test-app/index.js');

assert.strictEqual(app.nonMockedModule.default, 'koer');
assert.strictEqual(app.nonMockedCjsModule.default, 'kass');
assert.strictEqual(app.mockedModule.default, mockValue1);
assert.strictEqual(app.mockedModule.someExport, mockValue2);
assert.strictEqual(app.mockedCjsModule.default, mockValue3);
assert.strictEqual(app.mockedCjsModule.someExport, mockValue4);

console.log('Tests have been successfully completed');
