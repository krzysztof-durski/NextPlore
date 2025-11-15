import { DataTypes } from "sequelize";
import sequelize from "../db/database.js";

const Country = sequelize.define(
  "country",
  {
    country_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    country_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Country name cannot be empty",
        },
      },
      unique: true,
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
    flag: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: "Country flag emoji",
    },
  },
  {
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    paranoid: true,
    deletedAt: "deleted_at",
    tableName: "countries",
    freezeTableName: true,
  }
);

export default Country;
