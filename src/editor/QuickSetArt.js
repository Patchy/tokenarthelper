import Utils from "../libs/Utils.js";
import logger from "../libs/logger.js";
import DirectoryPicker from "../libs/DirectoryPicker.js";
import CONSTANTS from "../constants.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class QuickSetArt extends HandlebarsApplicationMixin(ApplicationV2) {

  constructor(options = {}) {
    super();
    this.selectedPortrait = null;
    this.selectedToken = null;
    this.activeTarget = "portrait";
    this.images = [];
    this.uploadDirectory = "";
    this.imagesLoaded = false;

    if (options.actor) {
      this._applyActor(options.actor);
    }
  }

  static PARTS = {
    form: {
      template: "modules/tokenarthelper/templates/quick-set-art.hbs",
    },
  };

  static DEFAULT_OPTIONS = {
    id: "quicksetart",
    classes: ["tokenarthelper", "themed", "theme-light"],
    tag: "form",
    form: {
      handler: QuickSetArt.formHandler,
      submitOnChange: false,
      closeOnSubmit: false,
    },
    actions: {
      selectImage: QuickSetArt.selectImage,
      setTarget: QuickSetArt.setTarget,
      refreshImages: QuickSetArt.refreshImages,
      clearPortrait: QuickSetArt.clearPortrait,
      clearToken: QuickSetArt.clearToken,
      copyPortraitToToken: QuickSetArt.copyPortraitToToken,
    },
    position: {
      width: 820,
      height: 720,
    },
    window: {
      title: "tokenarthelper.quicksetart.title",
    },
  };

  _applyActor(actor) {
    this.actor = actor;
    // Pre-fill slots with actor's current art
    this.selectedPortrait = actor.img ?? null;
    this.selectedToken = actor.prototypeToken?.texture?.src ?? null;
    // Pre-fill settings from actor's prototype token
    this._linkActor = actor.prototypeToken?.actorLink ?? false;
    this._setTokenName = false;
    this._hidden = actor.prototypeToken?.hidden ?? false;
    this._disposition = actor.prototypeToken?.disposition ?? -1;
    this._scale = actor.prototypeToken?.scale ?? 1;
    this._visionEnabled = actor.prototypeToken?.sight?.enabled ?? false;
  }

  async _prepareContext() {
    if (!this.imagesLoaded) {
      await this._loadImages();
      this.imagesLoaded = true;
    }

    const images = this.images.map((img) => ({
      path: img.path,
      name: img.name,
      isPortrait: img.path === this.selectedPortrait,
      isToken: img.path === this.selectedToken,
    }));

    return {
      actor: this.actor
        ? { id: this.actor.id, name: this.actor.name, img: this.actor.img }
        : null,
      images,
      selectedPortrait: this.selectedPortrait,
      selectedToken: this.selectedToken,
      portraitActive: this.activeTarget === "portrait",
      tokenActive: this.activeTarget === "token",
      uploadDirectory: this.uploadDirectory,
      // settings
      linkActor: this._linkActor ?? false,
      setTokenName: this._setTokenName ?? false,
      hidden: this._hidden ?? false,
      dispositionSecret: (this._disposition ?? -1) === -2,
      dispositionHostile: (this._disposition ?? -1) === -1,
      dispositionNeutral: (this._disposition ?? -1) === 0,
      dispositionFriendly: (this._disposition ?? -1) === 1,
      scale: this._scale ?? 1,
      visionEnabled: this._visionEnabled ?? false,
    };
  }

  async _loadImages() {
    const uploadDir = game.settings.get(CONSTANTS.MODULE_ID, "image-upload-directory");
    this.uploadDirectory = uploadDir || "";
    if (!uploadDir || uploadDir.trim() === "" || uploadDir.trim() === "[data]") {
      this.images = [];
      return;
    }
    try {
      const dir = DirectoryPicker.parse(uploadDir);
      this.uploadDirectory = dir.current;
      this.images = await this._getImagesFromDir(dir.activeSource, { bucket: dir.bucket }, dir.current);
    } catch (error) {
      logger.error("Failed to load images from upload directory", error);
      this.images = [];
    }
  }

  async _getImagesFromDir(activeSource, options, path) {
    const fileList = await DirectoryPicker.browse(activeSource, path, options);
    const images = fileList.files
      .filter((f) => Utils.endsWithAny(["png", "jpg", "jpeg", "gif", "webp", "webm", "bmp"], f))
      .map((f) => ({ path: f, name: f.split("/").pop() }));

    for (const subDir of fileList.dirs) {
      const subImages = await this._getImagesFromDir(activeSource, options, subDir);
      images.push(...subImages);
    }
    return images;
  }

  _onRender() {
    const dropZone = this.element.querySelector(".actor-drop-zone");
    if (!dropZone) return;

    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      dropZone.classList.add("drag-over");
    });
    dropZone.addEventListener("dragleave", () => {
      dropZone.classList.remove("drag-over");
    });
    dropZone.addEventListener("drop", async (e) => {
      e.preventDefault();
      dropZone.classList.remove("drag-over");
      try {
        const data = JSON.parse(e.dataTransfer.getData("text/plain"));
        if (data.type === "Actor") {
          const actor = await fromUuid(data.uuid);
          if (actor) {
            this._applyActor(actor);
            this.render();
          }
        }
      } catch (err) {
        logger.error("Failed to handle actor drop", err);
      }
    });
  }

  static async selectImage(event, target) {
    event.preventDefault();
    const path = target.dataset.path;
    if (this.activeTarget === "portrait") {
      this.selectedPortrait = path;
    } else {
      this.selectedToken = path;
    }
    this.render();
  }

  static async setTarget(event, target) {
    event.preventDefault();
    this.activeTarget = target.dataset.target;
    this.render();
  }

  static async refreshImages(event) {
    event.preventDefault();
    this.imagesLoaded = false;
    await this._loadImages();
    this.imagesLoaded = true;
    this.render();
  }

  static async clearPortrait(event) {
    event.preventDefault();
    this.selectedPortrait = null;
    this.render();
  }

  static async clearToken(event) {
    event.preventDefault();
    this.selectedToken = null;
    this.render();
  }

  static async copyPortraitToToken(event) {
    event.preventDefault();
    this.selectedToken = this.selectedPortrait;
    this.render();
  }

  static async formHandler(event, form, formData) {
    if (!this.actor) {
      ui.notifications.warn(game.i18n.localize("tokenarthelper.quicksetart.noActor"));
      return;
    }
    if (!this.selectedPortrait && !this.selectedToken) {
      ui.notifications.warn(game.i18n.localize("tokenarthelper.quicksetart.noImagesSelected"));
      return;
    }

    const data = formData.object;
    const updates = {};

    if (this.selectedPortrait) updates.img = this.selectedPortrait;
    if (this.selectedToken) updates["prototypeToken.texture.src"] = this.selectedToken;
    if (data.linkActor) updates["prototypeToken.actorLink"] = true;
    if (data.setTokenName) updates["prototypeToken.name"] = this.actor.name;
    if (data.hidden) updates["prototypeToken.hidden"] = true;
    if (data.visionEnabled) updates["prototypeToken.sight.enabled"] = true;
    updates["prototypeToken.disposition"] = parseInt(data.disposition);
    const scale = parseFloat(data.scale);
    if (!isNaN(scale) && scale > 0) updates["prototypeToken.scale"] = scale;

    try {
      await this.actor.update(updates);
      ui.notifications.info(game.i18n.format("tokenarthelper.quicksetart.saved", { name: this.actor.name }));
      this.close();
    } catch (error) {
      logger.error("Failed to update actor", error);
      ui.notifications.error(game.i18n.format("tokenarthelper.quicksetart.saveFailed", { name: this.actor.name }));
    }
  }
}
