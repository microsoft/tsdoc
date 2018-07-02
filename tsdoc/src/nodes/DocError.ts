import { DocNodeLeaf, DocNodeKind, IDocNodeLeafParameters } from './DocNode';
import { TextRange } from '../parser/TextRange';

/**
 * Constructor parameters for {@link DocError}.
 */
export interface IDocErrorParameters extends IDocNodeLeafParameters {
  errorMessage: string;
  errorLocation: TextRange;
  errorDocCommentLine: TextRange;
}

/**
 * Represents a span of comment text that contained invalid markup.
 * The characters should be rendered as plain text.
 */
export class DocError extends DocNodeLeaf {
  /** {@inheritdoc} */
  public readonly kind: DocNodeKind = DocNodeKind.Error;

  /**
   * A description of why the character could not be parsed.
   */
  public readonly errorMessage: string;

  /**
   * The range of characters that caused the error.  In general these may be
   * somewhat farther ahead in the input stream from the DocError node itself.
   *
   * @remarks
   * For example, for the malformed HTML tag `<a href="123 /a>`, the DocError node
   * will correspond to the `<` character that looked like an HTML tag, whereas the
   * error location will be the `"` character that was missing its closing pair.
   */
  public readonly errorLocation: TextRange;

  /**
   * The virtual line inside the doc comment that the errorLocation was extracted from.
   * Note that this line excludes prefixes (e.g. doc comment delimiters) and suffixes
   * (e.g. trailing whitespace).
   */
  public readonly errorDocCommentLine: TextRange;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocErrorParameters) {
    super(parameters);
    this.errorMessage = parameters.errorMessage;
    this.errorLocation = parameters.errorLocation;
    this.errorDocCommentLine = parameters.errorDocCommentLine;
  }
}
