import ArtEditor from "./editor/ArtEditor.js";
import DirectoryPicker from "./libs/DirectoryPicker.js";
import logger from "./libs/logger.js";
import CONSTANTS from "./constants.js";
import { registerSettings } from "./settings.js";

export function init() {
  registerSettings();
}

function launchArtEditor(options = {}) {
  if (!game.user.can("FILES_UPLOAD")) {
    ui.notifications.warn(game.i18n.localize(`${CONSTANTS.MODULE_ID}.requires-upload-permission`));
    return;
  }

  if (game.canvas?.layers) {
    game.canvas.layers.forEach((layer) => {
      layer._copy = [];
    });
  }

  logger.debug("Launching ArtEditor with options", options);
  const editor = new ArtEditor(options);
  editor.render({ force: true });
}

function fixUploadLocation() {
  const uploadDir = game.settings.get(CONSTANTS.MODULE_ID, "image-upload-directory");
  if (game.user.isGM) {
    DirectoryPicker.verifyPath(DirectoryPicker.parse(uploadDir));
  }
}

function exposeAPI() {
  const API = {
    launch: launchArtEditor,
    launchArtEditor,
  };
  window.TokenArtHelper = API;
  game.modules.get(CONSTANTS.MODULE_ID).api = API;
}

export function ready() {
  logger.info("Ready Hook Called");
  fixUploadLocation();
  exposeAPI();
}

// Add a button to the left scene controls toolbar
Hooks.on("getSceneControlButtons", (controls) => {
  controls.tiles.tools[CONSTANTS.MODULE_ID] = {
    name: CONSTANTS.MODULE_ID,
    title: "tokenarthelper.toolbar.button",
    icon: "fa-solid fa-palette",
    order: Object.keys(controls.tokens.tools).length,
    button: true,
    visible: game.user.can("FILES_UPLOAD"),
    onChange: () => launchArtEditor(),
  };
});
