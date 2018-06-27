import { DocNode, DocNodeKind, IDocNodeParameters } from './DocNode';

/**
 * Constructor parameters for {@link DocPlainText}.
 */
export interface IDocPlainTextParameters extends IDocNodeParameters {
}

/**
 * Represents a span of comment text that is considered by the parser
 * to contain no special symbols  or meaning.
 */
export class DocPlainText extends DocNode {
  /** {@inheritdoc} */
  public readonly kind: DocNodeKind = DocNodeKind.PlainText;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocPlainTextParameters) {
    super(parameters);
  }
}
