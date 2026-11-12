import { resolveClerkUiScriptUrl } from './clerk-ui.loader';

describe('resolveClerkUiScriptUrl', () => {
  const devKey = 'pk_test_c2VsZWN0ZWQtc3RpbmdyYXktODQuY2xlcmsuYWNjb3VudHMuZGV2JA';

  it('usa o dominio decodificado da publishable key quando nao ha proxyUrl', () => {
    expect(resolveClerkUiScriptUrl({ publishableKey: devKey })).toBe(
      'https://selected-stingray-84.clerk.accounts.dev/npm/@clerk/ui@1/dist/ui.browser.js',
    );
  });

  it('usa a proxyUrl normalizada quando configurada para producao', () => {
    expect(
      resolveClerkUiScriptUrl({
        publishableKey: devKey,
        proxyUrl: 'https://fluy.pages.dev/__clerk/',
      }),
    ).toBe('https://fluy.pages.dev/__clerk/npm/@clerk/ui@1/dist/ui.browser.js');
  });
});
