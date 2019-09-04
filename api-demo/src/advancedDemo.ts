import * as colors from 'colors';
import * as os from 'os';
import * as path from 'path';
import * as ts from 'typescript';
import * as tsdoc from '@microsoft/tsdoc';

/**
 * Returns true if the specified SyntaxKind is part of a declaration form.
 *
 * Based on ts.isDeclarationKind() from the compiler.
 * https://github.com/Microsoft/TypeScript/blob/v3.0.3/src/compiler/utilities.ts#L6382
 */
function isDeclarationKind(kind: ts.SyntaxKind): boolean {
  return kind === ts.SyntaxKind.ArrowFunction
    || kind === ts.SyntaxKind.BindingElement
    || kind === ts.SyntaxKind.ClassDeclaration
    || kind === ts.SyntaxKind.ClassExpression
    || kind === ts.SyntaxKind.Constructor
    || kind === ts.SyntaxKind.EnumDeclaration
    || kind === ts.SyntaxKind.EnumMember
    || kind === ts.SyntaxKind.ExportSpecifier
    || kind === ts.SyntaxKind.FunctionDeclaration
    || kind === ts.SyntaxKind.FunctionExpression
    || kind === ts.SyntaxKind.GetAccessor
    || kind === ts.SyntaxKind.ImportClause
    || kind === ts.SyntaxKind.ImportEqualsDeclaration
    || kind === ts.SyntaxKind.ImportSpecifier
    || kind === ts.SyntaxKind.InterfaceDeclaration
    || kind === ts.SyntaxKind.JsxAttribute
    || kind === ts.SyntaxKind.MethodDeclaration
    || kind === ts.SyntaxKind.MethodSignature
    || kind === ts.SyntaxKind.ModuleDeclaration
    || kind === ts.SyntaxKind.NamespaceExportDeclaration
    || kind === ts.SyntaxKind.NamespaceImport
    || kind === ts.SyntaxKind.Parameter
    || kind === ts.SyntaxKind.PropertyAssignment
    || kind === ts.SyntaxKind.PropertyDeclaration
    || kind === ts.SyntaxKind.PropertySignature
    || kind === ts.SyntaxKind.SetAccessor
    || kind === ts.SyntaxKind.ShorthandPropertyAssignment
    || kind === ts.SyntaxKind.TypeAliasDeclaration
    || kind === ts.SyntaxKind.TypeParameter
    || kind === ts.SyntaxKind.VariableDeclaration
    || kind === ts.SyntaxKind.JSDocTypedefTag
    || kind === ts.SyntaxKind.JSDocCallbackTag
    || kind === ts.SyntaxKind.JSDocPropertyTag;
}

/**
 * Retrieves the JSDoc-style comments associated with a specific AST node.
 *
 * Based on ts.getJSDocCommentRanges() from the compiler.
 * https://github.com/Microsoft/TypeScript/blob/v3.0.3/src/compiler/utilities.ts#L924
 */
function getJSDocCommentRanges(node: ts.Node, text: string): ts.CommentRange[] {
  const commentRanges: ts.CommentRange[] = [];

  switch (node.kind) {
    case ts.SyntaxKind.Parameter:
    case ts.SyntaxKind.TypeParameter:
    case ts.SyntaxKind.FunctionExpression:
    case ts.SyntaxKind.ArrowFunction:
    case ts.SyntaxKind.ParenthesizedExpression:
      commentRanges.push(...ts.getTrailingCommentRanges(text, node.pos) || []);
      break;
  }
  commentRanges.push(...ts.getLeadingCommentRanges(text, node.pos) || []);

  // True if the comment starts with '/**' but not if it is '/**/'
  return commentRanges.filter((comment) =>
    text.charCodeAt(comment.pos + 1) === 0x2A /* ts.CharacterCodes.asterisk */ &&
    text.charCodeAt(comment.pos + 2) === 0x2A /* ts.CharacterCodes.asterisk */ &&
    text.charCodeAt(comment.pos + 3) !== 0x2F /* ts.CharacterCodes.slash */);
}

interface IFoundComment {
  compilerNode: ts.Node;
  textRange: tsdoc.TextRange;
}

function walkCompilerAstAndFindComments(node: ts.Node, indent: string, foundComments: IFoundComment[]): void {
  // The TypeScript AST doesn't store code comments directly.  If you want to find *every* comment,
  // you would need to rescan the SourceFile tokens similar to how tsutils.forEachComment() works:
  // https://github.com/ajafff/tsutils/blob/v3.0.0/util/util.ts#L453
  //
  // However, for this demo we are modeling a tool that discovers declarations and then analyzes their doc comments,
  // so we only care about TSDoc that would conventionally be associated with an interesting AST node.

  let foundCommentsSuffix: string = '';
  const buffer: string = node.getSourceFile().getFullText(); // don't use getText() here!

  // Only consider nodes that are part of a declaration form.  Without this, we could discover
  // the same comment twice (e.g. for a MethodDeclaration and its PublicKeyword).
  if (isDeclarationKind(node.kind)) {
    // Find "/** */" style comments associated with this node.
    // Note that this reinvokes the compiler's scanner -- the result is not cached.
    const comments: ts.CommentRange[] = getJSDocCommentRanges(node, buffer);

    if (comments.length > 0) {
      if (comments.length === 1) {
        foundCommentsSuffix = colors.cyan(`  (FOUND 1 COMMENT)`);
      } else {
        foundCommentsSuffix = colors.cyan(`  (FOUND ${comments.length} COMMENTS)`);
      }

      for (const comment of comments) {
        foundComments.push({
          compilerNode: node,
          textRange: tsdoc.TextRange.fromStringRange(buffer, comment.pos, comment.end)
        });
      }
    }
  }

  console.log(`${indent}- ${ts.SyntaxKind[node.kind]}${foundCommentsSuffix}`);

  return node.forEachChild(child => walkCompilerAstAndFindComments(child, indent + '  ', foundComments));
}

function dumpTSDocTree(docNode: tsdoc.DocNode, indent: string): void {
  let dumpText: string = '';
  if (docNode instanceof tsdoc.DocExcerpt) {
    const content: string = docNode.content.toString();
    dumpText += colors.gray(`${indent}* ${docNode.excerptKind}=`) + colors.cyan(JSON.stringify(content));
  } else {
    dumpText += `${indent}- ${docNode.kind}`;
  }
  console.log(dumpText);

  for (const child of docNode.getChildNodes()) {
    dumpTSDocTree(child, indent + '  ');
  }
}

function parseTSDoc(foundComment: IFoundComment): void {
  console.log(os.EOL + colors.green('Comment to be parsed:') + os.EOL);
  console.log(colors.gray('<<<<<<'));
  console.log(foundComment.textRange.toString());
  console.log(colors.gray('>>>>>>'));

  const customConfiguration: tsdoc.TSDocConfiguration = new tsdoc.TSDocConfiguration();

  const customInlineDefinition: tsdoc.TSDocTagDefinition = new tsdoc.TSDocTagDefinition({
    tagName: '@customInline',
    syntaxKind: tsdoc.TSDocTagSyntaxKind.InlineTag,
    allowMultiple: true
  });

  // NOTE: Defining this causes a new DocBlock to be created under docComment.customBlocks.
  // Otherwise, a simple DocBlockTag would appear inline in the @remarks section.
  const customBlockDefinition: tsdoc.TSDocTagDefinition = new tsdoc.TSDocTagDefinition({
    tagName: '@customBlock',
    syntaxKind: tsdoc.TSDocTagSyntaxKind.BlockTag
  });

  // NOTE: Defining this causes @customModifier to be removed from its section,
  // and added to the docComment.modifierTagSet
  const customModifierDefinition: tsdoc.TSDocTagDefinition = new tsdoc.TSDocTagDefinition({
    tagName: '@customModifier',
    syntaxKind: tsdoc.TSDocTagSyntaxKind.ModifierTag
  });

  customConfiguration.addTagDefinitions([
    customInlineDefinition,
    customBlockDefinition,
    customModifierDefinition
  ]);

  console.log(os.EOL + 'Invoking TSDocParser with custom configuration...' + os.EOL);
  const tsdocParser: tsdoc.TSDocParser = new tsdoc.TSDocParser(customConfiguration);
  const parserContext: tsdoc.ParserContext = tsdocParser.parseRange(foundComment.textRange);
  const docComment: tsdoc.DocComment = parserContext.docComment;

  console.log(os.EOL + colors.green('Parser Log Messages:') + os.EOL);

  if (parserContext.log.messages.length === 0) {
    console.log('No errors or warnings.');
  } else {
    const sourceFile: ts.SourceFile = foundComment.compilerNode.getSourceFile();
    for (const message of parserContext.log.messages) {
      // Since we have the compiler's analysis, use it to calculate the line/column information,
      // since this is currently faster than TSDoc's TextRange.getLocation() lookup.
      const location: ts.LineAndCharacter = sourceFile.getLineAndCharacterOfPosition(message.textRange.pos);
      const formattedMessage: string = `${sourceFile.fileName}(${location.line + 1},${location.character + 1}):`
        + ` [TSDoc] ${message}`;
      console.log(formattedMessage);
    }
  }

  if (parserContext.docComment.modifierTagSet.hasTag(customModifierDefinition)) {
    console.log(os.EOL + colors.cyan(`The ${customModifierDefinition.tagName} modifier was FOUND.`));
  } else {
    console.log(os.EOL + colors.cyan(`The ${customModifierDefinition.tagName} modifier was NOT FOUND.`));
  }

  console.log(os.EOL + colors.green('Visiting TSDoc\'s DocNode tree') + os.EOL);
  dumpTSDocTree(docComment, '');
}

/**
 * The advanced demo invokes the TypeScript compiler and extracts the comment from the AST.
 * It also illustrates how to define custom TSDoc tags using TSDocConfiguration.
 */
export function advancedDemo(): void {
  console.log(colors.yellow('*** TSDoc API demo: Advanced Scenario ***') + os.EOL);

  const inputFilename: string = path.resolve(path.join(__dirname, '..', 'assets', 'advanced-input.ts'));
  const compilerOptions: ts.CompilerOptions = {
    'target': ts.ScriptTarget.ES5
  };

  // Compile the input
  console.log('Invoking the TypeScript compiler to analyze assets/advanced-input.ts...');

  const program: ts.Program = ts.createProgram([ inputFilename ], compilerOptions);

  // Report any compiler errors
  const compilerDiagnostics: ReadonlyArray<ts.Diagnostic> = program.getSemanticDiagnostics();
  if (compilerDiagnostics.length > 0) {
    for (const diagnostic of compilerDiagnostics) {
      const message: string = ts.flattenDiagnosticMessageText(diagnostic.messageText, os.EOL);
      if (diagnostic.file) {
        const location: ts.LineAndCharacter = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!);
        const formattedMessage: string = `${diagnostic.file.fileName}(${location.line + 1},${location.character + 1}):`
          + ` [TypeScript] ${message}`;
        console.log(colors.red(formattedMessage));
      } else {
        console.log(colors.red(message));
      }
    }
  } else {
    console.log('No compiler errors or warnings.');
  }

  const sourceFile: ts.SourceFile | undefined = program.getSourceFile(inputFilename);
  if (!sourceFile) {
    throw new Error('Error retrieving source file');
  }

  console.log(os.EOL + colors.green('Scanning compiler AST for first code comment...') + os.EOL);

  const foundComments: IFoundComment[] = [];

  walkCompilerAstAndFindComments(sourceFile, '', foundComments);

  if (foundComments.length === 0) {
    console.log(colors.red('Error: No code comments were found in the input file'));
  } else {
    // For the purposes of this demo, only analyze the first comment that we found
    parseTSDoc(foundComments[0]);
  }
}
