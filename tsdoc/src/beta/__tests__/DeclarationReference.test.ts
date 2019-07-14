// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import {
    ModuleSource,
    GlobalSource,
    Meaning,
    RootComponent,
    Navigation,
    NavigationComponent,
    DeclarationReference,
    SymbolReference
} from '../DeclarationReference';

describe('parser', () => {
    it('parse component text', () => {
        const ref: DeclarationReference = DeclarationReference.parse('abc');
        expect(ref.source).toBeUndefined();
        expect(ref.symbol).toBeInstanceOf(SymbolReference);
        expect(ref.symbol!.component.text).toBe('abc');
    });
    it('parse component text string', () => {
        const ref: DeclarationReference = DeclarationReference.parse('"abc"');
        expect(ref.source).toBeUndefined();
        expect(ref.symbol).toBeInstanceOf(SymbolReference);
        expect(ref.symbol!.component.text).toBe('"abc"');
    });
    it('parse bracketed component text', () => {
        const ref: DeclarationReference = DeclarationReference.parse('[abc[def]]');
        expect(ref.source).toBeUndefined();
        expect(ref.symbol).toBeInstanceOf(SymbolReference);
        expect(ref.symbol!.component.text).toBe('[abc[def]]');
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
        expect(ref.symbol!.component.text).toBe('abc');
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
        Meaning.EnumMember,
        Meaning.Signature,
        Meaning.Type
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

        const component1: NavigationComponent = symbol.component as NavigationComponent;
        expect(component1).toBeInstanceOf(NavigationComponent);
        expect(component1.navigation).toBe(Navigation.Members);
        expect(component1.text).toBe('z');

        const component2: NavigationComponent = component1.parent as NavigationComponent;
        expect(component2).toBeInstanceOf(NavigationComponent);
        expect(component2.navigation).toBe(Navigation.Exports);
        expect(component2.text).toBe('C');

        const component3: RootComponent = component2.parent as RootComponent;
        expect(component3).toBeInstanceOf(RootComponent);
        expect(component3.text).toBe('N');

        expect(ref.toString()).toBe('foo/bar!N.C#z:member(1)');
    });
});
