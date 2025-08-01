/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

/* eslint-disable no-console */

'use strict';

import type {Terminal} from 'metro-core';

const chalk = require('chalk');
const util = require('util');

const groupStack = [];
let collapsedGuardTimer;

module.exports = (
  terminal: Terminal,
  level: string,
  mode: 'BRIDGE' | 'NOBRIDGE',
  ...data: Array<mixed>
) => {
  // $FlowFixMe[invalid-computed-prop]
  const logFunction = console[level] && level !== 'trace' ? level : 'log';
  const color =
    level === 'error'
      ? chalk.inverse.red
      : level === 'warn'
        ? chalk.inverse.yellow
        : chalk.inverse.white;

  if (level === 'group') {
    groupStack.push(level);
  } else if (level === 'groupCollapsed') {
    groupStack.push(level);
    clearTimeout(collapsedGuardTimer);
    // Inform users that logs get swallowed if they forget to call `groupEnd`.
    collapsedGuardTimer = setTimeout(() => {
      if (groupStack.includes('groupCollapsed')) {
        terminal.log(
          chalk.inverse.yellow.bold(' WARN '),
          'Expected `console.groupEnd` to be called after `console.groupCollapsed`.',
        );
        groupStack.length = 0;
      }
    }, 3000);
    return;
  } else if (level === 'groupEnd') {
    groupStack.pop();
    if (!groupStack.length) {
      clearTimeout(collapsedGuardTimer);
    }
    return;
  }

  if (!groupStack.includes('groupCollapsed')) {
    // Remove excess whitespace at the end of a log message, if possible.
    const lastItem = data[data.length - 1];
    if (typeof lastItem === 'string') {
      data[data.length - 1] = lastItem.trimEnd();
    }

    const modePrefix =
      !mode || mode == 'BRIDGE' ? '' : `(${mode.toUpperCase()}) `;
    terminal.log(
      color.bold(` ${modePrefix}${logFunction.toUpperCase()} `) +
        ''.padEnd(groupStack.length * 2, ' '),
      // `util.format` actually accepts any arguments.
      // If the first argument is a string, it tries to format it.
      // Otherwise, it just concatenates all arguments.
      // $FlowFixMe[incompatible-call] util.format expected the first argument to be a string
      util.format(...data),
    );
  }
};
