import app from "./app.js";
import dotenv from "dotenv";
import sequelize from "./src/db/database.js";
import Location from "./src/models/location.js";
import User from "./src/models/user.js";
import Tag from "./src/models/tag.js";
import Country from "./src/models/country.js";
import "./src/models/association.js";
dotenv.config();

async function StartServer() {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully.");

    // Sync models in correct dependency order
    // Country must be synced first (no dependencies)
    await Country.sync({ force: true });
    console.log("Country model synchronized.");

    // Tag can be synced next (no dependencies)
    await Tag.sync({ force: true });
    console.log("Tag model synchronized.");

    // User depends on Country
    await User.sync({ force: true });
    console.log("User model synchronized.");

    // Location can be synced (country_code is just a string, not FK)
    await Location.sync({ force: true });
    console.log("Location model synchronized.");

    // Now sync association tables (through tables)
    await sequelize.sync({ force: false });
    console.log("All models were synchronized successfully.");

    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running on port ${process.env.PORT || 8000}`);
      console.log(`Visit http://localhost:${process.env.PORT || 8000}`);
    });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    process.exit(1);
  }
}
StartServer();
