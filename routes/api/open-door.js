const cache = require("./../../includes/cache/main");
const logger = require("./../../includes/logging/main");
const Joi = require("joi");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");

const schema = Joi.object({
  provider_id: Joi.string().min(3).max(64).required(),
  door_id: Joi.string().min(3).max(64).required(),
});

const exportFunction = async (req, res, next) => {
  const { body } = req;
  const result = schema.validate(body);
  const { value, error } = result;
  const valid = error == null;
  if (!valid) {
    res.status(200).json({
      status: "failed",
      message: "missing provider_id or door_id",
    });
  } else {
    if (cache.initialized) {
      if (body.provider_id in cache.doorData) {
        if (body.door_id in cache.doorData[body.provider_id].doors) {
          const door = cache.doorData[body.provider_id].doors[body.door_id];
          let finished = false;
          while (!finished) {
            if (door.servers.length > 0) {
              const serverIndexToUse = Math.floor(
                Math.random() * door.servers.length
              );
              const serverToUse = door.servers[serverIndexToUse];
              let serverUrl =
                serverToUse.serverIp +
                ":" +
                serverToUse.port +
                "/api/open-door";
              if (serverToUse.ssl) {
                serverUrl = "https://" + serverUrl;
              } else {
                serverUrl = "http://" + serverUrl;
              }
              console.log(door.servers);
              logger.info("Attempting to request door open from server: "+"("+serverIndexToUse+") "+serverUrl)
              let data = {
                provider_id: body.provider_id,
                door_id: body.door_id,
                registrationKey: serverToUse.registerKey,
              }
              console.log(data)
              await axios
                .post(serverUrl, data)
                .then((success) => {
                    if(success.data.status == "success"){
                        finished = true;
                        res.status(200).json({
                            status: "success",
                            message: "door opened"
                        })
                    }else{
                        // Remove server from list
                        logger.info("Server request failed", success.data.message)
                        door.servers.splice(serverIndexToUse, 1)
                    }
                })
                .catch((error) => {
                    // Remove server from list
                    logger.info("Error connecting to worker node: ", error)
                    door.servers.splice(serverIndexToUse, 1)
                });
            } else {
              finished = true;
              res.status(200).json({
                status: "failed",
                message: "no servers available to process your request",
              });
            }
          }
        } else {
          res.status(200).json({
            status: "failed",
            message: "unknown door",
          });
        }
      } else {
        res.status(200).json({
          status: "failed",
          message: "unknown provider",
        });
      }
    } else {
      res.status(200).json({
        status: "failed",
        message: "server is still starting up",
      });
    }
  }
};

module.exports = exportFunction;
