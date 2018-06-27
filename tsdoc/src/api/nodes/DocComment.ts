import { TextRange } from '../TextRange';
import { ParseError } from '../ParseError';
import { DocNode, DocNodeKind, IDocNodeParameters } from './DocNode';

/**
 * Constructor parameters for {@link DocComment}.
 */
export interface IDocCommentParameters extends IDocNodeParameters {
  /** {@inheritdoc DocComment.sourceRange} */
  sourceRange: TextRange;

  /** {@inheritdoc DocComment.lines} */
  lines: TextRange[];

  /** {@inheritdoc DocComment.parseErrors} */
  parseErrors: ParseError[];
}

/**
 * Represents an entire parsed documentation comment.  This is typically the
 * root of the expression tree returned by the parser.
 */
export class DocComment extends DocNode {

  /** {@inheritdoc} */
  public readonly kind: DocNodeKind = DocNodeKind.Comment;

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
    super(parameters);

    this.sourceRange = parameters.sourceRange;

    this.lines = parameters.lines;
    this.parseErrors = parameters.parseErrors;
  }
}
