import { TextRange } from '../parser/TextRange';
import { ParseError } from '../parser/ParseError';
import { DocNodeContainer, DocNodeKind, IDocNodeContainerParameters } from './DocNode';
import { ParserContext } from '../parser/ParserContext';

/**
 * Constructor parameters for {@link DocComment}.
 */
export interface IDocCommentParameters extends IDocNodeContainerParameters {
  parserContext: ParserContext;
}

/**
 * Represents an entire parsed documentation comment.  This is typically the
 * root of the expression tree returned by the parser.
 */
export class DocComment extends DocNodeContainer {

  /** {@inheritdoc} */
  public readonly kind: DocNodeKind = DocNodeKind.Comment;

  /**
   * The `sourceRange` indicates the start and end of the original input that was parsed.
   */
  public readonly sourceRange: TextRange;

  /**
   * The text range starting from the opening `/**` and ending with
   * the closing `*\/` delimiter.
   */
  public readonly commentRange: TextRange;

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

    this.sourceRange = parameters.parserContext.sourceRange;
    this.commentRange = parameters.parserContext.commentRange;
    this.lines = parameters.parserContext.lines;
    this.parseErrors = parameters.parserContext.parseErrors;
  }
}
