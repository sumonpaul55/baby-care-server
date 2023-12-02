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
    origin: ["http://localhost:5173"],// ["https://littlestars-care.web.app"],
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
// middler for verify token
const verfyToken = (req, res, next) => {
    const token = req?.cookies?.token;
    // console.log("token in the middle ware", token)
    if (!token) {
        return res.status(401).send({ message: "Unauthorized Access" })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: "Unauthorized Access" })
        }
        req.user = decoded;
        next();
    })
}
async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        const serviceCollection = client.db("babyCare").collection("services");
        const bookingsCollection = client.db("babyCare").collection("bookings");

        // generate token
        app.post("/jsonwebtoken", (req, res) => {
            const userEmail = req.body;
            // console.log(userEmail)
            const token = jwt.sign(userEmail, process.env.ACCESS_TOKEN, { expiresIn: "1h" })
            // console.log(token)
            res.cookie("token", token, {
                httpOnly: false,
                secure: true,
                sameSite: "none"
            }).send({ success: true })
        })
        // user logout delete token
        app.post("/logout", async (req, res) => {
            const user = req.body;
            // console.log("logout user", user)
            res.clearCookie("token", { maxAge: 0 }).send({ success: true })
        })
        // myService delete
        app.delete("/delete-myService/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await serviceCollection.deleteOne(query)
            res.send(result)
        })
        // delete api from book
        app.delete("/bookings-delete/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await bookingsCollection.deleteOne(query)
            res.send(result)
        })
        // getting simisar service api
        app.get("/similar", async (req, res) => {
            try {
                const category = req.query.category;
                const filter = { category: category }
                const result = (await serviceCollection.find(filter).toArray()).reverse().slice(0, 4)
                res.send(result)
            }

            catch (err) {
                res.send(err)
            }
        })
        // get specific data for upadate
        app.get("/my-serviceData/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await serviceCollection.find(query).toArray();
            res.send(result)
        })
        // getting pendinng service api
        app.get("/pending-service", verfyToken, async (req, res) => {
            const owneremail = req.query.email;
            const query = {
                serviceProviderEmail: owneremail,
                status: "pending"
            }
            const result = (await bookingsCollection.find(query).toArray()).reverse();
            res.send(result)
        })
        //getting data apis for service worner
        app.get("/my-services", verfyToken, async (req, res) => {
            const owneremail = req.query.email;
            // console.log("verify token", req.user, owneremail)
            if (req.user.email !== owneremail) {
                res.status(403).send({ message: "forbidden access" })
            }
            const filter = { email: owneremail }
            const result = (await serviceCollection.find(filter).toArray()).reverse()
            res.send(result)
        })
        // get a singelService for service detail
        app.get("/service/:id", async (req, res) => {
            try {
                const id = req.params.id
                const query = { _id: new ObjectId(id) }
                const result = await serviceCollection.find(query).toArray()
                res.send(result)
            } catch (err) {
                res.send(err)
            }
        })

        // get bookings data api
        app.get("/my-bookings", verfyToken, async (req, res) => {
            try {
                const email = req.query.email;
                const query = { userEmail: email }
                if (req.user.email !== email) {
                    res.status(403).send({ message: "forbidden access" })
                }
                const result = (await bookingsCollection.find(query).toArray()).reverse()
                res.send(result)
            }
            catch (err) {
                res.send(err)
            }
        })
        // getting service for update
        app.get("/update-service/:id", async (req, res) => {
            try {
                const id = req.params.id
                const query = { _id: new ObjectId(id) }
                const result = await serviceCollection.find(query).toArray()
                res.send(result)
            } catch (err) {
                res.send(err)
            }
        })
        // get apis for  service for home page 
        app.get("/all-service", async (req, res) => {
            const result = (await serviceCollection.find().toArray()).reverse();
            res.send(result)
        })
        // getPopular 5 services
        app.get("/popular-service", async (req, res) => {
            const result = (await serviceCollection.find().toArray()).slice(0, 4)
            res.send(result)
        })
        // get apis for 6 service for home page 
        app.get("/service6", async (req, res) => {
            const result = (await serviceCollection.find().toArray()).reverse().slice(0, 6);
            res.send(result)
        })
        // add bookings api
        app.post("/books", async (req, res) => {
            const bookings = req.body;
            const result = await bookingsCollection.insertOne(bookings)
            res.send(result)
        })
        // add service related apis
        app.post("/add-service", async (req, res) => {
            const service = req.body;
            const result = await serviceCollection.insertOne(service);
            res.send(result)
        })
        // update status for my pendings works
        app.patch("/update-booking-service-status/:id", async (req, res) => {
            try {
                const dataId = req.params.id;
                const updatePart = req.body;
                const query = { _id: new ObjectId(dataId) }
                const updateDocs = {
                    $set: {
                        status: updatePart.status
                    }
                }
                const result = await bookingsCollection.updateOne(query, updateDocs)
                res.send(result)
            } catch (err) {
                res.send(err)
            }
        })

        app.put("/update-myService/:id", async (req, res) => {
            try {
                const id = req.params.id;
                const filter = { _id: new ObjectId(id) }
                const updateService = req.body;
                const options = { upsert: true }
                const updateDocs = {
                    $set: {
                        serviceName: updateService.serviceName,
                        serviceArea: updateService.serviceArea,
                        serviceDescription: updateService.serviceDescription,
                        serviceImg: updateService.serviceImg,
                        price: updateService.price,
                        name: updateService.name,
                        email: updateService.email,
                        about: updateService.about,
                        providerImg: updateService.providerImg,
                        category: updateService.category,
                        location: updateService.location
                    }
                }

                const result = await serviceCollection.updateOne(filter, updateDocs, options)
                res.send(result)
            } catch (err) {
                res.send(err)
            }

        })


        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
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