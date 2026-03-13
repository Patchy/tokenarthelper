import Utils from "../libs/Utils.js";
import logger from "../libs/logger.js";
import View from "./View.js";
import DirectoryPicker from "../libs/DirectoryPicker.js";
import CONSTANTS from "../constants.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class ArtEditor extends HandlebarsApplicationMixin(ApplicationV2) {

  // options may include:
  //   portraitFilename: initial portrait image path (optional)
  //   tokenFilename: initial token image path (optional)
  constructor(options = {}) {
    super();
    this.editorOptions = options;
    this.imageFormat = game.settings.get(CONSTANTS.MODULE_ID, "image-save-type");
    this.uploadDirectory = game.settings.get(CONSTANTS.MODULE_ID, "image-upload-directory");
    this.portraitFileName = options.portraitFilename
      ? options.portraitFilename.split("/").pop()
      : `portrait.${this.imageFormat}`;
    this.tokenFileName = options.tokenFilename
      ? options.tokenFilename.split("/").pop()
      : `token.${this.imageFormat}`;
    this.activeLayerSelectorElement = null;
  }

  static PARTS = {
    form: {
      template: "modules/tokenarthelper/templates/art-editor.hbs",
    },
  };

  static DEFAULT_OPTIONS = {
    id: "arteditor-control",
    classes: ["tokenarthelper", "themed", "theme-light"],
    tag: "form",
    form: {
      handler: ArtEditor.formHandler,
      submitOnChange: false,
      closeOnSubmit: true,
    },
    actions: {
      menuButton: ArtEditor.menuButton,
      chooseImage: ArtEditor.#onChooseImage,
    },
    position: {
      width: "auto",
      height: "auto",
    },
    window: {
      title: "Token Art Helper",
    },
  };

  async _prepareContext() {
    const pasteTarget = game.settings.get(CONSTANTS.MODULE_ID, "paste-target") ?? "token";
    const pasteTargetName = Utils.titleString(pasteTarget);

    return {
      options: this.editorOptions,
      canUpload: game.user && game.user.can("FILES_UPLOAD"),
      canBrowse: game.user && game.user.can("FILES_BROWSE"),
      pasteTarget,
      pasteTargetName,
      portraitFileName: this.portraitFileName,
      tokenFileName: this.tokenFileName,
      uploadDirectory: this.uploadDirectory,
    };
  }

  static async #onChooseImage(event, button) {
    const target = button.dataset.target;
    let current = "";
    let view;
    if (target === "portrait") {
      view = this.Portrait;
      current = this.editorOptions.portraitFilename || "";
    } else if (target === "token") {
      view = this.Token;
      current = this.editorOptions.tokenFilename || "";
    }

    const fp = new foundry.applications.apps.FilePicker.implementation({
      type: "image",
      current: current,
      callback: (path) => {
        Utils.download(path)
          .then((img) => view.addImageLayer(img, { type: "image" }))
          .catch((error) => ui.notifications.error(error));
      },
    });

    fp.render(true);
  }

  static async formHandler() {
    // read filenames from the form inputs
    const portraitInput = this.element.querySelector('input[name="portraitFileName"]');
    const tokenInput = this.element.querySelector('input[name="tokenFileName"]');
    const dirInput = this.element.querySelector('input[name="uploadDirectory"]');

    if (portraitInput) this.portraitFileName = portraitInput.value.trim() || this.portraitFileName;
    if (tokenInput) this.tokenFileName = tokenInput.value.trim() || this.tokenFileName;
    if (dirInput) this.uploadDirectory = dirInput.value.trim() || this.uploadDirectory;

    // upload portrait and token
    const dataResults = await Promise.all([this.Portrait.get("blob"), this.Token.get("blob")]);
    const portraitBlob = dataResults[0];
    const tokenBlob = dataResults[1];

    if (portraitBlob) {
      const filePath = await Utils.uploadToFoundry(portraitBlob, this.uploadDirectory, this.portraitFileName);
      logger.debug(`Saved portrait at ${filePath}`);
      ui.notifications.info(game.i18n.format("tokenarthelper.notification.savedPortrait", { path: filePath }));
    }
    if (tokenBlob) {
      const filePath = await Utils.uploadToFoundry(tokenBlob, this.uploadDirectory, this.tokenFileName);
      logger.debug(`Saved token at ${filePath}`);
      ui.notifications.info(game.i18n.format("tokenarthelper.notification.savedToken", { path: filePath }));
    }
  }

  static async menuButton(event, target) {
    event.preventDefault();
    const view = target.dataset.target === "portrait" ? this.Portrait : this.Token;

    switch (target.dataset.type) {
      case "upload": {
        const img = await Utils.upload();
        view.addImageLayer(img, { type: "image" });
        break;
      }
      case "download-portrait": {
        const filename = this.portraitFileName;
        const blob = await this.Portrait.get("blob");
        const file = new File([blob], filename, { type: blob.type });
        let a = document.createElement("a");
        a.href = URL.createObjectURL(file);
        a.download = filename;
        a.click();
        break;
      }
      case "download-token": {
        const filename = this.tokenFileName;
        const blob = await this.Token.get("blob");
        const file = new File([blob], filename, { type: blob.type });
        let a = document.createElement("a");
        a.href = URL.createObjectURL(file);
        a.download = filename;
        a.click();
        break;
      }
      case "download": {
        const result = await foundry.applications.api.DialogV2.prompt({
          window: { title: game.i18n.localize("tokenarthelper.dialog.downloadTitle") },
          content: `
            <p>${game.i18n.localize("tokenarthelper.download.url")}.</p>
            <div class="form-group">
              <label>URL</label>
              <input id="arteditorurl" type="text" name="arteditorurl" placeholder="https://" data-dtype="String">
            </div>`,
          ok: {
            label: game.i18n.localize("tokenarthelper.label.OK"),
            callback: (event, button) => {
              return button.form.elements.arteditorurl.value;
            },
          },
          rejectClose: false,
        });
        if (result) {
          try {
            const img = await Utils.download(result);
            view.addImageLayer(img, { type: "image" });
          } catch (error) {
            logger.error("Error fetching image", error);
            ui.notifications.error(error);
          }
        }
        break;
      }
      case "token": {
        this.Token.get("img").then((img) => view.addImageLayer(img, { type: "image" }));
        break;
      }
      case "portrait": {
        this.Portrait.get("img").then((img) => view.addImageLayer(img, { activate: true, type: "image" }));
        break;
      }
      case "color": {
        const defaultColor = game.settings.get(CONSTANTS.MODULE_ID, "default-color");
        view.addColorLayer({ color: defaultColor });
        break;
      }
      // no default
    }
  }

  async _initPortrait(inputUrl) {
    const url = inputUrl ?? CONST.DEFAULT_TOKEN ?? 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    const portraitView = document.querySelector("#arteditor-portrait");
    if (this.Portrait) {
      this.Portrait.canvas.remove();
      this.Portrait.stage.remove();
      this.Portrait.controlsArea.remove();
      this.Portrait.menu.remove();
    }
    this.Portrait = null;
    try {
      const img = await Utils.download(url);
      const MAX_DIMENSION = Math.max(img.naturalHeight, img.naturalWidth, game.settings.get(CONSTANTS.MODULE_ID, "portrait-size"));
      logger.debug("Setting Portrait dimensions to " + MAX_DIMENSION + "x" + MAX_DIMENSION);
      this.Portrait = new View(this, MAX_DIMENSION, portraitView);
      this.Portrait.addImageLayer(img, { type: "original" });
      this.element.style.height = "auto";
    } catch (error) {
      if (inputUrl) {
        ui.notifications.error(game.i18n.format("tokenarthelper.notification.failedInput", { url }));
        if (inputUrl !== this.editorOptions.portraitFilename) {
          await this._initPortrait(this.editorOptions.portraitFilename);
        } else {
          await this._initPortrait();
        }
      } else {
        ui.notifications.error(game.i18n.localize("tokenarthelper.notification.failedFallback"));
      }
    }
  }

  async _initToken(src) {
    let imgSrc = src ?? CONST.DEFAULT_TOKEN;
    try {
      logger.debug("Initializing Token, trying to download", imgSrc);
      const img = await Utils.download(imgSrc);
      logger.debug("Got image", img);
      this.Token.addImageLayer(img, { type: "original" });
    } catch (error) {
      if (!src || src === CONST.DEFAULT_TOKEN) {
        logger.error(`Failed to load fallback token: "${imgSrc}"`);
      } else {
        const errorMessage = game.i18n.format("tokenarthelper.notification.failedLoad", { imgSrc, default: CONST.DEFAULT_TOKEN });
        ui.notifications.error(errorMessage);
        logger.error("Failed to init token image", errorMessage);
        await this._initToken();
      }
    }
  }

  pasteImage(event) {
    const pasteTarget = game.settings.get(CONSTANTS.MODULE_ID, "paste-target");
    const view = pasteTarget === "token" ? this.Token : this.Portrait;
    Utils.extractImage(event, view);
  }

  _onRender() {
    this.loadImages();
  }

  loadImages() {
    const tokenView = document.querySelector("#arteditor-token");
    const portraitView = document.querySelector("#arteditor-portrait");

    // sync filename inputs if they exist
    const portraitInput = this.element.querySelector('input[name="portraitFileName"]');
    if (portraitInput) portraitInput.value = this.portraitFileName;
    const tokenInput = this.element.querySelector('input[name="tokenFileName"]');
    if (tokenInput) tokenInput.value = this.tokenFileName;
    const dirInput = this.element.querySelector('input[name="uploadDirectory"]');
    if (dirInput) dirInput.value = this.uploadDirectory;

    this.Token = new View(this, game.settings.get(CONSTANTS.MODULE_ID, "token-size"), tokenView);
    this._initToken(this.editorOptions.tokenFilename);

    this._initPortrait(this.editorOptions.portraitFilename);
  }
}

Hooks.on("renderArtEditor", (app) => {
  window.addEventListener("paste", async (e) => {
    if (game.canvas?.layers) {
      game.canvas.layers.forEach((layer) => {
        layer._copy = [];
      });
    }
    e.stopPropagation();
    app.pasteImage(e);
  });
  window.addEventListener("drop", async (e) => {
    e.stopPropagation();
    app.pasteImage(e);
  });
  app.element.addEventListener("mousedown", async (e) => {
    if (!app.activeLayerSelectorElement) return;
    if (!app.activeLayerSelectorElement.contains(e.target)) {
      e.preventDefault();
      app.activeLayerSelectorElement.classList.remove("show");
      app.activeLayerSelectorElement = null;
    }
  }, false);
});
