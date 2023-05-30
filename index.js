const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const stripe = require('stripe')(process.env.STRIPE_KEY)
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
        const usersCollection = client.db('laptopTrade-db').collection('users')
        const bookingsCollection = client.db('laptopTrade-db').collection('bookings')
        const paymentsCollection = client.db('laptopTrade-db').collection('payments')



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
        
         // get all products
        app.get('/all-products', async (req, res) => {
            const query = {}
            const cursor = productsCollection.find(query)
            const products = await cursor.toArray()
            res.send(products)
        })

        // get product category wise
        app.get('/category/:id', async (req, res) => {
            const id = req.params.id
            const query = { categoryId: id }
            const cursor = productsCollection.find(query)
            const products = await cursor.toArray()
            res.send(products)
        })

        // get filtered products for seller
        app.get('/products/:email', async (req, res) => {
            const email = req.params.email

            const query = {
                sellerEmail: email
            }
            const cursor = productsCollection.find(query)
            const products = await cursor.toArray()
            res.send(products)
        })

        // delete a product
        app.delete('/product/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await productsCollection.deleteOne(query)
            res.send(result)
        })

        // post user
        app.post('/users', async (req, res) => {
            const user = req.body
            const result = await usersCollection.insertOne(user)
            res.send(result)
        })

        // get all user
        app.get('/users/:role', async (req, res) => {
            const role = req.params.role
            const query = { role: role }
            const cursor = usersCollection.find(query)
            const users = await cursor.toArray()
            res.send(users)
        })

        // get single user
        app.get('/user/:email', async (req, res) => {
            const email = req.params.email
            const query = { email: email }
            const user = await usersCollection.findOne(query)
            res.send(user)
        })

        // delete a user
        app.delete('/user/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await usersCollection.deleteOne(query)
            res.send(result)
        })

        // store booked products
        app.post('/booking', async (req, res) => {
            const booking = req.body
            const result = await bookingsCollection.insertOne(booking)
            res.send(result)
        })

        // get booked products by email
        app.get('/bookings/:email', async (req, res) => {
            const email = req.params.email
            const query = { email: email }
            const cursor = bookingsCollection.find(query)
            const bookings = await cursor.toArray()
            res.send(bookings)
        })



        // get a single booking
        app.get('/booking/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const booking = await bookingsCollection.findOne(query)
            res.send(booking)
        })

        // create payment intent

        app.post('/create-payment-intent', async (req, res) => {
            const booking = req.body;
            const price = booking.resalePrice;
            const amount = parseInt(price * 100);

            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card"
                ]
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });



        // store payment
        app.post('/payments', async (req, res) => {
            const payment = req.body
            const result = await paymentsCollection.insertOne(payment)
            const bookingId = payment.bookingId
            const bookingFilter = { _id: ObjectId(bookingId) }
            const bookingUpdatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const productId = payment.productId
            const productFilter = { _id: ObjectId(productId) }
            const productUpdatedDoc = {
                $set: {
                    paid: true
                }
            }
            const updateBooking = await bookingsCollection.updateOne(bookingFilter, bookingUpdatedDoc)
            const updateProduct = await productsCollection.updateOne(productFilter, productUpdatedDoc)
            res.send(result)
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
