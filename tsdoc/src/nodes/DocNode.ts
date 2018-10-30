/**
 * Indicates the type of {@link DocNode}.
 *
 * @remarks
 * When creating custom subclasses of `DocNode`, it's recommended to create your own const enum to identify them.
 * To avoid naming conflicts between projects, the enum value should be a string comprised of your full
 * NPM package name, followed by a "#" symbol, followed by the class name (without the "Doc" prefix).
 */
export const enum DocNodeKind {
  Block                         = '@microsoft/tsdoc#Block',
  BlockTag                      = '@microsoft/tsdoc#BlockTag',
  Excerpt                       = '@microsoft/tsdoc#Excerpt',
  FencedCode                    = '@microsoft/tsdoc#FencedCode',
  CodeSpan                      = '@microsoft/tsdoc#CodeSpan',
  Comment                       = '@microsoft/tsdoc#Comment',
  DeclarationReference          = '@microsoft/tsdoc#DeclarationReference',
  ErrorText                     = '@microsoft/tsdoc#ErrorText',
  EscapedText                   = '@microsoft/tsdoc#EscapedText',
  HtmlAttribute                 = '@microsoft/tsdoc#HtmlAttribute',
  HtmlEndTag                    = '@microsoft/tsdoc#HtmlEndTag',
  HtmlStartTag                  = '@microsoft/tsdoc#HtmlStartTag',
  InheritDocTag                 = '@microsoft/tsdoc#InheritDocTag',
  InlineTag                     = '@microsoft/tsdoc#InlineTag',
  LinkTag                       = '@microsoft/tsdoc#LinkTag',
  MemberIdentifier              = '@microsoft/tsdoc#MemberIdentifier',
  MemberReference               = '@microsoft/tsdoc#MemberReference',
  MemberSelector                = '@microsoft/tsdoc#MemberSelector',
  MemberSymbol                  = '@microsoft/tsdoc#MemberSymbol',
  Paragraph                     = '@microsoft/tsdoc#Paragraph',
  ParamBlock                    = '@microsoft/tsdoc#ParamBlock',
  ParamCollection               = '@microsoft/tsdoc#ParamCollection',
  PlainText                     = '@microsoft/tsdoc#PlainText',
  Section                       = '@microsoft/tsdoc#Section',
  SoftBreak                     = '@microsoft/tsdoc#SoftBreak'
}

/**
 * Constructor parameters for {@link DocNode}.
 *
 * @remarks
 * There are two scenarios for constructing `DocNode` objects.  The "builder scenario" constructs the object based on
 * literal strings, does NOT create DocExcerpt child nodes, and generally uses the `IDocNodeParameters`
 * hierarchy for its constructor parameters.  The "parser scenario" constructs the object by parsing a TypeScript
 * source file, does create DocExcerpt child nodes, and generally uses the {@link IDocNodeParsedParameters} hierarchy.
 */
export interface IDocNodeParameters {
}

/**
 * Constructor parameters for {@link DocNode}.
 *
 * @remarks
 * There are two scenarios for constructing `DocNode` objects.  The "builder scenario" constructs the object based on
 * literal strings, does NOT create DocExcerpt child nodes, and generally uses the {@link IDocNodeParameters}
 * hierarchy for its constructor parameters.  The "parser scenario" constructs the object by parsing a TypeScript
 * source file, does create DocExcerpt child nodes, and generally uses the `IDocNodeParsedParameters` hierarchy.
 */
export interface IDocNodeParsedParameters {
  /**
   * This is a marker used by {@link DocNode.isParsedParameters} to determine whether the constructor was
   * invoked using `IDocNodeParameters` (builder scenario) or `IDocNodeParsedParameters` (parser scenario).
   */
  parsed: true;
}

/**
 * The base class for the parser's Abstract Syntax Tree nodes.
 */
export abstract class DocNode {
  /**
   * Indicates the kind of DocNode.
   */
  public abstract readonly kind: DocNodeKind | string;

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
   * Overridden by child classes to implement {@link DocNode.getChildNodes}.
   * @virtual
   */
  protected onGetChildNodes(): ReadonlyArray<DocNode | undefined> {
    return [];
  }

  /**
   * A type guard that returns true if the input uses the `IDocNodeParsedParameters` (parser scenario).
   *
   * @remarks
   * There are two scenarios for constructing `DocNode` objects.  The "builder scenario" constructs the object based on
   * literal strings, does NOT create DocExcerpt child nodes, and generally uses the {@link IDocNodeParameters}
   * hierarchy for its constructor parameters.  The "parser scenario" constructs the object by parsing a TypeScript
   * source file, does create DocExcerpt child nodes, and generally uses the {@link IDocNodeParsedParameters} hierarchy.
   */
  public static isParsedParameters(parameters: IDocNodeParameters | IDocNodeParsedParameters):
    parameters is IDocNodeParsedParameters {

    return (parameters as IDocNodeParsedParameters).parsed === true;
  }
}
