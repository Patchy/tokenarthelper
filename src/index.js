import { init, ready } from "./hooks.js";

Hooks.once("init", () => {
  init();
});

Hooks.once("ready", () => {
  ready();
});
