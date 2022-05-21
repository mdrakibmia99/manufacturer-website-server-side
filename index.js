const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express');
const app=express();
const cors = require('cors');
require('dotenv').config()
const port =process.env.PORT || 5000;


// middle ware 
app.use(cors());
app.use(express.json());

app.get('/',(req,res)=>{
    res.send("manufacturer is running....");
})



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yl9lo.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try { 
        await client.connect();
        const userCollection= client.db("manufacturerWebsite").collection("users");
        app.post('/user',async(req,res)=>{
            const user =req.body
            const result=await userCollection.insertOne(user);
            res.send(result);
        })

     } finally {
        // await client.close()
    }
}
run().catch(console.dir);

app.listen(port,()=>{
    console.log(`Server is running on ${port}`)
})