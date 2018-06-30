import { Token } from '../parser/Token';

/**
 * Indicates the type of {@link DocNode}.
 */
export enum DocNodeKind {
  BackslashEscape,
  Comment,
  HtmlTag,
  PlainText,
  Error
}

/**
 * Constructor parameters for DocNode.
 */
export interface IDocNodeParameters {
  tokens: Token[];
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
   * There is guaranteed to be at least one token for any DocNode.
   */
  public readonly tokens: Token[];

  public constructor(parameters: IDocNodeParameters) {
    for (const token of parameters.tokens) {
      if (token === undefined) {
        throw new Error('Token cannot be undefined');
      }
    }
    this.tokens = parameters.tokens;
  }
}
