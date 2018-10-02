import { TSDocParser } from '../TSDocParser';
import { TextRange } from '../TextRange';
import {
  DocErrorText,
  DocNode,
  DocComment,
  DocPlainText,
  DocNodeLeaf,
  DocParticle
} from '../../nodes';
import { ParserContext } from '../ParserContext';
import { Excerpt } from '../Excerpt';
import { TSDocParserConfiguration } from '../TSDocParserConfiguration';
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

    const paddedSpace: string[]  = [ '',   ' ',  '  ',  '   ',  '    ' ];
    const paddedLArrow: string[] = [ '',   '>',  ' >',  '  >',  '   >' ];
    const paddedRArrow: string[] = [ '',   '<',  '< ',  '<  ',  '<   ' ];

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
    return s.replace(/\n/g, '[n]')
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
  public static parseAndMatchNodeParserSnapshot(buffer: string): void {
    const tsdocParser: TSDocParser = new TSDocParser();
    const parserContext: ParserContext = tsdocParser.parseString(buffer);

    expect({
      buffer: TestHelpers.getEscaped(buffer),
      lines: parserContext.lines.map(x => TestHelpers.getEscaped(x.toString())),
      logMessages: parserContext.log.messages.map(message => message.text),
      nodes: TestHelpers.getDocNodeSnapshot(parserContext.docComment),
      gaps: this._getTokenCoverageGapsSnapshot(parserContext)
    }).toMatchSnapshot();

    TestHelpers._getTokenCoverageGapsSnapshot(parserContext);
  }

  /**
   * Main harness for tests under `./details/*`.
   */
  public static parseAndMatchDocCommentSnapshot(buffer: string,
    configuration?: TSDocParserConfiguration): ParserContext {

    const tsdocParser: TSDocParser = new TSDocParser(configuration);
    const parserContext: ParserContext = tsdocParser.parseString(buffer);
    const docComment: DocComment = parserContext.docComment;

    expect({
      _00_lines: parserContext.lines.map(x => TestHelpers.getEscaped(x.toString())),
      _01_gaps: this._getTokenCoverageGapsSnapshot(parserContext),
      _02_summarySection: TestHelpers.getDocNodeSnapshot(docComment.summarySection),
      _03_remarksBlock: TestHelpers.getDocNodeSnapshot(docComment.remarksBlock),
      _04_privateRemarksBlock: TestHelpers.getDocNodeSnapshot(docComment.privateRemarks),
      _05_deprecatedBlock: TestHelpers.getDocNodeSnapshot(docComment.deprecatedBlock),
      _06_paramBlocks: docComment.paramBlocks.map(x => TestHelpers.getDocNodeSnapshot(x)),
      _07_typeParamBlocks: docComment.typeParamBlocks.map(x => TestHelpers.getDocNodeSnapshot(x)),
      _08_returnsBlock: TestHelpers.getDocNodeSnapshot(docComment.returnsBlock),
      _09_customBlocks: docComment.customBlocks.map(x => TestHelpers.getDocNodeSnapshot(x)),
      _10_inheritDocTag: TestHelpers.getDocNodeSnapshot(docComment.inheritDocTag),
      _11_modifierTags: docComment.modifierTagSet.nodes.map(x => TestHelpers.getDocNodeSnapshot(x)),
      _12_logMessages: parserContext.log.messages.map(message => message.text)
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

    if (docNode instanceof DocParticle) {
      item.kind += ': ' + docNode.particleId;
    }

    if (docNode instanceof DocNodeLeaf && docNode.excerpt) {
      const excerpt: Excerpt = docNode.excerpt;
      item.nodeExcerpt = TestHelpers.getEscaped(excerpt.content.toString());
      if (!excerpt.spacingAfterContent.isEmpty()) {
        item.nodeSpacing = TestHelpers.getEscaped(excerpt.spacingAfterContent.toString());
      }
    }

    if (docNode instanceof DocPlainText) {
      const docPlainText: DocPlainText = docNode as DocPlainText;
      const nodePlainText: string = TestHelpers.getEscaped(docPlainText.text);
      if (nodePlainText !== item.nodeExcerpt) {
        item.nodePlainText = nodePlainText;
      }
    }

    if (docNode instanceof DocErrorText) {
      item.errorMessage = TestHelpers.getEscaped(docNode.errorMessage);
      item.errorLocation = TestHelpers.getEscaped(docNode.errorLocation.toString());
      if (docNode.errorLocation.startIndex > 0) {
        // Show the preceding token to provide some context (e.g. is this the opening quote
        // or closing quote?)
        item.errorLocationPrecedingToken = docNode.errorLocation.parserContext.tokens[
          docNode.errorLocation.startIndex - 1].toString();
      }
    }

    if (docNode.getChildNodes().length > 0) {
      item.nodes = docNode.getChildNodes().map(x => TestHelpers.getDocNodeSnapshot(x)!);
    }

    return item;
  }

  private static _getTokenCoverageGapsSnapshot(parserContext: ParserContext): string[] {
    const tokenCoverageChecker: TokenCoverageChecker = new TokenCoverageChecker(parserContext);
    return tokenCoverageChecker.getGaps(parserContext.docComment).map(x => x.toString());
  }
}
