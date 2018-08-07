import { DocNode, DocNodeKind, IDocNodeParameters } from './DocNode';
import { ParserContext } from '../parser/ParserContext';
import { DocSection } from './DocSection';

/**
 * Constructor parameters for {@link DocComment}.
 */
export interface IDocCommentParameters extends IDocNodeParameters {
  parserContext?: ParserContext;
}

/**
 * Represents an entire documentation comment conforming to the TSDoc structure.
 * This is the root of the DocNode tree.
 */
export class DocComment extends DocNode {

  /** {@inheritdoc} */
  public readonly kind: DocNodeKind = DocNodeKind.Comment;

  /**
   * The main documentation for an API item is separated into a brief "summary" section
   * followed by more detailed "remarks" section.  On a documentation web site, a table of
   * API item members will typically show only the summaries, whereas the detail page
   * for an API item will show the summary followed by the remarks and other sections.
   */
  public remarks: DocSection;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocCommentParameters) {
    super(parameters);

    this.remarks = new DocSection(parameters);
  }
}
