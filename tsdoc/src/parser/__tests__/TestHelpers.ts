// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { TSDocParser } from '../TSDocParser';
import type { TextRange } from '../TextRange';
import { DocErrorText, type DocNode, type DocComment, DocPlainText, DocExcerpt } from '../../nodes';
import type { ParserContext } from '../ParserContext';
import { TSDocConfiguration } from '../../configuration/TSDocConfiguration';
import { TokenCoverageChecker } from './TokenCoverageChecker';

interface ISnapshotItem {
  kind: string;
  errorMessage?: string;
  errorLocation?: string;
  errorLocationPrecedingToken?: string;
  nodeExcerpt?: string;
  nodeSpacing?: string;

  // If it's a DocPlainText node and the plain text is different from the excerpt,
  // this shows the DocPlainText.text
  nodePlainText?: string;
  nodes?: ISnapshotItem[];
}

export class TestHelpers {
  /**
   * Pretty print a line with "<" and ">" markers to indicate a text range.
   */
  public static formatLineSpan(line: TextRange, range: TextRange): string {
    if (range.pos < line.pos || range.end > line.end) {
      throw new Error('Range must fall within the associated line');
    }

    const paddedSpace: string[] = ['', ' ', '  ', '   ', '    '];
    const paddedLArrow: string[] = ['', '>', ' >', '  >', '   >'];
    const paddedRArrow: string[] = ['', '<', '< ', '<  ', '<   '];

    const buffer: string = line.buffer;

    let span: string = '';
    if (line.end > 0) {
      let i: number = line.pos - 1;
      while (i < range.pos - 1) {
        span += paddedSpace[TestHelpers.getEscaped(buffer[i]).length];
        ++i;
      }
      span += paddedLArrow[TestHelpers.getEscaped(buffer[i]).length];
      ++i;
      while (i < range.end) {
        span += paddedSpace[TestHelpers.getEscaped(buffer[i]).length];
        ++i;
      }
      if (i === line.end) {
        span += '<';
      } else {
        span += paddedRArrow[TestHelpers.getEscaped(buffer[i]).length];
        ++i;
        while (i < line.end) {
          span += paddedSpace[TestHelpers.getEscaped(buffer[i]).length];
          ++i;
        }
      }
    }
    return span;
  }

  /**
   * Workaround various characters that get ugly escapes in Jest snapshots
   */
  public static getEscaped(s: string): string {
    return s
      .replace(/\n/g, '[n]')
      .replace(/\r/g, '[r]')
      .replace(/\t/g, '[t]')
      .replace(/\f/g, '[f]')
      .replace(/\\/g, '[b]')
      .replace(/\"/g, '[q]')
      .replace(/`/g, '[c]')
      .replace(/\</g, '[<]')
      .replace(/\>/g, '[>]');
  }

  /**
   * Main harness for tests under `./parser/*`.
   */
  public static parseAndMatchNodeParserSnapshot(buffer: string, config?: TSDocConfiguration): void {
    const configuration: TSDocConfiguration = config ?? new TSDocConfiguration();

    // For the parser tests, we use lots of custom tags without bothering to define them
    configuration.validation.ignoreUndefinedTags = true;

    const tsdocParser: TSDocParser = new TSDocParser(configuration);
    const parserContext: ParserContext = tsdocParser.parseString(buffer);

    expect({
      buffer: TestHelpers.getEscaped(buffer),
      lines: parserContext.lines.map((x) => TestHelpers.getEscaped(x.toString())),
      logMessages: parserContext.log.messages.map((message) => message.text),
      nodes: TestHelpers.getDocNodeSnapshot(parserContext.docComment),
      gaps: this._getTokenCoverageGapsSnapshot(parserContext)
    }).toMatchSnapshot();

    TestHelpers._getTokenCoverageGapsSnapshot(parserContext);
  }

  /**
   * Main harness for tests under `./details/*`.
   */
  public static parseAndMatchDocCommentSnapshot(
    buffer: string,
    configuration?: TSDocConfiguration
  ): ParserContext {
    const tsdocParser: TSDocParser = new TSDocParser(configuration);
    const parserContext: ParserContext = tsdocParser.parseString(buffer);
    const docComment: DocComment = parserContext.docComment;

    expect({
      s00_lines: parserContext.lines.map((x) => TestHelpers.getEscaped(x.toString())),
      s01_gaps: this._getTokenCoverageGapsSnapshot(parserContext),
      s02_summarySection: TestHelpers.getDocNodeSnapshot(docComment.summarySection),
      s03_remarksBlock: TestHelpers.getDocNodeSnapshot(docComment.remarksBlock),
      s04_privateRemarksBlock: TestHelpers.getDocNodeSnapshot(docComment.privateRemarks),
      s05_deprecatedBlock: TestHelpers.getDocNodeSnapshot(docComment.deprecatedBlock),
      s06_paramBlocks: docComment.params.blocks.map((x) => TestHelpers.getDocNodeSnapshot(x)),
      s07_typeParamBlocks: docComment.typeParams.blocks.map((x) => TestHelpers.getDocNodeSnapshot(x)),
      s08_returnsBlock: TestHelpers.getDocNodeSnapshot(docComment.returnsBlock),
      s09_customBlocks: docComment.customBlocks.map((x) => TestHelpers.getDocNodeSnapshot(x)),
      s10_tsBuiltInDirectiveBlocks: docComment.tsBuiltInDirectiveBlocks.map((x) =>
        TestHelpers.getDocNodeSnapshot(x)
      ),
      s11_inheritDocTag: TestHelpers.getDocNodeSnapshot(docComment.inheritDocTag),
      s12_modifierTags: docComment.modifierTagSet.nodes.map((x) => TestHelpers.getDocNodeSnapshot(x)),
      s13_logMessages: parserContext.log.messages.map((message) => message.text)
    }).toMatchSnapshot();

    return parserContext;
  }

  /**
   * Render a nice Jest snapshot object for a DocNode tree.
   */
  public static getDocNodeSnapshot(docNode: DocNode | undefined): ISnapshotItem | undefined {
    if (!docNode) {
      return undefined;
    }

    const item: ISnapshotItem = {
      kind: docNode.kind
    };

    if (docNode instanceof DocExcerpt) {
      item.kind += ': ' + docNode.excerptKind;

      item.nodeExcerpt = TestHelpers.getEscaped(docNode.content.toString());
    }

    if (docNode instanceof DocPlainText) {
      const docPlainText: DocPlainText = docNode as DocPlainText;
      if (docPlainText.textExcerpt === undefined) {
        item.nodePlainText = TestHelpers.getEscaped(docPlainText.text);
      }
    }

    if (docNode instanceof DocErrorText) {
      item.errorMessage = TestHelpers.getEscaped(docNode.errorMessage);
      item.errorLocation = TestHelpers.getEscaped(docNode.errorLocation.toString());
      if (docNode.errorLocation.startIndex > 0) {
        // Show the preceding token to provide some context (e.g. is this the opening quote
        // or closing quote?)
        item.errorLocationPrecedingToken =
          docNode.errorLocation.parserContext.tokens[docNode.errorLocation.startIndex - 1].toString();
      }
    }

    if (docNode.getChildNodes().length > 0) {
      item.nodes = docNode.getChildNodes().map((x) => TestHelpers.getDocNodeSnapshot(x)!);
    }

    return item;
  }

  private static _getTokenCoverageGapsSnapshot(parserContext: ParserContext): string[] {
    const tokenCoverageChecker: TokenCoverageChecker = new TokenCoverageChecker(parserContext);
    return tokenCoverageChecker.getGaps(parserContext.docComment).map((x) => x.toString());
  }
}
