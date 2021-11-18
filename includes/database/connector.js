const { Sequelize } = require("sequelize");
const config = require("./../../config");
const logger = require("./../logging/main")

// Create connection
const sequelize = new Sequelize(config.database.connection);


sequelize
  .sync()
  .then((result) => {
    console.log(result);
  })
  .catch((err) => {
    console.log(err);
  });


(async()=>{
  try {
    
    await sequelize.authenticate();
    logger.info('Connected to database');
  } catch (error) {
      logger.info('Unable to connect to the database:', error);
  }
})


module.exports = sequelize;