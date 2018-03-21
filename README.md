# TSDoc

> A doc comment standard for TypeScript



###  What is TSDoc?

**TSDoc** is a proposal to standardize the doc comments used in [TypeScript](http://www.typescriptlang.org/) source files.  This will allow different tools to extract content from comments without getting confused by each other's syntax.   Here's an example of the TSDoc notation:

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



This project will also publish an NPM package **@microsoft/tsdoc** with an open source reference implementation of a parser.  This provides an easy way for a tool to ensure that it's 100% compatible with the standard.

###  Why do we need TSDoc?

This scenario originated from a several tools that were all trying to process source code for projects inside Microsoft:

- [Visual Studio Code](https://code.visualstudio.com): provides syntax highlighting and interactive refactoring for TypeScript doc comments
- [TypeDoc](https://github.com/TypeStrong/typedoc): a tool that can generate an API reference web site based on doc comments
- [DocFX](https://dotnet.github.io/docfx/):  A integrated pipeline that extracts doc comments from many different languages, but then applies its own Markdown renderer and custom tag parsing
- [API Extractor](https://aka.ms/extractor): A tool which is used for tracking API review workflows and trimming *.d.ts files

These are just examples.  For example, the **SimplrJS** authors recently joined the discussion since they use a documentation tool [ts-docs-gen](https://github.com/SimplrJS/ts-docs-gen) that wants to interoperate.  Each of these tools accepts a syntax that is loosely based on [JSDoc](http://usejsdoc.org), but encounters frustrating incompatibilities when attempting to coexist with other tools.

Why can't JSDoc be the standard?  Unfortunately the JSDoc syntax is not rigorously specified, but vaguely determined by the behavior of a particular tool.  More importantly, the majority of JSDoc tags are preoccupied with providing type annotations for plain JavaScript, which is not useful for a strongly-typed language such as TypeScript.  **TSDoc** addresses these limitations, while also tackling a more sophisticated set of requirements (see below).

### What are the goals?

The TSDoc specification has these requirements:

- **Designed for TypeScript**: ...while aligning as closely as possible with the familiar JSDoc notations we know and love.
- **Markdown support**: Doc comments can incorporate [CommonMark](http://commonmark.org) notations for rich text elements such as boldface, code fences, headings, tables, etc.  Special accommodations are made for entrenched pipelines (e.g. GitHub Pages) that expect to bring their own Markdown renderer to the party.
- **Common core**: Common  tags such as `@param` and `@returns` will have consistent behavior across all tools.
- **Extensible**: Each tool can supplement the core tags with custom notations for specialized scenarios.
- **Interoperable**: The TSDoc syntax guarantees that unsupported custom tags don't interfere with parsing of other content. (For example, if you didn't recognize the `@remarks` or `@link` tag in our example above, what to do with the text between or after? Are they part of the tag or not?) TSDoc also avoids Markdown ambiguities.  (How would you handle a single backtick inside a `{@link}` tag? I can't even write this example because my Markdown editor chokes on it!) 
- **Strict Mode**: Many projects don’t have the time/desire to change their existing code, so they want a "*loose*" mode that makes a best attempt to render their doc comments as-is.  Other projects want a "*strict*" mode that ensures consistency and catches mistakes.  Some projects want to be "strict" eventually but, they can't migrate everything overnight; they need a "*transitional*" mechanism similar to tslint suppressions.
- **Package aware**:  TSDoc treats NPM packages as first-class citizens.  It allows processing groups of packages, with doc comments that contain cross-references to items from other libraries.  It standardizes the *package.json* metadata that enables tooling to detect whether a dependency supports TSDoc or not.
- **Open standard**: TSDoc is an open source, community-driven standard.  You are encouraged to contribute your ideas and pull requests.

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

