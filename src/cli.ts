#!/usr/bin/env node
/// <reference types="react/experimental" />
import { render } from 'ink';
import { createElement } from 'react';

import { App } from './App';

render(createElement(App, {}));
