// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

export {
  DocNodeManager,
  type IDocNodeDefinition,
  type DocNodeConstructor
} from './configuration/DocNodeManager';
export { TSDocConfiguration } from './configuration/TSDocConfiguration';
export {
  type ITSDocTagDefinitionParameters,
  TSDocTagSyntaxKind,
  TSDocTagDefinition
} from './configuration/TSDocTagDefinition';
export { TSDocValidationConfiguration } from './configuration/TSDocValidationConfiguration';

export { StandardTags } from './details/StandardTags';
export { Standardization } from './details/Standardization';
export { StandardModifierTagSet } from './details/StandardModifierTagSet';
export { ModifierTagSet } from './details/ModifierTagSet';

export { PlainTextEmitter } from './emitters/PlainTextEmitter';
export { StringBuilder, type IStringBuilder } from './emitters/StringBuilder';
export { TSDocEmitter } from './emitters/TSDocEmitter';

export * from './nodes';

export { ParserContext } from './parser/ParserContext';
export { ParserMessage, type IParserMessageParameters } from './parser/ParserMessage';
export { ParserMessageLog } from './parser/ParserMessageLog';
export { TextRange, type ITextLocation } from './parser/TextRange';
export { Token, TokenKind } from './parser/Token';
export { TokenSequence, type ITokenSequenceParameters } from './parser/TokenSequence';
export { TSDocMessageId } from './parser/TSDocMessageId';
export { TSDocParser } from './parser/TSDocParser';

export { DocNodeTransforms } from './transforms/DocNodeTransforms';
