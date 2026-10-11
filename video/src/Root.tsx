import { Composition } from "remotion";
import { Intro } from "./Intro";
import { Demo, DEMO_FRAMES, Short, SHORT_FRAMES } from "./Demo";
export const Root = () => (
  <>
    <Composition id="Intro" component={Intro} durationInFrames={750} fps={30} width={1280} height={720} />
    <Composition id="Demo" component={Demo} durationInFrames={DEMO_FRAMES} fps={30} width={1280} height={720} />
    <Composition id="Short" component={Short} durationInFrames={SHORT_FRAMES} fps={30} width={1280} height={720} />
  </>
);
