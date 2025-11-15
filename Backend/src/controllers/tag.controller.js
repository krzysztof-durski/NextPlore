import Tag from "../models/tag.js";
import { asynchandler } from "../utils/asynchandler.js";
import { ApiResponse } from "../utils/apiResponse.js";

const getAllTags = asynchandler(async (req, res) => {
  // Get all tags from the database
  const tags = await Tag.findAll({
    order: [["name", "ASC"]], // Order by tag name alphabetically
    attributes: ["tag_id", "name", "icon_prefix", "icon_suffix"], // Return all tag fields
  });

  return res
    .status(200)
    .json(new ApiResponse(200, tags, "Tags retrieved successfully"));
});

export { getAllTags };

