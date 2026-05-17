const sheet = new CSSStyleSheet();

sheet.replaceSync(`
  :host {
    display: block;
    box-sizing: border-box;
    -webkit-tap-highlight-color: transparent;
    font-family: inherit;
  }

  *,
  *::before,
  *::after {
    box-sizing: inherit;
  }
`);

export { sheet as baseSheet };
