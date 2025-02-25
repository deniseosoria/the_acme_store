require("dotenv").config();

// Import the pg module to interact with PostgreSQL
const pg = require("pg");
const uuid = require("uuid");
const bcrypt = require("bcrypt");
const SALT_ROUNDS = 10;

// Get the database connection URL from environment variables
const DATABASE_URL = process.env.DATABASE_URL;

// Create a new PostgreSQL client using the connection string
const client = new pg.Client({
  connectionString: DATABASE_URL,
});

// createTables: A method that drops and creates the tables for your application.
// createProduct: A method that creates a product in the database and then returns the created record.
// createUser: A method that creates a user in the database and then returns the created record. The password of the user should be hashed by using Bcrypt.
// fetchUsers: A method that returns an array of users in the database.
// fetchProducts: A method that returns an array of products in the database.
// createFavorite: A method that creates a favorite in the database and then returns the created record,
// fetchFavorites: A method that returns an array of favorites for a user,
// destroyFavorite: A method that deletes a favorite in the database.

const createTables = async () => {
  const SQL = `
    DROP TABLE IF EXISTS favorites;
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS products;

    CREATE TABLE users(
    id UUID PRIMARY KEY,
    username VARCHAR(350) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
    );

    CREATE TABLE products(
    id UUID PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
    );

    CREATE TABLE favorites(
    id UUID PRIMARY KEY,
    product_id UUID REFERENCES products(id) NOT NULL,
    user_id UUID REFERENCES users(id) NOT NULL,
    CONSTRAINT unique_user_id_and_product_id UNIQUE (user_id, product_id)
    );
    `;

  // Execute the SQL commands to set up the database
  await client.query(SQL);
};

// Create a product
const createProduct = async (name) => {
    const SQL = `
      INSERT INTO products (id, name) VALUES ($1, $2) RETURNING *;
    `;
    const result = await client.query(SQL, [uuid.v4(), name]);
    return result.rows[0];
  };

  async function createUser({ username, password }) {
    if (!password) {
      throw new Error("Password is required to create a user");
    }
  
    console.log("Password before hashing:", password); // Debugging line
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    
    const result = await client.query(
      `INSERT INTO users (id, username, password) VALUES ($1, $2, $3) RETURNING *`,
      [uuid.v4(), username, hashedPassword]
    );
  
    return result.rows[0]; // Ensure this returns the user with `id`
  }

const createFavorite = async ({ user_id, product_id }) => {
  const SQL = `
    INSERT INTO favorites(id, user_id, product_id) 
    VALUES($1, $2, $3) RETURNING *;
  `;

  const response = await client.query(SQL, [uuid.v4(), user_id, product_id]);
  return response.rows[0];
};;

const fetchUsers = async()=> {
  const SQL = `
    SELECT id, username 
    FROM users
  `;
  const response = await client.query(SQL);
  return response.rows;
};

const fetchProducts = async () => {
  const SQL = `
    SELECT *
    FROM products
  `;
  const response = await client.query(SQL);
  return response.rows;
};


const fetchFavorites = async (user_id) => {
  const SQL = `
    SELECT *
    FROM favorites
    WHERE user_id = $1
  `;
  const response = await client.query(SQL, [ user_id ]);
  return response.rows;
};

const destroyFavorite = async ({user_id, id}) => {
  const SQL = `
    DELETE
    FROM favorites
    WHERE user_id = $1 AND id = $2
  `;
  await client.query(SQL, [ user_id, id ]);
};



module.exports = {
  client,
  createTables,
  createProduct,
  createUser,
  fetchUsers,
  fetchProducts,
  createFavorite,
  fetchFavorites,
  destroyFavorite,
};
