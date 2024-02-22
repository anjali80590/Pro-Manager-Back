require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');
const taskRoutes=require('./routes/taskRoutes')
const cors = require('cors'); 

const app = express();


app.use(cors());


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.json({message: 'server started'})
});


app.use('/user', userRoutes);
app.use('/tasks', taskRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log(`Server running at http://localhost:${PORT}`))
    .catch(err => console.error('Could not connect to MongoDB.', err));
});
