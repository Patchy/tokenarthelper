import CONSTANTS from "./constants.js";

export function registerSettings() {
  game.settings.register(CONSTANTS.MODULE_ID, "image-upload-directory", {
    name: `${CONSTANTS.MODULE_ID}.settings.image-upload-directory.name`,
    hint: `${CONSTANTS.MODULE_ID}.settings.image-upload-directory.hint`,
    scope: "world",
    config: true,
    type: String,
    default: "[data] tokenart",
  });

  game.settings.register(CONSTANTS.MODULE_ID, "token-size", {
    name: `${CONSTANTS.MODULE_ID}.settings.token-size.name`,
    hint: `${CONSTANTS.MODULE_ID}.settings.token-size.hint`,
    scope: "world",
    config: true,
    type: Number,
    default: 400,
  });

  game.settings.register(CONSTANTS.MODULE_ID, "portrait-size", {
    name: `${CONSTANTS.MODULE_ID}.settings.portrait-size.name`,
    hint: `${CONSTANTS.MODULE_ID}.settings.portrait-size.hint`,
    scope: "world",
    config: true,
    type: Number,
    default: 400,
  });

  game.settings.register(CONSTANTS.MODULE_ID, "image-save-type", {
    name: `${CONSTANTS.MODULE_ID}.settings.image-save-type.name`,
    hint: `${CONSTANTS.MODULE_ID}.settings.image-save-type.hint`,
    scope: "world",
    config: true,
    type: String,
    choices: {
      "webp": "WebP",
      "png": "PNG",
      "jpeg": "JPEG",
    },
    default: "webp",
  });

  game.settings.register(CONSTANTS.MODULE_ID, "default-color", {
    name: `${CONSTANTS.MODULE_ID}.settings.default-color.name`,
    hint: `${CONSTANTS.MODULE_ID}.settings.default-color.hint`,
    scope: "world",
    config: true,
    type: String,
    default: "#000000",
  });

  game.settings.register(CONSTANTS.MODULE_ID, "default-crop-image", {
    name: `${CONSTANTS.MODULE_ID}.settings.default-crop-image.name`,
    hint: `${CONSTANTS.MODULE_ID}.settings.default-crop-image.hint`,
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
  });

  game.settings.register(CONSTANTS.MODULE_ID, "default-algorithm", {
    name: `${CONSTANTS.MODULE_ID}.settings.default-algorithm.name`,
    hint: `${CONSTANTS.MODULE_ID}.settings.default-algorithm.hint`,
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register(CONSTANTS.MODULE_ID, "paste-target", {
    scope: "client",
    config: false,
    type: String,
    default: "token",
  });

  game.settings.register(CONSTANTS.MODULE_ID, "log-level", {
    name: `${CONSTANTS.MODULE_ID}.settings.log-level.name`,
    hint: `${CONSTANTS.MODULE_ID}.settings.log-level.hint`,
    scope: "client",
    config: true,
    type: String,
    choices: {
      "DEBUG": "DEBUG",
      "INFO": "INFO",
      "WARN": "WARN",
      "ERR": "ERROR",
      "OFF": "OFF",
    },
    default: "OFF",
  });
}
