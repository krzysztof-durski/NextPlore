import sequelize from "./db/database";
import { DataTypes } from "sequelize";

const Tag = sequelize.define("tag", {
  tag_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  Tag: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
});

export default Tag;
