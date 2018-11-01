import { DocNodeKind, DocNode, IDocNodeParameters, IDocNodeParsedParameters } from './DocNode';
import { StringChecks } from '../parser/StringChecks';
import { TokenSequence } from '../parser/TokenSequence';
import { DocExcerpt, ExcerptKind } from './DocExcerpt';

/**
 * Constructor parameters for {@link DocBlockTag}.
 */
export interface IDocBlockTagParameters extends IDocNodeParameters {
  tagName: string;
}

/**
 * Constructor parameters for {@link DocBlockTag}.
 */
export interface IDocBlockTagParsedParameters extends IDocNodeParsedParameters {
  tagName: string;
  tagNameExcerpt: TokenSequence;
}

/**
 * Represents a TSDoc block tag such as `@param` or `@public`.
 */
export class DocBlockTag extends DocNode {
  /** @override */
  public readonly kind: DocNodeKind = DocNodeKind.BlockTag;

  private readonly _tagName: string;
  private readonly _tagNameWithUpperCase: string;
  private readonly _tagNameExcerpt: DocExcerpt | undefined;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocBlockTagParameters | IDocBlockTagParsedParameters) {
    super(parameters);

    StringChecks.validateTSDocTagName(parameters.tagName);
    this._tagName = parameters.tagName;
    this._tagNameWithUpperCase = parameters.tagName.toUpperCase();

    if (DocNode.isParsedParameters(parameters)) {
      this._tagNameExcerpt = new DocExcerpt({
        configuration: this.configuration,
        excerptKind: ExcerptKind.BlockTag,
        content: parameters.tagNameExcerpt
      });
    }
  }

  /**
   * The TSDoc tag name.  TSDoc tag names start with an at-sign ("@") followed
   * by ASCII letters using "camelCase" capitalization.
   */
  public get tagName(): string {
    return this._tagName;
  }

  /**
   * The TSDoc tag name in all capitals, which is used for performing
   * case-insensitive comparisons or lookups.
   */
  public get tagNameWithUpperCase(): string {
    return this._tagNameWithUpperCase;
  }

  /** @override */
  protected onGetChildNodes(): ReadonlyArray<DocNode | undefined> {
    return [
      this._tagNameExcerpt
    ];
  }

  public getTokenSequence(): TokenSequence {
    if (!this._tagNameExcerpt) {
      throw new Error('DocBlockTag.getTokenSequence() failed because this object did not'
        + ' originate from a parsed input');
    }
    return this._tagNameExcerpt.content;
  }
}
