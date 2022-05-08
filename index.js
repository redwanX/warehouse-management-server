const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require("jsonwebtoken");
const port = process.env.PORT||5000;

const app = express();

//middleware
app.use(cors());
app.use(express.json());



//VerifyJWT
const VerifyJWT = (req,res,next)=>{
    email=req.query.email;
    const authHeader = req.headers.authorization;
    if(!authHeader || !email){
        return res.status(401).send({message:'unauthorized access'});
    }
    const token= authHeader.split(' ')[1];
    jwt.verify(token,process.env.JWT_SECRET,(err,decoded)=>{
        if(err){
            return res.status(403).send({message:"Forbidden Access"});
        }
        req.decoded = decoded;
         next();
    })
}

// Index
app.get('/',(req,res)=>{
    res.send("server is running");
})

//MONGODB CONNECTION
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jogi2.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const run = async()=>{
    try{
        await client.connect();
        const products = client.db('furnitures').collection('product');
        const feedback = client.db('furnitures').collection('feedback');
        const activity = client.db('furnitures').collection('activity');

        

        // Activity set
        const setActivity = async (req)=>{
            let logs= req.query;
            if(!logs){
                logs = {}
            }
            const today = new Date();
            logs.date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
            const res= await activity.insertOne(logs);
            return res;
        }

        //GET ACTIVITIES
        app.get('/getActivity',VerifyJWT,async(req,res)=>{
            const decodedEmail=req?.decoded?.email;
            const QueryEmail = req?.query?.email;
            if(decodedEmail === QueryEmail){
            if(QueryEmail){
                const query={email:QueryEmail};
                const cursor = activity.find(query);
                const result= await cursor.toArray();
                res.send(result);
            }
            else{
                res.send([]);
            }
            }
            else{
                res.status(403).send({message:"Forbidden Access!"});
            }
        });



        //AUTH API
        app.post('/login',async(req,res)=>{
            const user = req.body;
            const token = jwt.sign(user,process.env.JWT_SECRET,{
                expiresIn:'1d'
            });
            res.send({token})
        });


        //FEEDBACK
        app.post('/feedback',async(req,res)=>{
            const result = await feedback.insertOne(req.body);
            res.send(result);
        });


        //PRODUCTS API
        
        //ADD PRODUCT
        app.post('/addproduct',async (req,res)=>{
            const result = await products.insertOne(req.body);
            const activity=await setActivity(req);
            res.send(result);
        });

        //GET ALL PRODUCTS
        app.get('/allproducts',async(req,res)=>{
                query={};
            const cursor = products.find(query);
            const result= await cursor.toArray();
            res.send(result);
        });

        //GET ONLY PRODUCTS WITH GIVEN EMAIL (JWT)
        app.get('/products',VerifyJWT,async(req,res)=>{
            const decodedEmail=req?.decoded?.email;
            const QueryEmail = req?.query?.email;
            if(decodedEmail === QueryEmail){
            if(QueryEmail){
                const query={email:QueryEmail};
                const cursor = products.find(query);
                const result= await cursor.toArray();
                res.send(result);
            }
            else{
                res.send([]);
            }
            }
            else{
                res.status(403).send({message:"Forbidden Access!"});
            }
        });


        //GET SINGLE PRODUCT WITH ID
        app.get('/singleProduct/:id',async(req,res)=>{
            try{
            const id = req?.params?.id
            const query = {_id:ObjectId(id)}
            const result = await products.findOne(query)
            res.send(result);
            }
            catch{
                res.send({})
            }
        });


        //UPDATE PRODUCT
        app.put('/update',async(req,res)=>{
            const id = req?.body?._id;
            const quantity = req?.body?.quantity;
            if(id  && parseInt(quantity)>=0){
                const sold = req?.body?.sold;
                const filter = {_id:ObjectId(id)}
                const options = { upsert: true };
                const updateDoc = {
                    $set: {
                        quantity: quantity,
                        sold:sold
                    },
                };
                const result = await products.updateOne(filter, updateDoc, options);
                res.send(result);
            }
            else{
                res.send({message:"something went wrong"});
            }
        });

        //DELETE PRODUCT
        app.delete('/deleteItem/:id',async(req,res)=>{
            try{
                const id=req.params.id;
            if(id){
                const query = {_id:ObjectId(id)};
                const result = await products.deleteOne(query);
                const activity=await setActivity(req);
                res.send(result);
            }
            else{
                res.send({message:"something went wrong"});
            }
            }
            catch{
                res.send({message:"something went wrong"});
            }
        });
    }
    finally{

    }
}
run().catch(console.dir);




//LISTENING TO PORT
app.listen(port,()=>{console.log(`listening to port: ${port}`)});
