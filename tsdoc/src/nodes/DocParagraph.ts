import { DocNodeKind } from './DocNode';
import { DocNodeContainer, IDocNodeContainerParameters } from './DocNodeContainer';

/**
 * Constructor parameters for {@link DocParagraph}.
 */
export interface IDocParagraphParameters extends IDocNodeContainerParameters {
}

/**
 * Represents a paragraph of text, similar to a `<p>` element in HTML.
 * Like CommonMark, the TSDoc syntax uses blank lines to delineate paragraphs
 * instead of explicitly notating them.
 */
export class DocParagraph extends DocNodeContainer {
  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocParagraphParameters) {
    super(parameters);
  }

  /** @override */
  public get kind(): DocNodeKind | string {
    return DocNodeKind.Paragraph;
  }
}
