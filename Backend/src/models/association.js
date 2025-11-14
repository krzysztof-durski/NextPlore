import User from "./user.js";
import Tag from "./tag.js";
import Location from "./location.js";
import Country from "./country.js";

// User and Country (Many-to-One)
User.belongsTo(Country, { foreignKey: "country_id", as: "country" });
Country.hasMany(User, { foreignKey: "country_id" });

// User and Tag (Many-to-Many)
User.belongsToMany(Tag, { through: "user_tag", foreignKey: "userId" });
Tag.belongsToMany(User, { through: "user_tag", foreignKey: "tagId" });

// Location and Tag (Many-to-Many)
Location.belongsToMany(Tag, { through: "place_tag", foreignKey: "locationId" });
Tag.belongsToMany(Location, { through: "place_tag", foreignKey: "tagId" });

// Location and Country (Many-to-One)
Location.belongsTo(Country, { foreignKey: "country_id", as: "country" });
Country.hasMany(Location, { foreignKey: "country_id" });
