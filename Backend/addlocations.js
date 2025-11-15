import fs from "fs";
import csv from "csv-parser";
import path from "path";
import { fileURLToPath } from "url";
import { Sequelize } from "sequelize";

// --- Make sure these paths are correct ---
import sequelize from "./src/db/database.js";
import Location from "./src/models/location.js";
import Country from "./src/models/country.js";
// ---

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const csvFilePath = path.join(
  __dirname,
  "DATA-CSVs",
  "nextplore Data - locations.csv"
);

async function importLocations() {
  console.log("Starting location import process...");
  await sequelize.authenticate();
  console.log("Database connection established.");

  const stream = fs.createReadStream(csvFilePath).pipe(csv());

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for await (const row of stream) {
    // Validate required fields
    if (
      !row.fsq_place_id ||
      !row.name ||
      !row.latitude ||
      !row.longitude ||
      !row.country_code
    ) {
      console.warn(
        `Skipping row with missing required fields (Name: ${
          row.name || "Unknown"
        })`
      );
      skipCount++;
      continue;
    }

    // Validate latitude and longitude are valid numbers
    const latitude = parseFloat(row.latitude);
    const longitude = parseFloat(row.longitude);

    if (isNaN(latitude) || isNaN(longitude)) {
      console.warn(
        `Skipping row with invalid coordinates (Name: ${row.name}, Lat: ${row.latitude}, Long: ${row.longitude})`
      );
      skipCount++;
      continue;
    }

    // Validate latitude and longitude ranges
    if (
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      console.warn(
        `Skipping row with out-of-range coordinates (Name: ${row.name}, Lat: ${latitude}, Long: ${longitude})`
      );
      skipCount++;
      continue;
    }

    try {
      // Find country by country_code to get country_id
      const country = await Country.findOne({
        where: { country_code: row.country_code.toUpperCase() },
      });

      if (!country) {
        console.warn(
          `Country not found for code: ${row.country_code}. Skipping location: ${row.name}`
        );
        skipCount++;
        continue;
      }

      // Create POINT geometry from latitude and longitude
      // Note: PostGIS ST_MakePoint uses (longitude, latitude) order
      const locationPoint = Sequelize.literal(
        `ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)`
      );

      const locationData = {
        fsq_place_id: row.fsq_place_id.trim(),
        name: row.name.trim(),
        address: row.address ? row.address.trim() : "",
        location: locationPoint,
        country_id: country.country_id,
      };

      // Use findOrCreate to avoid duplicates based on fsq_place_id
      const [location, created] = await Location.findOrCreate({
        where: { fsq_place_id: locationData.fsq_place_id },
        defaults: locationData,
      });

      if (created) {
        console.log(
          `Successfully created location: ${location.name} (ID: ${location.location_id})`
        );
        successCount++;
      } else {
        console.log(
          `Location already exists: ${location.name} (ID: ${location.location_id})`
        );
      }
    } catch (error) {
      console.error(`Failed to import location ${row.name}: ${error.message}`);
      errorCount++;
    }
  }

  console.log("\n=== Import Summary ===");
  console.log(`Successfully imported: ${successCount}`);
  console.log(`Skipped: ${skipCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log("Location import process finished.");
  await sequelize.close();
}

importLocations().catch((err) => {
  console.error("Critical error during location import:", err);
  process.exit(1);
});
