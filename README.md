#### A small mocking library for Node ESM based codebase

**Warning:** This library uses [custom ESM loaders](https://nodejs.org/api/esm.html#esm_experimental_loaders) which is very much experimental. Just few weeks ago this library didn't work because of how NodeJS handled CommonJS modules with query parameters. I have no idea if they actually fixed it or what but it seems to work now. Let me know if you any problems.

## Usage

```js
import mock from 'mock-esm';

const mockedConfig = { listen: { port: 8080 } }

const app = await mock(specifier => import(specifier), './app.js', {
	'./config.js': {
		default: mockedConfig
	}
});

```

#### API

`mock(importCallback, moduleSpecifier, mocks)`

 - `importCallback` - since literally every single mocking library sucks at module resolution I didn't even try and just use this hack. This should always be `specifier => import(specifier);`.
 - `moduleSpecifier` - root module or array of root modules you want to import
 - `mocks` - module specifier -> exports maps. Exports are always identifier -> value maps, even for CommonJS modules (since all mocks are exposed as ESM). Use `default` identifier for CommonJS exports.

Limitations/notes:

 - Modules imported from CommoonJS or built-in modules cannot be mocked because Node does not use custom loader for these.
 - Every `mock` call reexecutes whole dependency tree (i.e. ignores module cache), except modules imported from unmocked CommonJS & built-in modules. This is desired behaviour for me. If you need to cache certain modules, import them separately and pass as mocks.
 - The library does not account for module specifiers with query parameters. I guess it's easy to fix but I have no need for this at the moment.
