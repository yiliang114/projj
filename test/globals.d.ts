declare function after(hook: () => any): void;
declare function afterEach(hook: () => any): void;
declare function before(hook: () => any): void;
declare function beforeEach(hook: () => any): void;
declare function describe(name: string, suite: () => void): void;
declare function it(name: string, test: (done?: (err?: any) => void) => any): void;
