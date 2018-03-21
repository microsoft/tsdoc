# TSDoc

> A doc comment standard for TypeScript



###  What is TSDoc?

**TSDoc** is a proposal to standardize the doc comments used in [TypeScript](http://www.typescriptlang.org/) source files.  It allows different tools to extract content from comments without getting confused by each other's syntax.   The **TSDoc** notation looks like this:

```typescript
/**
 * Adds two numbers together.
 *
 * @remarks
 * This method is part of the {@link core-libary/Math | Math subsystem}.
 *
 * @param x - The first number to add
 * @param y - The second number to add
 * @returns The sum of `x` and `y`
 *
 * @beta
 */
function add(x: number, y: number): number;
```



This project will also publish an NPM package **@microsoft/tsdoc** that provides an open source reference implementation of a parser.  Using this library is an easy way to ensure that a tool is 100% compatible with the **TSDoc** standard.

###  Why do we need TSDoc?

This scenario originally arose from TypeScript projects at Microsoft that needed to be processed by  multiple tools:

- [Visual Studio Code](https://code.visualstudio.com): an editor that supports syntax highlighting and interactive refactoring for TypeScript doc comments
- [TypeDoc](https://github.com/TypeStrong/typedoc): an API reference website generator that extracts its content from doc comments
- [DocFX](https://dotnet.github.io/docfx/):  a integrated pipeline that ingests API reference content for many different programming languages, but then applies its own Markdown renderer and custom tag parsing
- [API Extractor](https://aka.ms/extractor): a build tool that tracks TypeScript API review workflows and generates *.d.ts rollups for third-party SDKs

These are just examples.  Many other tools in the web developer ecosystem interact with TypeScript doc comments.  Each of these tools accepts a syntax that is loosely based on [JSDoc](http://usejsdoc.org), but encounters frustrating incompatibilities when attempting to coexist with other tools.

*Why can't JSDoc be the standard?*  Unfortunately the JSDoc grammar is not rigorously specified, but rather inferred from the behavior of a particular tool.  More importantly, the majority of JSDoc tags are preoccupied with providing type annotations for plain JavaScript, an irrelevant requirement for a strongly-typed language such as TypeScript.  **TSDoc** addresses these limitations, while also tackling a more sophisticated set of goals (see below).

### What are the goals?

The TSDoc specification has these requirements:

- **Designed for TypeScript**: ...while aligning as closely as possible with the familiar JSDoc notations we know and love.
- **Markdown integration**: Doc comments can incorporate [CommonMark](http://commonmark.org) notations for rich text elements such as boldface, code fences, headings, tables, etc.  Special accommodations are made for entrenched pipelines (e.g. GitHub Pages) that expect to bring their own Markdown renderer to the party.
- **Common core**: Common  tags such as `@param` and `@returns` will have consistent behavior across all tools.
- **Extensible**: Each tool can supplement the core tags with custom tags for specialized scenarios.
- **Interoperable**: The TSDoc syntax guarantees that unsupported custom tags don't interfere with parsing of other content. (For example, if you didn't recognize the `@remarks` or `@link` tag in our example above, how would you handle the text around them? Should it be skipped or not?) TSDoc also avoids Markdown ambiguities.  (How to handle a single backtick inside a `{@link}` tag?) 
- **Package aware**:  TSDoc treats NPM packages as first-class citizens.  It allows processing groups of packages, with doc comments that contain cross-references to items from other libraries.  It defines *package.json* metadata that enables tooling to detect whether a dependency supports TSDoc or not.
- **Open standard**: TSDoc is an open source, community-driven standard.  You are encouraged to contribute your ideas and pull requests.



The **@microsoft/tsdoc** library package brings in some additional goals:

- **"Strict" and "Lax" modes**: Many projects don’t have the time/desire to change their existing code, so they want a "*lax*" mode that makes a best attempt to render their doc comments as-is.  Other projects want a "*strict*" mode that ensures consistent syntax everywhere and catches typos that might result in rendering errors.  Some projects want to be "*strict*" eventually, but they can't migrate everything overnight; they need a "*transitional*" mode similar to tslint suppressions.
- **Roundtripping**:  The parser accepts code comments as input, and produces an abstract syntax tree (AST) as output.  This is reversible:  given a (potentially modified) AST input, the library can regenerate the TypeScript code comment in a normalized form.
- **Self-contained**: The implementation will be small, fast, and self-contained.  It will not have a dependency on the TypeScript compiler API.  The doc comments will be received as a plain text string, and the AST will be a simple JavaScript tree object.  This makes it easier for tools to accept this package as a dependency.

### How do I use it?

Currently TSDoc is in the early design stages.  We are using GitHub issues to discuss various implementation strategies.  The **@microsoft/tsdoc** library is under development but has not been published yet.  If you have ideas, please feel free to participate!

### Who's involved ?

The collaborators currently driving the TSDoc standard are:

- [TypeScript](http://www.typescriptlang.org) compiler group at Microsoft
- [API Extractor](https://aka.ms/extractor) project owners 
- [TypeDoc](http://typedoc.org) maintainers
- [DocFX ](https://dotnet.github.io/docfx/)pipeline owners
- [SimplrJS](https://github.com/simplrteam/SimplrJS) developers, who maintain the [ts-docs-gen](https://github.com/SimplrJS/ts-docs-gen) tool
- [Tom Dale](https://github.com/tomdale), who's working on the documentation engine for Ember, Glimmer, and other project



##  Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.microsoft.com.

When you submit a pull request, a CLA-bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., label, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

