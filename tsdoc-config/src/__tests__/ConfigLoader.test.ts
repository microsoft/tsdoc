import * as path from 'path';

import { TSDocConfigFile } from '../TSDocConfigFile';
import { ConfigLoader } from '../ConfigLoader';

function getRelativePath(testPath: string): string {
  return path.relative(__dirname, testPath).split('\\').join('/');
}

test('Resolve p1', () => {
  const configFile: TSDocConfigFile | undefined = ConfigLoader.tryLoadFromPackageFolder(
    path.join(__dirname, 'assets/p1'));
  expect(configFile).toBeDefined();
  expect(getRelativePath(configFile!.filePath)).toEqual('assets/p1/folder/tsdoc-config.json');
});
test('Resolve p2', () => {
  const configFile: TSDocConfigFile | undefined = ConfigLoader.tryLoadFromPackageFolder(
    path.join(__dirname, 'assets/p2'));
  expect(configFile).toBeDefined();
  expect(getRelativePath(configFile!.filePath)).toEqual('assets/p2/folder/tsdoc-config.json');
});
test('Resolve p3', () => {
  const configFile: TSDocConfigFile | undefined = ConfigLoader.tryLoadFromPackageFolder(
    path.join(__dirname, 'assets/p3'));
  expect(configFile).toBeDefined();
  expect(getRelativePath(configFile!.filePath)).toEqual('assets/p3/folder/tsdoc-config.json');
});
test('Resolve p4', () => {
  const configFile: TSDocConfigFile | undefined = ConfigLoader.tryLoadFromPackageFolder(
    path.join(__dirname, 'assets/p4'));
  expect(configFile).toBeDefined();
  expect(getRelativePath(configFile!.filePath)).toEqual('assets/p4/tsdoc-config.json');
});
