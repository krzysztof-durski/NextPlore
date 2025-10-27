const asynchandler = (requiredFunction) => async (req,res,next)=>
    {
        try {
             await requiredFunction(req,res,next);
        } catch (error) {
            console.log("Error:", error);
            next(error);
        }
       
    }

    export {asynchandler}