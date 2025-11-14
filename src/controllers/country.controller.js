import Country from "../models/country.js";
import { asynchandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";

const getAllCountries = asynchandler(async (req, res) => {
  // Get all countries from the database
  const countries = await Country.findAll({
    order: [["country_name", "ASC"]], // Order by country name alphabetically
    attributes: ["country_id", "country_name", "country_code", "flag"], // Only return necessary fields
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        countries,
        "Countries retrieved successfully"
      )
    );
});

export { getAllCountries };

