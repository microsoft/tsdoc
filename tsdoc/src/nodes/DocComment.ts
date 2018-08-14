import { DocNode, DocNodeKind, IDocNodeParameters } from './DocNode';
import { ParserContext } from '../parser/ParserContext';
import { DocSection } from './DocSection';
import { CoreModifierTagSet } from '../details/CoreModifierTagSet';
import { DocParamSection } from './DocParamSection';

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
   * The modifier tags for this DocComment.
   */
  public readonly modifierTagSet: CoreModifierTagSet;

  /**
   * The main documentation for an API item is separated into a brief "summary" section,
   * optionally followed by more detailed "remarks" section.
   *
   * @remarks
   * The summary section should be brief. On a documentation web site, it will be shown
   * on a page that lists summaries for many different API items.  On a detail page for
   * a single item, the summary will be shown followed by the remarks section (if any).
   */
  public summarySection: DocSection;

  /**
   * The main documentation for an API item is separated into a brief "summary" section
   * followed by more detailed "remarks" section.
   *
   * @remarks
   * Unlike the summary, the remarks block may contain lengthy documentation content.
   * The remarks should not restate information from the summary, since the summary section
   * will always be displayed wherever the remarks section appears.  Other sections
   * (e.g. an `@example` block) will be shown after the remarks section.
   */
  public remarksSection: DocSection | undefined;

  /**
   * The collection of parsed `@param` blocks for this doc comment.
   */
  public paramSections: DocParamSection[];

  /**
   * The `@returns` block for this doc comment, or undefined if there is not one.
   */
  public returnsSection: DocSection | undefined;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocCommentParameters) {
    super(parameters);

    this.modifierTagSet = new CoreModifierTagSet();

    this.summarySection = new DocSection(parameters);
    this.remarksSection = undefined;
    this.paramSections = [];
    this.returnsSection = undefined;
  }

  /**
   * {@inheritdoc}
   * @override
   */
  public getChildNodes(): ReadonlyArray<DocNode> {
    const result: DocNode[] = [ this.summarySection ];

    if (this.remarksSection) {
      result.push(this.remarksSection);
    }

    result.push(...this.paramSections);

    if (this.returnsSection) {
      result.push(this.returnsSection);
    }

    result.push(...this.modifierTagSet.nodes);
    return result;
  }
}
