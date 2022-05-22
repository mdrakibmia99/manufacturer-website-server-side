const { MongoClient, ServerApiVersion } = require('mongodb');
const jwt = require('jsonwebtoken');
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
function verifyJWT(req, res, next) {
    const authorizeCode = req.body.authorization;
    if (!authorizeCode) {
      return res.status(401).send({ message: 'unauthorize access' })
    }
    const token = authorizeCode.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
      if (err) {
        return res.status(403).send({ message: 'forbidden access' })
      }
      req.decoded = decoded;
      next();
  
    });
  }


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yl9lo.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try { 
        await client.connect();
        const carouselCollection=client.db('manufacturerWebsite').collection('carousel');
        const userCollection= client.db("manufacturerWebsite").collection("users");
        const productsCollection= client.db("manufacturerWebsite").collection("products");
        
        app.post('/user',async(req,res)=>{
            const user =req.body
            const result=await userCollection.insertOne(user);
            res.send(result);
        })
      
        // this api for get carousel photos  
        app.get('/carousels', async (req, res) => {
            const carousels = await carouselCollection.find({}).toArray();
            res.send(carousels);
        })

        //this api for get all products 
        app.get("/products",async(req,res)=>{
          const products= await productsCollection.find({}).toArray();
          res.send(products);
        })

     } finally {
        // await client.close()
    }
}
run().catch(console.dir);

app.listen(port,()=>{
    console.log(`Server is running on ${port}`)
})