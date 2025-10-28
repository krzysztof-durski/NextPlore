import sequelize from "../db/database.js";
import { DataTypes } from "sequelize";

const Tag = sequelize.define("tag", {
  tag_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  tag_name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
});

export default Tag;
