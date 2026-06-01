export default function mock(parentUrl: string, moduleMocks: Record<string, Record<string, unknown>>): {
    load(specifier: string): Record<string, any>;
    cleanup(): void;
};
export function getMockedModuleExports(mockId: string, mockedModuleSpecifier: string): Record<string, unknown>;
