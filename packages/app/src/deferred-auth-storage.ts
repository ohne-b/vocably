import { KeyValueStorageInterface } from '@aws-amplify/core';
import { AppAuthStorage } from '@vocably/pontis';

/**
 * `AppAuthStorage` needs the extension ID up front, but on Edge the ID is only
 * known once the Chrome build has been probed for (see `./extension`). Every
 * storage operation is asynchronous anyway, so the real storage is built as
 * soon as the ID settles and each call waits for it.
 */
export class DeferredAppAuthStorage implements KeyValueStorageInterface {
  private storage: Promise<AppAuthStorage>;

  constructor(extensionId: Promise<string>) {
    this.storage = extensionId.then((id) => new AppAuthStorage(id));
  }

  async setItem(key: string, value: string): Promise<void> {
    return (await this.storage).setItem(key, value);
  }

  async getItem(key: string): Promise<string | null> {
    return (await this.storage).getItem(key);
  }

  async removeItem(key: string): Promise<void> {
    return (await this.storage).removeItem(key);
  }

  async clear(): Promise<void> {
    return (await this.storage).clear();
  }
}
