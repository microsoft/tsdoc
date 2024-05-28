// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { TextRange } from './TextRange';
import { Token, TokenKind } from './Token';

export class Tokenizer {
  private static readonly _commonMarkPunctuationCharacters: string = '!"#$%&\'()*+,-./:;<=>?@[\\]^`{|}~';
  private static readonly _wordCharacters: string =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_';

  private static _charCodeMap: { [charCode: number]: TokenKind | undefined };
  private static _punctuationTokens: { [tokenKind: number]: boolean };

  /**
   * Given a list of input lines, this returns an array of extracted tokens.
   * The last token will always be TokenKind.EndOfInput.
   */
  public static readTokens(lines: TextRange[]): Token[] {
    Tokenizer._ensureInitialized();

    const tokens: Token[] = [];

    let lastLine: TextRange | undefined = undefined;

    for (const line of lines) {
      Tokenizer._pushTokensForLine(tokens, line);
      lastLine = line;
    }

    if (lastLine) {
      tokens.push(
        new Token(TokenKind.EndOfInput, lastLine.getNewRange(lastLine.end, lastLine.end), lastLine)
      );
    } else {
      tokens.push(new Token(TokenKind.EndOfInput, TextRange.empty, TextRange.empty));
    }

    return tokens;
  }

  /**
   * Returns true if the token is a CommonMark punctuation character.
   * These are basically all the ASCII punctuation characters.
   */
  public static isPunctuation(tokenKind: TokenKind): boolean {
    Tokenizer._ensureInitialized();
    return Tokenizer._punctuationTokens[tokenKind] || false;
  }

  private static _pushTokensForLine(tokens: Token[], line: TextRange): void {
    const buffer: string = line.buffer;
    const end: number = line.end;

    let bufferIndex: number = line.pos;
    let tokenKind: TokenKind | undefined = undefined;
    let tokenPos: number = bufferIndex;

    while (bufferIndex < end) {
      // Read a character and determine its kind
      const charCode: number = buffer.charCodeAt(bufferIndex);
      let characterKind: TokenKind | undefined = Tokenizer._charCodeMap[charCode];
      if (characterKind === undefined) {
        characterKind = TokenKind.Other;
      }

      // Can we append to an existing token?  Yes if:
      // 1. There is an existing token, AND
      // 2. It is the same kind of token, AND
      // 3. It's not punctuation (which is always one character)
      if (
        tokenKind !== undefined &&
        characterKind === tokenKind &&
        Tokenizer._isMultiCharacterToken(tokenKind)
      ) {
        // yes, append
      } else {
        // Is there a previous completed token to push?
        if (tokenKind !== undefined) {
          tokens.push(new Token(tokenKind, line.getNewRange(tokenPos, bufferIndex), line));
        }

        tokenPos = bufferIndex;
        tokenKind = characterKind;
      }

      ++bufferIndex;
    }

    // Is there a previous completed token to push?
    if (tokenKind !== undefined) {
      tokens.push(new Token(tokenKind, line.getNewRange(tokenPos, bufferIndex), line));
    }

    tokens.push(new Token(TokenKind.Newline, line.getNewRange(line.end, line.end), line));
  }

  /**
   * Returns true if the token can be comprised of multiple characters
   */
  private static _isMultiCharacterToken(kind: TokenKind): boolean {
    switch (kind) {
      case TokenKind.Spacing:
      case TokenKind.AsciiWord:
      case TokenKind.Other:
        return true;
    }
    return false;
  }

  private static _ensureInitialized(): void {
    if (Tokenizer._charCodeMap) {
      return;
    }

    Tokenizer._charCodeMap = {};
    Tokenizer._punctuationTokens = {};

    // All Markdown punctuation characters
    const punctuation: string = Tokenizer._commonMarkPunctuationCharacters;
    for (let i: number = 0; i < punctuation.length; ++i) {
      const charCode: number = punctuation.charCodeAt(i);
      Tokenizer._charCodeMap[charCode] = TokenKind.OtherPunctuation;
    }

    // Special symbols

    // !"#$%&\'()*+,\-.\/:;<=>?@[\\]^_`{|}~
    const specialMap: { [character: string]: TokenKind } = {
      '\\': TokenKind.Backslash,
      '<': TokenKind.LessThan,
      '>': TokenKind.GreaterThan,
      '=': TokenKind.Equals,
      "'": TokenKind.SingleQuote,
      '"': TokenKind.DoubleQuote,
      '/': TokenKind.Slash,
      '-': TokenKind.Hyphen,
      '@': TokenKind.AtSign,
      '{': TokenKind.LeftCurlyBracket,
      '}': TokenKind.RightCurlyBracket,
      '`': TokenKind.Backtick,
      '.': TokenKind.Period,
      ':': TokenKind.Colon,
      ',': TokenKind.Comma,
      '[': TokenKind.LeftSquareBracket,
      ']': TokenKind.RightSquareBracket,
      '|': TokenKind.Pipe,
      '(': TokenKind.LeftParenthesis,
      ')': TokenKind.RightParenthesis,
      '#': TokenKind.PoundSymbol,
      '+': TokenKind.Plus,
      $: TokenKind.DollarSign
    };
    for (const key of Object.getOwnPropertyNames(specialMap)) {
      Tokenizer._charCodeMap[key.charCodeAt(0)] = specialMap[key];
      Tokenizer._punctuationTokens[specialMap[key]] = true;
    }

    Tokenizer._punctuationTokens[TokenKind.OtherPunctuation] = true;

    const word: string = Tokenizer._wordCharacters;
    for (let i: number = 0; i < word.length; ++i) {
      const charCode: number = word.charCodeAt(i);
      Tokenizer._charCodeMap[charCode] = TokenKind.AsciiWord;
    }
    Tokenizer._charCodeMap[' '.charCodeAt(0)] = TokenKind.Spacing;
    Tokenizer._charCodeMap['\t'.charCodeAt(0)] = TokenKind.Spacing;
  }
}
