import { TextRange } from '../TextRange';

/**
 * Indicates the type of {@link DocNode}.
 */
export enum DocNodeKind {
  BackslashEscape,
  Comment,
  HtmlTag,
  PlainText
}

/**
 * Constructor parameters for DocNode.
 */
export interface IDocNodeParameters {
  range: TextRange;
}

/**
 * Represents a parsed documentation item.
 */
export abstract class DocNode {
  /**
   * Indicates the kind of DocNode.
   */
  public abstract readonly kind: DocNodeKind;

  /**
   * The text range corresponding to this documentation node.
   */
  public readonly range: TextRange;

  public constructor(parameters: IDocNodeParameters) {
    this.range = parameters.range;
  }
}
