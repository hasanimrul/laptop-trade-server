const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000


// middlewares
app.use(cors())
app.use(express.json())

// database connection
const uri = process.env.DB_URI;
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1
});

async function run() {
    try {
        const categoriesCollection = client.db('laptopTrade-db').collection('categories')
        const productsCollection = client.db('laptopTrade-db').collection('allProducts')

        // get all categories
        app.get('/categories', async (req, res) => {
            const query = {}
            const cursor = categoriesCollection.find(query)
            const categories = await cursor.toArray()
            res.send(categories)
        })

        // post a products
        app.post('/products', async (req, res) => {
            const product = req.body
            console.log(product)
            const result = await productsCollection.insertOne(product)
            res.send(result)
        })

        // get product category wise
        app.get('/all-products/:categoryName', async (req, res) => {
            const categoryName = req.params.categoryName
            const query = { category: categoryName }
            const cursor = productsCollection.find(query)
            const products = await cursor.toArray()
            res.send(products)
        })

    }
    finally {

    }
}
run().catch(err => console.error(err))

app.get('/', (req, res) => {
    res.send('Laptop Trade server is running.......')
})
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})