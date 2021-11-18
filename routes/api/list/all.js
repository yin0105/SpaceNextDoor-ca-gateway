const cache = require("./../../../includes/cache/main");

const exportFunction = (req, res, next) => {
  if (cache.initialized) {
    let dataToSend = [];
    Object.keys(cache.doorData).forEach((provider) => {
      let data = {
        provider: provider,
        doors: Object.keys(cache.doorData[provider].doors),
      };
      dataToSend.push(data)
    });
    res.status(200).json({
      status: "success",
      message: "retrieved all providers",
      data: dataToSend
    });
  } else {
    res.status(200).json({
      status: "failed",
      message: "server is still starting up",
    });
  }
};
module.exports = exportFunction;
