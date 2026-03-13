import CONSTANTS from "../constants.js";

const logger = {
  _showMessage: (logLevel, data) => {
    if (!logLevel || !data || typeof logLevel !== "string") return false;
    const setting = game.settings.get(CONSTANTS.MODULE_ID, "log-level");
    const logLevels = ["DEBUG", "INFO", "WARN", "ERR", "OFF"];
    const logLevelIndex = logLevels.indexOf(logLevel.toUpperCase());
    if (setting == "OFF" || logLevelIndex === -1 || logLevelIndex < logLevels.indexOf(setting)) return false;
    return true;
  },
  log: (logLevel, ...data) => {
    if (!logger._showMessage(logLevel, data)) return;
    logLevel = logLevel.toUpperCase();
    const LOG_PREFIX = "TokenArtHelper";
    let msg = "No logging message provided.";
    let payload = data.slice();
    if (data[0] && typeof (data[0] == "string")) {
      msg = data[0];
      payload = data.length > 1 ? data.slice(1) : null;
    }
    msg = `${LOG_PREFIX} | ${logLevel} > ${msg}`;
    switch (logLevel) {
      case "DEBUG": payload ? console.debug(msg, ...payload) : console.debug(msg); break; // eslint-disable-line no-console
      case "INFO":  payload ? console.info(msg, ...payload)  : console.info(msg);  break; // eslint-disable-line no-console
      case "WARN":  payload ? console.warn(msg, ...payload)  : console.warn(msg);  break; // eslint-disable-line no-console
      case "ERR":   payload ? console.error(msg, ...payload) : console.error(msg); break; // eslint-disable-line no-console
      default: break;
    }
  },
  debug: (...data) => logger.log("DEBUG", ...data),
  info:  (...data) => logger.log("INFO",  ...data),
  warn:  (...data) => logger.log("WARN",  ...data),
  error: (...data) => logger.log("ERR",   ...data),
};

export default logger;
