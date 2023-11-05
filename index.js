const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require("jsonwebtoken")
const cookieParser = require("cookie-parser")
require('dotenv').config()
const cors = require("cors")
const app = express();
const port = process.env.PORT || 5000;
// add middleware
app.use(cors({
    origin: ["http://localhost:5173"],
    credentials: true
}))
app.use(cookieParser())
app.use(express.json())
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nrfwsc1.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // generate token
        app.post("/jsonwebtoken", (req, res) => {
            const userEmail = req.body;
            const token = jwt.sign(userEmail, process.env.ACCESS_TOKEN, { expiresIn: "30m" })
            console.log(token)
            res.cookie("token", token, {
                httpOnly: false,
                secure: true,
                sameSite: "none"
            }).send({ success: true })
        })

        // update Products
        // app.put("/updateProduct/:id", async (req, res) => {
        //     const id = req.params.id;
        //     const filter = { _id: new ObjectId(id) }
        //     const product = req.body;
        //     const updateProduct = {
        //         $set: {
        //             productName: product.productName,
        //             porductImg: product.porductImg,
        //             brandName: product.brandName,
        //             productType: product.productType,
        //             desc: product.desc,
        //             rate: product.rate,
        //             price: product.price
        //         },
        //     };
        //     const result = await productCollections.updateOne(filter, updateProduct)
        //     res.send(result)
        // })
        // delete data from cart
        // app.delete("/deleteCart/:id", async (req, res) => {
        //     const deleteid = req.params.id;
        //     const query = { _id: new ObjectId(deleteid) }
        //     const result = await cartCollection.deleteOne(query)
        //     res.send(result)
        // })


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.log);

app.listen(port, () => {
    console.log(`Server Listening from ${port}`)
})