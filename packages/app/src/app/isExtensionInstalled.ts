import { pingExternal } from '@vocably/extension-messages';
import { distinctUntilChanged, Observable, switchMap, timer } from 'rxjs';
import { getExtensionId } from '../extension';
import { isFirefox, pingFirefoxExtension } from '../firefox';

export const isExtensionInstalled$: Observable<boolean> = timer(0, 2000).pipe(
  switchMap(() => {
    if (isFirefox) {
      pingFirefoxExtension();
      return isExtensionInstalled$;
    }

    return getExtensionId()
      .then((extensionId) => pingExternal(extensionId))
      .catch(() => undefined)
      .then((result) => result === 'pong');
  }),
  distinctUntilChanged()
);
