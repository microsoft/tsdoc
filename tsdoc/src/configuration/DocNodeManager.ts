import { DocNode } from '../nodes/DocNode';
import { StringChecks } from '../parser/StringChecks';

// tslint:disable-next-line:no-any
export type DocNodeConstructor = new (...args: any[]) => DocNode;

export interface IDocNodeDefinition {
  docNodeKind: string;
  constructor: DocNodeConstructor;
}

interface IRegisteredDocNodeDefinition {
  docNodeKind: string;
  constructor: DocNodeConstructor;
  packageName: string;
  allowedChildKinds: Set<string>;
}

/**
 * Part of the {@link TSDocConfiguration} object.
 */
export class DocNodeManager {
  private static readonly _nodeKindRegExp: RegExp = /^[_a-z][_a-z0-9]*$/i;

  private readonly _docNodeDefinitionsByKind: Map<string, IRegisteredDocNodeDefinition>
    = new Map<string, IRegisteredDocNodeDefinition>();
  private readonly _docNodeDefinitionsByConstructor: Map<DocNodeConstructor, IRegisteredDocNodeDefinition>
    = new Map<DocNodeConstructor, IRegisteredDocNodeDefinition>();

  public registerDocNodes(packageName: string, definitions: ReadonlyArray<IDocNodeDefinition>): void {
    const packageNameError: string | undefined = StringChecks.explainIfInvalidPackageName(packageName);
    if (packageNameError) {
      throw new Error('Invalid NPM package name: ' + packageNameError);
    }

    for (const definition of definitions) {
      if (!DocNodeManager._nodeKindRegExp.test(definition.docNodeKind)) {
        throw new Error(`The DocNode kind ${JSON.stringify(definition.docNodeKind)} is not a valid identifier.`
          + ` It must start with an underscore or letter, and be comprised of letters, numbers, and underscores`);
      }

      let existingDefinition: IRegisteredDocNodeDefinition | undefined
        = this._docNodeDefinitionsByKind.get(definition.docNodeKind);

      if (existingDefinition !== undefined) {
        throw new Error(`The DocNode kind "${definition.docNodeKind}" was already registered`
          + ` by ${existingDefinition.packageName}`);
      }

      existingDefinition = this._docNodeDefinitionsByConstructor.get(definition.constructor);
      if (existingDefinition !== undefined) {
        throw new Error(`This DocNode constructor was already registered by ${existingDefinition.packageName}`
          + ` as ${existingDefinition.docNodeKind}`);
      }

      const newDefinition: IRegisteredDocNodeDefinition = {
        docNodeKind: definition.docNodeKind,
        constructor: definition.constructor,
        packageName,
        allowedChildKinds: new Set<string>()
      };

      this._docNodeDefinitionsByKind.set(definition.docNodeKind, newDefinition);
      this._docNodeDefinitionsByConstructor.set(definition.constructor, newDefinition);
    }
  }

  public requireRegisteredKind(docNodeKind: string): void {
    if (!this._docNodeDefinitionsByKind.has(docNodeKind)) {
      throw new Error(`The DocNode kind "${docNodeKind}" was not registered with this TSDocConfiguration`);
    }
  }

  public registerAllowableChildren(parentKind: string, childKinds: ReadonlyArray<string>): void {
    const parentDefinition: IRegisteredDocNodeDefinition = this._getDefinition(parentKind);

    for (const childKind of childKinds) {
      this.requireRegisteredKind(childKind);
      parentDefinition.allowedChildKinds.add(childKind);
    }
  }

  public isAllowedChild(parentKind: string, childKind: string): boolean {
    const parentDefinition: IRegisteredDocNodeDefinition = this._getDefinition(parentKind);
    return parentDefinition.allowedChildKinds.has(childKind);
  }

  private _getDefinition(docNodeKind: string): IRegisteredDocNodeDefinition {
    const definition: IRegisteredDocNodeDefinition | undefined = this._docNodeDefinitionsByKind.get(docNodeKind);
    if (definition === undefined) {
      throw new Error(`The DocNode kind "${docNodeKind}" was not registered with this TSDocConfiguration`);
    }
    return definition;
  }
}
