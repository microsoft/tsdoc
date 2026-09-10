// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { TSDocParser } from '../TSDocParser';
import { TokenReader } from '../TokenReader';
import { TokenSequence } from '../TokenSequence';
import { TokenKind } from '../Token';
import type { ParserContext } from '../ParserContext';

function createContext(): ParserContext {
  return new TSDocParser().parseString('/** before inner after */');
}

function createEmbeddedReader(context: ParserContext, length: number = 1): TokenReader {
  const startIndex: number = context.tokens.map((token) => token.toString()).indexOf('inner');
  expect(startIndex).toBeGreaterThan(0);
  return new TokenReader(
    context,
    new TokenSequence({ parserContext: context, startIndex, endIndex: startIndex + length })
  );
}

describe('TokenReader subrange bounds', () => {
  test('does not expose the token before an embedded range', () => {
    const reader: TokenReader = createEmbeddedReader(createContext());
    expect(reader.peekPreviousTokenKind()).toBe(TokenKind.EndOfInput);
    expect(reader.peekToken().toString()).toBe('inner');
    expect(reader.readToken().toString()).toBe('inner');
    expect(reader.peekPreviousTokenKind()).toBe(TokenKind.AsciiWord);
  });

  test('rejects peeking beyond an embedded range without consuming outer tokens', () => {
    const reader: TokenReader = createEmbeddedReader(createContext());
    reader.readToken();
    const endMarker: number = reader.createMarker();
    expect(reader.peekTokenKind()).toBe(TokenKind.EndOfInput);
    expect(reader.peekTokenAfterKind()).toBe(TokenKind.EndOfInput);
    expect(reader.peekTokenAfterAfterKind()).toBe(TokenKind.EndOfInput);
    expect(() => reader.peekToken()).toThrow('Cannot peek past end of stream');
    expect(() => reader.readToken()).toThrow('Cannot read past end of stream');
    expect(reader.createMarker()).toBe(endMarker);
  });

  test('honors an empty embedded range at a nonzero offset', () => {
    const reader: TokenReader = createEmbeddedReader(createContext(), 0);
    expect(reader.peekPreviousTokenKind()).toBe(TokenKind.EndOfInput);
    expect(reader.peekTokenKind()).toBe(TokenKind.EndOfInput);
    expect(() => reader.peekToken()).toThrow('Cannot peek past end of stream');
    expect(reader.isAccumulatedSequenceEmpty()).toBe(true);
  });

  test('honors an empty embedded range at zero', () => {
    const context: ParserContext = createContext();
    const reader: TokenReader = new TokenReader(context, TokenSequence.createEmpty(context));
    expect(() => reader.peekToken()).toThrow('Cannot peek past end of stream');
  });

  test('rejects backtracking before the embedded start without changing state', () => {
    const reader: TokenReader = createEmbeddedReader(createContext());
    const startMarker: number = reader.createMarker();
    reader.readToken();
    const endMarker: number = reader.createMarker();
    expect(() => reader.backtrackToMarker(startMarker - 1)).toThrow('The marker is outside the reader range');
    expect(reader.createMarker()).toBe(endMarker);
    expect(reader.extractAccumulatedSequence().toString()).toBe('inner');
  });

  test('rejects negative markers for a full reader', () => {
    const reader: TokenReader = new TokenReader(createContext());
    expect(() => reader.backtrackToMarker(-1)).toThrow('The marker is outside the reader range');
    expect(reader.createMarker()).toBe(0);
    expect(reader.isAccumulatedSequenceEmpty()).toBe(true);
  });

  test('can rewind to the embedded start after extracting an accumulated sequence', () => {
    const reader: TokenReader = createEmbeddedReader(createContext(), 3);
    const startMarker: number = reader.createMarker();
    reader.readToken();
    reader.readToken();
    expect(reader.extractAccumulatedSequence().toString()).toBe('inner ');
    reader.backtrackToMarker(startMarker);
    expect(reader.peekPreviousTokenKind()).toBe(TokenKind.EndOfInput);
    expect(reader.isAccumulatedSequenceEmpty()).toBe(true);
    expect(reader.readToken().toString()).toBe('inner');
    expect(reader.extractAccumulatedSequence().toString()).toBe('inner');
  });

  test('still rejects expired markers', () => {
    const reader: TokenReader = createEmbeddedReader(createContext());
    const startMarker: number = reader.createMarker();
    reader.readToken();
    const endMarker: number = reader.createMarker();
    reader.backtrackToMarker(startMarker);
    expect(() => reader.backtrackToMarker(endMarker)).toThrow('The marker has expired');
    expect(reader.createMarker()).toBe(startMarker);
  });

  test('preserves the full reader EndOfInput token', () => {
    const reader: TokenReader = new TokenReader(createContext());
    while (reader.peekTokenKind() !== TokenKind.EndOfInput) {
      expect(reader.peekToken()).toBe(reader.readToken());
    }
    expect(reader.peekToken().kind).toBe(TokenKind.EndOfInput);
    expect(() => reader.readToken()).toThrow('The EndOfInput token cannot be read');
    expect(reader.peekToken().kind).toBe(TokenKind.EndOfInput);
  });
});
