const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const express = require('express');
const app=express();
const cors = require('cors');
require('dotenv').config()
const port =process.env.PORT || 5000;
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


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
        const userOrdersCollection=client.db("manufacturerWebsite").collection("userOrders");
        const userReviewsCollection=client.db("manufacturerWebsite").collection("userReviews");
        const paymentCollection = client.db('manufacturerWebsite').collection('payments');

        
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

        // //this api for get all products 
        // app.get("/products",async(req,res)=>{
        //   const products= await productsCollection.find({}).toArray();
        //   res.send(products);
        // })

        // this api for get a single product 
        app.get("/product/:id",async(req,res)=>{
          const id=req.params.id;
          const query = { _id: ObjectId(id) };
          const product=await productsCollection.find(query).toArray();
          res.send(product);
        })
    //  this api for post a user order 
        app.post('/userOrder',async(req,res)=>{
          const orderData =req.body;
          const result =await userOrdersCollection.insertOne(orderData);
          res.send(result);
        })

       //    get all  products api 
       app.get('/products', async (req, res) => {
        const page = parseInt(req.query.page)
        const PageSize = parseInt(req.query.size)
        const cursor = productsCollection.find({});
        let products;
        if (page || PageSize) {

            products = await cursor.skip(page * PageSize).limit(PageSize).toArray();
        } else {

            products = await cursor.toArray();
        }
        res.send(products)

    })
        //   this api for count total product
        app.get('/productCount', async (req, res) => {
          const count = await productsCollection.estimatedDocumentCount();
          res.send({ count });
      })
      
    //  this api for display show order list 
        app.get('/userOrders', async (req, res) => {
            const userOrders = await userOrdersCollection.find({}).toArray();
            res.send(userOrders);
        })

        // this api for get review info 
        app.get('/reviews',async(req,res)=>{
           const reviews=await userReviewsCollection.find({}).toArray();
           res.send(reviews);
        })

        // add user review
        app.put('/reviews/:email', async (req, res) => {
          const reviewerEmail = req.params.email;
          const userReview = req.body;

          const filter = { reviewerEmail: reviewerEmail };
          const options = { upsert: true };
          const updateDoc = {
              $set: userReview
          };
          const usersReview = await userReviewsCollection.updateOne(filter, updateDoc, options);
          res.send(usersReview);
      })
    
       

      // display specific ordered product through id
      app.get('/userOrder/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: ObjectId(id) };
        const userOrder = await userOrdersCollection.findOne(query);
        res.send(userOrder);
    })

    // add user order with payment method
    app.patch('/userOrder/:id', async (req, res) => {
        const id = req.params.id;
        const payment = req.body;
     
        const filter = { _id: ObjectId(id) };
        const updateDoc = {
            $set: {
                paid: true,
                transactionId: payment?.transactionId
            }
        };

        const result = await paymentCollection.insertOne(payment);
        const updateUserOrder = await userOrdersCollection.updateOne(filter, updateDoc);
        res.send(updateDoc);
    })

    // make a payment through create payment intent
    app.post('/create-payment-intent', async (req, res) => {
        const userOrder = req.body;
        const totalPrice = userOrder?.totalPrice;
        const amount = totalPrice * 100;

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: "usd",
            payment_method_types: [
                "card"
            ],
        });

        res.send({
            clientSecret: paymentIntent.client_secret,
        });
    })


     } finally {
        // await client.close()
    }
}
run().catch(console.dir);

app.listen(port,()=>{
    console.log(`Server is running on ${port}`)
})