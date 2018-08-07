import { DocNode, DocNodeKind, IDocNodeParameters } from './DocNode';
import { TextRange } from '../parser/TextRange';

/**
 * Constructor parameters for {@link DocErrorText}.
 */
export interface IDocErrorTextParameters extends IDocNodeParameters {
  text: string;
  errorMessage: string;
  errorLocation: TextRange;
  errorDocCommentLine: TextRange;
}

/**
 * Represents a span of text that contained invalid markup.
 * The characters should be rendered as plain text.
 */
export class DocErrorText extends DocNode {
  /** {@inheritdoc} */
  public readonly kind: DocNodeKind = DocNodeKind.ErrorText;

  /**
   * The characters that should be rendered as plain text because they
   * could not be parsed successfully.
   */
  public readonly text: string;

  /**
   * A description of why the character could not be parsed.
   */
  public readonly errorMessage: string;

  /**
   * The range of characters that caused the error.  In general these may be
   * somewhat farther ahead in the input stream from the DocErrorText node itself.
   *
   * @remarks
   * For example, for the malformed HTML tag `<a href="123 /a>`, the DocErrorText node
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
  public constructor(parameters: IDocErrorTextParameters) {
    super(parameters);
    this.text = parameters.text;
    this.errorMessage = parameters.errorMessage;
    this.errorLocation = parameters.errorLocation;
    this.errorDocCommentLine = parameters.errorDocCommentLine;
  }
}
