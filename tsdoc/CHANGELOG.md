# Change Log - @microsoft/tsdoc

This log was last generated on Wed, 17 Oct 2018 13:41:54 GMT and should not be manually modified.

## 0.9.2
Wed, 17 Oct 2018 13:41:54 GMT

### Patches

- Fix stack overflow in DocFencedCode.language property getter

## 0.9.1
Wed, 17 Oct 2018 12:49:01 GMT

### Patches

- Fix a regression where the paragraph splitter was sometimes skipping blocks

## 0.9.0
Wed, 17 Oct 2018 04:47:19 GMT

### Minor changes

- (API change) Change `DocBlock` to have a `DocSection` property rather than inheriting from `DocSection`; this eliminates confusion about which nodes belong to the container
- (API change) Rename `DocParticle` to `DocExcerpt`, and eliminate the `Excerpt` class
- (API change) Eliminate `DocNodeLeaf`, since now `DocExcerpt` is the only class that can represent excerpts
- (API change) Remove `DocNode.updateParameters()` because it is no longer needed
- (API change) Spacing is now represented as a normal `DocExcerpt`, rather than via a special `Excerpt.spacingAfterContent`
- (API change) Simplify `DocNodeTransforms.trimSpacesInParagraph()` to no longer merge/remap excerpts during the transformation. If we need this information, we will track it differently.

## 0.8.1
Sun, 07 Oct 2018 06:30:34 GMT

### Patches

- Improve error reporting for declaration references that are probably missing a `"#"` delimiter
- Rename `DocCodeFence` to `DocFencedCode`

## 0.8.0
Wed, 03 Oct 2018 02:43:47 GMT

### Minor changes

- Introduce a distinction between "defined" tags (i.e. recognized) versus "supported" tags (i.e. implemented by the tool)
- The parser optionally reports usage of undefined tags
- The parser optionally reports usage of unsupported tags
- The parser reports usage of inline/block syntax that is inconsistent with the tag definition
- Code spans are now allowed to be adjacent to other text, but must contain at least one character
- An `@deprecated` block must contain a deprecation message
- If `@inheritDoc` is used, then the summary section must be empty, and there must not be an `@remarks` block

## 0.7.0
Tue, 02 Oct 2018 02:35:35 GMT

### Minor changes

- Add support for `@defaultValue` tag
- Add support for `@typeParam` tag

## 0.6.0
Mon, 01 Oct 2018 22:11:24 GMT

### Minor changes

- Add support for `@link` tags using the new declaration reference syntax
- Add support for `@inheritDoc` tags
- Add new APIs: `DocDeclarationReference`, `DocInheritDocTag`, `DocLinkTag`, `DocMemberIdentifier`, `DocMemberReference`, `DocMemberSelector`, `DocMemberSymbol`
- Remove `ParserContext.verbatimNodes`
- Add `DocParticle.particleId` property

## 0.5.0
Tue, 25 Sep 2018 03:04:06 GMT

### Minor changes

- Add a new API `DocNode.updateParameters()` that allows a `DocNode` object to be updated after it was created; the tree nodes are no longer immutable
- Add `DocNodeTransforms.trimSpacesInParagraphNodes()` for collapsing whitespace inside `DocParagraph` subtrees
- Extract the `DocNode.excerpt` property into a new abstract base class `DocNodeLeaf`

## 0.4.1
Fri, 31 Aug 2018 03:32:18 GMT

### Patches

- Improve the error location reporting for DocErrorText objects
- Separate the **api-demo** sample into a "simple" scenario which parses a simple text string, and an "advanced" scenario which uses the TypeScript compiler API to extract comments and parse custom TSDoc tags

## 0.4.0
Tue, 28 Aug 2018 03:17:20 GMT

### Minor changes

- Rename `DocCodeSpan.text` to `DocCodeSpan.code` and model the delimiters using particles
- Add support for code fences (`DocCodeFence`)
- `DocSection` content is now grouped into `DocParagraph` nodes; blank lines are used to indicate paragraph boundaries
- Rename `DocComment.deprecated` to `deprecatedBlock`

## 0.3.0
Sat, 25 Aug 2018 05:53:56 GMT

### Minor changes

- Add TextRange.isEmpty()
- Improve the ModifierTagSet API
- Implement the @privateRemarks and @deprecated tags

## 0.2.0
Fri, 24 Aug 2018 01:19:56 GMT

### Minor changes

- Rename `CoreTags` to `StandardTags` so we can include non-core tags in the standard definitions
- Rename `CoreModifierTagSet` to `StandardModifierTagSet` and convert properties to functions
- Categorize the standard tags according to a `Standardization` enum, and document them
- Add more standard tag definitions: `@deprecated`, `@eventProperty`, `@example`, `@inheritDoc`, `@link`, `@override`, `@packageDocumentation`, `@public`, `@privateRemarks`, `@sealed`, `@virtual`
- Replace TSDocTagDefinition.singleton with TSDocTagDefinition.allowMultiple, since in practice most tags are single-usage

## 0.1.0
Thu, 16 Aug 2018 18:18:02 GMT

### Minor changes

- Initial release of the TSDoc library!  :-)

