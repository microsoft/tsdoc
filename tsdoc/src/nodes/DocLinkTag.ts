import { DocNodeKind, DocNode } from './DocNode';
import { DocDeclarationReference } from './DocDeclarationReference';
import {
  DocInlineTagBase,
  IDocInlineTagBaseParsedParameters,
  IDocInlineTagBaseParameters
} from './DocInlineTagBase';
import { DocExcerpt, ExcerptKind } from './DocExcerpt';
import { TokenSequence } from '../parser/TokenSequence';
import { StandardTags } from '../details/StandardTags';

/**
 * Constructor parameters for {@link DocLinkTag}.
 */
export interface IDocLinkTagParameters extends IDocInlineTagBaseParameters {
  codeDestination?: DocDeclarationReference;

  urlDestination?: string;

  linkText?: string;
}

/**
 * Constructor parameters for {@link DocLinkTag}.
 */
export interface IDocLinkTagParsedParameters extends IDocInlineTagBaseParsedParameters {
  codeDestination?: DocDeclarationReference;

  urlDestinationExcerpt?: TokenSequence;

  spacingAfterDestinationExcerpt?: TokenSequence;

  pipeExcerpt?: TokenSequence;
  spacingAfterPipeExcerpt?: TokenSequence;

  linkTextExcerpt?: TokenSequence;
  spacingAfterLinkTextExcerpt?: TokenSequence;
}

/**
 * Represents an `{@link}` tag.
 */
export class DocLinkTag extends DocInlineTagBase {
  private readonly _codeDestination: DocDeclarationReference | undefined;

  private _urlDestination: string | undefined;
  private readonly _urlDestinationExcerpt: DocExcerpt | undefined;

  private readonly _spacingAfterDestinationExcerpt: DocExcerpt | undefined;

  private readonly _pipeExcerpt: DocExcerpt | undefined;
  private readonly _spacingAfterPipeExcerpt: DocExcerpt | undefined;

  private _linkText: string | undefined;
  private readonly _spacingAfterLinkTextExcerpt: DocExcerpt | undefined;

  private readonly _linkTextExcerpt: DocExcerpt | undefined;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocLinkTagParameters | IDocLinkTagParsedParameters) {
    super(parameters);

    if (!StandardTags.link.hasTagName(this.tagNameWithUpperCase)) {
      throw new Error('DocLinkTag requires the tag name to be "{@link}"');
    }

    this._codeDestination = parameters.codeDestination;

    if (DocNode.isParsedParameters(parameters)) {
      if (parameters.codeDestination !== undefined && parameters.urlDestinationExcerpt !== undefined) {
        throw new Error('Either the codeDestination or the urlDestination may be specified, but not both');
      }

      if (parameters.urlDestinationExcerpt) {
        this._urlDestinationExcerpt = new DocExcerpt({
          configuration: this.configuration,
          excerptKind: ExcerptKind.LinkTag_UrlDestination,
          content: parameters.urlDestinationExcerpt
        });
      }
      if (parameters.spacingAfterDestinationExcerpt) {
        this._spacingAfterDestinationExcerpt = new DocExcerpt({
          configuration: this.configuration,
          excerptKind: ExcerptKind.Spacing,
          content: parameters.spacingAfterDestinationExcerpt
        });
      }

      if (parameters.pipeExcerpt) {
        this._pipeExcerpt = new DocExcerpt({
          configuration: this.configuration,
          excerptKind: ExcerptKind.LinkTag_Pipe,
          content: parameters.pipeExcerpt
        });
      }
      if (parameters.spacingAfterPipeExcerpt) {
        this._spacingAfterPipeExcerpt = new DocExcerpt({
          configuration: this.configuration,
          excerptKind: ExcerptKind.Spacing,
          content: parameters.spacingAfterPipeExcerpt
        });
      }

      if (parameters.linkTextExcerpt) {
        this._linkTextExcerpt = new DocExcerpt({
          configuration: this.configuration,
          excerptKind: ExcerptKind.LinkTag_LinkText,
          content: parameters.linkTextExcerpt
        });
      }
      if (parameters.spacingAfterLinkTextExcerpt) {
        this._spacingAfterLinkTextExcerpt = new DocExcerpt({
          configuration: this.configuration,
          excerptKind: ExcerptKind.Spacing,
          content: parameters.spacingAfterLinkTextExcerpt
        });
      }
    } else {
      if (parameters.codeDestination !== undefined && parameters.urlDestination !== undefined) {
        throw new Error('Either the codeDestination or the urlDestination may be specified, but not both');
      }

      this._urlDestination = parameters.urlDestination;
      this._linkText = parameters.linkText;
    }

  }

  /** @override */
  public get kind(): DocNodeKind | string {
    return DocNodeKind.LinkTag;
  }

  /**
   * If the link tag refers to a declaration, this returns the declaration reference object;
   * otherwise this property is undefined.
   * @remarks
   * Either the `codeDestination` or the `urlDestination` property will be defined, but never both.
   */
  public get codeDestination(): DocDeclarationReference | undefined {
    return this._codeDestination;
  }

  /**
   * If the link tag was an ordinary URI, this returns the URL string;
   * otherwise this property is undefined.
   * @remarks
   * Either the `codeDestination` or the `urlDestination` property will be defined, but never both.
   */
  public get urlDestination(): string | undefined {
    if (this._urlDestination === undefined) {
      if (this._urlDestinationExcerpt !== undefined) {
        this._urlDestination = this._urlDestinationExcerpt.content.toString();
      }
    }
    return this._urlDestination;
  }

  /**
   * An optional text string that is the hyperlink text.  If omitted, the documentation
   * renderer will use a default string based on the link itself (e.g. the URL text
   * or the declaration identifier).
   *
   * @remarks
   *
   * In HTML, the hyperlink can include leading/trailing space characters around the link text.
   * For example, this HTML will cause a web browser to `y` and also the space character before
   * and after it:
   *
   * ```html
   * x<a href="#Button"> y </a> z
   * ```
   *
   * Unlike HTML, TSDoc trims leading/trailing spaces.  For example, this TSDoc will be
   * displayed `xy z` and underline only the `y` character:
   *
   * ```
   * x{@link Button | y } z
   * ```
   */
  public get linkText(): string | undefined {
    if (this._linkText === undefined) {
      if (this._linkTextExcerpt !== undefined) {
        this._linkText = this._linkTextExcerpt.content.toString();
      }
    }
    return this._linkText;
  }

  /** @override */
  protected getChildNodesForContent(): ReadonlyArray<DocNode | undefined> { // abstract
    return [
      this._codeDestination,
      this._urlDestinationExcerpt,
      this._spacingAfterDestinationExcerpt,
      this._pipeExcerpt,
      this._spacingAfterPipeExcerpt,
      this._linkTextExcerpt,
      this._spacingAfterLinkTextExcerpt
    ];
  }
}
