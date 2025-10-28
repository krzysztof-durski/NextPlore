import { DataTypes } from "sequelize";
import sequelize from "../db/database.js";
import User from "./user.js";
import Tag from "./tag.js";

const UserTag = sequelize.define("user_tag", {
  user_tag_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: "user_id",
    },
  },
  tag_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Tag,
      key: "tag_id",
    },
  },
});

export default UserTag;
