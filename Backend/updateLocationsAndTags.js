import fs from "fs";
import csv from "csv-parser";
import path from "path";
import { fileURLToPath } from "url";

import sequelize from "./src/db/database.js";
import Location from "./src/models/location.js";
import Tag from "./src/models/tag.js";
import "./src/models/association.js"; // Import associations

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const csvFilePath = path.join(
  __dirname,
  "DATA-CSVs",
  "nextplore Data - nextplore.csv"
);

/**
 * Parse comma-separated tags from a string
 * @param {string} tagString - Comma-separated tag string
 * @returns {string[]} Array of trimmed tag names
 */
function parseTags(tagString) {
  if (!tagString || tagString.trim() === "") {
    return [];
  }
  return tagString
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

/**
 * Get all unique tags from a row
 * @param {object} row - CSV row object
 * @returns {string[]} Array of unique tag names
 */
function getAllTagsFromRow(row) {
  const tags = new Set();

  // Parse vibes (comma-separated)
  const vibes = parseTags(row.vibes);
  vibes.forEach((vibe) => tags.add(vibe));

  // Parse cuisine (comma-separated)
  const cuisine = parseTags(row.cuisine);
  cuisine.forEach((cuisineTag) => tags.add(cuisineTag));

  // Parse category (single value, but handle comma-separated just in case)
  const category = parseTags(row.category);
  category.forEach((cat) => tags.add(cat));

  // Parse adult only (single value: "child friendly" or "adult only")
  if (row["adult only"]) {
    const adultOnlyTag = row["adult only"].trim();
    if (adultOnlyTag) {
      tags.add(adultOnlyTag);
    }
  }

  return Array.from(tags);
}

async function updateLocationsAndTags() {
  console.log("Starting location update and tag import process...");
  await sequelize.authenticate();
  console.log("Database connection established.");

  const stream = fs.createReadStream(csvFilePath).pipe(csv());

  let locationUpdateCount = 0;
  let tagCreateCount = 0;
  let tagAssociateCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for await (const row of stream) {
    // Validate required fields
    if (!row.fsq_place_id) {
      console.warn(`Skipping row with missing fsq_place_id`);
      skipCount++;
      continue;
    }

    try {
      // Find location by fsq_place_id
      const location = await Location.findOne({
        where: { fsq_place_id: row.fsq_place_id.trim() },
      });

      if (!location) {
        console.warn(
          `Location not found for fsq_place_id: ${row.fsq_place_id}. Skipping...`
        );
        skipCount++;
        continue;
      }

      // Prepare update data
      const updateData = {};

      // Update description if provided
      if (row.description && row.description.trim()) {
        updateData.description = row.description.trim();
      }

      // Update links (website and phone) if provided
      const links = {};
      if (row.website && row.website.trim()) {
        links.website = row.website.trim();
      }
      if (row.phone && row.phone.trim()) {
        links.phone = row.phone.trim();
      }
      if (Object.keys(links).length > 0) {
        // Merge with existing links if any
        const existingLinks = location.links || {};
        updateData.links = { ...existingLinks, ...links };
      }

      // Update location if there's data to update
      if (Object.keys(updateData).length > 0) {
        await location.update(updateData);
        locationUpdateCount++;
        console.log(
          `Updated location: ${location.name} (ID: ${location.location_id})`
        );
      }

      // Process tags
      const tagNames = getAllTagsFromRow(row);

      if (tagNames.length > 0) {
        // Get or create tags
        const tagInstances = [];
        for (const tagName of tagNames) {
          const [tag, created] = await Tag.findOrCreate({
            where: { name: tagName },
            defaults: { name: tagName },
          });

          if (created) {
            tagCreateCount++;
            console.log(`Created tag: ${tagName}`);
          }

          tagInstances.push(tag);
        }

        // Associate tags with location (this will handle duplicates automatically)
        await location.setTags(tagInstances);
        tagAssociateCount += tagInstances.length;
        console.log(
          `Associated ${tagInstances.length} tags with location: ${location.name}`
        );
      }
    } catch (error) {
      console.error(
        `Failed to process row for fsq_place_id ${row.fsq_place_id}: ${error.message}`
      );
      console.error(error.stack);
      errorCount++;
    }
  }

  console.log("\n=== Import Summary ===");
  console.log(`Locations updated: ${locationUpdateCount}`);
  console.log(`Tags created: ${tagCreateCount}`);
  console.log(`Tag associations made: ${tagAssociateCount}`);
  console.log(`Skipped: ${skipCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log("Location update and tag import process finished.");
  await sequelize.close();
}

updateLocationsAndTags().catch((err) => {
  console.error("Critical error during import:", err);
  process.exit(1);
});

