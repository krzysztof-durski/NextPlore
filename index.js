import app from "./app.js";
import dotenv from 'dotenv';
import sequelize from "./src/models/db/database.js";
import Location from "./src/models/location.js";
dotenv.config();

async function StartServer(){
    try{
        await sequelize.authenticate();
        console.log("Database connected successfully.");

        await sequelize.sync({alter:true});
        console.log("All models were synchronized successfully.");

        app.listen(process.env.PORT || 8000, ()=>{
            console.log(`Server is running on port ${process.env.PORT || 8000}`);
            console.log(`Visit http://localhost:${process.env.PORT || 8000}`);
        });
    }
    catch(error){
        console.error("Unable to connect to the database:", error);
        process.exit(1);
    }
}
StartServer();


