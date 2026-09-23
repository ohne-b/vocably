import { browser } from './browser';

type ExtensionPlatform = {
  url: string;
  name: string;
  platform: 'chromeExtension' | 'safariExtension' | 'iosSafariExtension';
  paymentLink: string | 'web' | false;
};

export const detectExtensionPlatform = (): ExtensionPlatform => {
  if (
    browser.satisfies({
      macos: {
        safari: '>10.1',
      },
    })
  ) {
    return {
      url: 'https://apps.apple.com/app/id6464076425',
      name: 'App Store',
      platform: 'safariExtension',
      paymentLink: false,
    };
  }

  if (
    browser.getOSName(true) === 'ios' &&
    browser.getBrowserName(true) === 'safari' &&
    !browser.getPlatformType(true).includes('desktop')
  ) {
    return {
      url: 'https://apps.apple.com/app/vocably-pro-language-cards/id1641258757',
      name: 'App Store',
      platform: 'iosSafariExtension',
      paymentLink: 'vocably-pro://upgrade',
    };
  }

  // Chromium-based Edge runs the very same build, published under a separate
  // listing, so only the store differs. `platform` stays `chromeExtension`:
  // it is reported to the backend and shared with `@vocably/model`.
  if (
    browser.satisfies({
      desktop: {
        edge: '>=79',
      },
    })
  ) {
    return {
      url: 'https://microsoftedge.microsoft.com/addons/detail/dahphaiflimmafjchchidjmgidlkajho',
      name: 'Edge Add-ons',
      platform: 'chromeExtension',
      paymentLink: 'web',
    };
  }

  return {
    url: 'https://chrome.google.com/webstore/detail/vocably/baocigmmhhdemijfjnjdidbkfgpgogmb',
    name: 'Chrome Web Store',
    platform: 'chromeExtension',
    paymentLink: 'web',
  };
};
