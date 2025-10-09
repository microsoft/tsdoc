// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import * as os from 'node:os';

import * as colors from 'colors';

import { simpleDemo } from './simpleDemo';
import { advancedDemo } from './advancedDemo';

function main(args: string[]): void {
  if (args.length >= 1) {
    switch (args[0].toUpperCase()) {
      case 'SIMPLE':
        simpleDemo();
        return;
      case 'ADVANCED':
        advancedDemo();
        return;
      case '--HELP':
      case '-H':
        break;
      default:
        console.log(colors.red('Unsupported option: ' + JSON.stringify(args[0])) + os.EOL);
        break;
    }
  }

  console.log(colors.yellow('*** TSDoc API demo ***') + os.EOL);

  console.log('usage: ' + colors.green('npm run start simple'));
  console.log('       ' + colors.green('npm run start advanced'));
  console.log(os.EOL + 'Invokes the simple or advanced API demo for TSDoc.');
}

main(process.argv.slice(2));
