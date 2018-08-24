# Change Log - @microsoft/tsdoc

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
