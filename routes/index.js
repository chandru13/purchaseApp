var express = require('express');
var router = express.Router();

// Include packages:
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const reader = require('xlsx');

// Include external File:
const appController = require('../controller/purchaseController.js');
const getToken = require('../generateAccessToken');
const conn = require('../mysql');

const dotenv = require('dotenv').config();


// list of middleware function start here:

// Middleware for check token
const checkToken = (req, res, next) => {
  // validation check:
  if (typeof(req.headers.authorization) == 'undefined' || req.headers.authorization == "") {
    res.send({"Error" : "Authorization required"}) ; 
  }else{
      const token = req.headers.authorization.split(" ")[1];

      jwt.verify(token, process.env.TOKEN_SECRET, (err , user) => {
          if (err){
             res.send(err);
          }else{
             next();
          }
     })
  }
}


// Middleware for validate request object:
const validateRequest = (req,res,next) => {

    // create schema object
    const schema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        mobile: Joi.number().min(7).required()
    });

    const options = {
        abortEarly: false, // include all errors
        allowUnknown: true, // ignore unknown props
        stripUnknown: true // remove unknown props
    };

    const { error, value } = schema.validate(req.headers, options);
    
    if (error) {
        res.send(`Validation error: ${error.details.map(x => x.message).join(', ')}`);
    } else {
        req.headers = value;
        next();
    }
}


// middleware for validate email to generate token.
const validateEmail = async (req , res, next ) => {
    const email = req.headers.email;

    if (typeof(email) == 'undefined' && Object.keys(email).length == 0) {
      res.send("Error : User Email Missing");
    }

    // check email exists in DB or Not:

    let sql = "SELECT email from user where email ='"+email+"'";

    var result = await new Promise((resolve, reject)=>{
        conn.query(sql ,(err , response) => {
        if (err) { 
          reject(err);
        }
        resolve(response);
      });
    });
    
    if (result == "") {
      res.send("Error : User does not exist. Please create user.");
    }else{
      next();
    }
}


// Middleware function end here:

/* GET home page. */
router.get('/', checkToken , function(req, res, next) {
  res.render('index', { title: 'Purchase based APIs ' });
});


// API for Register new user:
router.get('/signup', validateRequest , (req, res) => {

  const reqParam = req.headers;

  var data = appController.signUp(reqParam, (err , response) => {
    if (err) { throw err  }
    res.send(response);
  });
});


// API for get access token:
router.get('/getAccessToken' , validateEmail ,  (req, res) => {

  const email = req.headers.email;
  const token = getToken.generateAccessToken(email);

  res.send(token);
});


// Upload the product from ods file:
router.get('/uploadProduct' , checkToken ,(req , res) =>{

  // get the products from external file
  const file = reader.readFile('./productInfo.ods')
  
  let data = []
    
  const sheets = file.SheetNames
    
  for(let i = 0; i < sheets.length; i++)
  {
     const temp = reader.utils.sheet_to_json(
          file.Sheets[file.SheetNames[i]])
     temp.forEach((res) => {
        data.push(res)
     })
  }

  var result = appController.uploadProducts(data, (err , response) => {
    if (err) { throw err  }
    res.send(response);
  });

});


// create order API
router.post('/createOrder', checkToken , (req, res) => {

   if (Object.keys(req.body.products).length == 0 && Object.keys(req.body.customer_name).length == 0) {
      res.send("Required field missing...!");
    }
    
    const reqParam = req.body;

    var result = appController.createOrder(reqParam, (err , response) => {
        if (err) { throw err  }
        res.send(response);
      });
});


//update order api
router.put('/updateOrder', checkToken , (req, res) => {

   if (Object.keys(req.body.products).length == 0 && Object.keys(req.body.customer_name).length == 0) {
      res.send("Required field missing...!");
    }
    
    const reqParam = req.body;

    var result = appController.updateOrder(reqParam, (err , response) => {
        if (err) { throw err  }
        res.send(response);
      });
});


// cancel order:
router.delete('/cancelOrder', checkToken , async (req, res) => {

   if (Object.keys(req.body.customer_name).length == 0) {
      res.send("Required field missing...!");
    }
    
    const reqParam = req.body;

    var checkCustomer = await new Promise((resolve, reject) => {
        const sql = "SELECT customer from purchase_product where customer ='"+reqParam.customer_name+"' and status = '1'";
        conn.query(sql , (err , response) => {
          if (err) { throw err }
          resolve(response);
        })
     });

    if (checkCustomer == "") {
        res.send("No Order created for this customer : "+reqParam.customer_name)
      }else{
        var updateOrder = await new Promise((resolve, reject) => {
          const sql2 = "UPDATE `purchase_product` SET `status` = '0' WHERE `customer` = '"+reqParam.customer_name+"'";
          conn.query(sql2 , (err , response) => {
            if (err) { throw err }
            res.send("Product cancelled..!");
          })
        });
      }
});


// API to list ordered products based on the customer
router.get('/listOrderByCustomer', checkToken , async (req, res) => {

    var checkCustomer = await new Promise((resolve, reject) => {
        const sql = "SELECT customer, productList FROM `purchase_product` where status = '1' GROUP by customer";
        conn.query(sql , (err , response) => {
          if (err) { throw err }
          resolve(response);
        })
     });
      
    if (checkCustomer == "") {
      res.send("No order created..!");
    }else{
      res.send(checkCustomer);
    }
});  

module.exports = router;
