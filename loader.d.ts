import type { LoadHook, LoadHookSync, ResolveHook, ResolveHookSync } from 'node:module';

export const load: {
	(...parameters: Parameters<LoadHook>): ReturnType<LoadHook>
	(...parameters: Parameters<LoadHookSync>): ReturnType<LoadHookSync>
};
export const resolve: {
	(...parameters: Parameters<ResolveHook>): ReturnType<ResolveHook>
	(...parameters: Parameters<ResolveHookSync>): ReturnType<ResolveHookSync>
};;
