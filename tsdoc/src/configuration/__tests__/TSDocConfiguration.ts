import { TSDocConfiguration } from '../TSDocConfiguration';
import { TSDocTagDefinition, TSDocTagSyntaxKind } from '../TSDocTagDefinition';

describe('Synonym overrides', () => {
    describe('addSynonym', () => {
        describe('with no existing synonym in base', () => {
            let configuration: TSDocConfiguration;
            let baseTag: TSDocTagDefinition;
            let derivedTag: TSDocTagDefinition;
            beforeEach(() => {
                configuration = new TSDocConfiguration();
                baseTag = new TSDocTagDefinition({
                    syntaxKind: TSDocTagSyntaxKind.BlockTag,
                    tagName: '@foo',
                });
                configuration.addTagDefinition(baseTag);
                configuration.setSupportForTag(baseTag, /*supported*/ true);
                derivedTag = configuration.addSynonym(baseTag, '@bar');
                afterEach(() => {
                    configuration = undefined!;
                    baseTag = undefined!;
                    derivedTag = undefined!;
                });
            });
            test('does not mutate base tag', () => {
                expect(baseTag.synonyms).toHaveLength(0);
            });
            test('returns a derived tag', () => {
                expect(derivedTag).not.toBe(baseTag);
            });
            test('derived tag has expected synonyms', () => {
                expect(derivedTag.synonyms).toEqual(['@bar']);
            });
            test('derived tag differs from base only in synonyms', () => {
                expect(derivedTag.tagName).toEqual(baseTag.tagName);
                expect(derivedTag.tagNameWithUpperCase).toEqual(baseTag.tagNameWithUpperCase);
                expect(derivedTag.syntaxKind).toEqual(baseTag.syntaxKind);
                expect(derivedTag.standardization).toEqual(baseTag.standardization);
                expect(derivedTag.allowMultiple).toEqual(baseTag.allowMultiple);
                expect(derivedTag.synonyms).not.toEqual(baseTag.synonyms);
            });
            test('additional synonym for base returns derived', () => {
                expect(configuration.addSynonym(baseTag, '@baz')).toBe(derivedTag);
            });
            test('additional synonym for derived returns derived', () => {
                expect(configuration.addSynonym(derivedTag, '@baz')).toBe(derivedTag);
            });
            test('additional synonym for derived mutates derived', () => {
                configuration.addSynonym(derivedTag, '@baz')
                expect(derivedTag.synonyms).toEqual(['@bar', '@baz']);
            });
            test('derived replaces base in tagDefinitions', () => {
                expect(configuration.tagDefinitions).toHaveLength(1);
                expect(configuration.tagDefinitions[0]).toBe(derivedTag);
            });
            test('derived replaces base in supportedTagDefinitions', () => {
                expect(configuration.supportedTagDefinitions).toHaveLength(1);
                expect(configuration.supportedTagDefinitions[0]).toBe(derivedTag);
            });
            test('derived tag reachable by name', () => {
                expect(configuration.tryGetTagDefinition('@foo')).toBe(derivedTag);
            });
            test('derived tag reachable by synonym', () => {
                expect(configuration.tryGetTagDefinition('@bar')).toBe(derivedTag);
            });
            test('configured tag of base is derived tag', () => {
                expect(configuration.getConfiguredTagDefinition(baseTag)).toBe(derivedTag);
            });
            test('configured tag of derived is derived tag', () => {
                expect(configuration.getConfiguredTagDefinition(derivedTag)).toBe(derivedTag);
            });
        });
        describe('for existing synonym in base', () => {
            let configuration: TSDocConfiguration;
            let baseTag: TSDocTagDefinition;
            let baseTagAfterAddExisting: TSDocTagDefinition;
            beforeEach(() => {
                configuration = new TSDocConfiguration();
                baseTag = new TSDocTagDefinition({
                    syntaxKind: TSDocTagSyntaxKind.BlockTag,
                    tagName: '@foo',
                    synonyms: ['@bar']
                });
                configuration.addTagDefinition(baseTag);
                configuration.setSupportForTag(baseTag, /*supported*/ true);
                baseTagAfterAddExisting = configuration.addSynonym(baseTag, '@bar');
                afterEach(() => {
                    configuration = undefined!;
                    baseTag = undefined!;
                    baseTagAfterAddExisting = undefined!;
                });
            });
            test('does not modify base tag', () => {
                expect(baseTag.synonyms).toEqual(['@bar']);
            });
            test('returns the base tag', () => {
                expect(baseTagAfterAddExisting).toBe(baseTag);
            });
            test('base tag reachable by name', () => {
                expect(configuration.tryGetTagDefinition('@foo')).toBe(baseTag);
            });
            test('base tag reachable by synonym', () => {
                expect(configuration.tryGetTagDefinition('@bar')).toBe(baseTag);
            });
            test('configured tag of base is base tag', () => {
                expect(configuration.getConfiguredTagDefinition(baseTag)).toBe(baseTag);
            });
            describe('additional synonym', () => {
                let derivedTag: TSDocTagDefinition;
                beforeEach(() => {
                    derivedTag = configuration.addSynonym(baseTag, '@baz');
                    afterEach(() => {
                        derivedTag = undefined!;
                    });
                });
                test('does not modify base tag', () => {
                    expect(baseTag.synonyms).toEqual(['@bar']);
                });
                test('returns a derived tag', () => {
                    expect(derivedTag).not.toBe(baseTag);
                });
                test('does not modify base tag', () => {
                    expect(baseTag.synonyms).toHaveLength(0);
                });
                test('derived replaces base in tagDefinitions', () => {
                    expect(configuration.tagDefinitions).toHaveLength(1);
                    expect(configuration.tagDefinitions[0]).toBe(derivedTag);
                });
                test('derived replaces base in supportedTagDefinitions', () => {
                    expect(configuration.supportedTagDefinitions).toHaveLength(1);
                    expect(configuration.supportedTagDefinitions[0]).toBe(derivedTag);
                });
                    test('derived tag reachable by name', () => {
                    expect(configuration.tryGetTagDefinition('@foo')).toBe(derivedTag);
                });
                test('derived tag reachable by synonym', () => {
                    expect(configuration.tryGetTagDefinition('@baz')).toBe(derivedTag);
                });
                test('configured tag of base is derived tag', () => {
                    expect(configuration.getConfiguredTagDefinition(baseTag)).toBe(derivedTag);
                });
                test('configured tag of derived is derived tag', () => {
                    expect(configuration.getConfiguredTagDefinition(derivedTag)).toBe(derivedTag);
                });
            });
        });
    });
    describe('removeSynonym', () => {
        describe('with no existing synonym in base', () => {
            let configuration: TSDocConfiguration;
            let baseTag: TSDocTagDefinition;
            let derivedTag: TSDocTagDefinition;
            let derivedTagAfterRemove: TSDocTagDefinition;
            beforeEach(() => {
                configuration = new TSDocConfiguration();
                baseTag = new TSDocTagDefinition({
                    syntaxKind: TSDocTagSyntaxKind.BlockTag,
                    tagName: '@foo',
                });
                configuration.addTagDefinition(baseTag);
                derivedTag = configuration.addSynonym(baseTag, '@bar');
                derivedTagAfterRemove = configuration.removeSynonym(baseTag, '@bar');
                afterEach(() => {
                    configuration = undefined!;
                    baseTag = undefined!;
                    derivedTag = undefined!;
                    derivedTagAfterRemove = undefined!;
                });
            });
            test('returned tag remains derived', () => {
                expect(derivedTagAfterRemove).toBe(derivedTag);
            });
            test('mutates synonyms on derived', () => {
                expect(derivedTag.synonyms).toHaveLength(0);
            });
            test('derived replaces base in tagDefinitions', () => {
                expect(configuration.tagDefinitions).toHaveLength(1);
                expect(configuration.tagDefinitions[0]).toBe(derivedTag);
            });
            test('derived replaces base in supportedTagDefinitions', () => {
                expect(configuration.supportedTagDefinitions).toHaveLength(1);
                expect(configuration.supportedTagDefinitions[0]).toBe(derivedTag);
            });
            test('derived tag reachable by name', () => {
                expect(configuration.tryGetTagDefinition('@foo')).toBe(derivedTag);
            });
            test('nothing reachable by synonym', () => {
                expect(configuration.tryGetTagDefinition('@bar')).toBeUndefined();
            });
            test('configured tag of base is derived tag', () => {
                expect(configuration.getConfiguredTagDefinition(baseTag)).toBe(derivedTag);
            });
            test('configured tag of derived is derived tag', () => {
                expect(configuration.getConfiguredTagDefinition(derivedTag)).toBe(derivedTag);
            });
        });
        describe('with existing synonym in base', () => {
            let configuration: TSDocConfiguration;
            let baseTag: TSDocTagDefinition;
            let derivedTag: TSDocTagDefinition;
            beforeEach(() => {
                configuration = new TSDocConfiguration();
                baseTag = new TSDocTagDefinition({
                    syntaxKind: TSDocTagSyntaxKind.BlockTag,
                    tagName: '@foo',
                    synonyms: ['@bar']
                });
                configuration.addTagDefinition(baseTag);
                derivedTag = configuration.removeSynonym(baseTag, '@bar');
                afterEach(() => {
                    configuration = undefined!;
                    baseTag = undefined!;
                    derivedTag = undefined!;
                });
            });
            test('does not mutate base tag', () => {
                expect(baseTag.synonyms).toEqual(['@bar']);
            });
            test('returns a derived tag', () => {
                expect(derivedTag).not.toBe(baseTag);
            });
            test('derived tag has expected synonyms', () => {
                expect(derivedTag.synonyms).toHaveLength(0);
            });
            test('derived replaces base in tagDefinitions', () => {
                expect(configuration.tagDefinitions).toHaveLength(1);
                expect(configuration.tagDefinitions[0]).toBe(derivedTag);
            });
            test('derived replaces base in supportedTagDefinitions', () => {
                expect(configuration.supportedTagDefinitions).toHaveLength(1);
                expect(configuration.supportedTagDefinitions[0]).toBe(derivedTag);
            });
            test('derived tag reachable by name', () => {
                expect(configuration.tryGetTagDefinition('@foo')).toBe(derivedTag);
            });
            test('nothing reachable by synonym', () => {
                expect(configuration.tryGetTagDefinition('@bar')).toBeUndefined();
            });
            test('configured tag of base is derived tag', () => {
                expect(configuration.getConfiguredTagDefinition(baseTag)).toBe(derivedTag);
            });
            test('configured tag of derived is derived tag', () => {
                expect(configuration.getConfiguredTagDefinition(derivedTag)).toBe(derivedTag);
            });
        });
    });
});