//Me update to using ES6 Module Syntax here for nanoid error.
import { nanoid } from 'nanoid';
import validUrl from 'valid-url';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

dotenv.config();
const app = express();

//Using CommonJS module syntax here
// const { nanoid } = require('nanoid');
// require('dotenv').config();
// const express = require('express');
// const mongoose = require('mongoose')
// const cors = require('cors');

// Basic Configuration for env variables
const port = process.env.PORT || 3000;
const uri = process.env.MONGO_URI;

app.use(cors());

//This is the middleware for: HINT: Do not forget to use a body parsing middleware to handle the POST requests.
app.use(express.urlencoded({ extended: true }));
// for URL encoded payloads
app.use(express.json());
// for JSON payloads

//serve static css to html
app.use('/public', express.static(`${process.cwd()}/public`));

//setting up MongoDB Mongoose Connection and build url schema and model
mongoose
  .connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Me can be connected to MongoDB Database'))
  .catch((error) => console.error('Error: not connected to MONGODB', error));

// After connection to MONGODB database make a Mongoose Schema for the url shortner microservice to be used in the database.
const Schema = mongoose.Schema;
const urlSchema = new Schema({
  original_url: String,
  short_url: String,
});
const urlModel = mongoose.model('urlModel', urlSchema);


app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.status(400).json({ greeting: 'hello API' });
});



//Fcc Answer: post request route for: URL validation, finding database entry if one, if not add save new entry to database and also can catch error if server error and unable to save. 
app.post('/api/shorturl', async (req, res) => {
  const inputURL = req.body.url.trim();
  const shortUrlId = nanoid();
  console.log('input url line 1', inputURL);

  // URL Validation using URL constructor: can also use npm install valid-url but did not work using variable with URL constructor and checking .protocol for url works.  
  try {
    const url = new URL(inputURL);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('Invalid protocol');
    }
  } catch (err) {
    console.log('Invalid URL detected');
    return res.json({ error: 'invalid url' });
  }

  //checking if input URL is in database if it is send response with model information for short and long url back. 
  try {
    let findOne = await urlModel.findOne({
      original_url: inputURL,
    });
    if (findOne) {
      res.json({
        original_url: findOne.original_url,
        short_url: findOne.short_url,
      });
      //if input URL is not in database make new entry with mongoose model and then can be saving to database.
    } else {
      findOne = new urlModel({
        original_url: inputURL,
        short_url: shortUrlId,
      });
      await findOne.save();
      console.log('Valid URL saved to mongodb', findOne);
      res.json({
        original_url: findOne.original_url,
        short_url: findOne.short_url,
      });
    }
  } catch (err) {
    console.error('Error saving to mongoDB', err);
    return res.status(500).json({
      error: 'Internal Server Error 500',
    });
  }
});


//Fcc Answer: shorturl redirect get request route for longurl
app.get('/api/shorturl/:redirect', async (req, res) => {
  const shortUrl = req.params.redirect;

  let findOriginalUrl = await urlModel.findOne({
    short_url: shortUrl,
  });

  if (findOriginalUrl) {
    res.redirect(findOriginalUrl.original_url);
  } else {
    res.status(404).json({ error: 'No URL for shortUrl in DataBase' });
  }
});



app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
