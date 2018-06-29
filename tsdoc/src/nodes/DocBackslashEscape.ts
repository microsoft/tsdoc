import { DocNode, DocNodeKind, IDocNodeParameters } from './DocNode';

/**
 * Constructor parameters for {@link DocBackslashEscape}.
 */
export interface IDocBackslashEscapeParameters extends IDocNodeParameters {
}

/**
 * Represents a text character that is preceded by a backslash in order to remove
 * any special meaning that it might have as a TSDoc symbol.
 */
export class DocBackslashEscape extends DocNode {
  /** {@inheritdoc} */
  public readonly kind: DocNodeKind = DocNodeKind.BackslashEscape;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocBackslashEscapeParameters) {
    super(parameters);
  }
}
