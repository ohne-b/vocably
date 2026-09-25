import { Device, Screenshot } from '../Device';
import { getFormat } from '../formats';
import { Placeholder } from '../templates/Placeholder';

const format = getFormat('play-icon');

export const PlayIcon = () => (
  <Device format={format}>
    {(language) => (
      <>
        <Screenshot>
          <Placeholder format={format} label={`${language} · 1`} />
        </Screenshot>
      </>
    )}
  </Device>
);
