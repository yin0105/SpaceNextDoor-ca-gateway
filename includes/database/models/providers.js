const { DataTypes } = require('sequelize');
const sequelize = require('./../connector');

const Providers = sequelize.define('Providers', {
    providerId: {
        type: DataTypes.STRING,
        allowNull: false
    }
})



module.exports = Providers;