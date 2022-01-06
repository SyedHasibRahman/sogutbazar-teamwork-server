const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");
const ObjectId = require("mongodb").ObjectId;
require("dotenv").config();
const fileUpload = require("express-fileupload");

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());
app.use(fileUpload());

// Database Info
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.quv1r.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    await client.connect();

    console.log("database connected successfully");

    const database = client.db("madicinebd_DB");
    // Collections
    const categoryCollection = database.collection("categories");
    const userCollection = database.collection("users");
    const productCollection = database.collection("products");
    const bannerCollection = database.collection("banners");
    const testimonialCollection = database.collection("testimonials");

    /* ========================= Category Collection START ======================= */
    // GET - All Categories
    app.get("/categories", async (req, res) => {
      const cursor = categoryCollection.find({});
      const categories = await cursor.toArray();
      res.json(categories);
    });

    // POST - Add Category
    app.post("/categories", async (req, res) => {
      const category = req.body;
      const result = await categoryCollection.insertOne(category);
      res.json({ _id: result.insertedId, name: category.name });
    });

    // Delete - Delete a Category
    app.delete("/categories/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await categoryCollection.deleteOne(query);
      res.json({ _id: id, deletedCount: result.deletedCount });
    });

    /* ========================= Category Collection END ======================= */

    /* ========================= User Collection START ======================= */

    // GET - All users
    app.get("/users", async (req, res) => {
      const cursor = userCollection.find({});
      const users = await cursor.toArray();
      res.json(users);
    });

    // POST - Save user info to user collection
    app.post("/users", async (req, res) => {
      const newUser = req.body;
      const result = await userCollection.insertOne(newUser);
      res.json(result);
    });

    // PUT - Update user data to database for third party login system
    app.put("/users", async (req, res) => {
      const userData = req.body;
      const filter = { email: userData.email };
      const options = { upsert: true };
      const updateDoc = { $set: userData };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      res.json(result);
    });

    // Delete - Delete an user from DB
    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.json({ _id: id, deletedCount: result.deletedCount });
    });

    // GET - Admin Status.
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await userCollection.findOne(query);
      let isAdmin = false;
      if (result?.role === "admin") {
        isAdmin = true;
        res.json({ admin: isAdmin });
      } else {
        res.json({ admin: isAdmin });
      }
    });

    // PUT - Set an user role as admin
    app.put("/make-admin/:id", async (req, res) => {
      const filter = req.params.id;
      const updateDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await userCollection.updateOne(
        { email: filter },
        updateDoc
      );
      res.json(result);
      console.log(result);
    });

    app.get("/admins", async (req, res) => {
      const cursor = userCollection.find({});
      const users = await cursor.toArray();
      res.json(users);
    });

    /* ========================= User Collection END ======================= */

    /* ========================= Product Collection START ======================= */

    // GET - Get all product of a specific category
    app.get("/products", async (req, res) => {
      const category = req.params.id;
      const query = { category: category };
      const cursor = productCollection.find(query);
      if ((await cursor.count()) > 0) {
        const products = await cursor.toArray();
        res.json(products);
      } else {
        res.json({ message: "Product Not Found!" });
      }
    });

    // POST - Add a product by - Admin
    app.post("/products", async (req, res) => {
      // Extract image data and convert it to binary base 64
      const pic = req.files.image;
      const picData = pic.data;
      const encodedPic = picData.toString("base64");
      const imageBuffer = Buffer.from(encodedPic, "base64");
      // Extract other information and make our product object including image for saveing into MongoDB
      const { category, name, description, price } = req.body;
      const product = {
        category,
        name,
        description: description.split("\n"),
        image: imageBuffer,
      };
      const result = await productCollection.insertOne(product);
      res.json(result);
    });

    // Delete - Delete a product by user
    app.delete("/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productCollection.deleteOne(query);
      res.json({ _id: id, deletedCount: result.deletedCount });
    });

    /* ========================= Product Collection END ======================= */

    /* ========================= Banner Collection START ======================= */

    // GET - Get all banners
    app.get("/banners", async (req, res) => {
      const cursor = bannerCollection.find({});
      const products = await cursor.toArray();
      res.json(products);
    });

    // GET - Get all banners
    app.delete("/banners/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await bannerCollection.deleteOne(query);
      res.json({ _id: id, deletedCount: result.deletedCount });
    });

    // GET - Single Banner Detail
    app.get("/banners/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const banner = await bannerCollection.findOne(query);
      res.json(banner);
    });

    // POST - Add a banner by - Admin
    app.post("/banners", async (req, res) => {
      // Extract image data and convert it to binary base 64
      const pic = req.files.image;
      const picData = pic.data;
      const encodedPic = picData.toString("base64");
      const imageBuffer = Buffer.from(encodedPic, "base64");
      // Extract other information and make our product object including image for saveing into MongoDB
      const { title, description } = req.body;
      const banner = {
        title,
        description,
        image: imageBuffer,
      };
      const result = await bannerCollection.insertOne(banner);
      res.json(result);
    });

    // PUT - Update a banner
    app.put("/banners", async (req, res) => {
      // Extract image data and convert it to binary base 64
      const pic = req.files.image;
      const picData = pic.data;
      const encodedPic = picData.toString("base64");
      const imageBuffer = Buffer.from(encodedPic, "base64");

      // Extract other information and make our product object including image for saveing into MongoDB
      const { _id, title, description } = req.body;
      const banner = {
        title,
        description,
        image: imageBuffer,
      };
      console.log("_id", _id);
      console.log("banner", banner);

      const filter = { _id: ObjectId(_id) };
      const options = { upsert: false };
      const updateDoc = { $set: banner };
      const result = await bannerCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.json(result);
      // res.json({ message: "Test" });
      console.log(result);
    });

    /* ========================= Banner Collection END ======================= */

    /* ========================= Testimonial Collection START ======================= */
    // GET - Get Testimonials
    app.get("/testimonials", async (req, res) => {
      const cursor = testimonialCollection.find({});
      const testimonials = await cursor.toArray();
      res.json(testimonials);
    });

    // POST - User Review
    app.post("/add-review", async (req, res) => {
      const review = req.body;
      const result = await testimonialCollection.insertOne(review);
      res.send(result);
    });

    /* ========================= Testimonial Collection END ======================= */
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Simple Express Server is Running");
});

app.listen(port, () => {
  console.log("Server has started at port:", port);
});
