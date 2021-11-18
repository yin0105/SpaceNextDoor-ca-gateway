const cache = require("./../../../includes/cache/main");
const logging = require("./../../../includes/logging/main");
const Joi = require("joi");
const { v4: uuidv4 } = require("uuid");
const { default: axios } = require("axios");

const schema = Joi.object({
  provider: Joi.string().min(3).max(32).required(),
  doors: Joi.array()
    .items(
      Joi.object({
        status: Joi.string(),
        provider: Joi.string(),
        doorId: Joi.string(),
        internalId: Joi.string(),
      })
    )
    .required(),
  port: Joi.number().integer(),
  ssl: Joi.boolean(),
});

const exportFunction = async (req, res, next) => {
  const { body } = req;
  const result = schema.validate(body);
  const { value, error } = result;
  const valid = error == null;
  if (!valid) {
    console.log(error, value);
    res.status(200).json({
      status: "failed",
      message: "missing provider or doors array(object)",
    });
  } else {
    if (cache.initialized) {
      if (body.provider in cache.doorData) {
        logging.info("Provider found in door data");
      } else {
        logging.info("Provider not found in door data");
        cache.doorData[body.provider] = {
          doors: {},
        };
      }

      // Run through doors
      let registerKey = uuidv4();

      let promiseArray = [];
      body.doors.forEach(async (door) => {
        promiseArray.push(promiseCheck(door, registerKey, req, body));
      });

      let results = await Promise.all(promiseArray);

      if (!results.includes(false)) {
        res.json({
          status: "success",
          registerKey: registerKey,
          message: "Server added to controller",
        });
      } else {
        res.status(200).json({
          status: "failed",
          message: "Different reply recieved, please contact an admin",
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

const promiseCheck = (door, registerKey, req, body) => {
  // Check if server is alive
  let ssl = false;
  let serverUrl =
    (req.headers["x-forwarded-for"] || req.socket.remoteAddress).replace(
      "::ffff:",
      ""
    ) +
    ":" +
    body.port +
    "/api/status";
  if (body.ssl) {
    ssl = true;
    serverUrl = "https://" + serverUrl;
  } else {
    serverUrl = "http://" + serverUrl;
    ssl = false;
  }
  return axios
    .post(serverUrl, { registration_key: "fake key 123" })
    .then((success) => {
      if (
        success.data.status == "failed" &&
        success.data.message == 'server is still starting up'
      ) {
        // Store server
        if (typeof cache.doorData[body.provider].doors !== "undefined") {
          if (door.doorId in cache.doorData[body.provider].doors) {
            logging.info("Door already exists in provider object");

            // Add to server list
            cache.doorData[body.provider].doors[door.doorId].servers.push({
              serverIp: (
                req.headers["x-forwarded-for"] || req.socket.remoteAddress
              ).replace("::ffff:", ""),
              port: body.port,
              ssl: ssl,
              registerKey: registerKey,
            });
          } else {
            logging.info("Door does not exist in provider object");
            // Create door
            cache.doorData[body.provider].doors[door.doorId] = door;
            cache.doorData[body.provider].doors[door.doorId].servers = [];
            cache.doorData[body.provider].doors[door.doorId].servers.push({
              serverIp: (
                req.headers["x-forwarded-for"] || req.socket.remoteAddress
              ).replace("::ffff:", ""),
              port: body.port,
              ssl: ssl,
              registerKey: registerKey,
            });
          }
        } else {
          logging.info("Door does not exist in provider object");
          // Create door
          cache.doorData[body.provider].doors[door.doorId] = door;
          cache.doorData[body.provider].doors[door.doorId].servers = [];
          cache.doorData[body.provider].doors[door.doorId].servers.push({
            serverIp: (
              req.headers["x-forwarded-for"] || req.socket.remoteAddress
            ).replace("::ffff:", ""),
            port: body.port,
            ssl: ssl,
            registerKey: registerKey,
          });
        }
        // completed succesfully
        return true;
      } else {
        return false;
      }
    })
    .catch((error) => {
      //console.log(error);
      return false;
    });
};

module.exports = exportFunction;
