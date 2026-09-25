export type Store = 'app-store' | 'google-play';

export type AssetFormat = {
  id: string;
  store: Store;
  name: string;
  width: number;
  height: number;
};

// https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications
// https://support.google.com/googleplay/android-developer/answer/9866151
export const formats: AssetFormat[] = [
  {
    id: 'ios-iphone-6.5',
    store: 'app-store',
    name: 'iPhone 6.5"',
    width: 1284,
    height: 2778,
  },
  {
    id: 'ios-ipad-13',
    store: 'app-store',
    name: 'iPad 13"',
    width: 2064,
    height: 2752,
  },
  {
    id: 'ios-icon',
    store: 'app-store',
    name: 'App icon',
    width: 1024,
    height: 1024,
  },
  {
    id: 'play-phone',
    store: 'google-play',
    name: 'Phone screenshot',
    width: 1080,
    height: 1920,
  },
  {
    id: 'play-tablet-10',
    store: 'google-play',
    name: '10" tablet screenshot',
    width: 1600,
    height: 2560,
  },
  {
    id: 'play-feature-graphic',
    store: 'google-play',
    name: 'Feature graphic',
    width: 1024,
    height: 500,
  },
  {
    id: 'play-icon',
    store: 'google-play',
    name: 'App icon',
    width: 512,
    height: 512,
  },
];
