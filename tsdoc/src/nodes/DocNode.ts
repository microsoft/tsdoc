/**
 * Indicates the type of {@link DocNode}.
 */
export const enum DocNodeKind {
  Block = 'Block',
  BlockTag = 'BlockTag',
  Excerpt = 'Excerpt',
  FencedCode = 'FencedCode',
  CodeSpan = 'CodeSpan',
  Comment = 'Comment',
  DeclarationReference = 'DeclarationReference',
  ErrorText = 'ErrorText',
  EscapedText = 'EscapedText',
  HtmlAttribute = 'HtmlAttribute',
  HtmlEndTag = 'HtmlEndTag',
  HtmlStartTag = 'HtmlStartTag',
  InheritDocTag = 'InheritDocTag',
  InlineTag = 'InlineTag',
  LinkTag = 'LinkTag',
  MemberIdentifier = 'MemberIdentifier',
  MemberReference = 'MemberReference',
  MemberSelector = 'MemberSelector',
  MemberSymbol = 'MemberSymbol',
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
 * Constructor parameters for {@link DocNode}.
 */
export interface IDocNodeParsedParameters {
  parsed: true;
}

/**
 * The base class for the parser's Abstract Syntax Tree nodes.
 */
export abstract class DocNode {
  /**
   * Indicates the kind of DocNode.
   */
  public abstract readonly kind: DocNodeKind;

  public constructor(parameters: IDocNodeParameters | IDocNodeParsedParameters) {
    // (abstract)
  }

  /**
   * Returns the list of child nodes for this node.  This is useful for visitors that want
   * to scan the tree looking for nodes of a specific type, without having to process
   * intermediary nodes.
   */
  public getChildNodes(): ReadonlyArray<DocNode> {
    return this.onGetChildNodes().filter(x => x !== undefined) as ReadonlyArray<DocNode>;
  }

  /**
   * Used to implement {@link DocNode.getChildNodes}.
   * @virtual
   */
  protected onGetChildNodes(): ReadonlyArray<DocNode | undefined> {
    return [];
  }

  public static isParsedParameters(parameters: IDocNodeParameters | IDocNodeParsedParameters):
    parameters is IDocNodeParsedParameters {

    return (parameters as IDocNodeParsedParameters).parsed === true;
  }
}
