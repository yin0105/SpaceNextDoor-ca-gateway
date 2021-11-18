const cache = require("./../../../includes/cache/main");

const exportFunction = (req, res, next) => {
    if (cache.initialized) {
        // Transform 
        res.status(200).json({
            status: "success",
            message: "retrieved all providers",
            data: Object.keys(cache.doorData)
          });
    } else {
        res.status(200).json({
          status: "failed",
          message: "server is still starting up",
        });
      }
}
module.exports = exportFunction;