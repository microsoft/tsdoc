import { DocNodeKind, IDocNodeParameters, DocNode } from './DocNode';

/**
 * Constructor parameters for {@link DocCodeSpan}.
 */
export interface IDocCodeSpanParameters extends IDocNodeParameters {
  text: string;
}

/**
 * Represents CommonMark-style code span, i.e. code surrounded by
 * backtick characters.
 */
export class DocCodeSpan extends DocNode {
  /** {@inheritdoc} */
  public readonly kind: DocNodeKind = DocNodeKind.CodeSpan;

  /**
   * The text that should be rendered as code, excluding the backtick delimiters.
   */
  public readonly text: string;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocCodeSpanParameters) {
    super(parameters);
    this.text = parameters.text;
  }
}
