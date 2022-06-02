// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  '@@xstate/typegen': true;
  eventsCausingActions: {
    setSelected: 'SELECT';
    setError: 'error.platform.act';
  };
  internalEvents: {
    'error.platform.act': { type: 'error.platform.act'; data: unknown };
    'xstate.init': { type: 'xstate.init' };
    'done.invoke.act': {
      type: 'done.invoke.act';
      data: unknown;
      __tip: 'See the XState TS docs to learn how to strongly type this.';
    };
  };
  invokeSrcNameMap: {
    handleSelected: 'done.invoke.act';
  };
  missingImplementations: {
    actions: never;
    services: never;
    guards: never;
    delays: never;
  };
  eventsCausingServices: {
    handleSelected: 'SELECT';
  };
  eventsCausingGuards: {};
  eventsCausingDelays: {};
  matchesStates: 'select' | 'acting' | 'success' | 'error';
  tags: never;
}
