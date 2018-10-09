export const syntaxColors: { [name: string]: string } = {
  modifierTag: '#2047a8',
  remarksTag: '#a85e21',
  returnsTag: '#c9c500',
  inlineDelimeter: '#555',
  inlineTagName: '#447cd6',
  paramTagName: '#346263',
  paramName: '#03b3b7',
  linkText: '#9200f4',
  packageName: '#7c0000',
  blockTag: '#00c98c',
  inlineTag: 'orangered',
  linkTag: 'darkgoldenrod',
  black: 'black'
};

const cssLines: string[] = [];
// Convert color codes into class names
for (const name in syntaxColors) {
  if (syntaxColors.hasOwnProperty(name)) {
    const color: string = syntaxColors[name];
    const className: string = `tsdoc-syntax-${name}`;
    cssLines.push(`.${className} { color: ${color} !important; }`);
    syntaxColors[name] = className;
  }
}

const styleSheet: HTMLStyleElement = document.createElement('style');
styleSheet.type = 'text/css';
styleSheet.innerText = cssLines.join('\n');
document.head.appendChild(styleSheet);
