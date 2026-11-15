// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { DocList, DocListItem, DocPlainText, type DocSection } from '../nodes';
import type { ParserContext } from './ParserContext';
import { TokenKind, type Token } from './Token';
import type { TokenReader } from './TokenReader';

interface IListFrame {
  list: DocList;
  item: DocListItem;
  parent: DocSection;
  indent: number;
  contentColumn: number;
}

interface IListMarker {
  ordered: boolean;
  start: number;
  width: number;
  endIndex: number;
}

/** Routes logical lines into list item sections while the normal parser reads their content. */
export class ListParser {
  private readonly _context: ParserContext;
  private readonly _frames: IListFrame[] = [];
  private _root: DocSection;
  private _section: DocSection;
  private _canStart: boolean = true;
  private _contentStart: number = -1;
  private _structuralLineBreakItem: DocListItem | undefined;

  public constructor(context: ParserContext) {
    this._context = context;
    this._root = this._section = context.docComment.summarySection;
  }

  /** The indentation removed from code fences in the active item. */
  public get contentColumn(): number {
    return this._frames.length ? this._frames[this._frames.length - 1].contentColumn : 0;
  }

  public isContentStart(reader: TokenReader): boolean {
    return reader.createMarker() === this._contentStart;
  }

  public noteContent(): void {
    this._canStart = false;
  }

  public consumeStructuralLineBreak(reader: TokenReader): boolean {
    if (!this._structuralLineBreakItem || reader.peekTokenKind() !== TokenKind.Newline) {
      return false;
    }
    reader.readToken();
    this._structuralLineBreakItem.addPrefixExcerpt(reader.extractAccumulatedSequence());
    this._structuralLineBreakItem = undefined;
    return true;
  }

  public startSection(section: DocSection): void {
    this._frames.length = 0;
    this._root = this._section = section;
    this._canStart = true;
    this._contentStart = -1;
    this._structuralLineBreakItem = undefined;
  }

  public prepareLine(reader: TokenReader, section: DocSection): DocSection {
    if (section !== this._section) {
      this.startSection(section);
    }
    const tokens: ReadonlyArray<Token> = reader.tokens;
    const begin: number = reader.createMarker();
    let index: number = begin;
    let spacing: string = '';
    if (tokens[index].kind === TokenKind.Spacing) {
      spacing = tokens[index++].toString();
    }
    const blank: boolean =
      tokens[index].kind === TokenKind.Newline || tokens[index].kind === TokenKind.EndOfInput;
    this._contentStart = -1;
    if (blank) {
      this._canStart = true;
      return this._section;
    }

    const indent: number = spacing.length;
    const marker: IListMarker | undefined =
      spacing.indexOf('\t') !== -1 ? undefined : this._readMarker(reader, index);
    let frame: IListFrame = this._frames[this._frames.length - 1];
    let sibling: boolean = false;
    while (frame) {
      if (marker && indent === frame.indent) {
        sibling = true;
        break;
      }
      if (spacing.indexOf('\t') === -1 && indent >= frame.contentColumn) {
        break;
      }
      this._frames.pop();
      this._section = frame.parent;
      frame = this._frames[this._frames.length - 1];
    }

    if (marker && (sibling || (frame ? indent === frame.contentColumn : this._canStart))) {
      let list: DocList;
      let parent: DocSection;
      if (sibling && frame.list.ordered === marker.ordered) {
        list = frame.list;
        parent = frame.parent;
        this._frames.pop();
      } else {
        parent = frame ? (sibling ? frame.parent : frame.item.content) : this._root;
        if (sibling) {
          this._frames.pop();
        }
        list = new DocList({
          configuration: this._context.configuration,
          ordered: marker.ordered,
          start: marker.start
        });
        parent.appendNode(list);
      }
      const item: DocListItem = new DocListItem({ configuration: this._context.configuration });
      list.appendNode(item);
      const contentColumn: number = indent + marker.width + 1;
      this._frames.push({ list, item, parent, indent, contentColumn });
      while (reader.createMarker() < marker.endIndex) {
        reader.readToken();
      }
      let extraSpacing: string = '';
      if (reader.peekTokenKind() === TokenKind.Spacing) {
        extraSpacing = reader.readToken().toString().slice(1);
      }
      const markerOnlyLine: boolean =
        reader.peekTokenKind() === TokenKind.Newline || reader.peekTokenKind() === TokenKind.EndOfInput;
      item.addPrefixExcerpt(reader.extractAccumulatedSequence());
      if (markerOnlyLine && reader.peekTokenKind() === TokenKind.Newline) {
        this._structuralLineBreakItem = item;
      } else if (extraSpacing) {
        item.content.appendNodeInParagraph(
          new DocPlainText({
            configuration: this._context.configuration,
            text: extraSpacing
          })
        );
      }
      this._section = item.content;
      this._contentStart = reader.createMarker();
    } else if (frame) {
      this._section = frame.item.content;
      if (index > begin) {
        reader.readToken();
        frame.item.addPrefixExcerpt(reader.extractAccumulatedSequence());
        const remaining: string = spacing.slice(frame.contentColumn);
        if (remaining) {
          this._section.appendNodeInParagraph(
            new DocPlainText({
              configuration: this._context.configuration,
              text: remaining
            })
          );
        }
      }
      this._contentStart = reader.createMarker();
    }
    this._canStart = false;
    return this._section;
  }

  private _readMarker(reader: TokenReader, index: number): IListMarker | undefined {
    const token: Token = reader.tokens[index];
    const text: string = token.toString();
    let ordered: boolean = false;
    let start: number = 1;
    let width: number = 1;
    let endIndex: number = index + 1;
    if (text !== '-' && text !== '+' && text !== '*') {
      if (!/^\d{1,9}$/.test(text) || reader.tokens[endIndex]?.kind !== TokenKind.Period) {
        return undefined;
      }
      ordered = true;
      start = Number(text);
      width = text.length + 1;
      endIndex++;
    }
    const following: Token = reader.tokens[endIndex];
    if (following.kind === TokenKind.Spacing) {
      if (following.toString().indexOf('\t') !== -1) {
        return undefined;
      }
    } else if (following.kind !== TokenKind.Newline && following.kind !== TokenKind.EndOfInput) {
      return undefined;
    }
    return { ordered, start, width, endIndex };
  }
}
