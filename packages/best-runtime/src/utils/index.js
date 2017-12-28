import { time } from "./time";
import { nextTick } from "./next-tick";

const raf = (window && window.requestAnimationFrame) ? window.requestAnimationFrame: nextTick;

export { time, nextTick, raf };
