import { registerHooks } from "node:module";
registerHooks(await import("@arbendium/mock-esm/loader"));

import('./common.js');
