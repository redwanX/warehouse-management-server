const express = require("express")
const cors = require("cors")
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT||5000

const app = express()

//middleware
app.use(cors())
app.use(express.json())

app.get('/',(req,res)=>{
    res.send("server is running");
})


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jogi2.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
const run = async()=>{
    try{
        await client.connect()
        const products = client.db('furnitures').collection('product')

        app.post('/product',async (req,res)=>{
            const result = await products.insertOne(req.body);
            res.send(result);
        });
        app.get('/products',async(req,res)=>{
            const query = {};
            const cursor = products.find(query);
            const result= await cursor.toArray()
            console.log(result)
            res.send(result)
        });
    }
    finally{

    }
}
run().catch(console.dir)





app.listen(port,()=>{console.log(`listening to port: ${port}`)})
