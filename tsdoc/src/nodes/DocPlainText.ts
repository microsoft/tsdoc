import { DocNode, DocNodeKind, IDocNodeParameters } from './DocNode';

/**
 * Constructor parameters for {@link DocPlainText}.
 */
export interface IDocPlainTextParameters extends IDocNodeParameters {
  text: string;
}

/**
 * Represents a span of comment text that is considered by the parser
 * to contain no special symbols or meaning.
 */
export class DocPlainText extends DocNode {
  /** {@inheritdoc} */
  public readonly kind: DocNodeKind = DocNodeKind.PlainText;

  /**
   * The text content.
   */
  public readonly text: string;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocPlainTextParameters) {
    super(parameters);
    this.text = parameters.text;
  }
}
