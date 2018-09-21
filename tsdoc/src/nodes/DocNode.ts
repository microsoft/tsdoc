import { Excerpt } from '../parser/Excerpt';

/**
 * Indicates the type of {@link DocNode}.
 */
export const enum DocNodeKind {
  Block = 'Block',
  BlockTag = 'BlockTag',
  CodeFence = 'CodeFence',
  CodeSpan = 'CodeSpan',
  Comment = 'Comment',
  DeclarationReference = 'DeclarationReference',
  ErrorText = 'ErrorText',
  EscapedText = 'EscapedText',
  HtmlAttribute = 'HtmlAttribute',
  HtmlEndTag = 'HtmlEndTag',
  HtmlStartTag = 'HtmlStartTag',
  InlineTag = 'InlineTag',
  MemberReference = 'MemberReference',
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
  excerpt?: Excerpt;
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
   * If this DocNode was created by parsing an input, the `DocNode.excerpt`
   * property can be used to track the associated input text.  This can be useful
   * for highlighting matches during refatoring or highlighting error locations.
   */
  public excerpt: Excerpt | undefined = undefined;

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
    this.excerpt = parameters.excerpt;
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
