const {
  client,
  createTables,
  createUser,
  createProduct,
  createFavorite,
  fetchUsers,
  fetchProducts,
  fetchFavorites,
  destroyFavorite,
} = require("./db");

const express = require("express");
const app = express();

app.use(express.json());

// For deployment only
const path = require("path");
app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "../client/dist/index.html"))
);
app.use(
  "/assets",
  express.static(path.join(__dirname, "../client/dist/assets"))
);

// API Routes
app.get("/api/users", async (req, res, next) => {
  try {
    res.send(await fetchUsers());
  } catch (ex) {
    next(ex);
  }
});

app.get("/api/products", async (req, res, next) => {
  try {
    res.send(await fetchProducts());
  } catch (ex) {
    next(ex);
  }
});

app.get("/api/users/:id/favorites", async (req, res, next) => {
  try {
    res.send(await fetchFavorites(req.params.id));
  } catch (ex) {
    next(ex);
  }
});

app.post("/api/users/:id/favorites", async (req, res, next) => {
  try {
    const favorite = await createFavorite({
      user_id: req.params.id,
      product_id: req.body.product_id,
    });
    res.status(201).send(favorite);
  } catch (ex) {
    next(ex);
  }
});

app.delete("/api/users/:user_id/favorites/:id", async (req, res, next) => {
  try {
    await destroyFavorite({
      user_id: req.params.user_id,
      id: req.params.id,
    });
    res.sendStatus(204);
  } catch (ex) {
    next(ex);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).send({ error: err.message || err });
});

const init = async () => {
  try {
    const port = process.env.PORT || 3001;
    console.log("Connecting to database...");
    await client.connect();
    console.log("Connected to database");

    await createTables();
    console.log("Tables created");

    // Create sample users and products for testing
    const users = await Promise.all([
        createUser({ username: "moe", password: "m_pw" }),
        createUser({ username: "lucy", password: "l_pw" }),
        createUser({ username: "ethyl", password: "e_pw" }),
        createUser({ username: "curly", password: "c_pw" }),
      ]);

    const products = await Promise.all([
      createProduct({ name: "foo" }),
      createProduct({ name: "bar" }),
      createProduct({ name: "bazz" }),
      createProduct({ name: "quq" }),
      createProduct({ name: "fip" }),
    ]);

    const [moe, lucy, ethyl, curly] = users;
    const [foo, bar, bazz, quq, fip] = products;

    console.log("Users: ", await fetchUsers());
    console.log("Products: ", await fetchProducts());

    const favorites = await Promise.all([
      createFavorite({ user_id: moe.id, product_id: bar.id }),
      createFavorite({ user_id: moe.id, product_id: foo.id }),
      createFavorite({ user_id: ethyl.id, product_id: quq.id }),
      createFavorite({ user_id: ethyl.id, product_id: fip.id }),
    ]);

    console.log("Moe's Favorites: ", await fetchFavorites(moe.id));
    await destroyFavorite({ user_id: moe.id, id: favorites[0].id });
    console.log("Moe's Favorites: ", await fetchFavorites(moe.id));

    app.listen(port, () => console.log(`Server is running on port ${port}`));
  } catch (error) {
    console.error("Error initializing the app:", error);
  }
};

init();
