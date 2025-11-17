import Tag from "../models/tag.js";
import Location from "../models/location.js";
import { asynchandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import sequelize from "../db/database.js";
import { Op } from "sequelize";

const getnearbyLocations = asynchandler(async (req, res) => {
  const { lat, lon, radius } = req.query;

  if (!lat || !lon) {
    throw new ApiError(400, "Latitude and Longitude are required");
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lon);
  const radiusKm = parseFloat(radius || 2);

  if (isNaN(latitude) || isNaN(longitude) || isNaN(radiusKm)) {
    throw new ApiError(400, "Invalid latitude, longitude, or radius provided");
  }

  const userPoint = sequelize.fn(
    "ST_SetSRID",
    sequelize.fn("ST_MakePoint", longitude, latitude),
    4326
  );
  const userGeography = sequelize.cast(userPoint, "GEOGRAPHY");

  const locations = await Location.findAll({
    where: sequelize.where(
      sequelize.fn(
        "ST_DWithin",
        sequelize.col("location"),
        userGeography,
        radiusKm * 1000 // convert km to meters
      ),
      true
    ),
    include: [
      {
        model: Tag,
        attributes: ["name", "icon_prefix", "icon_suffix"],
        through: { attributes: [] },
      },
    ],
  });

  res
    .status(200)
    .json(
      new ApiResponse(200, locations, "Nearby locations fetched successfully")
    );
});

const getRecommendLocations = asynchandler(async (req, res) => {
  const { tags, radius, userLocation } = req.body;

  if (!userLocation || !userLocation.latitude || !userLocation.longitude) {
    throw new ApiError(
      400,
      "User location with latitude and longitude is required"
    );
  }
  if (!tags || !Array.isArray(tags) || tags.length === 0) {
    throw new ApiError(400, "At least one tag is required for recommendations");
  }

  const tagNames = tags;
  const tagCount = tagNames.length;
  const latitude = parseFloat(userLocation.latitude);
  const longitude = parseFloat(userLocation.longitude);
  const radiusKm = parseFloat(radius || 5);

  if (isNaN(latitude) || isNaN(longitude) || isNaN(radiusKm)) {
    throw new ApiError(400, "Invalid user location or radius provided");
  }

  const userPoint = sequelize.fn(
    "ST_SetSRID",
    sequelize.fn("ST_MakePoint", longitude, latitude),
    4326
  );
  const userGeography = sequelize.cast(userPoint, "GEOGRAPHY");

  const locations = await Location.findAll({
    attributes: ["location_id", "fsq_place_id", "name", "address", "location"],
    include: [
      {
        model: Tag,
        where: { name: { [Op.in]: tagNames } },
        attributes: ["name", "icon_prefix", "icon_suffix"],
        through: { attributes: [] },
        required: true,
      },
    ],
    where: sequelize.where(
      sequelize.fn(
        "ST_DWithin",
        sequelize.col("location"),
        userGeography,
        radiusKm * 1000 // convert km to meters
      ),
      true
    ),
    group: ["location.location_id"],
    having: sequelize.literal(`COUNT(DISTINCT "tags"."tag_id") = ${tagCount}`),
    raw: true,
  });

  // Extract location IDs
  const locationIds = matchingLocationIds.map((loc) => loc.location_id);

  if (locationIds.length === 0) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          [],
          "No locations found matching all selected tags"
        )
      );
  }

  // Step 2: Fetch the full location data with tags
  // Note: We don't need to re-apply the distance filter since locationIds already filtered by distance
  const locations = await Location.findAll({
    attributes: [
      "location_id",
      "fsq_place_id",
      "name",
      "address",
      "location",
      "description",
      "links",
    ],
    include: [
      {
        model: Tag,
        attributes: ["name", "icon_prefix", "icon_suffix"],
        through: { attributes: [] },
      },
    ],
    where: {
      location_id: { [Op.in]: locationIds },
    },
  });

  const locationIds = locationIdsResult.map((loc) => loc.location_id);

  if (locationIds.length === 0) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          [],
          "No locations found matching all specified tags."
        )
      );
  }

  // Step 2: Fetch the full details for the matching locations

  const locations = await Location.findAll({
    // --- ADD THIS ATTRIBUTES ARRAY ---
    attributes: [
      "location_id",
      "fsq_place_id",
      "name",
      "address",
      "description",
      "links",
      "location", // The all-important coordinate data
      "country_id",
    ],
    // ---
    where: { location_id: { [Op.in]: locationIds } },
    include: [
      {
        model: Tag,
        attributes: ["name", "icon_prefix", "icon_suffix"],
        through: { attributes: [] },
      },
    ],
  });
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        locations,
        "Recommended locations fetched successfully"
      )
    );
});

const getPlaceDetails = asynchandler(async (req, res) => {
  const { id } = req.params;
  // This include automatically picks up the new icon fields from the Tag model
  const location = await Location.findByPk(id, {
    include: Tag,
  });
  if (!location) {
    throw new ApiError(404, "Location not found");
  }
  res
    .status(200)
    .json(
      new ApiResponse(200, location, "Location details fetched successfully")
    );
});

export { getnearbyLocations, getRecommendLocations, getPlaceDetails };
