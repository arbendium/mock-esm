#### A small mocking library for Node ESM based codebase

**Warning:** This library uses [customization hooks](https://nodejs.org/api/module.html#customization-hooks) which, at the time of writing, is in a "Release candidate" stage.

## Usage

```js
// Instead of these two lines, the following Node CLI option would also work if the application is run in the package directory:
// --import 'data:text/javascript,import { register } from "node:module"; import { pathToFileURL } from "node:url"; register("@arbendium/mock-esm/loader.js", pathToFileURL("./"));'
import { register } from "node:module";
register("@arbendium/mock-esm/loader", import.meta.url);

import mock from '@arbendium/mock-esm';

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
