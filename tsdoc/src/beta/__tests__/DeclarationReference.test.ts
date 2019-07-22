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
  it('parse module source', () => {
    const ref: DeclarationReference = DeclarationReference.parse('abc!');
    expect(ref.source).toBeInstanceOf(ModuleSource);
    expect(ref.symbol).toBeUndefined();
    expect((ref.source as ModuleSource).path).toBe('abc');
  });
  it('parse global source', () => {
    const ref: DeclarationReference = DeclarationReference.parse('!abc');
    expect(ref.source).toBe(GlobalSource.instance);
    expect(ref.symbol).toBeInstanceOf(SymbolReference);
    expect(ref.symbol!.componentPath).toBeDefined();
    expect(ref.symbol!.componentPath!.component.toString()).toBe('abc');
  });
  const meanings: Meaning[] = [
    Meaning.Class,
    Meaning.Interface,
    Meaning.TypeAlias,
    Meaning.Enum,
    Meaning.Namespace,
    Meaning.Function,
    Meaning.Variable,
    Meaning.Constructor,
    Meaning.Member,
    Meaning.Event,
    Meaning.CallSignature,
    Meaning.ConstructSignature,
    Meaning.IndexSignature,
    Meaning.ComplexType
  ];
  for (const s of meanings) {
    it(`parse meaning ':${s}'`, () => {
      const ref: DeclarationReference = DeclarationReference.parse(`a:${s}`);
      expect(ref.symbol!.meaning).toBe(s);
    });
  }
  it('parse complex', () => {
    const ref: DeclarationReference = DeclarationReference.parse('foo/bar!N.C#z:member(1)');

    const source: ModuleSource = ref.source as ModuleSource;
    expect(source).toBeInstanceOf(ModuleSource);
    expect(source.path).toBe('foo/bar');

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
});
it('add navigation step', () => {
  const ref: DeclarationReference = DeclarationReference.empty()
    .addNavigationStep(Navigation.Members, ComponentReference.parse('[Symbol.iterator]'));
  const symbol: SymbolReference = ref.symbol!;
  expect(symbol).toBeInstanceOf(SymbolReference);
  expect(symbol.componentPath).toBeDefined();
  expect(symbol.componentPath!.component.toString()).toBe('[Symbol.iterator]');
});