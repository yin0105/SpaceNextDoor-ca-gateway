const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('./../connector');

const Servers = sequelize.define('Servers', {
    providerId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    doorId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    ip: {
        type: DataTypes.STRING,
        allowNull: false
    },
    port: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    ssl: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    registerKey: {
        type: DataTypes.STRING,
        allowNull: false
    },
})


module.exports = Servers;