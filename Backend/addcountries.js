import fs from "fs";
import csv from "csv-parser";
import path from "path";
import { fileURLToPath } from "url";

// --- Make sure these paths are correct ---
import sequelize from "./src/db/database.js";
import Country from "./src/models/country.js";
// ---

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const csvFilePath = path.join(
  __dirname,
  "DATA-CSVs",
  "nextplore Data - countries.csv"
); // Make sure this is your COUNTRIES file

async function importCountries() {
  console.log("Starting country import process...");
  await sequelize.authenticate();
  console.log("Database connection established.");

  const stream = fs.createReadStream(csvFilePath).pipe(csv());

  for await (const row of stream) {
    if (!row.country_code) {
      console.warn(
        `Skipping row with empty country_code (Name: ${row.country_name})`
      );
      continue;
    }

    try {
      const countryData = {
        country_name: row.country_name,
        country_code: row.country_code.toUpperCase(),
        flag: row.flag || null,
      };

      // Use findOrCreate without a transaction.
      // This is slower but commits each row immediately.
      const [country, created] = await Country.findOrCreate({
        where: { country_code: countryData.country_code },
        defaults: countryData,
      });

      if (created) {
        console.log(
          `Successfully created country: ${country.country_name} (ID: ${country.country_id})`
        );
      }
    } catch (error) {
      console.error(
        `Failed to import country ${row.country_name}: ${error.message}`
      );
    }
  }

  console.log("Country import process finished.");
  await sequelize.close();
}

importCountries().catch((err) => {
  console.error("Critical error during country import:", err);
  process.exit(1);
});
