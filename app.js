//import express from 'express';
//import db from './db/db';

const express = require("express")
const db = require("./db/db")
// Set up the express app
const app = express();
// get all todos
app.get('/api/v1/todos', (req, res) => {
  res.status(200).send({
    success: 'true',
    message: 'todos retrieved successfully',
    todos: db
  })
});
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`)
});