import { Composition } from "remotion";
import { Intro } from "./Intro";
import { Demo, DEMO_FRAMES } from "./Demo";
export const Root = () => (
  <>
    <Composition id="Intro" component={Intro} durationInFrames={750} fps={30} width={1280} height={720} />
    <Composition id="Demo" component={Demo} durationInFrames={DEMO_FRAMES + 210} fps={30} width={1280} height={720} />
  </>
);
