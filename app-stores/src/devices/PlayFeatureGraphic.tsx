import { Device, Screenshot } from '../Device';
import { getFormat } from '../formats';
import { Placeholder } from '../templates/Placeholder';

const format = getFormat('play-feature-graphic');

export const PlayFeatureGraphic = () => (
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
