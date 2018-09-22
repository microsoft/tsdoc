/**
 * Indicates the type of {@link DocNode}.
 */
export const enum DocNodeKind {
  Block = 'Block',
  BlockTag = 'BlockTag',
  CodeFence = 'CodeFence',
  CodeSpan = 'CodeSpan',
  Comment = 'Comment',
  ErrorText = 'ErrorText',
  EscapedText = 'EscapedText',
  HtmlAttribute = 'HtmlAttribute',
  HtmlEndTag = 'HtmlEndTag',
  HtmlStartTag = 'HtmlStartTag',
  InlineTag = 'InlineTag',
  LinkTag = 'LinkTag',
  Particle = 'Particle',
  Paragraph = 'Paragraph',
  ParamBlock = 'ParamBlock',
  PlainText = 'PlainText',
  Section = 'Section',
  SoftBreak = 'SoftBreak'
}

/**
 * Constructor parameters for {@link DocNode}.
 */
export interface IDocNodeParameters {
}

/**
 * The base class for the parser's Abstract Syntax Tree nodes.
 */
export abstract class DocNode {
  private static _badSpacingRegExp: RegExp = /\S/;

  /**
   * Indicates the kind of DocNode.
   */
  public abstract readonly kind: DocNodeKind;

  /**
   * Returns the array with any undefined elements removed.
   */
  protected static trimUndefinedNodes(nodes: ReadonlyArray<DocNode | undefined>): ReadonlyArray<DocNode> {
    return nodes.filter(x => x) as ReadonlyArray<DocNode>;
  }

  protected static validateSpacing(spacing: string | undefined, parameterName: string): void {
    if (spacing) {
      const match: RegExpExecArray | null = DocNode._badSpacingRegExp.exec(spacing);
      if (match) {
        const badCharacter: string = match[0];
        throw new Error(`The "${parameterName}" value contains a non-whitespace character "${badCharacter}"`);
      }
    }
  }

  public constructor(parameters: IDocNodeParameters) {
    this.updateParameters(parameters);
  }

  /** @virtual */
  public updateParameters(parameters: IDocNodeParameters): void {
    // (virtual)
  }

  /**
   * Returns the list of child nodes for this node.  This is useful for visitors that want
   * to scan the tree looking for nodes of a specific type, without having to process
   * intermediary nodes.
   * @virtual
   */
  public getChildNodes(): ReadonlyArray<DocNode> {
    return [];
  }
}
