import logger from "../libs/logger.js";
import Utils from "./Utils.js";

const FPClass = foundry.applications.apps.FilePicker.implementation;

class DirectoryPicker extends FPClass {

  static async uploadToPath(path, file) {
    const options = DirectoryPicker.parse(path);
    return FPClass.upload(options.activeSource, options.current, file, { bucket: options.bucket }, { notify: false });
  }

  static format(value) {
    return value.bucket !== null
      ? `[${value.activeSource}:${value.bucket}] ${value.path ?? value.current ?? ""}`
      : `[${value.activeSource}] ${value.path ?? value.current ?? ""}`;
  }

  static parse(inStr) {
    const str = inStr ?? "";
    let matches = str.match(/\[(.+)\]\s*(.+)?/u);
    if (matches) {
      let [, source, current = ""] = matches;
      current = current.trim();
      const [s3, bucket] = source.split(":");
      if (bucket !== undefined) {
        return { activeSource: s3, bucket: bucket, current: current, fullPath: inStr };
      } else {
        return { activeSource: s3, bucket: null, current: current, fullPath: inStr };
      }
    }
    return { activeSource: "data", bucket: null, current: str };
  }

  static async createDirectory(source, target, options = {}) {
    if (!target) throw new Error("No directory name provided");
    if (typeof ForgeVTT !== "undefined" && ForgeVTT?.usingTheForge) {
      const response = await ForgeAPI.call("assets/new-folder", { path: target });
      if (!response || response.error) {
        throw new Error(response ? response.error : "Unknown error while creating directory.");
      }
      return;
    }
    return FPClass.createDirectory(source, target, options);
  }

  static async verifyPath(parsedPath, targetPath = null) {
    try {
      const paths = (targetPath) ? targetPath.split("/") : parsedPath.current.split("/");
      let currentSource = paths[0];
      for (let i = 0; i < paths.length; i += 1) {
        try {
          if (currentSource !== paths[i]) currentSource = `${currentSource}/${paths[i]}`;
          await DirectoryPicker.createDirectory(parsedPath.activeSource, `${currentSource}`, { bucket: parsedPath.bucket });
        } catch (err) {
          const errMessage = `${(err?.message ?? Utils.isString(err) ? err : err)}`.replace(/^Error: /, "").trim();
          if (!errMessage.startsWith("EEXIST") && !errMessage.startsWith("The S3 key")) {
            logger.error(`Error trying to verify path`, err);
          }
        }
      }
    } catch (err) {
      return false;
    }
    return true;
  }

  static async browse(activeSource, path, options = {}) {
    return FPClass.browse(activeSource, path, options);
  }
}

export default DirectoryPicker;
