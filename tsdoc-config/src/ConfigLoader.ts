import * as fs from 'fs';
import * as path from 'path';
import { TSDocConfigFile } from './TSDocConfigFile';

interface IPackageJson {
  name?: string;
  version?: string;
  main?: string;
  typings?: string;
  types?: string;
  tsdocConfig?: string;
}

/**
 * Use this class to load the `tsdoc-config.json` file.
 * @public
 */
export class ConfigLoader {
  public static readonly JSON_FILE_NAME: string = 'tsdoc-config.json';

  private static _getExpectedPathForPackage(packageJson: IPackageJson): string {
    // Rule 1: If package.json contains the field "tsdocConfig" then that takes precedence
    // then that takes precedence.  This convention will be rarely needed, since the later
    // generally produce a good result.
    if (packageJson.tsdocConfig) {
      return packageJson.tsdocConfig;
    }

    // Rule 2: If package.json contains a field such as "types" or "typings", then look
    // for the file in that folder
    //
    // Rule 3: If package.json contains a field such as "main", then we would look
    // for the file in that folder.
    //
    // Rule 4: Other wise look in the package.json folder, since the default entry point
    // is './index.js'

    let entryPointPath: string = 'index.js';
    if (packageJson.types) {
      entryPointPath = packageJson.types;
    } else if (packageJson.typings) {
      entryPointPath = packageJson.typings;
    } else if (packageJson.main) {
      entryPointPath = packageJson.main;
    }
    const entryPointFolder: string = path.dirname(entryPointPath);

    return path.join(entryPointFolder, ConfigLoader.JSON_FILE_NAME);
  }

  /**
   * Given a `packageFolder` path, probe for tsdoc-config.json and return the
   * path to this file.
   * @returns the absolute path, or `undefined` if not found
   */
  private static _tryGetValidPath(packageFolder: string): string | undefined {
    const packageJsonPath: string = path.join(packageFolder, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error('package.json was not found under the path: ' + packageFolder);
    }
    const packageJsonContent: string = fs.readFileSync(packageJsonPath).toString();
    const packageJson: IPackageJson = JSON.parse(packageJsonContent);
    const configFilePath: string = ConfigLoader._getExpectedPathForPackage(packageJson);
    const configFileAbsolutePath: string = path.resolve(packageFolder, configFilePath);

    if (fs.existsSync(configFileAbsolutePath)) {
      return configFileAbsolutePath;
    }

    return undefined;
  }

  public static tryLoadFromPackageFolder(packageFolder: string): TSDocConfigFile | undefined {

    const rootConfigFilePath: string | undefined = ConfigLoader._tryGetValidPath(packageFolder);

    if (!rootConfigFilePath) {
      return undefined;
    }

    return TSDocConfigFile.loadFromFile(rootConfigFilePath);
  }
}
