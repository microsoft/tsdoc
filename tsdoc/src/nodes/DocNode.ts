import { Token } from '../parser/Token';
import { TextRange } from '../parser/TextRange';

/**
 * Indicates the type of {@link DocNode}.
 */
export enum DocNodeKind {
  BackslashEscape = 1001,
  Comment = 1002,
  Delimiter = 1003,
  Error = 1004,
  HtmlAttribute  = 1005,
  HtmlStartTag = 1006,
  HtmlString = 1007,
  Newline = 1008,
  PlainText = 1009,
  Spacing = 1010,
  Word = 1011
}

/**
 * The base class for the parser's Abstract Syntax Tree nodes.
 *
 * @remarks
 * A DocNode represents a contiguous sequence of characters from the
 * input source file.  Except for DocNewline, the DocNode objects will
 * never contain a newline character as part of their text range; they always
 * exist on a single line.
 */
export abstract class DocNode {
  /**
   * Indicates the kind of DocNode.
   */
  public abstract readonly kind: DocNodeKind;

  public getChildNodes(): ReadonlyArray<DocNode> {
    return [];
  }
}

/**
 * Constructor parameters for DocNode.
 */
export interface IDocNodeLeafParameters {
  tokens: Token[];
}

export abstract class DocNodeLeaf extends DocNode {
  public readonly range: TextRange;

  /**
   * The virtual line inside the doc comment that the range was
   * extracted from.  Note that this line excludes prefixes (e.g. doc comment
   * delimiters) and suffixes (e.g. trailing whitespace).
   */
  public readonly docCommentLine: TextRange;

  public constructor(parameters: IDocNodeLeafParameters) {
    super();

    if (parameters.tokens.length === 0) {
      // If this happens, it's a parser bug
      throw new Error('A leaf node must have at least one token');
    }
    const firstToken: Token = parameters.tokens[0];

    this.docCommentLine = firstToken.line;

    let pos: number = -1;
    let end: number = -1;

    for (const token of parameters.tokens) {
      if (token === undefined) {
        // If this happens, it's a parser bug
        throw new Error('Token cannot be undefined');
      }
      if (token.line !== this.docCommentLine) {
        // If this happens, it's a parser bug
        throw new Error('The tokens must all come from the same doc comment line');
      }

      if (pos < 0) {
        // The first token
        pos = token.range.pos;
      } else {
        if (token.range.pos !== end) {
          // If this happens, it's a parser bug
          throw new Error('Tokens must be contiguous');
        }
      }
      end = token.range.end;
    }
    this.range = firstToken.range.getNewRange(pos, end);
  }

  public toString(): string {
    if (this.kind === DocNodeKind.Newline) {
      return '\n';
    }
    return this.range.toString();
  }
}

/**
 * Constructor parameters for DocNodeContainer.
 */
export interface IDocNodeContainerParameters {
  childNodes: DocNode[];
}

/**
 * The base class for DocNode subclasses that act as a container for other
 * child nodes.  Container nodes are purely structural and should not have
 * any associated text characters.
 */
export abstract class DocNodeContainer extends DocNode {
  /**
   * The child nodes that belong to this container.
   */
  public readonly childNodes: ReadonlyArray<DocNode>;

  public constructor(parameters: IDocNodeContainerParameters) {
    super();

    this.childNodes = parameters.childNodes;
  }

  public getChildNodes(): ReadonlyArray<DocNode> {
    return this.childNodes;
  }

  public toString(): string {
    return this.getChildNodes().map(x => x.toString()).join('');
  }
}
