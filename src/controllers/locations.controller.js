import Tag from "../models/tag.js";
import Location from "../models/location.js";
import User from "../models/user.js";
import {asynchandler} from "../utils/asynchandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import sequelize from "../db/database.js";


const getnearbyLocations = asynchandler(async (req, res) => {

        const { latStr, lonStr } = req.query;

        const radiusKm = parseFloat(req.query.radius || 2); 

        if (!latitude || !longitude) {
            throw new ApiError(400, "Latitude and Longitude are required");
        }

        const latitude = parseFloat(latStr);
        const longitude = parseFloat(lonStr);

        const Point = sequelize.fn('ST_MakePoint', longitude, latitude);
    
        const userPoint = sequelize.fn('ST_SetSRID', Point, 4326);
        const userGeography = sequelize.cast(userPoint, 'GEOGRAPHY');
    
        const locations = await Location.findAll({
            where: sequelize.where(
                sequelize.fn('ST_DWithin', 
                    sequelize.col('location'), 
                    userGeography,
                    radiusKm * 1000 // convert km to meters
                ),
                true
            ),
        });
    
        res.status(200).json(new ApiResponse(200, "Nearby locations fetched successfully", locations));
});




export { getnearbyLocations };

