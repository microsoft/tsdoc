import { TextRange } from '../TextRange';

/**
 * Indicates the type of {@link DocNode}.
 */
export enum DocNodeKind {
  DocComment,
  DocText
}

/**
 * Represents a parsed documentation item.
 */
export abstract class DocNode {
  /**
   * Indicates the kind of DocNode.
   */
  public abstract readonly kind: DocNodeKind;

  public readonly range: TextRange;

  public constructor(range: TextRange) {
    this.range = range;
  }
}
