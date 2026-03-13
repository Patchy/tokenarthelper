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

// Inject a button into the left side scene controls toolbar in Foundry v13
Hooks.on("renderSceneControls", (_controls, html) => {
  const root = html instanceof HTMLElement ? html : html[0];
  if (!root) return;

  // Avoid adding duplicate buttons
  if (root.querySelector(".tokenarthelper-toolbar-btn")) return;

  const mainControls = root.querySelector(".main-controls");
  if (!mainControls) return;

  const li = document.createElement("li");
  li.classList.add("scene-control", "tokenarthelper-toolbar-btn");
  li.dataset.tooltip = game.i18n.localize("tokenarthelper.toolbar.button");
  li.setAttribute("aria-label", game.i18n.localize("tokenarthelper.toolbar.button"));
  li.innerHTML = `<i class="fas fa-palette"></i>`;
  li.addEventListener("click", () => launchArtEditor());

  mainControls.appendChild(li);
});
