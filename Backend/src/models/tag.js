import sequelize from "../db/database.js";
import { DataTypes } from "sequelize";

const Tag = sequelize.define(
  "tag",
  {
    tag_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      // Renamed from tag_name to match your controller
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    // --- NEW COLUMNS ADDED! ---
    icon_prefix: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    icon_suffix: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: "tags", // Good practice to define the table name
    freezeTableName: true,
  }
);

export default Tag;
