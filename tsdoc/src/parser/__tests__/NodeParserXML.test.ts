import { TSDocConfiguration } from '../../configuration/TSDocConfiguration';
import { ParserContext } from '../ParserContext';
import { TSDocParser } from '../TSDocParser';

// TODO: Tests
test('xml', () => {
  const config: TSDocConfiguration = new TSDocConfiguration();

  const parser: TSDocParser = new TSDocParser(config);

  let context: ParserContext;
  context = parser.parseString(['/**', ' * <foo></foo>', ' */'].join('\n'));

  console.log('ok');
});
