import { DataTypes } from "sequelize";
import sequelize from "../db/database.js";

const Location = sequelize.define("location", {
  location_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  fsq_place_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  address: {
    type: DataTypes.STRING(255),
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
  icon_prefix: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  icon_suffix: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  // Foreign key to Country model - use country_id to get country_code from Country
  country_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "country",
      key: "country_id",
    },
  },
});

export default Location;
