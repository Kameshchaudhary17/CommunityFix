import { DataTypes } from 'sequelize';
import sequelize from'../config/db.js'; // Your database configuration

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.STRING,
        defaultValue: 'user', // Default role for users
        allowNull: false
    }, 
    isVerified : {
        type: DataTypes.BOOLEAN, 
        defaultValue: fasle
    }
});

module.exports = User;
