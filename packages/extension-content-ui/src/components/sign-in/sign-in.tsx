import {
  Component,
  Element,
  Event,
  EventEmitter,
  forceUpdate,
  h,
  Host,
} from '@stencil/core';
import { subscribeToLocale, t } from '../../i18n';

@Component({
  tag: 'vocably-sign-in',
  styleUrl: 'sign-in.scss',
  shadow: true,
})
export class VocablySignIn {
  @Element() el: HTMLElement;
  @Event() confirm: EventEmitter;

  private unsubLocale: (() => void) | undefined;

  connectedCallback() {
    this.unsubLocale = subscribeToLocale(this.el, () => forceUpdate(this.el));
  }

  disconnectedCallback() {
    this.unsubLocale?.();
  }

  render() {
    return (
      <Host data-test="sign-in">
        <div class="p">
          <button
            class="button"
            data-test="sign-in-button"
            onClick={() => this.confirm.emit()}
          >
            {t('sign_in.button')}
          </button>
        </div>
      </Host>
    );
  }
}
