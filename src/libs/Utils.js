import DirectoryPicker from "./DirectoryPicker.js";
import logger from "./logger.js";

const SKIPPING_WORDS = ["the", "of", "at", "it", "a"];

export default class Utils {

  static isObject(obj) {
    return typeof obj === "object" && !Array.isArray(obj) && obj !== null;
  }

  static isString(str) {
    return typeof str === "string" || str instanceof String;
  }

  static htmlToDoc(text) {
    const parser = new DOMParser();
    return parser.parseFromString(text, "text/html");
  }

  static endsWithAny(suffixes, string) {
    return suffixes.some((suffix) => string.endsWith(suffix));
  }

  static dirPath(path) {
    return path.split("/").slice(0, -1).join("/");
  }

  static generateUUID() {
    var firstPart  = (Math.random() * 46656) || 0;
    var secondPart = (Math.random() * 46656) || 0;
    firstPart  = ("000" + firstPart.toString(36)).slice(-3);
    secondPart = ("000" + secondPart.toString(36)).slice(-3);
    return firstPart + secondPart;
  }

  static getCanvasCords(canvas, event) {
    const elementRelativeX = event.offsetX;
    const elementRelativeY = event.offsetY;
    const canvasRelativeX = elementRelativeX * canvas.width / canvas.clientWidth;
    const canvasRelativeY = elementRelativeY * canvas.height / canvas.clientHeight;
    return { x: canvasRelativeX, y: canvasRelativeY };
  }

  static upload() {
    let fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.click();
    return new Promise((resolve, reject) => {
      fileInput.addEventListener("change", (event) => {
        let file = event.target.files[0];
        let reader = new FileReader();
        reader.addEventListener("load", () => {
          let img = document.createElement("img");
          img.addEventListener("load", () => { resolve(img); });
          img.src = reader.result;
        });
        if (file) {
          reader.readAsDataURL(file);
        } else {
          reject("No input file given");
        }
      });
    });
  }

  static async download(url) {
    if (!url || url.trim() === "") url = "icons/mystery-man.png";
    const dateTag = `${+new Date()}`;
    const forge = (typeof ForgeVTT !== "undefined" && ForgeVTT?.usingTheForge);
    return new Promise((resolve, reject) => {
      const imgSrc = forge && url.startsWith("moulinette")
        ? url
        : `${url.split("?")[0]}?${dateTag}`;
      let img = new Image();
      img.crossOrigin = "";
      img.onerror = function(event) {
        logger.error("Download error", event);
        reject(event);
      };
      img.onload = function() {
        logger.debug("Loading image:", img);
        resolve(img);
      };
      img.src = imgSrc;
    });
  }

  static async uploadToFoundry(data, directoryPath, fileName) {
    let file = new File([data], fileName, { type: data.type });
    const options = DirectoryPicker.parse(directoryPath);
    logger.debug(`Uploading ${fileName}`, { directoryPath, fileName, options });
    const FPClass = foundry.applications.apps.FilePicker.implementation;
    const result = await FPClass.upload(options.activeSource, options.current, file, { bucket: options.bucket }, { notify: false });
    return result.path;
  }

  static rgbToHex(r, g, b) {
    if (r > 255 || g > 255 || b > 255) throw new Error("Invalid color component");
    // eslint-disable-next-line no-bitwise
    return ((r << 16) | (g << 8) | b).toString(16);
  }

  static async getHash(str, algo = "SHA-256") {
    let strBuf = new TextEncoder("utf-8").encode(str);
    if (window.isSecureContext) {
      return crypto.subtle.digest(algo, strBuf).then((hash) => {
        let result = "";
        const view = new DataView(hash);
        for (let i = 0; i < hash.byteLength; i += 4) {
          result += ("00000000" + view.getUint32(i).toString(16)).slice(-8);
        }
        return result;
      });
    } else {
      return new Promise((resolve) => {
        resolve(
          str.split("").reduce((a, b) => {
            // eslint-disable-next-line no-bitwise
            a = (a << 5) - a + b.charCodeAt(0);
            // eslint-disable-next-line no-bitwise
            return a & a;
          }, 0),
        );
      });
    }
  }

  static async makeSlug(name) {
    const toReplace = "а,б,в,г,д,е,ё,ж,з,и,й,к,л,м,н,о,п,р,с,т,у,ф,х,ц,ч,ш,щ,ъ,ы,ь,э,ю,я".split(",");
    const replacers = "a,b,v,g,d,e,yo,zh,z,i,y,k,l,m,n,o,p,r,s,t,u,f,kh,c,ch,sh,sch,_,y,_,e,yu,ya".split(",");
    const replaceDict = Object.fromEntries(toReplace.map((_, i) => [toReplace[i], replacers[i]]));
    const unicodeString = name
      .toLowerCase()
      .split("")
      .map((x) => (Object.prototype.hasOwnProperty.call(replaceDict, x) ? replaceDict[x] : x))
      .join("")
      .replace(/[^\w.]/gi, "_")
      .replace(/__+/g, "_");
    let asciiString = unicodeString;
    return new Promise((resolve) => {
      if (asciiString.length < 2) {
        Utils.getHash(name).then((hash) => resolve(hash));
      } else {
        resolve(asciiString);
      }
    });
  }

  static titleString(text) {
    const words = text.trim().split(" ");
    for (let i = 0; i < words.length; i++) {
      if (words[i][0] && (i == 0 || !SKIPPING_WORDS.includes(words[i]))) {
        words[i] = words[i][0].toUpperCase() + words[i].substr(1);
      }
    }
    return words.join(" ");
  }

  static extractImage(event, view) {
    const evData = event?.clipboardData || event?.dataTransfer;
    if (!evData.items) return;
    for (const item of evData.items) {
      if (item.type.startsWith("image")) {
        const blob = item.getAsFile();
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.addEventListener("load", () => {
          view.addImageLayer(img, { type: "image" });
        });
        const reader = new FileReader();
        reader.onload = function(ev) { img.src = ev.target.result; };
        reader.readAsDataURL(blob);
      }
    }
  }

  static cloneCanvas(sourceCanvas) {
    const cloneCanvas = document.createElement("canvas");
    cloneCanvas.width = sourceCanvas.width;
    cloneCanvas.height = sourceCanvas.height;
    cloneCanvas.getContext("2d", { willReadFrequently: false }).drawImage(sourceCanvas, 0, 0);
    return cloneCanvas;
  }

  static throttle(cb, delay) {
    let wait = false;
    return (...args) => {
      if (wait) return;
      cb(...args);
      wait = true;
      setTimeout(() => { wait = false; }, delay);
    };
  }

}
