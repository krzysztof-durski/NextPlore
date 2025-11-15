import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';
import { fileURLToPath } from 'url';

// --- ESM replacement for __dirname ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// ---

// --- UPDATED IMPORTS ---
// We import sequelize and models directly, like your other files
import sequelize from './src/db/database.js'; 
import Country from './src/models/country.js'; 
// ---

const csvFilePath = path.join(__dirname, 'nextplore Data - countries.csv');

async function importCountries() {
  console.log("Starting country import process...");
  await sequelize.authenticate();
  console.log("Database connection established.");

  const stream = fs.createReadStream(csvFilePath).pipe(csv());

  let firstRow = true;
  for await (const row of stream) {
    if (firstRow) {
      console.log("First row data:", row);
      firstRow = false;
    }
    // Skip rows with no country_code or country_name
    if (!row.country_code || !row.country_name) {
      console.warn(`Skipping row with empty country_code or country_name (Code: ${row.country_code}, Name: ${row.country_name})`);
      continue;
    }

    const t = await sequelize.transaction();
    try {
      const countryData = {
        country_name: row.country_name,
        country_code: row.country_code.toUpperCase(), // Ensure uppercase
        flag: row.flag || null
      };

      const [country, created] = await Country.findOrCreate({
        where: { country_code: countryData.country_code },
        defaults: countryData,
        transaction: t
      });

      await t.commit(); 

      if (created) {
        console.log(`Successfully created country: ${country.country_name}`);
      }
    } catch (error) {
      await t.rollback(); 
      console.error(`Failed to import country ${row.country_name}: ${error.message}`);
    }
  }

  console.log("Country import process finished.");
  await sequelize.close();
}

importCountries().catch(err => {
  console.error("Critical error during country import:", err);
  process.exit(1);
});