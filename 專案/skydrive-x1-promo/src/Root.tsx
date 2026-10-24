import {Composition} from 'remotion';
import {Promo} from './Promo';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="SkydrivePromo"
    component={Promo}
    durationInFrames={900}
    fps={30}
    width={1920}
    height={1080}
  />
);
