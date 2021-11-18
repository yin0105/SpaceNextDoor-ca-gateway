const { DataTypes } = require('sequelize');
const sequelize = require('./../connector');

const Doors = sequelize.define('Doors', {
    providerId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    doorId: {
        type: DataTypes.STRING,
        allowNull: false
    },
})



module.exports = Doors;