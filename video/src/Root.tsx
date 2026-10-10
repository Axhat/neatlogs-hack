import { Composition } from "remotion";
import { Intro } from "./Intro";
export const Root = () => <Composition id="Intro" component={Intro} durationInFrames={750} fps={30} width={1280} height={720} />;
