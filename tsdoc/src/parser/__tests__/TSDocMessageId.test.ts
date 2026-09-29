// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { TSDocConfiguration } from '../../configuration/TSDocConfiguration';
import type { ParserMessage } from '../ParserMessage';
import type { ParserContext } from '../ParserContext';
import { TSDocMessageId } from '../TSDocMessageId';
import { TSDocParser } from '../TSDocParser';

test('allTsdocMessageIds includes every TSDocMessageId enum value', () => {
  const configuration: TSDocConfiguration = new TSDocConfiguration();
  const missing: string[] = [];
  for (const key of Object.keys(TSDocMessageId)) {
    const messageId: string = TSDocMessageId[key as keyof typeof TSDocMessageId];
    if (!configuration.isKnownMessageId(messageId)) {
      missing.push(messageId);
    }
  }
  expect(missing).toEqual([]);
});

test('unsupported HTML elements report a known message id', () => {
  const configuration: TSDocConfiguration = new TSDocConfiguration();
  configuration.setSupportedHtmlElements([]);
  configuration.validation.reportUnsupportedHtmlElements = true;

  const tsdocParser: TSDocParser = new TSDocParser(configuration);
  const parserContext: ParserContext = tsdocParser.parseString(['/**', ' * <b>', ' */'].join('\n'));

  const unsupportedHtmlMessages: ParserMessage[] = parserContext.log.messages.filter(
    (message: ParserMessage) => message.messageId === TSDocMessageId.UnsupportedHtmlElementName
  );
  expect(unsupportedHtmlMessages.length).toBeGreaterThan(0);

  for (const message of parserContext.log.messages) {
    expect(configuration.isKnownMessageId(message.messageId)).toEqual(true);
  }
});
