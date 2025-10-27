import { DataTypes } from "sequelize";
import sequelize from "../db/database.js";

const Location = sequelize.define("location",{
    location_id:{
        type: DataTypes.INTEGER,
        primaryKey:true,
        autoIncrement:true,
    },
    fsq_place_id:{
        type: DataTypes.STRING,
        allowNull:false,
        unique:true,
    },
    Name:{
        type:DataTypes.STRING,
        allowNull:false,
    },
    Address:{
        type: DataTypes.STRING,
        allowNull:false,    
    },
    location:{
        type: DataTypes.GEOGRAPHY('POINT',4326),
        allowNull:false,
    },
    Description:{
        type: DataTypes.STRING,
        allowNull:true,
    },
    Links:{
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull:true,
    },
    country_code:{
        type: DataTypes.STRING,
        allowNull:false,
    }
})

export default Location;