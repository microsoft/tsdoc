import { StringChecks } from "../parser/StringChecks";

/**
 * @internal
 */
export class TSDocSynonymCollection {
    private _synonyms: string[];
    private _synonymsWithUpperCase: string[] | undefined;

    public constructor() {
        this._synonyms = [];
        this._synonymsWithUpperCase = undefined;
    }

    public get count(): number {
        return this._synonyms.length;
    }

    public get synonyms(): ReadonlyArray<string> {
        return this._synonyms;
    }

    public get synonymsWithUpperCase(): ReadonlyArray<string> {
        if (!this._synonymsWithUpperCase) {
            this._synonymsWithUpperCase = this._synonyms.map(synonym => synonym.toUpperCase());
        }
        return this._synonymsWithUpperCase;
    }

    public add(synonym: string): void {
        StringChecks.validateTSDocTagName(synonym);
        if (this._synonyms.indexOf(synonym) >= 0) {
            return;
        }
        this._synonyms.push(synonym);
        this._invalidateSynonymsWithUpperCase();
    }

    public delete(synonym: string): boolean {
        const index: number = this._synonyms.indexOf(synonym);
        if (index >= 0) {
            this._synonyms.splice(index, 1);
            this._invalidateSynonymsWithUpperCase();
            return true;
        }
        return false;
    }

    public clear(): void {
        this._synonyms.length = 0;
        this._invalidateSynonymsWithUpperCase();
    }

    public hasTagName(tagName: string): boolean {
        return this.synonymsWithUpperCase.indexOf(tagName.toUpperCase()) >= 0;
    }

    public [Symbol.iterator](): IterableIterator<string> {
        return this._synonyms[Symbol.iterator]();
    }

    private _invalidateSynonymsWithUpperCase(): void {
        if (this._synonymsWithUpperCase) {
            this._synonymsWithUpperCase = undefined;
        }
    }
}