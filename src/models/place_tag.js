import { DataTypes } from "sequelize";
import sequelize from "../db/database.js";
import Location from "./location.js";
import Tag from "./tag.js";

const PlaceTag = sequelize.define("place_tag", {
  place_tag_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  locationId: {
    type: DataTypes.INTEGER,
    references: {
      model: Location,
      key: "location_id",
    },
  },
  tagId: {
    type: DataTypes.INTEGER,
    references: {
      model: Tag,
      key: "tag_id",
    },
  },
});

export default PlaceTag;