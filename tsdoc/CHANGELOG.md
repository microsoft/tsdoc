# Change Log - @microsoft/tsdoc

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
