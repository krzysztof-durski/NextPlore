import { DataTypes } from "sequelize";
import sequelize from "../db/database.js";

const Location = sequelize.define("location", {
  location_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  fsq_place_id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  location: {
    type: DataTypes.GEOGRAPHY("POINT", 4326),
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  links: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
  },
  //to be changed for country_id!!!!!!!!!!!!!!!!!!!!
  country_code: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

export default Location;
