import { TSDocParser } from '../TSDocParser';
import { TextRange } from '../TextRange';
import {
  DocNode,
  DocComment,
  DocNodeKind,
  DocNodeContainer,
  DocNodeLeaf,
  DocError
} from '../../nodes';

interface ISnapshotItem {
  error?: string;
  failLine?: string;
  failSpan?: string;
  kind: string;
  nodes?: ISnapshotItem[];
  lineIndex?: number;
  nodeLine?: string;
  nodeSpan?: string;
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
    const docComment: DocComment = tsdocParser.parseString(buffer);

    expect({
      buffer: TestHelpers.getEscaped(buffer),
      lines: docComment.lines.map(x => TestHelpers.getEscaped(x.toString())),
      rootNode: TestHelpers._getNodeSnapshot(docComment, docComment.lines)
    }).toMatchSnapshot();
  }

  private static _getNodeSnapshot(docNode: DocNode, lines: TextRange[]): ISnapshotItem {
    const item: ISnapshotItem = {
      kind: DocNodeKind[docNode.kind]
    };

    if (docNode instanceof DocNodeContainer) {
      item.nodes = docNode.getChildNodes().map(x => TestHelpers._getNodeSnapshot(x, lines));
    } else if (docNode instanceof DocNodeLeaf) {
      item.lineIndex = lines.indexOf(docNode.docCommentLine);
      item.nodeLine = '>' + TestHelpers.getEscaped(docNode.docCommentLine.toString()) + '<';
      item.nodeSpan = TestHelpers.formatLineSpan(docNode.docCommentLine, docNode.range);

      if (docNode instanceof DocError) {
        item.error = docNode.errorMessage;
        item.failLine = '>' + TestHelpers.getEscaped(docNode.errorDocCommentLine.toString()) + '<';
        item.failSpan = TestHelpers.formatLineSpan(docNode.errorDocCommentLine, docNode.errorLocation);
      }
    } else {
      throw new Error('Unsupported node type');
    }
    return item;
  }
}
