import { DataTypes } from "sequelize";
import sequelize from "../db/database.js";

const Country = sequelize.define(
  "country",
  {
    country_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    country_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          msg: "Country name cannot be empty",
        },
      },
    },
    country_code: {
      type: DataTypes.STRING(2),
      allowNull: false,
      unique: true,
      validate: {
        len: {
          args: [2, 2],
          msg: "Country code must be exactly 2 characters (ISO 3166-1 alpha-2)",
        },
        isUppercase: {
          msg: "Country code must be uppercase",
        },
      },
    },
  },
  {
    tableName: "country",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default Country;
