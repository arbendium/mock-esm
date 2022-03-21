#### A small mocking library for Node ESM based codebase

**Warning:** This library uses [custom ESM loaders](https://nodejs.org/api/esm.html#esm_experimental_loaders) which is very much experimental. The API gets changed every now in an incompatible way so this library occasionally breaks down.

## Usage

```js
import mock from 'mock-esm';

const mockedConfig = { listen: { port: 8080 } }

const { load, cleanup } = await mock(import.meta.url, {
	'./config.js': {
		default: mockedConfig
	}
});

const app = await load('./app.js');
cleanup();
```

#### API

`mock(entryModuleUrl, mocks)`

Initialize mock context.

 - `entryModuleUrl` - the root module url from which relative module specifiers are derived, usually `import.meta.url`
 - `mocks` - module specifier -> exports maps. Exports are always identifier -> value maps, even for CommonJS modules (since all mocks are exposed as ESM). Use `default` identifier for CommonJS exports.

`load(specifier)`

Load module in given mock context and given specifier relative to entry module.

`cleanup()`

Delete mocked modules from internal map for garbage collection. This is usually safe to call right after all needed modules are loaded, except when there are further dynamic imports of mocked modules. In this case, these imports will fail with exception.

Limitations/notes:

 - Modules imported from CommoonJS or built-in modules cannot be mocked because Node does not use custom loader for these.
 - Every `mock` call creates new namespace in module cache, which means all modules reexecuted, except modules imported from unmocked CommonJS & built-in modules. This is desired behaviour for me. If you need to cache certain modules, import them separately and pass as mocks.
 - The library does not account for module specifiers with query parameters. I guess it's easy to fix but I have no need for this at the moment.
