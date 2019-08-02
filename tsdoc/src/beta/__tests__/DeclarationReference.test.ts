import {
  ModuleSource,
  GlobalSource,
  Meaning,
  ComponentRoot,
  Navigation,
  ComponentNavigation,
  DeclarationReference,
  SymbolReference,
  ComponentReference
} from '../DeclarationReference';

describe('parser', () => {
  it('parse component text', () => {
    const ref: DeclarationReference = DeclarationReference.parse('abc');
    expect(ref.source).toBeUndefined();
    expect(ref.symbol).toBeInstanceOf(SymbolReference);
    expect(ref.symbol!.componentPath).toBeDefined();
    expect(ref.symbol!.componentPath!.component.toString()).toBe('abc');
  });
  it('parse component text string', () => {
    const ref: DeclarationReference = DeclarationReference.parse('"abc"');
    expect(ref.source).toBeUndefined();
    expect(ref.symbol).toBeInstanceOf(SymbolReference);
    expect(ref.symbol!.componentPath).toBeDefined();
    expect(ref.symbol!.componentPath!.component.toString()).toBe('"abc"');
  });
  it('parse bracketed component text', () => {
    const ref: DeclarationReference = DeclarationReference.parse('[abc.[def]]');
    expect(ref.source).toBeUndefined();
    expect(ref.symbol).toBeInstanceOf(SymbolReference);
    expect(ref.symbol!.componentPath).toBeDefined();
    expect(ref.symbol!.componentPath!.component.toString()).toBe('[abc.[def]]');
  });
  it.each`
    text                                      | path                                    | navigation   | symbol
    ${'abc!'}                                 | ${'abc'}                                | ${undefined} | ${undefined}
    ${'"abc"!'}                               | ${'"abc"'}                              | ${undefined} | ${undefined}
    ${'@microsoft/rush-stack-compiler-3.5!'}  | ${'@microsoft/rush-stack-compiler-3.5'} | ${undefined} | ${undefined}
    ${'abc!def'}                              | ${'abc'}                                | ${'.'}       | ${'def'}
    ${'abc!~def'}                             | ${'abc'}                                | ${'~'}       | ${'def'}
  `('parse module source $text', ({ text, path, navigation, symbol }) => {
    const ref: DeclarationReference = DeclarationReference.parse(text);
    expect(ref.source).toBeInstanceOf(ModuleSource);
    expect((ref.source as ModuleSource).escapedPath).toBe(path);
    expect(ref.navigation).toBe(navigation);
    if (symbol) {
      expect(ref.symbol).toBeInstanceOf(SymbolReference);
      expect(ref.symbol!.componentPath).toBeDefined();
      expect(ref.symbol!.componentPath!.component.toString()).toBe(symbol);
    } else {
      expect(ref.symbol).toBeUndefined();
    }
  });
  it.each`
    text      | symbol
    ${'!abc'} | ${'abc'}
  `('parse global source $text', ({ text, symbol }) => {
    const ref: DeclarationReference = DeclarationReference.parse(text);
    expect(ref.source).toBe(GlobalSource.instance);
    expect(ref.symbol).toBeInstanceOf(SymbolReference);
    expect(ref.symbol!.componentPath).toBeDefined();
    expect(ref.symbol!.componentPath!.component.toString()).toBe(symbol);
  });
  it.each`
    text                | meaning
    ${'a:class'}        | ${Meaning.Class}
    ${'a:interface'}    | ${Meaning.Interface}
    ${'a:type'}         | ${Meaning.TypeAlias}
    ${'a:enum'}         | ${Meaning.Enum}
    ${'a:namespace'}    | ${Meaning.Namespace}
    ${'a:function'}     | ${Meaning.Function}
    ${'a:var'}          | ${Meaning.Variable}
    ${'a:constructor'}  | ${Meaning.Constructor}
    ${'a:member'}       | ${Meaning.Member}
    ${'a:event'}        | ${Meaning.Event}
    ${'a:call'}         | ${Meaning.CallSignature}
    ${'a:new'}          | ${Meaning.ConstructSignature}
    ${'a:index'}        | ${Meaning.IndexSignature}
    ${'a:complex'}      | ${Meaning.ComplexType}
  `('parse meaning $meaning', ({ text, meaning }) => {
    const ref: DeclarationReference = DeclarationReference.parse(text);
    expect(ref.symbol!.meaning).toBe(meaning);
  });
  it('parse complex', () => {
    const ref: DeclarationReference = DeclarationReference.parse('foo/bar!N.C#z:member(1)');

    const source: ModuleSource = ref.source as ModuleSource;
    expect(source).toBeInstanceOf(ModuleSource);
    expect(source.escapedPath).toBe('foo/bar');

    expect(ref.navigation).toBe(Navigation.Exports);

    const symbol: SymbolReference = ref.symbol!;
    expect(symbol).toBeInstanceOf(SymbolReference);
    expect(symbol.meaning).toBe('member');
    expect(symbol.overloadIndex).toBe(1);

    const component1: ComponentNavigation = symbol.componentPath as ComponentNavigation;
    expect(component1).toBeInstanceOf(ComponentNavigation);
    expect(component1.navigation).toBe(Navigation.Members);
    expect(component1.component.toString()).toBe('z');

    const component2: ComponentNavigation = component1.parent as ComponentNavigation;
    expect(component2).toBeInstanceOf(ComponentNavigation);
    expect(component2.navigation).toBe(Navigation.Exports);
    expect(component2.component.toString()).toBe('C');

    const component3: ComponentRoot = component2.parent as ComponentRoot;
    expect(component3).toBeInstanceOf(ComponentRoot);
    expect(component3.component.toString()).toBe('N');

    expect(ref.toString()).toBe('foo/bar!N.C#z:member(1)');
  });
  it('parse invalid module reference', () => {
    expect(() => {
      DeclarationReference.parse('@scope/foo');
    }).toThrow();
  });
});
it('add navigation step', () => {
  const ref: DeclarationReference = DeclarationReference.empty()
    .addNavigationStep(Navigation.Members, ComponentReference.parse('[Symbol.iterator]'));
  const symbol: SymbolReference = ref.symbol!;
  expect(symbol).toBeInstanceOf(SymbolReference);
  expect(symbol.componentPath).toBeDefined();
  expect(symbol.componentPath!.component.toString()).toBe('[Symbol.iterator]');
});
describe('DeclarationReference', () => {
  it.each`
    text            | expected
    ${''}           | ${true}
    ${'a'}          | ${true}
    ${'a.b'}        | ${false}
    ${'a~b'}        | ${false}
    ${'a#b'}        | ${false}
    ${'a:class'}    | ${false}
    ${'a!'}         | ${false}
    ${'@a'}         | ${false}
    ${'a@'}         | ${false}
    ${'['}          | ${false}
    ${']'}          | ${false}
    ${'{'}          | ${false}
    ${'}'}          | ${false}
    ${'('}          | ${false}
    ${')'}          | ${false}
    ${'[a]'}        | ${false}
    ${'[a.b]'}      | ${false}
    ${'[a!b]'}      | ${false}
    ${'""'}         | ${true}
    ${'"a"'}        | ${true}
    ${'"a.b"'}      | ${true}
    ${'"a~b"'}      | ${true}
    ${'"a#b"'}      | ${true}
    ${'"a:class"'}  | ${true}
    ${'"a!"'}       | ${true}
    ${'"@a"'}       | ${true}
    ${'"a@"'}       | ${true}
    ${'"["'}        | ${true}
    ${'"]"'}        | ${true}
    ${'"{"'}        | ${true}
    ${'"}"'}        | ${true}
    ${'"("'}        | ${true}
    ${'")"'}        | ${true}
  `('isWellFormedComponentString($text)', ({ text, expected }) => {
    expect(DeclarationReference.isWellFormedComponentString(text)).toBe(expected);
  });
  it.each`
    text            | expected
    ${''}           | ${'""'}
    ${'a'}          | ${'a'}
    ${'a.b'}        | ${'"a.b"'}
    ${'a~b'}        | ${'"a~b"'}
    ${'a#b'}        | ${'"a#b"'}
    ${'a:class'}    | ${'"a:class"'}
    ${'a!'}         | ${'"a!"'}
    ${'@a'}         | ${'"@a"'}
    ${'a@'}         | ${'"a@"'}
    ${'['}          | ${'"["'}
    ${']'}          | ${'"]"'}
    ${'{'}          | ${'"{"'}
    ${'}'}          | ${'"}"'}
    ${'('}          | ${'"("'}
    ${')'}          | ${'")"'}
    ${'[a]'}        | ${'"[a]"'}
    ${'[a.b]'}      | ${'"[a.b]"'}
    ${'[a!b]'}      | ${'"[a!b]"'}
    ${'""'}         | ${'"\\\"\\\""'}
    ${'"a"'}        | ${'"\\\"a\\\""'}
  `('escapeComponentString($text)', ({ text, expected }) => {
    expect(DeclarationReference.escapeComponentString(text)).toBe(expected);
  });
  it.each`
    text              | expected
    ${''}             | ${''}
    ${'""'}           | ${''}
    ${'a'}            | ${'a'}
    ${'"a"'}          | ${'a'}
    ${'"a.b"'}        | ${'a.b'}
    ${'"\\"\\""'}     | ${'""'}
    ${'"\\"a\\""'}    | ${'"a"'}
  `('unescapeComponentString($text)', ({ text, expected }) => {
    if (expected === undefined) {
      expect(() => DeclarationReference.unescapeComponentString(text)).toThrow();
    } else {
      expect(DeclarationReference.unescapeComponentString(text)).toBe(expected);
    }
  });
  it.each`
    text            | expected
    ${''}           | ${false}
    ${'a'}          | ${true}
    ${'a.b'}        | ${true}
    ${'a~b'}        | ${true}
    ${'a#b'}        | ${true}
    ${'a:class'}    | ${true}
    ${'a!'}         | ${false}
    ${'@a'}         | ${true}
    ${'a@'}         | ${true}
    ${'['}          | ${true}
    ${']'}          | ${true}
    ${'{'}          | ${true}
    ${'}'}          | ${true}
    ${'('}          | ${true}
    ${')'}          | ${true}
    ${'[a]'}        | ${true}
    ${'[a.b]'}      | ${true}
    ${'[a!b]'}      | ${false}
    ${'""'}         | ${true}
    ${'"a"'}        | ${true}
    ${'"a.b"'}      | ${true}
    ${'"a~b"'}      | ${true}
    ${'"a#b"'}      | ${true}
    ${'"a:class"'}  | ${true}
    ${'"a!"'}       | ${true}
    ${'"@a"'}       | ${true}
    ${'"a@"'}       | ${true}
    ${'"["'}        | ${true}
    ${'"]"'}        | ${true}
    ${'"{"'}        | ${true}
    ${'"}"'}        | ${true}
    ${'"("'}        | ${true}
    ${'")"'}        | ${true}
    ${'"[a!b]"'}    | ${true}
  `('isWellFormedModuleSourceString($text)', ({ text, expected }) => {
    expect(DeclarationReference.isWellFormedModuleSourceString(text)).toBe(expected);
  });
  it.each`
    text            | expected
    ${''}           | ${'""'}
    ${'a'}          | ${'a'}
    ${'a.b'}        | ${'a.b'}
    ${'a~b'}        | ${'a~b'}
    ${'a#b'}        | ${'a#b'}
    ${'a:class'}    | ${'a:class'}
    ${'a!'}         | ${'"a!"'}
    ${'@a'}         | ${'@a'}
    ${'a@'}         | ${'a@'}
    ${'['}          | ${'['}
    ${']'}          | ${']'}
    ${'{'}          | ${'{'}
    ${'}'}          | ${'}'}
    ${'('}          | ${'('}
    ${')'}          | ${')'}
    ${'[a]'}        | ${'[a]'}
    ${'[a.b]'}      | ${'[a.b]'}
    ${'[a!b]'}      | ${'"[a!b]"'}
    ${'""'}         | ${'"\\\"\\\""'}
    ${'"a"'}        | ${'"\\\"a\\\""'}
  `('escapeModuleSourceString($text)', ({ text, expected }) => {
    expect(DeclarationReference.escapeModuleSourceString(text)).toBe(expected);
  });
  it.each`
    text              | expected
    ${''}             | ${undefined}
    ${'""'}           | ${''}
    ${'a'}            | ${'a'}
    ${'"a"'}          | ${'a'}
    ${'"a!"'}         | ${'a!'}
    ${'"a.b"'}        | ${'a.b'}
    ${'"\\"\\""'}     | ${'""'}
    ${'"\\"a\\""'}    | ${'"a"'}
  `('unescapeModuleSourceString($text)', ({ text, expected }) => {
    if (expected === undefined) {
      expect(() => DeclarationReference.unescapeModuleSourceString(text)).toThrow();
    } else {
      expect(DeclarationReference.unescapeModuleSourceString(text)).toBe(expected);
    }
  });
});
describe('ModuleSource', () => {
  it.each`
    text        | packageName | scopeName | unscopedPackageName | importPath
    ${'a'}      | ${'a'}      | ${''}     | ${'a'}              | ${''}
    ${'a/b'}    | ${'a'}      | ${''}     | ${'a'}              | ${'b'}
    ${'@a/b'}   | ${'@a/b'}   | ${'@a'}   | ${'b'}              | ${''}
    ${'@a/b/c'} | ${'@a/b'}   | ${'@a'}   | ${'b'}              | ${'c'}
  `('package parts of $text', ({ text, packageName, scopeName, unscopedPackageName, importPath }) => {
    const source: ModuleSource = new ModuleSource(text);
    expect(source.packageName).toBe(packageName);
    expect(source.scopeName).toBe(scopeName);
    expect(source.unscopedPackageName).toBe(unscopedPackageName);
    expect(source.importPath).toBe(importPath);
  });
  it.each`
    packageName | importPath    | text
    ${'a'}      | ${undefined}  | ${'a'}
    ${'a'}      | ${'b'}        | ${'a/b'}
    ${'@a/b'}   | ${undefined}  | ${'@a/b'}
    ${'@a/b'}   | ${'c'}        | ${'@a/b/c'}
  `('fromPackage($packageName, $importPath)', ({ packageName, importPath, text }) => {
    const source: ModuleSource = ModuleSource.fromPackage(packageName, importPath);
    expect(source.path).toBe(text);
  });
  it.each`
    scopeName | unscopedPackageName | importPath    | text
    ${''}     | ${'a'}              | ${undefined}  | ${'a'}
    ${''}     | ${'a'}              | ${'b'}        | ${'a/b'}
    ${'a'}    | ${'b'}              | ${undefined}  | ${'@a/b'}
    ${'@a'}   | ${'b'}              | ${undefined}  | ${'@a/b'}
    ${'a'}    | ${'b'}              | ${'c'}        | ${'@a/b/c'}
    ${'@a'}   | ${'b'}              | ${'c'}        | ${'@a/b/c'}
  `('fromScopedPackage($scopeName, $unscopedPackageName, $importPath)',
    ({ scopeName, unscopedPackageName, importPath, text }) => {
    const source: ModuleSource = ModuleSource.fromScopedPackage(scopeName, unscopedPackageName, importPath);
    expect(source.path).toBe(text);
  });
});