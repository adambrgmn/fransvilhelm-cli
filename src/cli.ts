#!/usr/bin/env node
/// <reference types="react/experimental" />
import { render } from 'ink';
import { createElement } from 'react';

import { App, AppProviders } from './App';

(async () => {
  try {
    let { waitUntilExit } = render(createElement(AppProviders, { children: createElement(App, {}) }));
    await waitUntilExit();
    process.exit();
  } catch (error) {
    process.exit(1);
  }
})();
