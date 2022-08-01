import { TSDocConfiguration } from '../../configuration/TSDocConfiguration';
import { ParserContext } from '../ParserContext';
import { TSDocParser } from '../TSDocParser';

test('xml', () => {
  const config: TSDocConfiguration = new TSDocConfiguration();

  const parser: TSDocParser = new TSDocParser(config);

  let context: ParserContext;
  try {
    context = parser.parseString(['/**', ' * <foo></foo>', ' */'].join('\n'));
  } catch (e) {
    console.log(e);
  }

  console.log('ok');
});
