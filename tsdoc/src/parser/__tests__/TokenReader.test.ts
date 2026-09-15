// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { TSDocParser } from '../TSDocParser';
import { type Token, TokenKind } from '../Token';
import { TokenReader } from '../TokenReader';
import { TokenSequence } from '../TokenSequence';
import type { ParserContext } from '../ParserContext';

function parseComment(buffer: string): ParserContext {
  const tsdocParser: TSDocParser = new TSDocParser();
  return tsdocParser.parseString(buffer);
}

function indexOfTokenText(parserContext: ParserContext, text: string): number {
  const tokens: ReadonlyArray<Token> = parserContext.tokens;
  for (let i: number = 0; i < tokens.length; ++i) {
    if (tokens[i].toString() === text) {
      return i;
    }
  }
  throw new Error('Token not found: ' + JSON.stringify(text));
}

function createEmbeddedReader(
  parserContext: ParserContext,
  startIndex: number,
  endIndex: number
): TokenReader {
  return new TokenReader(
    parserContext,
    new TokenSequence({
      parserContext: parserContext,
      startIndex: startIndex,
      endIndex: endIndex
    })
  );
}

test('peekPreviousTokenKind does not leak the token before an embedded window', () => {
  const parserContext: ParserContext = parseComment('/** prefix {@link Dest} suffix */');
  const destIndex: number = indexOfTokenText(parserContext, 'Dest');
  const tokenReader: TokenReader = createEmbeddedReader(parserContext, destIndex, destIndex + 1);

  expect(parserContext.tokens[destIndex - 1].kind).toEqual(TokenKind.Spacing);
  expect(tokenReader.peekPreviousTokenKind()).toEqual(TokenKind.EndOfInput);
});

test('peekToken at the end of an embedded window is EndOfInput, not the following token', () => {
  const parserContext: ParserContext = parseComment('/** prefix {@link Dest} suffix */');
  const destIndex: number = indexOfTokenText(parserContext, 'Dest');
  const tokenReader: TokenReader = createEmbeddedReader(parserContext, destIndex, destIndex + 1);

  expect(tokenReader.readToken().toString()).toEqual('Dest');
  expect(tokenReader.peekTokenKind()).toEqual(TokenKind.EndOfInput);

  expect(parserContext.tokens[destIndex + 1].kind).toEqual(TokenKind.RightCurlyBracket);
  expect(tokenReader.peekToken()).toBeDefined();
  expect(tokenReader.peekToken().kind).toEqual(TokenKind.EndOfInput);
});

test('peekToken for an empty TokenSequence is EndOfInput, not tokens[0]', () => {
  const parserContext: ParserContext = parseComment('/** prefix {@link Dest} suffix */');
  const tokenReader: TokenReader = new TokenReader(parserContext, TokenSequence.createEmpty(parserContext));

  expect(parserContext.tokens[0].toString()).toEqual('prefix');
  expect(tokenReader.peekTokenKind()).toEqual(TokenKind.EndOfInput);
  expect(tokenReader.peekToken().kind).toEqual(TokenKind.EndOfInput);
});

test('backtrackToMarker rejects a marker before the embedded start', () => {
  const parserContext: ParserContext = parseComment('/** prefix {@link Dest} suffix */');
  const destIndex: number = indexOfTokenText(parserContext, 'Dest');
  const tokenReader: TokenReader = createEmbeddedReader(parserContext, destIndex, destIndex + 1);

  tokenReader.readToken();

  expect(() => {
    tokenReader.backtrackToMarker(destIndex - 1);
  }).toThrowError('The marker is outside the TokenReader range');

  tokenReader.backtrackToMarker(destIndex);
  expect(tokenReader.peekToken().toString()).toEqual('Dest');
});
