# Change Log - @microsoft/tsdoc

## 0.8.1
- Improve error reporting for declaration references that are probably missing a `"#"` delimiter
- Rename `DocCodeFence` to `DocFencedCode`

## 0.8.0
- Introduce a distinction between "defined" tags (i.e. recognized) versus "supported" tags (i.e. implemented by the tool)
- The parser optionally reports usage of undefined tags
- The parser optionally reports usage of unsupported tags
- The parser reports usage of inline/block syntax that is inconsistent with the tag definition
- Code spans are now allowed to be adjacent to other text, but must contain at least one character
- An `@deprecated` block must contain a deprecation message
- If `@inheritDoc` is used, then the summary section must be empty, and there must not be an `@remarks` block

## 0.7.0
- Add support for `@defaultValue` tag
- Add support for `@typeParam` tag

## 0.6.0
- Add support for `@link` tags using the new declaration reference syntax
- Add support for `@inheritDoc` tags
- Add new APIs: `DocDeclarationReference`, `DocInheritDocTag`, `DocLinkTag`, `DocMemberIdentifier`, `DocMemberReference`, `DocMemberSelector`, `DocMemberSymbol`
- Remove `ParserContext.verbatimNodes`
- Add `DocParticle.particleId` property

## 0.5.0
- Add a new API `DocNode.updateParameters()` that allows a `DocNode` object to be updated after it was created; the tree nodes are no longer immutable
- Add `DocNodeTransforms.trimSpacesInParagraphNodes()` for collapsing whitespace inside `DocParagraph` subtrees
- Extract the `DocNode.excerpt` property into a new abstract base class `DocNodeLeaf`

## 0.4.1
Mon, 30 Aug 2018

- Improve the error location reporting for DocErrorText objects
- Separate the **api-demo** sample into a "simple" scenario which parses a simple text string, and an "advanced" scenario which uses the TypeScript compiler API to extract comments and parse custom TSDoc tags

## 0.4.0
Mon, 27 Aug 2018

- Rename `DocCodeSpan.text` to `DocCodeSpan.code` and model the delimiters using particles
- Add support for code fences (`DocCodeFence`)
- `DocSection` content is now grouped into `DocParagraph` nodes; blank lines are used to indicate paragraph boundaries
- Rename `DocComment.deprecated` to `deprecatedBlock`

## 0.3.0
Fri, 24 Aug 2018

- Add TextRange.isEmpty()
- Improve the ModifierTagSet API
- Implement the @privateRemarks and @deprecated tags

## 0.2.0
Thu, 23 Aug 2018

- Rename `CoreTags` to `StandardTags` so we can include non-core tags in the standard definitions
- Rename `CoreModifierTagSet` to `StandardModifierTagSet` and convert properties to functions
- Categorize the standard tags according to a `Standardization` enum, and document them
- Add more standard tag definitions: `@deprecated`, `@eventProperty`, `@example`, `@inheritDoc`, `@link`, `@override`, `@packageDocumentation`, `@public`, `@privateRemarks`, `@sealed`, `@virtual`
- Replace TSDocTagDefinition.singleton with TSDocTagDefinition.allowMultiple, since in practice most tags are single-usage

## 0.1.0
Thu, 16 Aug 2018

- Initial release of the TSDoc library!  :-)
