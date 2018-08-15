import { TSDocParser } from '../TSDocParser';
import { TextRange } from '../TextRange';
import {
  DocNodeKind,
  DocErrorText,
  DocNode,
  DocComment
} from '../../nodes';
import { ParserContext } from '../ParserContext';
import { Excerpt } from '../Excerpt';
import { TSDocParserConfiguration } from '../TSDocParserConfiguration';

interface ISnapshotItem {
  kind: string;
  errorMessage?: string;
  errorLocation?: string;
  errorLocationPrecedingToken?: string;
  nodePrefix?: string;
  nodeSuffix?: string;
  nodeSeparator?: string;
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
      rootNode: TestHelpers.getDocNodeSnapshot(parserContext.verbatimSection)
    }).toMatchSnapshot();
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
      _0_lines: parserContext.lines.map(x => TestHelpers.getEscaped(x.toString())),
      _1_summarySection: TestHelpers.getDocNodeSnapshot(docComment.summarySection),
      _2_remarksBlock: TestHelpers.getDocNodeSnapshot(docComment.remarksBlock),
      _3_customBlocks: docComment.customBlocks.map(x => TestHelpers.getDocNodeSnapshot(x)),
      _4_paramBlocks: docComment.paramBlocks.map(x => TestHelpers.getDocNodeSnapshot(x)),
      _5_returnsBlock: TestHelpers.getDocNodeSnapshot(docComment.returnsBlock),
      _6_modifierTags: docComment.modifierTagSet.nodes.map(x => TestHelpers.getDocNodeSnapshot(x)),
      _7_errors: parserContext.parseErrors.map(x => x.message)
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
      kind: DocNodeKind[docNode.kind]
    };

    if (docNode.excerpt) {
      const excerpt: Excerpt = docNode.excerpt;
      item.nodePrefix = TestHelpers.getEscaped(excerpt.prefix.toString());
      if (!excerpt.suffix.isEmpty()) {
        item.nodeSuffix = TestHelpers.getEscaped(excerpt.suffix.toString());
      }
      if (!excerpt.separator.isEmpty()) {
        item.nodeSeparator = TestHelpers.getEscaped(excerpt.separator.toString());
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
}
