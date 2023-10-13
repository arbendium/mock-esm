import mock from 'mock-esm';

const mockedConfig = { listen: { port: 8080 } }

const { load, cleanup } = await mock(import.meta.url, {
	'./config.js': {
		default: mockedConfig
	}
});

const app = await load('./app.js');
cleanup();
