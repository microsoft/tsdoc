import { TextRange } from './TextRange';
import { ParseError } from './ParseError';

/**
 * Indicates the type of {@link DocNode}.
 */
export enum DocNodeKind {
  DocComment
}

/**
 * Represents a parsed documentation item.
 */
export abstract class DocNode {
  /**
   * Indicates the kind of DocNode.
   */
  public abstract readonly kind: DocNodeKind;

  public readonly range: TextRange;

  public constructor(range: TextRange) {
    this.range = range;
  }
}

/**
 * Constructor parameters for {@link DocComment}.
 */
export interface IDocCommentParameters {
  /** {@inheritdoc DocComment.text} */
  buffer: string;

  /** {@inheritdoc DocComment.sourceRange} */
  sourceRange: TextRange;

  /** {@inheritdoc DocComment.commentRange} */
  commentRange: TextRange;

  /** {@inheritdoc DocComment.lines} */
  lines: TextRange[];

  /** {@inheritdoc DocComment.parseErrors} */
  parseErrors: ParseError[];
}

/**
 * Represents a parsed documentation comment.
 */
export class DocComment extends DocNode {

  /** {@inheritdoc} */
  public readonly kind: DocNodeKind = DocNodeKind.DocComment;

  /**
   * The text buffer that the various TextRange objects refer to.
   */
  public readonly buffer: string;

  /**
   * Whereas {@link DocComment.range} tracks the start and end of the `/**` and `*\/` delimiters,
   * the `sourceRange` indicates the start and end of the original input that was parsed.
   */
  public readonly sourceRange: TextRange;

  /**
   * The text ranges corresponding to the lines of content inside the comment.
   */
  public readonly lines: TextRange[];

  /**
   * If any errors occurred during parsing, they are returned in this list.
   */
  public readonly parseErrors: ParseError[] = [];

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocCommentParameters) {
    super(parameters.commentRange);

    this.buffer = parameters.buffer;
    this.sourceRange = parameters.sourceRange;

    this.lines = parameters.lines;
    this.parseErrors = parameters.parseErrors;
  }
}
