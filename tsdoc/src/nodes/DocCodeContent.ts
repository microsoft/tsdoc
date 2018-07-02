import { DocNodeContainer, DocNodeKind, IDocNodeContainerParameters } from './DocNode';

/**
 * Constructor parameters for {@link DocCodeContent}.
 */
export interface IDocCodeContentParameters extends IDocNodeContainerParameters {
}

/**
 * Represents the content of a code span or code fence.
 */
export class DocCodeContent extends DocNodeContainer {
  /** {@inheritdoc} */
  public readonly kind: DocNodeKind = DocNodeKind.CodeContent;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocCodeContentParameters) {
    super(parameters);
  }
}
