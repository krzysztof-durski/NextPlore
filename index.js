import app from "./app";


app.listen(proccess.env.PORT,()=>{
    console.log(`Server is running at ${proccess.env.PORT}`)
    console.log(`http://localhost:${proccess.env.PORT}`)
})
