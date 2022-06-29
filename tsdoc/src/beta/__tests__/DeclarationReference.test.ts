/* eslint-disable max-lines */

import {
  ModuleSource,
  GlobalSource,
  Meaning,
  ComponentRoot,
  Navigation,
  ComponentNavigation,
  DeclarationReference,
  SymbolReference,
  ComponentReference,
  ComponentString,
  Component,
  ComponentLike,
  ComponentPath,
  ComponentNavigationParts,
  Source
} from '../DeclarationReference';

// aliases to make some of the 'each' tests easier to read
const { from: MOD } = ModuleSource;
const { from: DREF } = DeclarationReference;
const { from: SYM } = SymbolReference;
const { from: CROOT } = ComponentRoot;
const { from: CSTR } = ComponentString;
const { from: CREF } = ComponentReference;

function CNAV(parts: ComponentNavigationParts</*With*/ false>): ComponentNavigation;
function CNAV(
  parent: ComponentPath,
  navigation: '.' | '#' | '~',
  component: ComponentLike</*With*/ false>
): ComponentNavigation;
function CNAV(
  ...args:
    | [ComponentNavigationParts</*With*/ false>]
    | [ComponentPath, '.' | '#' | '~', ComponentLike</*With*/ false>]
): ComponentNavigation {
  switch (args.length) {
    case 3:
      const [parent, navigation, component] = args;
      return ComponentNavigation.from({ parent, navigation: navigation as Navigation, component });
    case 1:
      return ComponentNavigation.from(args[0]);
  }
}

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
    text                                     | path                                    | navigation   | symbol
    ${'abc!'}                                | ${'abc'}                                | ${undefined} | ${undefined}
    ${'"abc"!'}                              | ${'"abc"'}                              | ${undefined} | ${undefined}
    ${'@microsoft/rush-stack-compiler-3.5!'} | ${'@microsoft/rush-stack-compiler-3.5'} | ${undefined} | ${undefined}
    ${'abc!def'}                             | ${'abc'}                                | ${'.'}       | ${'def'}
    ${'abc!~def'}                            | ${'abc'}                                | ${'~'}       | ${'def'}
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
    text               | meaning
    ${'a:class'}       | ${Meaning.Class}
    ${'a:interface'}   | ${Meaning.Interface}
    ${'a:type'}        | ${Meaning.TypeAlias}
    ${'a:enum'}        | ${Meaning.Enum}
    ${'a:namespace'}   | ${Meaning.Namespace}
    ${'a:function'}    | ${Meaning.Function}
    ${'a:var'}         | ${Meaning.Variable}
    ${'a:constructor'} | ${Meaning.Constructor}
    ${'a:member'}      | ${Meaning.Member}
    ${'a:event'}       | ${Meaning.Event}
    ${'a:call'}        | ${Meaning.CallSignature}
    ${'a:new'}         | ${Meaning.ConstructSignature}
    ${'a:index'}       | ${Meaning.IndexSignature}
    ${'a:complex'}     | ${Meaning.ComplexType}
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
  it.each`
    text
    ${'!bar..baz'}
    ${'!bar.#baz'}
    ${'!bar.~baz'}
    ${'!bar#.baz'}
    ${'!bar##baz'}
    ${'!bar#~baz'}
    ${'!bar~.baz'}
    ${'!bar~#baz'}
    ${'!bar~~baz'}
  `('parse invalid symbol $text', ({ text }) => {
    expect(() => {
      DeclarationReference.parse(text);
    }).toThrow();
  });
});

describe('DeclarationReference', () => {
  it.each`
    text           | expected
    ${''}          | ${true}
    ${'a'}         | ${true}
    ${'a.b'}       | ${false}
    ${'a~b'}       | ${false}
    ${'a#b'}       | ${false}
    ${'a:class'}   | ${false}
    ${'a!'}        | ${false}
    ${'@a'}        | ${false}
    ${'a@'}        | ${false}
    ${'['}         | ${false}
    ${']'}         | ${false}
    ${'{'}         | ${false}
    ${'}'}         | ${false}
    ${'('}         | ${false}
    ${')'}         | ${false}
    ${'[a]'}       | ${false}
    ${'[a.b]'}     | ${false}
    ${'[a!b]'}     | ${false}
    ${'""'}        | ${true}
    ${'"a"'}       | ${true}
    ${'"a.b"'}     | ${true}
    ${'"a~b"'}     | ${true}
    ${'"a#b"'}     | ${true}
    ${'"a:class"'} | ${true}
    ${'"a!"'}      | ${true}
    ${'"@a"'}      | ${true}
    ${'"a@"'}      | ${true}
    ${'"["'}       | ${true}
    ${'"]"'}       | ${true}
    ${'"{"'}       | ${true}
    ${'"}"'}       | ${true}
    ${'"("'}       | ${true}
    ${'")"'}       | ${true}
  `('static isWellFormedComponentString($text)', ({ text, expected }) => {
    expect(DeclarationReference.isWellFormedComponentString(text)).toBe(expected);
  });
  it.each`
    text         | expected
    ${''}        | ${'""'}
    ${'a'}       | ${'a'}
    ${'a.b'}     | ${'"a.b"'}
    ${'a~b'}     | ${'"a~b"'}
    ${'a#b'}     | ${'"a#b"'}
    ${'a:class'} | ${'"a:class"'}
    ${'a!'}      | ${'"a!"'}
    ${'@a'}      | ${'"@a"'}
    ${'a@'}      | ${'"a@"'}
    ${'['}       | ${'"["'}
    ${']'}       | ${'"]"'}
    ${'{'}       | ${'"{"'}
    ${'}'}       | ${'"}"'}
    ${'('}       | ${'"("'}
    ${')'}       | ${'")"'}
    ${'[a]'}     | ${'"[a]"'}
    ${'[a.b]'}   | ${'"[a.b]"'}
    ${'[a!b]'}   | ${'"[a!b]"'}
    ${'""'}      | ${'"\\"\\""'}
    ${'"a"'}     | ${'"\\"a\\""'}
  `('static escapeComponentString($text)', ({ text, expected }) => {
    expect(DeclarationReference.escapeComponentString(text)).toBe(expected);
  });
  it.each`
    text           | expected
    ${''}          | ${''}
    ${'""'}        | ${''}
    ${'a'}         | ${'a'}
    ${'"a"'}       | ${'a'}
    ${'"a.b"'}     | ${'a.b'}
    ${'"\\"\\""'}  | ${'""'}
    ${'"\\"a\\""'} | ${'"a"'}
  `('static unescapeComponentString($text)', ({ text, expected }) => {
    if (expected === undefined) {
      expect(() => DeclarationReference.unescapeComponentString(text)).toThrow();
    } else {
      expect(DeclarationReference.unescapeComponentString(text)).toBe(expected);
    }
  });
  it.each`
    text           | expected
    ${''}          | ${false}
    ${'a'}         | ${true}
    ${'a.b'}       | ${true}
    ${'a~b'}       | ${true}
    ${'a#b'}       | ${true}
    ${'a:class'}   | ${true}
    ${'a!'}        | ${false}
    ${'@a'}        | ${true}
    ${'a@'}        | ${true}
    ${'['}         | ${true}
    ${']'}         | ${true}
    ${'{'}         | ${true}
    ${'}'}         | ${true}
    ${'('}         | ${true}
    ${')'}         | ${true}
    ${'[a]'}       | ${true}
    ${'[a.b]'}     | ${true}
    ${'[a!b]'}     | ${false}
    ${'""'}        | ${true}
    ${'"a"'}       | ${true}
    ${'"a.b"'}     | ${true}
    ${'"a~b"'}     | ${true}
    ${'"a#b"'}     | ${true}
    ${'"a:class"'} | ${true}
    ${'"a!"'}      | ${true}
    ${'"@a"'}      | ${true}
    ${'"a@"'}      | ${true}
    ${'"["'}       | ${true}
    ${'"]"'}       | ${true}
    ${'"{"'}       | ${true}
    ${'"}"'}       | ${true}
    ${'"("'}       | ${true}
    ${'")"'}       | ${true}
    ${'"[a!b]"'}   | ${true}
  `('static isWellFormedModuleSourceString($text)', ({ text, expected }) => {
    expect(DeclarationReference.isWellFormedModuleSourceString(text)).toBe(expected);
  });
  it.each`
    text         | expected
    ${''}        | ${'""'}
    ${'a'}       | ${'a'}
    ${'a.b'}     | ${'a.b'}
    ${'a~b'}     | ${'a~b'}
    ${'a#b'}     | ${'a#b'}
    ${'a:class'} | ${'a:class'}
    ${'a!'}      | ${'"a!"'}
    ${'@a'}      | ${'@a'}
    ${'a@'}      | ${'a@'}
    ${'['}       | ${'['}
    ${']'}       | ${']'}
    ${'{'}       | ${'{'}
    ${'}'}       | ${'}'}
    ${'('}       | ${'('}
    ${')'}       | ${')'}
    ${'[a]'}     | ${'[a]'}
    ${'[a.b]'}   | ${'[a.b]'}
    ${'[a!b]'}   | ${'"[a!b]"'}
    ${'""'}      | ${'"\\"\\""'}
    ${'"a"'}     | ${'"\\"a\\""'}
  `('static escapeModuleSourceString($text)', ({ text, expected }) => {
    expect(DeclarationReference.escapeModuleSourceString(text)).toBe(expected);
  });
  it.each`
    text           | expected
    ${''}          | ${undefined}
    ${'""'}        | ${''}
    ${'a'}         | ${'a'}
    ${'"a"'}       | ${'a'}
    ${'"a!"'}      | ${'a!'}
    ${'"a.b"'}     | ${'a.b'}
    ${'"\\"\\""'}  | ${'""'}
    ${'"\\"a\\""'} | ${'"a"'}
  `('static unescapeModuleSourceString($text)', ({ text, expected }) => {
    if (expected === undefined) {
      expect(() => DeclarationReference.unescapeModuleSourceString(text)).toThrow();
    } else {
      expect(DeclarationReference.unescapeModuleSourceString(text)).toBe(expected);
    }
  });
  describe('static from()', () => {
    it('static from(undefined)', () => {
      const declref = DeclarationReference.from(undefined);
      expect(declref.isEmpty).toBe(true);
    });
    it('static from(string)', () => {
      const declref = DeclarationReference.from('a!b');
      expect(declref.source?.toString()).toBe('a!');
      expect(declref.symbol?.toString()).toBe('b');
    });
    it('static from(DeclarationReference)', () => {
      const declref1 = DeclarationReference.from('a!b');
      const declref2 = DeclarationReference.from(declref1);
      expect(declref2).toBe(declref1);
    });
    it('static from({ })', () => {
      const declref = DeclarationReference.from({});
      expect(declref.isEmpty).toBe(true);
    });
    it('static from({ source })', () => {
      const source = MOD('a');
      const declref = DeclarationReference.from({ source });
      expect(declref.source).toBe(source);
    });
    it('static from({ packageName })', () => {
      const declref = DeclarationReference.from({ packageName: 'a' });
      expect(declref.source).toBeInstanceOf(ModuleSource);
      expect(declref.source?.toString()).toBe('a!');
    });
    it('static from({ symbol })', () => {
      const symbol = SYM('a');
      const declref = DeclarationReference.from({ symbol });
      expect(declref.symbol).toBe(symbol);
    });
    it('static from({ componentPath })', () => {
      const declref = DeclarationReference.from({ componentPath: 'a' });
      expect(declref.symbol).toBeDefined();
      expect(declref.symbol?.toString()).toBe('a');
    });
  });
  describe('with()', () => {
    describe('with({ })', () => {
      it('produces same reference', () => {
        const declref = DeclarationReference.from({});
        expect(declref.with({})).toBe(declref);
      });
      it('does not change existing reference', () => {
        const source = MOD('a');
        const symbol = SYM('b');
        const declref = DeclarationReference.from({ source, navigation: Navigation.Exports, symbol });
        declref.with({});
        expect(declref.source).toBe(source);
        expect(declref.navigation).toBe(Navigation.Exports);
        expect(declref.symbol).toBe(symbol);
      });
    });
    describe('with({ source: <same> })', () => {
      it('produces same reference', () => {
        const source = MOD('a');
        const symbol = SYM('b');
        const declref1 = DeclarationReference.from({ source, navigation: Navigation.Exports, symbol });
        const declref2 = declref1.with({ source });
        expect(declref2).toBe(declref1);
      });
      it('does not change existing reference', () => {
        const source = MOD('a');
        const symbol = SYM('b');
        const declref1 = DeclarationReference.from({ source, navigation: Navigation.Exports, symbol });
        declref1.with({ source });
        expect(declref1.source).toBe(source);
        expect(declref1.navigation).toBe(Navigation.Exports);
        expect(declref1.symbol).toBe(symbol);
      });
    });
    describe('with({ source: <equivalent> })', () => {
      it('produces same reference', () => {
        const source = MOD('a');
        const symbol = SYM('b');
        const declref1 = DeclarationReference.from({ source, navigation: Navigation.Exports, symbol });
        const declref2 = declref1.with({ source: MOD('a') });
        expect(declref2).toBe(declref1);
      });
      it('does not change existing reference', () => {
        const source = MOD('a');
        const symbol = SYM('b');
        const declref1 = DeclarationReference.from({ source, navigation: Navigation.Exports, symbol });
        declref1.with({ source: MOD('a') });
        expect(declref1.source).toBe(source);
        expect(declref1.navigation).toBe(Navigation.Exports);
        expect(declref1.symbol).toBe(symbol);
      });
    });
    describe('with({ source: <equivalent string> })', () => {
      it('produces same reference', () => {
        const source = MOD('a');
        const symbol = SYM('b');
        const declref1 = DeclarationReference.from({ source, navigation: Navigation.Exports, symbol });
        const declref2 = declref1.with({ source: 'a' });
        expect(declref2).toBe(declref1);
      });
      it('does not change existing reference', () => {
        const source = MOD('a');
        const symbol = SYM('b');
        const declref1 = DeclarationReference.from({ source, navigation: Navigation.Exports, symbol });
        declref1.with({ source: 'a' });
        expect(declref1.source).toBe(source);
        expect(declref1.navigation).toBe(Navigation.Exports);
        expect(declref1.symbol).toBe(symbol);
      });
    });
    describe('with({ source: <different> })', () => {
      it('produces new reference', () => {
        const source1 = MOD('a');
        const symbol = SYM('a');
        const source2 = MOD('b');
        const declref1 = DeclarationReference.from({
          source: source1,
          navigation: Navigation.Exports,
          symbol
        });
        const declref2 = declref1.with({ source: source2 });
        expect(declref2).not.toBe(declref1);
        expect(declref2.source).toBe(source2);
        expect(declref2.navigation).toBe(Navigation.Exports);
        expect(declref2.symbol).toBe(symbol);
      });
      it('does not change existing reference', () => {
        const source1 = MOD('a');
        const source2 = MOD('b');
        const symbol = SYM('a');
        const declref1 = DeclarationReference.from({
          source: source1,
          navigation: Navigation.Exports,
          symbol
        });
        declref1.with({ source: source2 });
        expect(declref1.source).toBe(source1);
        expect(declref1.navigation).toBe(Navigation.Exports);
        expect(declref1.symbol).toBe(symbol);
      });
    });
    describe('with({ source: <new> })', () => {
      it('produces new reference', () => {
        const source = MOD('b');
        const declref1 = DeclarationReference.from({});
        const declref2 = declref1.with({ source });
        expect(declref2).not.toBe(declref1);
        expect(declref2.source).toBe(source);
      });
    });
    describe('with({ source: null })', () => {
      it('w/existing source: produces new reference', () => {
        const source = MOD('a');
        const declref1 = DeclarationReference.from({ source });
        const declref2 = declref1.with({ source: null });
        expect(declref2).not.toBe(declref1);
        expect(declref2.source).toBeUndefined();
      });
      it('w/existing source: does not change existing reference', () => {
        const source = MOD('a');
        const declref1 = DeclarationReference.from({ source });
        declref1.with({ source: null });
        expect(declref1.source).toBe(source);
      });
      it('w/o existing source: produces same reference', () => {
        const symbol = SYM('b');
        const declref1 = DeclarationReference.from({ navigation: Navigation.Exports, symbol });
        const declref2 = declref1.with({ source: null });
        expect(declref2).toBe(declref1);
      });
    });
    describe('with({ source: undefined })', () => {
      it('w/existing source: produces same reference', () => {
        const source = MOD('a');
        const declref1 = DeclarationReference.from({ source });
        const declref2 = declref1.with({ source: undefined });
        expect(declref2).toBe(declref1);
      });
      it('w/o existing source: produces same reference', () => {
        const declref1 = DeclarationReference.from({});
        const declref2 = declref1.with({ source: undefined });
        expect(declref2).toBe(declref1);
      });
    });
    describe('with({ source: { packageName: <equivalent> } })', () => {
      it('produces same reference', () => {
        const source = MOD('a');
        const declref1 = DeclarationReference.from({ source });
        const declref2 = declref1.with({ source: { packageName: 'a' } });
        expect(declref2).toBe(declref1);
      });
    });
    describe('with({ source: { packageName: <different> } })', () => {
      it('produces new reference', () => {
        const source = MOD('a');
        const declref1 = DeclarationReference.from({ source });
        const declref2 = declref1.with({ source: { packageName: 'b' } });
        expect(declref2).not.toBe(declref1);
        expect(declref2.source?.toString()).toBe('b!');
      });
      it('w/o new importPath in package name: does not change importPath', () => {
        const source = MOD('a/b');
        const declref1 = DeclarationReference.from({ source });
        const declref2 = declref1.with({ source: { packageName: 'c' } });
        expect(declref2.source?.toString()).toBe('c/b!');
      });
      it('w/new importPath in package name: changes importPath', () => {
        const source = MOD('a/b');
        const declref1 = DeclarationReference.from({ source });
        const declref2 = declref1.with({ source: { packageName: 'c/d' } });
        expect(declref2.source?.toString()).toBe('c/d!');
      });
    });
    describe('with({ source: { packageName: <new> } })', () => {
      it('produces new reference', () => {
        const declref1 = DeclarationReference.from({});
        const declref2 = declref1.with({ source: { packageName: 'b' } });
        expect(declref2).not.toBe(declref1);
        expect(declref2.source?.toString()).toBe('b!');
      });
    });
    describe('with({ source: { unscopedPackageName: <equivalent> } })', () => {
      it('w/o scope: produces same reference', () => {
        const source = MOD('a');
        const declref1 = DeclarationReference.from({ source });
        const declref2 = declref1.with({ source: { unscopedPackageName: 'a' } });
        expect(declref2).toBe(declref1);
      });
    });
    describe('with({ source: { unscopedPackageName: <different> } })', () => {
      it('w/existing source w/o scope: produces new reference', () => {
        const source = MOD('a');
        const declref1 = DeclarationReference.from({ source });
        const declref2 = declref1.with({ source: { unscopedPackageName: 'b' } });
        expect(declref2).not.toBe(declref1);
        expect(declref2.source?.toString()).toBe('b!');
      });
      it('w/o existing source: produces new reference', () => {
        const declref1 = DeclarationReference.from({});
        const declref2 = declref1.with({ source: { unscopedPackageName: 'b' } });
        expect(declref2).not.toBe(declref1);
        expect(declref2.source?.toString()).toBe('b!');
      });
      it('w/existing source w/scope: produces new reference', () => {
        const declref1 = DeclarationReference.from({ source: MOD('@a/b') });
        const declref2 = declref1.with({ source: { unscopedPackageName: 'c' } });
        expect(declref2).not.toBe(declref1);
        expect(declref2.source?.toString()).toBe('@a/c!');
      });
      it('does not change importPath', () => {
        const declref1 = DeclarationReference.from({ source: MOD('@a/b/c') });
        const declref2 = declref1.with({ source: { unscopedPackageName: 'd' } });
        expect(declref2).not.toBe(declref1);
        expect(declref2.source?.toString()).toBe('@a/d/c!');
      });
    });
    describe('with({ source: { scopeName: <equivalent> } })', () => {
      it('produces same reference', () => {
        const declref1 = DeclarationReference.from({ source: MOD('@a/b') });
        const declref2 = declref1.with({ source: { scopeName: '@a' } });
        expect(declref2).toBe(declref1);
      });
    });
    describe('with({ source: { scopeName: <different> } })', () => {
      it('w/source w/scope: produces new reference', () => {
        const declref1 = DeclarationReference.from({ source: MOD('@a/b') });
        const declref2 = declref1.with({ source: { scopeName: '@c' } });
        expect(declref2).not.toBe(declref1);
        expect(declref2.source?.toString()).toBe('@c/b!');
      });
      it('w/source w/o scope: produces new reference', () => {
        const declref1 = DeclarationReference.from({ source: MOD('a') });
        const declref2 = declref1.with({ source: { scopeName: '@b' } });
        expect(declref2).not.toBe(declref1);
        expect(declref2.source?.toString()).toBe('@b/a!');
      });
      it('does not change importPath', () => {
        const declref1 = DeclarationReference.from({ source: MOD('@a/b/c') });
        const declref2 = declref1.with({ source: { scopeName: '@d' } });
        expect(declref2).not.toBe(declref1);
        expect(declref2.source?.toString()).toBe('@d/b/c!');
      });
    });
    describe('with({ source: { scopeName: <new> } })', () => {
      it('w/existing scope: produces new reference', () => {
        const declref1 = DeclarationReference.from({ source: MOD('@a/b') });
        const declref2 = declref1.with({ source: { scopeName: null } });
        expect(declref2).not.toBe(declref1);
        expect(declref2.source?.toString()).toBe('b!');
      });
      it('w/o existing scope: produces same reference', () => {
        const declref1 = DeclarationReference.from({ source: MOD('a') });
        const declref2 = declref1.with({ source: { scopeName: null } });
        expect(declref2).toBe(declref1);
      });
    });
    describe('with({ source: { scopeName: null } })', () => {
      it('produces new reference', () => {
        const declref1 = DeclarationReference.from({ source: MOD('a') });
        const declref2 = declref1.with({ source: { scopeName: '@c' } });
        expect(declref2).not.toBe(declref1);
        expect(declref2.source?.toString()).toBe('@c/a!');
      });
    });
    describe('with({ packageName: <equivalent> })', () => {
      it('produces same reference', () => {
        const source = MOD('a');
        const declref1 = DeclarationReference.from({ source });
        const declref2 = declref1.with({ packageName: 'a' });
        expect(declref2).toBe(declref1);
      });
    });
    describe('with({ packageName: <different> })', () => {
      it('produces new reference', () => {
        const source = MOD('a');
        const declref1 = DeclarationReference.from({ source });
        const declref2 = declref1.with({ packageName: 'b' });
        expect(declref2).not.toBe(declref1);
        expect(declref2.source?.toString()).toBe('b!');
      });
      it('w/o new importPath in package name: does not change importPath', () => {
        const source = MOD('a/b');
        const declref1 = DeclarationReference.from({ source });
        const declref2 = declref1.with({ packageName: 'c' });
        expect(declref2.source?.toString()).toBe('c/b!');
      });
      it('w/new importPath in package name: changes importPath', () => {
        const source = MOD('a/b');
        const declref1 = DeclarationReference.from({ source });
        const declref2 = declref1.with({ packageName: 'c/d' });
        expect(declref2.source?.toString()).toBe('c/d!');
      });
    });
    describe('with({ packageName: <new> })', () => {
      it('produces new reference', () => {
        const declref1 = DeclarationReference.from({});
        const declref2 = declref1.with({ packageName: 'b' });
        expect(declref2).not.toBe(declref1);
        expect(declref2.source?.toString()).toBe('b!');
      });
    });
    describe('with({ unscopedPackageName: <equivalent> })', () => {
      it('w/o scope: produces same reference', () => {
        const source = MOD('a');
        const declref1 = DeclarationReference.from({ source });
        const declref2 = declref1.with({ unscopedPackageName: 'a' });
        expect(declref2).toBe(declref1);
      });
    });
    describe('with({ unscopedPackageName: <different> })', () => {
      it('w/o scope: produces new reference', () => {
        const source = MOD('a');
        const declref1 = DeclarationReference.from({ source });
        const declref2 = declref1.with({ unscopedPackageName: 'b' });
        expect(declref2).not.toBe(declref1);
        expect(declref2.source?.toString()).toBe('b!');
      });
      it('w/scope: produces new reference', () => {
        const declref1 = DeclarationReference.from({ source: MOD('@a/b') });
        const declref2 = declref1.with({ unscopedPackageName: 'c' });
        expect(declref2).not.toBe(declref1);
        expect(declref2.source?.toString()).toBe('@a/c!');
      });
      it('does not change importPath', () => {
        const declref1 = DeclarationReference.from({ source: MOD('@a/b/c') });
        const declref2 = declref1.with({ unscopedPackageName: 'd' });
        expect(declref2).not.toBe(declref1);
        expect(declref2.source?.toString()).toBe('@a/d/c!');
      });
    });
    describe('with({ unscopedPackageName: <new> })', () => {
      it('produces new reference', () => {
        const declref1 = DeclarationReference.from({});
        const declref2 = declref1.with({ unscopedPackageName: 'b' });
        expect(declref2).not.toBe(declref1);
        expect(declref2.source?.toString()).toBe('b!');
      });
    });
    describe('with({ scopeName: <equivalent> })', () => {
      it('produces same reference', () => {
        const declref1 = DeclarationReference.from({ source: MOD('@a/b') });
        const declref2 = declref1.with({ scopeName: '@a' });
        expect(declref2).toBe(declref1);
      });
    });
    describe('with({ scopeName: <different> })', () => {
      it('produces new reference', () => {
        const declref1 = DeclarationReference.from({ source: MOD('@a/b') });
        const declref2 = declref1.with({ scopeName: '@c' });
        expect(declref2).not.toBe(declref1);
        expect(declref2.source?.toString()).toBe('@c/b!');
      });
      it('does not change importPath', () => {
        const declref1 = DeclarationReference.from({ source: MOD('@a/b/c') });
        const declref2 = declref1.with({ scopeName: '@d' });
        expect(declref2).not.toBe(declref1);
        expect(declref2.source?.toString()).toBe('@d/b/c!');
      });
    });
    describe('with({ scopeName: <new> })', () => {
      it('produces new reference', () => {
        const declref1 = DeclarationReference.from({ source: MOD('a') });
        const declref2 = declref1.with({ scopeName: '@b' });
        expect(declref2).not.toBe(declref1);
        expect(declref2.source?.toString()).toBe('@b/a!');
      });
    });
    describe('with({ scopeName: null })', () => {
      it('w/existing scope: produces new reference', () => {
        const declref1 = DeclarationReference.from({ source: MOD('@a/b') });
        const declref2 = declref1.with({ scopeName: null });
        expect(declref2).not.toBe(declref1);
        expect(declref2.source?.toString()).toBe('b!');
      });
      it('w/o existing scope: produces same reference', () => {
        const declref1 = DeclarationReference.from({ source: MOD('a') });
        const declref2 = declref1.with({ scopeName: null });
        expect(declref2).toBe(declref1);
      });
    });
    describe('with({ symbol: <same> })', () => {
      it('produces same reference', () => {
        const symbol = SYM('a:var');
        const declref1 = DeclarationReference.from({ symbol });
        const declref2 = declref1.with({ symbol });
        expect(declref2).toBe(declref1);
      });
      it('does not change existing reference', () => {
        const source = MOD('a');
        const symbol = SYM('b');
        const declref1 = DeclarationReference.from({ source, navigation: Navigation.Exports, symbol });
        declref1.with({ symbol });
        expect(declref1.source).toBe(source);
        expect(declref1.navigation).toBe(Navigation.Exports);
        expect(declref1.symbol).toBe(symbol);
      });
    });
    describe('with({ symbol: <equivalent> })', () => {
      it('produces same reference', () => {
        const symbol = SYM('a:var');
        const declref1 = DeclarationReference.from({ symbol });
        const declref2 = declref1.with({ symbol: SYM('a:var') });
        expect(declref2).toBe(declref1);
      });
      it('does not change existing reference', () => {
        const source = MOD('a');
        const symbol = SYM('b');
        const declref1 = DeclarationReference.from({ source, navigation: Navigation.Exports, symbol });
        declref1.with({ symbol: SYM('b') });
        expect(declref1.source).toBe(source);
        expect(declref1.navigation).toBe(Navigation.Exports);
        expect(declref1.symbol).toBe(symbol);
      });
    });
    describe('with({ symbol: <different> })', () => {
      it('produces new reference', () => {
        const symbol1 = SYM('a:var');
        const symbol2 = SYM('b:var');
        const declref1 = DeclarationReference.from({ symbol: symbol1 });
        const declref2 = declref1.with({ symbol: symbol2 });
        expect(declref2).not.toBe(declref1);
        expect(declref2.symbol).toBe(symbol2);
      });
      it('does not change existing reference', () => {
        const source = MOD('a');
        const symbol = SYM('a:var');
        const declref = DeclarationReference.from({ source, symbol });
        declref.with({ symbol: SYM('b:var') });
        expect(declref.source).toBe(source);
        expect(declref.symbol).toBe(symbol);
      });
    });
    describe('with({ symbol: <new> })', () => {
      it('produces new reference', () => {
        const symbol2 = SYM('b:var');
        const declref1 = DeclarationReference.from({});
        const declref2 = declref1.with({ symbol: symbol2 });
        expect(declref2).not.toBe(declref1);
        expect(declref2.symbol).toBe(symbol2);
      });
    });
    describe('with({ symbol: null })', () => {
      it('w/existing symbol: produces new reference', () => {
        const symbol = SYM('a:var');
        const declref1 = DeclarationReference.from({ symbol });
        const declref2 = declref1.with({ symbol: null });
        expect(declref2).not.toBe(declref1);
        expect(declref2.symbol).toBeUndefined();
      });
      it('w/existing symbol: does not change existing reference', () => {
        const symbol = SYM('a:var');
        const declref = DeclarationReference.from({ symbol });
        declref.with({ symbol: null });
        expect(declref.symbol).toBe(symbol);
      });
      it('w/o existing symbol: produces same reference', () => {
        const declref1 = DeclarationReference.from({});
        const declref2 = declref1.with({ symbol: null });
        expect(declref2).toBe(declref1);
      });
    });
    describe('with({ symbol: { componentPath: <equivalent> } })', () => {
      it('produces same reference', () => {
        const symbol = SYM('a:var');
        const declref1 = DeclarationReference.from({ symbol });
        const declref2 = declref1.with({ symbol: { componentPath: CROOT(CSTR('a')) } });
        expect(declref2).toBe(declref1);
      });
    });
    describe('with({ symbol: { componentPath: <different> } })', () => {
      it('produces new reference', () => {
        const symbol = SYM('a:var');
        const declref1 = DeclarationReference.from({ symbol });
        const declref2 = declref1.with({ symbol: { componentPath: CROOT(CSTR('b')) } });
        expect(declref2).not.toBe(declref1);
        expect(declref2.symbol?.componentPath?.toString()).toBe('b');
      });
    });
    describe('with({ symbol: { componentPath: <new> } })', () => {
      it('produces new reference', () => {
        const declref1 = DeclarationReference.from({});
        const declref2 = declref1.with({ symbol: { componentPath: CROOT(CSTR('a')) } });
        expect(declref2).not.toBe(declref1);
        expect(declref2.symbol?.componentPath?.toString()).toBe('a');
      });
    });
    describe('with({ symbol: { componentPath: null } })', () => {
      it('produces new reference', () => {
        const symbol = SYM('a:var');
        const declref1 = DeclarationReference.from({ symbol });
        const declref2 = declref1.with({ symbol: { componentPath: null } });
        expect(declref2).not.toBe(declref1);
        expect(declref2.symbol?.componentPath).toBeUndefined();
      });
    });
    describe('with({ symbol: { meaning: <equivalent> } })', () => {
      it('produces same reference', () => {
        const symbol = SYM('b:var');
        const declref1 = DeclarationReference.from({ symbol });
        const declref2 = declref1.with({ symbol: { meaning: Meaning.Variable } });
        expect(declref2).toBe(declref1);
      });
    });
    describe('with({ symbol: { meaning: <different> } })', () => {
      it('produces new reference', () => {
        const symbol = SYM('b:var');
        const declref1 = DeclarationReference.from({ symbol });
        const declref2 = declref1.with({ symbol: { meaning: Meaning.Interface } });
        expect(declref2).not.toBe(declref1);
        expect(declref2.symbol?.meaning).toBe(Meaning.Interface);
      });
    });
    describe('with({ symbol: { meaning: <new> } })', () => {
      it('w/symbol: produces new reference', () => {
        const symbol = SYM('b');
        const declref1 = DeclarationReference.from({ symbol });
        const declref2 = declref1.with({ symbol: { meaning: Meaning.Variable } });
        expect(declref2).not.toBe(declref1);
        expect(declref2.symbol?.meaning).toBe(Meaning.Variable);
      });
      it('w/o symbol: produces new reference', () => {
        const declref1 = DeclarationReference.from({});
        const declref2 = declref1.with({ symbol: { meaning: Meaning.Variable } });
        expect(declref2).not.toBe(declref1);
        expect(declref2.symbol?.meaning).toBe(Meaning.Variable);
      });
    });
    describe('with({ symbol: { meaning: null } })', () => {
      it('w/symbol: produces new reference', () => {
        const symbol = SYM('b:var');
        const declref1 = DeclarationReference.from({ symbol });
        const declref2 = declref1.with({ symbol: { meaning: null } });
        expect(declref2).not.toBe(declref1);
        expect(declref2.symbol?.meaning).toBeUndefined();
      });
      it('w/o symbol: produces same reference', () => {
        const declref1 = DeclarationReference.from({});
        const declref2 = declref1.with({ symbol: { meaning: null } });
        expect(declref2).toBe(declref1);
      });
    });
    describe('with({ symbol: { overloadIndex: <equivalent> } })', () => {
      it('produces same reference', () => {
        const symbol = SYM('b:0');
        const declref1 = DeclarationReference.from({ symbol });
        const declref2 = declref1.with({ symbol: { overloadIndex: 0 } });
        expect(declref2).toBe(declref1);
      });
    });
    describe('with({ symbol: { overloadIndex: <different> } })', () => {
      it('produces new reference', () => {
        const symbol = SYM('b:0');
        const declref1 = DeclarationReference.from({ symbol });
        const declref2 = declref1.with({ symbol: { overloadIndex: 1 } });
        expect(declref2).not.toBe(declref1);
        expect(declref2.symbol?.overloadIndex).toBe(1);
      });
    });
    describe('with({ symbol: { overloadIndex: <new> } })', () => {
      it('w/symbol: produces new reference', () => {
        const symbol = SYM('b');
        const declref1 = DeclarationReference.from({ symbol });
        const declref2 = declref1.with({ symbol: { overloadIndex: 0 } });
        expect(declref2).not.toBe(declref1);
        expect(declref2.symbol?.overloadIndex).toBe(0);
      });
      it('w/o symbol: produces new reference', () => {
        const declref1 = DeclarationReference.from({});
        const declref2 = declref1.with({ symbol: { overloadIndex: 0 } });
        expect(declref2).not.toBe(declref1);
        expect(declref2.symbol?.overloadIndex).toBe(0);
      });
    });
    describe('with({ symbol: { overloadIndex: null } })', () => {
      it('w/symbol: produces new reference', () => {
        const symbol = SYM('b:0');
        const declref1 = DeclarationReference.from({ symbol });
        const declref2 = declref1.with({ symbol: { overloadIndex: null } });
        expect(declref2).not.toBe(declref1);
        expect(declref2.symbol?.overloadIndex).toBeUndefined();
      });
      it('w/o symbol: produces same reference', () => {
        const declref1 = DeclarationReference.from({});
        const declref2 = declref1.with({ symbol: { overloadIndex: null } });
        expect(declref2).toBe(declref1);
      });
    });
    describe('with({ componentPath: <equivalent> })', () => {
      it('produces same reference', () => {
        const symbol = SYM('a:var');
        const declref1 = DeclarationReference.from({ symbol });
        const declref2 = declref1.with({ componentPath: CROOT(CSTR('a')) });
        expect(declref2).toBe(declref1);
      });
    });
    describe('with({ componentPath: <different> })', () => {
      it('produces new reference', () => {
        const symbol = SYM('a:var');
        const declref1 = DeclarationReference.from({ symbol });
        const declref2 = declref1.with({ componentPath: CROOT(CSTR('b')) });
        expect(declref2).not.toBe(declref1);
        expect(declref2.symbol?.componentPath?.toString()).toBe('b');
      });
    });
    describe('with({ componentPath: <new> })', () => {
      it('produces new reference', () => {
        const declref1 = DeclarationReference.from({});
        const declref2 = declref1.with({ componentPath: CROOT(CSTR('a')) });
        expect(declref2).not.toBe(declref1);
        expect(declref2.symbol?.componentPath?.toString()).toBe('a');
      });
    });
    describe('with({ componentPath: null })', () => {
      it('produces new reference', () => {
        const symbol = SYM('a:var');
        const declref1 = DeclarationReference.from({ symbol });
        const declref2 = declref1.with({ componentPath: null });
        expect(declref2).not.toBe(declref1);
        expect(declref2.symbol?.componentPath).toBeUndefined();
      });
    });
    describe('with({ meaning: <equivalent> })', () => {
      it('produces same reference', () => {
        const symbol = SYM('b:var');
        const declref1 = DeclarationReference.from({ symbol });
        const declref2 = declref1.with({ meaning: Meaning.Variable });
        expect(declref2).toBe(declref1);
      });
    });
    describe('with({ meaning: <different> })', () => {
      it('produces new reference', () => {
        const symbol = SYM('b:var');
        const declref1 = DeclarationReference.from({ symbol });
        const declref2 = declref1.with({ meaning: Meaning.Interface });
        expect(declref2).not.toBe(declref1);
        expect(declref2.symbol?.meaning).toBe(Meaning.Interface);
      });
    });
    describe('with({ meaning: <new> })', () => {
      it('w/symbol: produces new reference', () => {
        const symbol = SYM('b');
        const declref1 = DeclarationReference.from({ symbol });
        const declref2 = declref1.with({ meaning: Meaning.Variable });
        expect(declref2).not.toBe(declref1);
        expect(declref2.symbol?.meaning).toBe(Meaning.Variable);
      });
      it('w/o symbol: produces new reference', () => {
        const declref1 = DeclarationReference.from({});
        const declref2 = declref1.with({ meaning: Meaning.Variable });
        expect(declref2).not.toBe(declref1);
        expect(declref2.symbol?.meaning).toBe(Meaning.Variable);
      });
    });
    describe('with({ meaning: null })', () => {
      it('w/symbol: produces new reference', () => {
        const symbol = SYM('b:var');
        const declref1 = DeclarationReference.from({ symbol });
        const declref2 = declref1.with({ meaning: null });
        expect(declref2).not.toBe(declref1);
        expect(declref2.symbol?.meaning).toBeUndefined();
      });
      it('w/o symbol: produces same reference', () => {
        const declref1 = DeclarationReference.from({});
        const declref2 = declref1.with({ meaning: null });
        expect(declref2).toBe(declref1);
      });
    });
    describe('with({ overloadIndex: <equivalent> })', () => {
      it('produces same reference', () => {
        const symbol = SYM('b:0');
        const declref1 = DeclarationReference.from({ symbol });
        const declref2 = declref1.with({ overloadIndex: 0 });
        expect(declref2).toBe(declref1);
      });
    });
    describe('with({ overloadIndex: <different> })', () => {
      it('produces new reference', () => {
        const symbol = SYM('b:0');
        const declref1 = DeclarationReference.from({ symbol });
        const declref2 = declref1.with({ overloadIndex: 1 });
        expect(declref2).not.toBe(declref1);
        expect(declref2.symbol?.overloadIndex).toBe(1);
      });
    });
    describe('with({ overloadIndex: <new> })', () => {
      it('w/symbol: produces new reference', () => {
        const symbol = SYM('b');
        const declref1 = DeclarationReference.from({ symbol });
        const declref2 = declref1.with({ overloadIndex: 0 });
        expect(declref2).not.toBe(declref1);
        expect(declref2.symbol?.overloadIndex).toBe(0);
      });
      it('w/o symbol: produces new reference', () => {
        const declref1 = DeclarationReference.from({});
        const declref2 = declref1.with({ overloadIndex: 0 });
        expect(declref2).not.toBe(declref1);
        expect(declref2.symbol?.overloadIndex).toBe(0);
      });
    });
    describe('with({ overloadIndex: null })', () => {
      it('w/symbol: produces new reference', () => {
        const symbol = SYM('b:0');
        const declref1 = DeclarationReference.from({ symbol });
        const declref2 = declref1.with({ overloadIndex: null });
        expect(declref2).not.toBe(declref1);
        expect(declref2.symbol?.overloadIndex).toBeUndefined();
      });
      it('w/o symbol: produces same reference', () => {
        const declref1 = DeclarationReference.from({});
        const declref2 = declref1.with({ overloadIndex: null });
        expect(declref2).toBe(declref1);
      });
    });
  });
  it('addNavigationStep()', () => {
    const symbol1 = SYM('a');
    const symbol2 = symbol1.addNavigationStep(Navigation.Exports, 'b');
    expect(symbol2.componentPath).toBeInstanceOf(ComponentNavigation);
    expect((symbol2.componentPath as ComponentNavigation).parent).toBe(symbol1.componentPath);
    expect((symbol2.componentPath as ComponentNavigation).navigation).toBe(Navigation.Exports);
    expect((symbol2.componentPath as ComponentNavigation).component.toString()).toBe('b');
  });
  it.each`
    left               | right              | expected
    ${undefined}       | ${undefined}       | ${true}
    ${DREF('a!b:var')} | ${undefined}       | ${false}
    ${DREF('a!b:var')} | ${DREF('a!b:var')} | ${true}
    ${DREF('a!b:var')} | ${DREF('a!b')}     | ${false}
  `('static equals($left, $right)', ({ left, right, expected }) => {
    expect(DeclarationReference.equals(left, right)).toBe(expected);
    expect(DeclarationReference.equals(right, left)).toBe(expected);
  });
});

describe('SourceBase', () => {
  it('toDeclarationReference()', () => {
    const source = MOD('a');
    const symbol = SYM({});
    const declref = source.toDeclarationReference({
      navigation: Navigation.Exports,
      symbol
    });
    expect(declref.source).toBe(source);
    expect(declref.navigation).toBe(Navigation.Exports);
    expect(declref.symbol).toBe(symbol);
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
    packageName | importPath   | text
    ${'a'}      | ${undefined} | ${'a'}
    ${'a'}      | ${'b'}       | ${'a/b'}
    ${'@a/b'}   | ${undefined} | ${'@a/b'}
    ${'@a/b'}   | ${'c'}       | ${'@a/b/c'}
  `('fromPackage($packageName, $importPath)', ({ packageName, importPath, text }) => {
    const source: ModuleSource = ModuleSource.fromPackage(packageName, importPath);
    expect(source.path).toBe(text);
  });
  it.each`
    scopeName | unscopedPackageName | importPath   | text
    ${''}     | ${'a'}              | ${undefined} | ${'a'}
    ${''}     | ${'a'}              | ${'b'}       | ${'a/b'}
    ${'a'}    | ${'b'}              | ${undefined} | ${'@a/b'}
    ${'@a'}   | ${'b'}              | ${undefined} | ${'@a/b'}
    ${'a'}    | ${'b'}              | ${'c'}       | ${'@a/b/c'}
    ${'@a'}   | ${'b'}              | ${'c'}       | ${'@a/b/c'}
  `(
    'fromScopedPackage($scopeName, $unscopedPackageName, $importPath)',
    ({ scopeName, unscopedPackageName, importPath, text }) => {
      const source: ModuleSource = ModuleSource.fromScopedPackage(scopeName, unscopedPackageName, importPath);
      expect(source.path).toBe(text);
    }
  );
  describe('static from()', () => {
    it('static from(string) w/o scope', () => {
      const source = ModuleSource.from('a/b');
      expect(source.packageName).toBe('a');
      expect(source.scopeName).toBe('');
      expect(source.unscopedPackageName).toBe('a');
      expect(source.importPath).toBe('b');
    });
    it('static from(string) w/trailing "!"', () => {
      const source = ModuleSource.from('a/b!');
      expect(source.packageName).toBe('a');
      expect(source.scopeName).toBe('');
      expect(source.unscopedPackageName).toBe('a');
      expect(source.importPath).toBe('b');
    });
    it('static from(string) w/ scope', () => {
      const source = ModuleSource.from('@a/b/c');
      expect(source.packageName).toBe('@a/b');
      expect(source.scopeName).toBe('@a');
      expect(source.unscopedPackageName).toBe('b');
      expect(source.importPath).toBe('c');
    });
    it('static from(ModuleSource)', () => {
      const source1 = ModuleSource.from('a');
      const source2 = ModuleSource.from(source1);
      expect(source2).toBe(source1);
    });
    it('static from({ packageName: "a/b" })', () => {
      const source = ModuleSource.from({ packageName: 'a/b' });
      expect(source.packageName).toBe('a');
      expect(source.scopeName).toBe('');
      expect(source.unscopedPackageName).toBe('a');
      expect(source.importPath).toBe('b');
    });
    it('static from({ packageName: "@a/b/c" })', () => {
      const source = ModuleSource.from({ packageName: '@a/b/c' });
      expect(source.packageName).toBe('@a/b');
      expect(source.scopeName).toBe('@a');
      expect(source.unscopedPackageName).toBe('b');
      expect(source.importPath).toBe('c');
    });
    it('static from({ packageName, importPath })', () => {
      const source = ModuleSource.from({ packageName: 'a', importPath: 'b' });
      expect(source.packageName).toBe('a');
      expect(source.scopeName).toBe('');
      expect(source.unscopedPackageName).toBe('a');
      expect(source.importPath).toBe('b');
    });
    it('static from({ unscopedPackageName })', () => {
      const source = ModuleSource.from({ unscopedPackageName: 'a', importPath: 'b' });
      expect(source.packageName).toBe('a');
      expect(source.scopeName).toBe('');
      expect(source.unscopedPackageName).toBe('a');
      expect(source.importPath).toBe('b');
    });
    it('static from({ scopeName, unscopedPackageName, importPath })', () => {
      const source = ModuleSource.from({ scopeName: 'a', unscopedPackageName: 'b', importPath: 'c' });
      expect(source.packageName).toBe('@a/b');
      expect(source.scopeName).toBe('@a');
      expect(source.unscopedPackageName).toBe('b');
      expect(source.importPath).toBe('c');
    });
    it('static from({ importPath })', () => {
      const source = ModuleSource.from({ importPath: '/c' });
      expect(source.packageName).toBe('');
      expect(source.scopeName).toBe('');
      expect(source.unscopedPackageName).toBe('');
      expect(source.importPath).toBe('/c');
    });
  });
  describe('with()', () => {
    it('with({ })', () => {
      const source1 = ModuleSource.from('a/b');
      const source2 = source1.with({});
      expect(source2).toBe(source1);
    });
    it('with({ packageName: <same> })', () => {
      const source1 = ModuleSource.from('a/b');
      const source2 = source1.with({ packageName: 'a' });
      expect(source2).toBe(source1);
    });
    it('with({ packageName: <different> }) w/ existing scopeName', () => {
      const source1 = ModuleSource.from('@a/b/c');
      const source2 = source1.with({ packageName: 'd' });
      expect(source2.packageName).toBe('d');
      expect(source2.scopeName).toBe('');
      expect(source2.unscopedPackageName).toBe('d');
      expect(source2.importPath).toBe('c');
    });
    it('with({ packageName: <different> }) w/o existing scopeName', () => {
      const source1 = ModuleSource.from('a/b');
      const source2 = source1.with({ packageName: 'c' });
      expect(source2.packageName).toBe('c');
      expect(source2.scopeName).toBe('');
      expect(source2.unscopedPackageName).toBe('c');
      expect(source2.importPath).toBe('b');
    });
    it('with({ packageName: <different + path> })', () => {
      const source1 = ModuleSource.from('a/b');
      const source2 = source1.with({ packageName: 'c/d' });
      expect(source2.packageName).toBe('c');
      expect(source2.scopeName).toBe('');
      expect(source2.unscopedPackageName).toBe('c');
      expect(source2.importPath).toBe('d');
    });
    it('with({ scopeName: <same> })', () => {
      const source1 = ModuleSource.from('@a/b/c');
      const source2 = source1.with({ scopeName: '@a' });
      expect(source2).toBe(source1);
    });
    it('with({ scopeName: <different> }) w/ existing scopeName', () => {
      const source1 = ModuleSource.from('@a/b/c');
      const source2 = source1.with({ scopeName: 'd' });
      expect(source2.packageName).toBe('@d/b');
      expect(source2.scopeName).toBe('@d');
      expect(source2.unscopedPackageName).toBe('b');
      expect(source2.importPath).toBe('c');
    });
    it('with({ scopeName: <different> }) w/o existing scopeName', () => {
      const source1 = ModuleSource.from('b/c');
      const source2 = source1.with({ scopeName: 'd' });
      expect(source2.packageName).toBe('@d/b');
      expect(source2.scopeName).toBe('@d');
      expect(source2.unscopedPackageName).toBe('b');
      expect(source2.importPath).toBe('c');
    });
    it('with({ scopeName: null }) w/ existing scopeName', () => {
      const source1 = ModuleSource.from('@a/b/c');
      const source2 = source1.with({ scopeName: null });
      expect(source2.packageName).toBe('b');
      expect(source2.scopeName).toBe('');
      expect(source2.unscopedPackageName).toBe('b');
      expect(source2.importPath).toBe('c');
    });
    it('with({ unscopedPackageName: <same> })', () => {
      const source1 = ModuleSource.from('@a/b/c');
      const source2 = source1.with({ unscopedPackageName: 'b' });
      expect(source2).toBe(source1);
    });
    it('with({ unscopedPackageName: <different> }) w/ scopeName', () => {
      const source1 = ModuleSource.from('@a/b/c');
      const source2 = source1.with({ unscopedPackageName: 'd' });
      expect(source2.packageName).toBe('@a/d');
      expect(source2.scopeName).toBe('@a');
      expect(source2.unscopedPackageName).toBe('d');
      expect(source2.importPath).toBe('c');
    });
    it('with({ unscopedPackageName: <different> }) w/o scopeName', () => {
      const source1 = ModuleSource.from('a/b');
      const source2 = source1.with({ unscopedPackageName: 'c' });
      expect(source2.packageName).toBe('c');
      expect(source2.scopeName).toBe('');
      expect(source2.unscopedPackageName).toBe('c');
      expect(source2.importPath).toBe('b');
    });
    it('with({ importPath: <same> })', () => {
      const source1 = ModuleSource.from('a/b');
      const source2 = source1.with({ importPath: 'b' });
      expect(source2).toBe(source1);
    });
    it('with({ importPath: <different> })', () => {
      const source1 = ModuleSource.from('a/b');
      const source2 = source1.with({ importPath: 'c' });
      expect(source2.packageName).toBe('a');
      expect(source2.scopeName).toBe('');
      expect(source2.unscopedPackageName).toBe('a');
      expect(source2.importPath).toBe('c');
    });
    it('with({ importPath: null })', () => {
      const source1 = ModuleSource.from('a/b');
      const source2 = source1.with({ importPath: null });
      expect(source2.packageName).toBe('a');
      expect(source2.scopeName).toBe('');
      expect(source2.unscopedPackageName).toBe('a');
      expect(source2.importPath).toBe('');
    });
  });
  it.each`
    left         | right         | expected
    ${undefined} | ${undefined}  | ${true}
    ${MOD('a')}  | ${undefined}  | ${false}
    ${MOD('a')}  | ${MOD('a')}   | ${true}
    ${MOD('a')}  | ${MOD('a/b')} | ${false}
  `('static equals($left, $right)', ({ left, right, expected }) => {
    expect(ModuleSource.equals(left, right)).toBe(expected);
    expect(ModuleSource.equals(right, left)).toBe(expected);
  });
});

describe('Source', () => {
  describe('from()', () => {
    it('from("!")', () => {
      const source = Source.from('!');
      expect(source).toBe(GlobalSource.instance);
    });
    it('from(string) w/o scope', () => {
      const source = Source.from('a/b') as ModuleSource;
      expect(source).toBeInstanceOf(ModuleSource);
      expect(source.packageName).toBe('a');
      expect(source.scopeName).toBe('');
      expect(source.unscopedPackageName).toBe('a');
      expect(source.importPath).toBe('b');
    });
    it('from(string) w/trailing "!"', () => {
      const source = Source.from('a/b!') as ModuleSource;
      expect(source).toBeInstanceOf(ModuleSource);
      expect(source.packageName).toBe('a');
      expect(source.scopeName).toBe('');
      expect(source.unscopedPackageName).toBe('a');
      expect(source.importPath).toBe('b');
    });
    it('from(string) w/ scope', () => {
      const source = Source.from('@a/b/c') as ModuleSource;
      expect(source).toBeInstanceOf(ModuleSource);
      expect(source.packageName).toBe('@a/b');
      expect(source.scopeName).toBe('@a');
      expect(source.unscopedPackageName).toBe('b');
      expect(source.importPath).toBe('c');
    });
    it('from(ModuleSource)', () => {
      const source1 = ModuleSource.from('a');
      const source2 = Source.from(source1);
      expect(source2).toBe(source1);
    });
    it('from(GlobalSource)', () => {
      const source1 = GlobalSource.instance;
      const source2 = Source.from(source1);
      expect(source2).toBe(source1);
    });
    it('from({ packageName: "a/b" })', () => {
      const source = Source.from({ packageName: 'a/b' }) as ModuleSource;
      expect(source).toBeInstanceOf(ModuleSource);
      expect(source.packageName).toBe('a');
      expect(source.scopeName).toBe('');
      expect(source.unscopedPackageName).toBe('a');
      expect(source.importPath).toBe('b');
    });
    it('from({ packageName: "@a/b/c" })', () => {
      const source = Source.from({ packageName: '@a/b/c' }) as ModuleSource;
      expect(source).toBeInstanceOf(ModuleSource);
      expect(source.packageName).toBe('@a/b');
      expect(source.scopeName).toBe('@a');
      expect(source.unscopedPackageName).toBe('b');
      expect(source.importPath).toBe('c');
    });
    it('from({ packageName, importPath })', () => {
      const source = Source.from({ packageName: 'a', importPath: 'b' }) as ModuleSource;
      expect(source).toBeInstanceOf(ModuleSource);
      expect(source.packageName).toBe('a');
      expect(source.scopeName).toBe('');
      expect(source.unscopedPackageName).toBe('a');
      expect(source.importPath).toBe('b');
    });
    it('from({ unscopedPackageName })', () => {
      const source = Source.from({ unscopedPackageName: 'a', importPath: 'b' }) as ModuleSource;
      expect(source).toBeInstanceOf(ModuleSource);
      expect(source.packageName).toBe('a');
      expect(source.scopeName).toBe('');
      expect(source.unscopedPackageName).toBe('a');
      expect(source.importPath).toBe('b');
    });
    it('from({ scopeName, unscopedPackageName, importPath })', () => {
      const source = Source.from({
        scopeName: 'a',
        unscopedPackageName: 'b',
        importPath: 'c'
      }) as ModuleSource;
      expect(source).toBeInstanceOf(ModuleSource);
      expect(source.packageName).toBe('@a/b');
      expect(source.scopeName).toBe('@a');
      expect(source.unscopedPackageName).toBe('b');
      expect(source.importPath).toBe('c');
    });
    it('from({ importPath })', () => {
      const source = Source.from({ importPath: '/c' }) as ModuleSource;
      expect(source).toBeInstanceOf(ModuleSource);
      expect(source.packageName).toBe('');
      expect(source.scopeName).toBe('');
      expect(source.unscopedPackageName).toBe('');
      expect(source.importPath).toBe('/c');
    });
  });
  it.each`
    left                     | right                    | expected
    ${undefined}             | ${undefined}             | ${true}
    ${GlobalSource.instance} | ${undefined}             | ${false}
    ${GlobalSource.instance} | ${GlobalSource.instance} | ${true}
    ${MOD('a')}              | ${undefined}             | ${false}
    ${MOD('a')}              | ${MOD('a')}              | ${true}
    ${MOD('a')}              | ${GlobalSource.instance} | ${false}
    ${MOD('a')}              | ${MOD('a/b')}            | ${false}
  `('equals($left, $right)', ({ left, right, expected }) => {
    expect(Source.equals(left, right)).toBe(expected);
    expect(Source.equals(right, left)).toBe(expected);
  });
});

describe('SymbolReference', () => {
  it('static empty()', () => {
    const symbol = SymbolReference.empty();
    expect(symbol.componentPath).toBeUndefined();
    expect(symbol.meaning).toBeUndefined();
    expect(symbol.overloadIndex).toBeUndefined();
  });
  describe('static from()', () => {
    it('static from({ })', () => {
      const symbol = SymbolReference.from({});
      expect(symbol.componentPath).toBeUndefined();
      expect(symbol.meaning).toBeUndefined();
      expect(symbol.overloadIndex).toBeUndefined();
    });
    it('static from({ componentPath })', () => {
      const componentPath = CROOT(CSTR('a'));
      const symbol = SymbolReference.from({ componentPath });
      expect(symbol.componentPath).toBe(componentPath);
      expect(symbol.meaning).toBeUndefined();
      expect(symbol.overloadIndex).toBeUndefined();
    });
    it('static from({ meaning })', () => {
      const symbol = SymbolReference.from({ meaning: Meaning.Variable });
      expect(symbol.componentPath).toBeUndefined();
      expect(symbol.meaning).toBe(Meaning.Variable);
      expect(symbol.overloadIndex).toBeUndefined();
    });
    it('static from(SymbolReference)', () => {
      const symbol1 = SYM({});
      const symbol2 = SymbolReference.from(symbol1);
      expect(symbol2).toBe(symbol1);
    });
  });
  describe('with()', () => {
    it('with({ })', () => {
      const symbol = SYM({});
      const updated = symbol.with({});
      expect(updated).toBe(symbol);
    });
    it('with({ componentPath: <same> })', () => {
      const componentPath = CROOT(CSTR('a'));
      const symbol = SYM({ componentPath });
      const updated = symbol.with({ componentPath });
      expect(updated).toBe(symbol);
    });
    it('with({ componentPath: <equivalent> })', () => {
      const componentPath = CROOT(CSTR('a'));
      const symbol = SYM({ componentPath });
      const updated = symbol.with({ componentPath: CROOT(CSTR('a')) });
      expect(updated).toBe(symbol);
    });
    it('with({ componentPath: null })', () => {
      const componentPath = CROOT(CSTR('a'));
      const symbol = SYM({ componentPath });
      const updated = symbol.with({ componentPath: null });
      expect(updated).not.toBe(symbol);
      expect(updated.componentPath).toBeUndefined();
    });
    it('with({ meaning: <same> })', () => {
      const symbol = SYM({ meaning: Meaning.Variable });
      const updated = symbol.with({ meaning: Meaning.Variable });
      expect(updated).toBe(symbol);
    });
    it('with({ overloadIndex: <same> })', () => {
      const symbol = SYM({ overloadIndex: 0 });
      const updated = symbol.with({ overloadIndex: 0 });
      expect(updated).toBe(symbol);
    });
  });
  it('withComponentPath()', () => {
    const root = CROOT(CSTR('a'));
    const symbol = SYM({});
    const updated = symbol.withComponentPath(root);
    expect(updated).not.toBe(symbol);
    expect(updated.componentPath).toBe(root);
  });
  it('withMeaning()', () => {
    const symbol = SYM({});
    const updated = symbol.withMeaning(Meaning.Variable);
    expect(updated).not.toBe(symbol);
    expect(updated.meaning).toBe(Meaning.Variable);
  });
  it('withOverloadIndex()', () => {
    const symbol = SYM({});
    const updated = symbol.withOverloadIndex(0);
    expect(updated).not.toBe(symbol);
    expect(updated.overloadIndex).toBe(0);
  });
  it('withSource()', () => {
    const symbol = SYM({});
    const source = ModuleSource.fromPackage('a');
    const declref = symbol.withSource(source);
    expect(declref.source).toBe(source);
    expect(declref.symbol).toBe(symbol);
  });
  it('addNavigationStep()', () => {
    const root = CROOT(CSTR('a'));
    const component = CSTR('b');
    const symbol = SYM({ componentPath: root });
    const step = symbol.addNavigationStep(Navigation.Exports, component);
    expect(step.componentPath).toBeInstanceOf(ComponentNavigation);
    expect((step.componentPath as ComponentNavigation).parent).toBe(root);
    expect((step.componentPath as ComponentNavigation).navigation).toBe(Navigation.Exports);
    expect((step.componentPath as ComponentNavigation).component).toBe(component);
  });
  it('toDeclarationReference()', () => {
    const root = CROOT(CSTR('a'));
    const symbol = SYM({ componentPath: root });
    const source = ModuleSource.fromPackage('b');
    const declref = symbol.toDeclarationReference({
      source,
      navigation: Navigation.Exports
    });
    expect(declref.source).toBe(source);
    expect(declref.navigation).toBe(Navigation.Exports);
    expect(declref.symbol).toBe(symbol);
  });
});

describe('ComponentPathBase', () => {
  it('addNavigationStep()', () => {
    const root = CROOT(CSTR('a'));
    const component = CSTR('b');
    const step = root.addNavigationStep(Navigation.Exports, component);
    expect(step.parent).toBe(root);
    expect(step.navigation).toBe(Navigation.Exports);
    expect(step.component).toBe(component);
  });
  it('withMeaning()', () => {
    const component = CROOT(CSTR('a'));
    const symbol = component.withMeaning(Meaning.Variable);
    expect(symbol.componentPath).toBe(component);
    expect(symbol.meaning).toBe(Meaning.Variable);
  });
  it('withOverloadIndex()', () => {
    const component = CROOT(CSTR('a'));
    const symbol = component.withOverloadIndex(0);
    expect(symbol.componentPath).toBe(component);
    expect(symbol.overloadIndex).toBe(0);
  });
  it('withSource()', () => {
    const component = CROOT(CSTR('a'));
    const source = ModuleSource.fromPackage('b');
    const declref = component.withSource(source);
    expect(declref.source).toBe(source);
    expect(declref.navigation).toBe(Navigation.Exports);
    expect(declref.symbol?.componentPath).toBe(component);
  });
  it('toSymbolReference()', () => {
    const component = CROOT(CSTR('a'));
    const symbol = component.toSymbolReference({
      meaning: Meaning.Variable,
      overloadIndex: 0
    });
    expect(symbol.componentPath).toBe(component);
    expect(symbol.meaning).toBe(Meaning.Variable);
    expect(symbol.overloadIndex).toBe(0);
  });
  it('toDeclarationReference()', () => {
    const component = CROOT(CSTR('a'));
    const source = ModuleSource.fromPackage('b');
    const declref = component.toDeclarationReference({
      source,
      navigation: Navigation.Exports,
      meaning: Meaning.Variable,
      overloadIndex: 0
    });
    expect(declref.source).toBe(source);
    expect(declref.navigation).toBe(Navigation.Exports);
    expect(declref.symbol).toBeDefined();
    expect(declref.symbol?.componentPath).toBe(component);
    expect(declref.symbol?.meaning).toBe(Meaning.Variable);
    expect(declref.symbol?.overloadIndex).toBe(0);
  });
});

describe('ComponentRoot', () => {
  it('root', () => {
    const component = new ComponentString('a');
    const root = new ComponentRoot(component);
    expect(root.root).toBe(root);
  });
  describe('static from()', () => {
    it('static from({ component })', () => {
      const component = Component.from('a');
      const componentPath = ComponentRoot.from({ component });
      expect(componentPath).toBeInstanceOf(ComponentRoot);
      expect(componentPath.component).toBe(component);
    });
    it('static from(ComponentRoot)', () => {
      const component = Component.from('a');
      const root = new ComponentRoot(component);
      const componentPath = ComponentRoot.from(root);
      expect(componentPath).toBeInstanceOf(ComponentRoot);
      expect(componentPath).toBe(root);
    });
  });
  describe('with()', () => {
    it('with({ })', () => {
      const root = ComponentRoot.from({ component: 'a' });
      const updated = root.with({});
      expect(updated).toBe(root);
    });
    it('with({ component: <same> })', () => {
      const component = Component.from('a');
      const root = ComponentRoot.from({ component });
      const updated = root.with({ component });
      expect(updated).toBe(root);
    });
    it('with({ component: Component })', () => {
      const component = Component.from('a');
      const root = ComponentRoot.from({ component });
      const newComponent = Component.from('b');
      const updated = root.with({ component: newComponent });
      expect(updated).not.toBe(root);
      expect(updated.component).toBe(newComponent);
    });
    it('with({ component: DeclarationReference })', () => {
      const component = Component.from('a');
      const root = ComponentRoot.from({ component });
      const reference = DeclarationReference.parse('b');
      const updated = root.with({ component: reference });
      expect(updated).not.toBe(root);
      expect(updated.component).toBeInstanceOf(ComponentReference);
      expect((updated.component as ComponentReference).reference).toBe(reference);
    });
    it('with({ component: string })', () => {
      const component = Component.from('a');
      const root = ComponentRoot.from({ component });
      const updated = root.with({ component: 'b' });
      expect(updated).not.toBe(root);
      expect(updated.component).toBeInstanceOf(ComponentString);
      expect((updated.component as ComponentString).text).toBe('b');
    });
  });
  it.each`
    left                | right                 | expected
    ${undefined}        | ${undefined}          | ${true}
    ${CROOT(CSTR('a'))} | ${undefined}          | ${false}
    ${CROOT(CSTR('a'))} | ${CROOT(CSTR('a'))}   | ${true}
    ${CROOT(CSTR('a'))} | ${CROOT(CSTR('b'))}   | ${false}
    ${CROOT(CSTR('a'))} | ${CROOT(CREF('[a]'))} | ${false}
  `('static equals(left, right) $#', ({ left, right, expected }) => {
    expect(ComponentRoot.equals(left, right)).toBe(expected);
    expect(ComponentRoot.equals(right, left)).toBe(expected);
  });
});

describe('ComponentNavigation', () => {
  it('root', () => {
    const root = ComponentRoot.from({ component: 'a' });
    const step = ComponentNavigation.from({ parent: root, navigation: Navigation.Exports, component: 'b' });
    expect(step.root).toBe(root);
  });
  describe('static from()', () => {
    it('static from(parts)', () => {
      const root = ComponentRoot.from({ component: 'a' });
      const step = ComponentNavigation.from({ parent: root, navigation: Navigation.Exports, component: 'b' });
      expect(step.parent).toBe(root);
      expect(step.navigation).toBe(Navigation.Exports);
      expect(step.component).toBeInstanceOf(ComponentString);
      expect((step.component as ComponentString).text).toBe('b');
    });
    it('static from(ComponentNavigation)', () => {
      const root = ComponentRoot.from({ component: 'a' });
      const step = ComponentNavigation.from({ parent: root, navigation: Navigation.Exports, component: 'b' });
      const result = ComponentNavigation.from(step);
      expect(result).toBe(step);
    });
  });
  describe('with()', () => {
    it('with({ })', () => {
      const root = ComponentRoot.from({ component: 'a' });
      const step = ComponentNavigation.from({ parent: root, navigation: Navigation.Exports, component: 'b' });
      const updated = step.with({});
      expect(updated).toBe(step);
    });
    it('with({ parent: <same> })', () => {
      const root = ComponentRoot.from({ component: 'a' });
      const step = ComponentNavigation.from({ parent: root, navigation: Navigation.Exports, component: 'b' });
      const updated = step.with({ parent: root });
      expect(updated).toBe(step);
    });
    it('with({ parent: <different> })', () => {
      const root = ComponentRoot.from({ component: 'a' });
      const step = ComponentNavigation.from({ parent: root, navigation: Navigation.Exports, component: 'b' });
      const newRoot = ComponentRoot.from({ component: 'c' });
      const updated = step.with({ parent: newRoot });
      expect(updated).not.toBe(step);
      expect(updated.parent).toBe(newRoot);
    });
    it('with({ navigation: <same> })', () => {
      const root = ComponentRoot.from({ component: 'a' });
      const step = ComponentNavigation.from({ parent: root, navigation: Navigation.Exports, component: 'b' });
      const updated = step.with({ navigation: Navigation.Exports });
      expect(updated).toBe(step);
    });
    it('with({ navigation: <different> })', () => {
      const root = ComponentRoot.from({ component: 'a' });
      const step = ComponentNavigation.from({ parent: root, navigation: Navigation.Exports, component: 'b' });
      const updated = step.with({ navigation: Navigation.Members });
      expect(updated).not.toBe(step);
      expect(updated.navigation).toBe(Navigation.Members);
    });
    it('with({ component: <same> })', () => {
      const root = ComponentRoot.from({ component: 'a' });
      const component = Component.from('b');
      const step = ComponentNavigation.from({ parent: root, navigation: Navigation.Exports, component });
      const updated = step.with({ component });
      expect(updated).toBe(step);
    });
    it('with({ component: new Component })', () => {
      const root = ComponentRoot.from({ component: 'a' });
      const component = Component.from('b');
      const step = ComponentNavigation.from({ parent: root, navigation: Navigation.Exports, component });
      const newComponent = Component.from('c');
      const updated = step.with({ component: newComponent });
      expect(updated).not.toBe(step);
      expect(updated.component).toBe(newComponent);
    });
    it('with({ component: string })', () => {
      const root = ComponentRoot.from({ component: 'a' });
      const step = ComponentNavigation.from({ parent: root, navigation: Navigation.Exports, component: 'b' });
      const updated = step.with({ component: 'c' });
      expect(updated).not.toBe(step);
      expect(updated.component).toBeInstanceOf(ComponentString);
      expect((updated.component as ComponentString).text).toBe('c');
    });
    it('with({ component: DeclarationReference })', () => {
      const root = ComponentRoot.from({ component: 'a' });
      const step = ComponentNavigation.from({ parent: root, navigation: Navigation.Exports, component: 'b' });
      const reference = DeclarationReference.parse('c');
      const updated = step.with({ component: reference });
      expect(updated).not.toBe(step);
      expect(updated.component).toBeInstanceOf(ComponentReference);
      expect((updated.component as ComponentReference).reference).toBe(reference);
    });
  });
  it.each`
    left                                        | right                                              | expected
    ${undefined}                                | ${undefined}                                       | ${true}
    ${CNAV(CROOT(CSTR('a')), '.', CSTR('a'))}   | ${undefined}                                       | ${false}
    ${CNAV(CROOT(CSTR('a')), '.', CSTR('a'))}   | ${CNAV(CROOT(CSTR('a')), '.', CSTR('a'))}          | ${true}
    ${CNAV(CROOT(CSTR('a')), '.', CSTR('a'))}   | ${CNAV(CROOT(CSTR('a')), '.', CSTR('b'))}          | ${false}
    ${CNAV(CROOT(CSTR('a')), '.', CSTR('a'))}   | ${CNAV(CROOT(CSTR('a')), '.', CREF('[a]'))}        | ${false}
    ${CNAV(CROOT(CSTR('a')), '.', CSTR('a'))}   | ${CNAV(CROOT(CSTR('a')), '.', { text: 'a' })}      | ${true}
    ${CNAV(CROOT(CSTR('a')), '.', CSTR('a'))}   | ${CNAV(CROOT(CSTR('a')), '.', { text: 'b' })}      | ${false}
    ${CNAV(CROOT(CSTR('a')), '.', CSTR('a'))}   | ${CNAV(CROOT(CSTR('a')), '.', { reference: 'a' })} | ${false}
    ${CNAV(CROOT(CSTR('a')), '.', CSTR('a'))}   | ${CNAV(CROOT(CSTR('a')), '.', DREF('a'))}          | ${false}
    ${CNAV(CROOT(CSTR('a')), '.', CSTR('a'))}   | ${CNAV(CROOT(CSTR('a')), '.', 'a')}                | ${true}
    ${CNAV(CROOT(CSTR('a')), '.', CSTR('a'))}   | ${CNAV(CROOT(CSTR('a')), '.', 'b')}                | ${false}
    ${CNAV(CROOT(CSTR('a')), '.', CSTR('a'))}   | ${CNAV(CROOT(CSTR('a')), '#', CSTR('a'))}          | ${false}
    ${CNAV(CROOT(CSTR('a')), '.', CREF('[a]'))} | ${CNAV(CROOT(CSTR('a')), '.', CREF('[a]'))}        | ${true}
    ${CNAV(CROOT(CSTR('a')), '.', CREF('[a]'))} | ${CNAV(CROOT(CSTR('a')), '.', CREF('[b]'))}        | ${false}
    ${CNAV(CROOT(CSTR('a')), '.', CREF('[a]'))} | ${CNAV(CROOT(CSTR('a')), '.', CSTR('a'))}          | ${false}
    ${CNAV(CROOT(CSTR('a')), '.', CREF('[a]'))} | ${CNAV(CROOT(CSTR('a')), '.', { reference: 'a' })} | ${true}
    ${CNAV(CROOT(CSTR('a')), '.', CREF('[a]'))} | ${CNAV(CROOT(CSTR('a')), '.', { reference: 'b' })} | ${false}
    ${CNAV(CROOT(CSTR('a')), '.', CREF('[a]'))} | ${CNAV(CROOT(CSTR('a')), '.', { text: 'a' })}      | ${false}
    ${CNAV(CROOT(CSTR('a')), '.', CREF('[a]'))} | ${CNAV(CROOT(CSTR('a')), '.', DREF('a'))}          | ${true}
    ${CNAV(CROOT(CSTR('a')), '.', CREF('[a]'))} | ${CNAV(CROOT(CSTR('a')), '.', DREF('b'))}          | ${false}
    ${CNAV(CROOT(CSTR('a')), '.', CREF('[a]'))} | ${CNAV(CROOT(CSTR('a')), '.', 'a')}                | ${false}
    ${CNAV(CROOT(CSTR('a')), '.', CREF('[a]'))} | ${CNAV(CROOT(CSTR('a')), '#', CREF('[a]'))}        | ${false}
    ${CNAV(CROOT(CSTR('a')), '.', CSTR('a'))}   | ${CNAV(CROOT(CREF('[a]')), '.', CSTR('a'))}        | ${false}
  `('static equals(left, right) $#', ({ left, right, expected }) => {
    expect(ComponentNavigation.equals(left, right)).toBe(expected);
    expect(ComponentNavigation.equals(right, left)).toBe(expected);
  });
});

describe('ComponentPath', () => {
  describe('static from()', () => {
    it('from({ component })', () => {
      const component = Component.from('a');
      const componentPath = ComponentPath.from({ component });
      expect(componentPath).toBeInstanceOf(ComponentRoot);
      expect(componentPath.component).toBe(component);
    });
    it('from(ComponentRoot)', () => {
      const component = Component.from('a');
      const root = new ComponentRoot(component);
      const componentPath = ComponentPath.from(root);
      expect(componentPath).toBe(root);
    });
    it('from(string)', () => {
      const componentPath = ComponentPath.from('a.b.[c]');
      const pathABC = componentPath as ComponentNavigation;
      const pathAB = pathABC?.parent as ComponentNavigation;
      const pathA = pathAB?.parent as ComponentRoot;
      expect(pathABC).toBeInstanceOf(ComponentNavigation);
      expect(pathABC.component).toBeInstanceOf(ComponentReference);
      expect(pathABC.component.toString()).toBe('[c]');
      expect(pathAB).toBeInstanceOf(ComponentNavigation);
      expect(pathAB.component).toBeInstanceOf(ComponentString);
      expect(pathAB.component.toString()).toBe('b');
      expect(pathA).toBeInstanceOf(ComponentRoot);
      expect(pathA.component).toBeInstanceOf(ComponentString);
      expect(pathA.component.toString()).toBe('a');
    });
    it('from(parts)', () => {
      const root = ComponentRoot.from({ component: 'a' });
      const step = ComponentPath.from({ parent: root, navigation: Navigation.Exports, component: 'b' });
      expect(step).toBeInstanceOf(ComponentNavigation);
      expect((step as ComponentNavigation).parent).toBe(root);
      expect((step as ComponentNavigation).navigation).toBe(Navigation.Exports);
      expect(step.component).toBeInstanceOf(ComponentString);
      expect((step.component as ComponentString).text).toBe('b');
    });
    it('from(ComponentNavigation)', () => {
      const root = ComponentRoot.from({ component: 'a' });
      const step = ComponentPath.from({ parent: root, navigation: Navigation.Exports, component: 'b' });
      const result = ComponentPath.from(step);
      expect(result).toBe(step);
    });
  });
  it.each`
    left                                        | right                                              | expected
    ${undefined}                                | ${undefined}                                       | ${true}
    ${CROOT(CSTR('a'))}                         | ${undefined}                                       | ${false}
    ${CROOT(CSTR('a'))}                         | ${CROOT(CSTR('a'))}                                | ${true}
    ${CROOT(CSTR('a'))}                         | ${CROOT(CSTR('b'))}                                | ${false}
    ${CROOT(CSTR('a'))}                         | ${CROOT(CREF('[a]'))}                              | ${false}
    ${CROOT(CSTR('a'))}                         | ${CNAV(CROOT(CSTR('a')), '.', CSTR('a'))}          | ${false}
    ${undefined}                                | ${CNAV(CROOT(CSTR('a')), '.', CSTR('a'))}          | ${false}
    ${CNAV(CROOT(CSTR('a')), '.', CSTR('a'))}   | ${undefined}                                       | ${false}
    ${CNAV(CROOT(CSTR('a')), '.', CSTR('a'))}   | ${CNAV(CROOT(CSTR('a')), '.', CSTR('a'))}          | ${true}
    ${CNAV(CROOT(CSTR('a')), '.', CSTR('a'))}   | ${CNAV(CROOT(CSTR('a')), '.', CSTR('b'))}          | ${false}
    ${CNAV(CROOT(CSTR('a')), '.', CSTR('a'))}   | ${CNAV(CROOT(CSTR('a')), '.', CREF('[a]'))}        | ${false}
    ${CNAV(CROOT(CSTR('a')), '.', CSTR('a'))}   | ${CNAV(CROOT(CSTR('a')), '.', { text: 'a' })}      | ${true}
    ${CNAV(CROOT(CSTR('a')), '.', CSTR('a'))}   | ${CNAV(CROOT(CSTR('a')), '.', { text: 'b' })}      | ${false}
    ${CNAV(CROOT(CSTR('a')), '.', CSTR('a'))}   | ${CNAV(CROOT(CSTR('a')), '.', { reference: 'a' })} | ${false}
    ${CNAV(CROOT(CSTR('a')), '.', CSTR('a'))}   | ${CNAV(CROOT(CSTR('a')), '.', DREF('a'))}          | ${false}
    ${CNAV(CROOT(CSTR('a')), '.', CSTR('a'))}   | ${CNAV(CROOT(CSTR('a')), '.', 'a')}                | ${true}
    ${CNAV(CROOT(CSTR('a')), '.', CSTR('a'))}   | ${CNAV(CROOT(CSTR('a')), '.', 'b')}                | ${false}
    ${CNAV(CROOT(CSTR('a')), '.', CSTR('a'))}   | ${CNAV(CROOT(CSTR('a')), '#', CSTR('a'))}          | ${false}
    ${CNAV(CROOT(CSTR('a')), '.', CREF('[a]'))} | ${CNAV(CROOT(CSTR('a')), '.', CREF('[a]'))}        | ${true}
    ${CNAV(CROOT(CSTR('a')), '.', CREF('[a]'))} | ${CNAV(CROOT(CSTR('a')), '.', CREF('[b]'))}        | ${false}
    ${CNAV(CROOT(CSTR('a')), '.', CREF('[a]'))} | ${CNAV(CROOT(CSTR('a')), '.', CSTR('a'))}          | ${false}
    ${CNAV(CROOT(CSTR('a')), '.', CREF('[a]'))} | ${CNAV(CROOT(CSTR('a')), '.', { reference: 'a' })} | ${true}
    ${CNAV(CROOT(CSTR('a')), '.', CREF('[a]'))} | ${CNAV(CROOT(CSTR('a')), '.', { reference: 'b' })} | ${false}
    ${CNAV(CROOT(CSTR('a')), '.', CREF('[a]'))} | ${CNAV(CROOT(CSTR('a')), '.', { text: 'a' })}      | ${false}
    ${CNAV(CROOT(CSTR('a')), '.', CREF('[a]'))} | ${CNAV(CROOT(CSTR('a')), '.', DREF('a'))}          | ${true}
    ${CNAV(CROOT(CSTR('a')), '.', CREF('[a]'))} | ${CNAV(CROOT(CSTR('a')), '.', DREF('b'))}          | ${false}
    ${CNAV(CROOT(CSTR('a')), '.', CREF('[a]'))} | ${CNAV(CROOT(CSTR('a')), '.', 'a')}                | ${false}
    ${CNAV(CROOT(CSTR('a')), '.', CREF('[a]'))} | ${CNAV(CROOT(CSTR('a')), '#', CREF('[a]'))}        | ${false}
    ${CNAV(CROOT(CSTR('a')), '.', CSTR('a'))}   | ${CNAV(CROOT(CREF('[a]')), '.', CSTR('a'))}        | ${false}
  `('equals(left, right) $#', ({ left, right, expected }) => {
    expect(ComponentPath.equals(left, right)).toBe(expected);
    expect(ComponentPath.equals(right, left)).toBe(expected);
  });
});

describe('ComponentBase', () => {
  it('toComponentPath()', () => {
    const component = new ComponentString('a');
    const componentPath = component.toComponentPath();
    expect(componentPath).toBeInstanceOf(ComponentRoot);
    expect(componentPath.component).toBe(component);
  });
  it('toComponentPath(parts)', () => {
    const parent = new ComponentRoot(new ComponentString('a'));
    const component = new ComponentString('b');
    const componentPath = component.toComponentPath({ parent, navigation: Navigation.Exports });
    expect(componentPath).toBeInstanceOf(ComponentNavigation);
    expect(componentPath.component).toBe(component);
    expect((componentPath as ComponentNavigation).parent).toBe(parent);
    expect((componentPath as ComponentNavigation).navigation).toBe(Navigation.Exports);
  });
});

describe('ComponentString', () => {
  describe('static from()', () => {
    it.each`
      parts            | expected
      ${''}            | ${'""'}
      ${{ text: '' }}  | ${'""'}
      ${'a'}           | ${'a'}
      ${{ text: 'a' }} | ${'a'}
      ${'['}           | ${'"["'}
      ${{ text: '[' }} | ${'"["'}
    `('static from($parts)', ({ parts, expected }) => {
      const component = ComponentString.from(parts);
      const actual = component.toString();
      expect(actual).toBe(expected);
    });
    it('static from(ComponentString)', () => {
      const component = new ComponentString('a');
      const actual = ComponentString.from(component);
      expect(actual).toBe(component);
    });
  });
  it.each`
    left         | right        | expected
    ${undefined} | ${undefined} | ${true}
    ${CSTR('a')} | ${undefined} | ${false}
    ${CSTR('a')} | ${CSTR('a')} | ${true}
    ${CSTR('a')} | ${CSTR('b')} | ${false}
  `('static equals(left, right) $#', ({ left, right, expected }) => {
    expect(ComponentString.equals(left, right)).toBe(expected);
    expect(ComponentString.equals(right, left)).toBe(expected);
  });
});

describe('ComponentReference', () => {
  describe('static from()', () => {
    it.each`
      parts                                             | expected
      ${'[a]'}                                          | ${'[a]'}
      ${DeclarationReference.parse('a')}                | ${'[a]'}
      ${{ reference: 'a' }}                             | ${'[a]'}
      ${{ reference: DeclarationReference.parse('a') }} | ${'[a]'}
    `('static from($parts)', ({ parts, expected }) => {
      const component = ComponentReference.from(parts);
      const actual = component.toString();
      expect(actual).toBe(expected);
    });
  });
  describe('with()', () => {
    it('with({ })', () => {
      const component = ComponentReference.parse('[a]');
      const updated = component.with({});
      expect(updated).toBe(component);
    });
    it('with({ reference: same DeclarationReference })', () => {
      const component = ComponentReference.parse('[a]');
      const updated = component.with({ reference: component.reference });
      expect(updated).toBe(component);
    });
    it('with({ reference: equivalent DeclarationReference })', () => {
      const component = ComponentReference.parse('[a]');
      const updated = component.with({ reference: DeclarationReference.parse('a') });
      expect(updated).toBe(component);
    });
    it('with({ reference: equivalent string })', () => {
      const component = ComponentReference.parse('[a]');
      const updated = component.with({ reference: 'a' });
      expect(updated).toBe(component);
    });
    it('with({ reference: different DeclarationReference })', () => {
      const reference = DeclarationReference.parse('a');
      const component = new ComponentReference(reference);
      const newReference = DeclarationReference.parse('b');
      const updated = component.with({ reference: newReference });
      expect(updated).not.toBe(component);
      expect(updated.reference).toBe(newReference);
    });
    it('with({ reference: different string })', () => {
      const reference = DeclarationReference.parse('a');
      const component = new ComponentReference(reference);
      const updated = component.with({ reference: 'b' });
      expect(updated).not.toBe(component);
      expect(updated.reference).not.toBe(reference);
      expect(updated.reference.toString()).toBe('b');
    });
  });
  it.each`
    left           | right                             | expected
    ${undefined}   | ${undefined}                      | ${true}
    ${CREF('[a]')} | ${undefined}                      | ${false}
    ${CREF('[a]')} | ${CREF('[a]')}                    | ${true}
    ${CREF('[a]')} | ${CREF('[b]')}                    | ${false}
    ${CREF('[a]')} | ${CREF({ reference: 'a' })}       | ${true}
    ${CREF('[a]')} | ${CREF({ reference: 'b' })}       | ${false}
    ${CREF('[a]')} | ${CREF({ reference: DREF('a') })} | ${true}
    ${CREF('[a]')} | ${CREF({ reference: DREF('b') })} | ${false}
  `('static equals(left, right) $#', ({ left, right, expected }) => {
    expect(ComponentReference.equals(left, right)).toBe(expected);
    expect(ComponentReference.equals(right, left)).toBe(expected);
  });
});

describe('Component', () => {
  describe('static from()', () => {
    it('from({ text: string })', () => {
      const component = Component.from({ text: 'a' });
      expect(component).toBeInstanceOf(ComponentString);
      expect(component.toString()).toBe('a');
    });
    it('from({ reference: string })', () => {
      const component = Component.from({ reference: 'a' });
      expect(component).toBeInstanceOf(ComponentReference);
      expect(component.toString()).toBe('[a]');
    });
    it('from({ reference: DeclarationReference })', () => {
      const reference = DeclarationReference.parse('a');
      const component = Component.from({ reference });
      expect(component).toBeInstanceOf(ComponentReference);
      expect((component as ComponentReference).reference).toBe(reference);
    });
    it('from(string)', () => {
      const component = Component.from('a');
      expect(component).toBeInstanceOf(ComponentString);
      expect(component.toString()).toBe('a');
    });
    it('from(DeclarationReference)', () => {
      const reference = DeclarationReference.parse('a');
      const component = Component.from(reference);
      expect(component).toBeInstanceOf(ComponentReference);
      expect((component as ComponentReference).reference).toBe(reference);
    });
    it('from(Component)', () => {
      const component = new ComponentString('a');
      const result = Component.from(component);
      expect(result).toBe(component);
    });
  });
  it.each`
    left           | right                             | expected
    ${undefined}   | ${undefined}                      | ${true}
    ${CSTR('a')}   | ${undefined}                      | ${false}
    ${CSTR('a')}   | ${CREF('[a]')}                    | ${false}
    ${CSTR('a')}   | ${CSTR('a')}                      | ${true}
    ${CSTR('a')}   | ${CSTR('b')}                      | ${false}
    ${CREF('[a]')} | ${undefined}                      | ${false}
    ${CREF('[a]')} | ${CREF('[a]')}                    | ${true}
    ${CREF('[a]')} | ${CREF('[b]')}                    | ${false}
    ${CREF('[a]')} | ${CREF({ reference: 'a' })}       | ${true}
    ${CREF('[a]')} | ${CREF({ reference: 'b' })}       | ${false}
    ${CREF('[a]')} | ${CREF({ reference: DREF('a') })} | ${true}
    ${CREF('[a]')} | ${CREF({ reference: DREF('b') })} | ${false}
  `('equals(left, right) $#', ({ left, right, expected }) => {
    expect(Component.equals(left, right)).toBe(expected);
    expect(Component.equals(right, left)).toBe(expected);
  });
});
