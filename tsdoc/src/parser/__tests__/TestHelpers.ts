import { TSDocParser } from '../TSDocParser';
import { TextRange } from '../TextRange';
import {
  DocNode,
  DocNodeKind,
  DocErrorText
} from '../../nodes';
import { ParserContext } from '../ParserContext';
import { Excerpt } from '../Excerpt';

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

  // Workaround various characters that get ugly escapes in Jest snapshots
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

  public static parseAndMatchSnapshot(buffer: string): void {
    const tsdocParser: TSDocParser = new TSDocParser();
    const parserContext: ParserContext = tsdocParser.parseString(buffer);

    expect({
      buffer: TestHelpers.getEscaped(buffer),
      lines: parserContext.lines.map(x => TestHelpers.getEscaped(x.toString())),
      rootNode: TestHelpers._getNodeSnapshot(parserContext.docComment, parserContext.lines)
    }).toMatchSnapshot();
  }

  private static _getNodeSnapshot(docNode: DocNode, lines: TextRange[]): ISnapshotItem {
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
      if (docNode.errorLocation.pos > 0) {
        // Show the preceding token to provide some context (e.g. is this the opening quote
        // or closing quote?)
        item.errorLocationPrecedingToken = docNode.errorLocation.parserContext.tokens[
          docNode.errorLocation.pos - 1].toString();
      }
    }

    if (docNode.getChildNodes().length > 0) {
      item.nodes = docNode.getChildNodes().map(x => TestHelpers._getNodeSnapshot(x, lines));
    }

    return item;
  }
}
