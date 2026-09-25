import { Device, Screenshot } from '../Device';
import { getFormat } from '../formats';
import { Placeholder } from '../templates/Placeholder';

const format = getFormat('ios-iphone-6.5');

export const IPhone65 = () => (
  <Device format={format}>
    {(language) => (
      <>
        <Screenshot>
          <Placeholder format={format} label={`${language} · 1`} />
        </Screenshot>
        <Screenshot>
          <Placeholder format={format} label={`${language} · 2`} />
        </Screenshot>
        <Screenshot>
          <Placeholder format={format} label={`${language} · 3`} />
        </Screenshot>
      </>
    )}
  </Device>
);
