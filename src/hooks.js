import ArtEditor from "./editor/ArtEditor.js";
import QuickSetArt from "./editor/QuickSetArt.js";
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

function launchQuickSetArt(options = {}) {
  if (!game.user.can("FILES_UPLOAD")) {
    ui.notifications.warn(game.i18n.localize(`${CONSTANTS.MODULE_ID}.requires-upload-permission`));
    return;
  }
  logger.debug("Launching QuickSetArt with options", options);
  const window = new QuickSetArt(options);
  window.render({ force: true });
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
    launchQuickSetArt,
  };
  window.TokenArtHelper = API;
  game.modules.get(CONSTANTS.MODULE_ID).api = API;
}

export function ready() {
  logger.info("Ready Hook Called");
  fixUploadLocation();
  exposeAPI();
}

// Toolbar buttons in Tile Controls
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

  controls.tiles.tools[`${CONSTANTS.MODULE_ID}-quickset`] = {
    name: `${CONSTANTS.MODULE_ID}-quickset`,
    title: "tokenarthelper.quicksetart.toolbar",
    icon: "fa-solid fa-wand-magic-sparkles",
    order: Object.keys(controls.tokens.tools).length + 1,
    button: true,
    visible: game.user.can("FILES_UPLOAD"),
    onChange: () => launchQuickSetArt(),
  };
});

// Actor directory right-click context menu
Hooks.on("getActorDirectoryEntryContext", (html, entryOptions) => {
  if (!game.user.can("FILES_UPLOAD")) return;
  entryOptions.push({
    name: "tokenarthelper.quicksetart.contextMenu",
    icon: '<i class="fas fa-wand-magic-sparkles"></i>',
    condition: () => game.user.can("FILES_UPLOAD"),
    callback: async (li) => {
      const actorId = li.dataset?.documentId ?? li.dataset?.entryId ?? li.data?.("documentId");
      const actor = game.actors.get(actorId);
      launchQuickSetArt({ actor });
    },
  });
});
