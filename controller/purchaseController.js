// include mysql packages & external file:
const conn = require('../mysql');
const waterfall = require('async-waterfall');


// function for sign up new user:
const signUp = async (req , callback) => {

		// insert the records:

		var createUser = await new Promise((resolve, reject) =>{
			let sql = "INSERT INTO `user` (`name`, `email`, `mobile`) VALUES ('"+req.name+"', '"+req.email+"', '"+req.mobile+"')";

			conn.query(sql , (err , res) =>{
				if (err) { 
						callback(err, null);
					};
				resolve(res);
			});
		});

		callback(null , "New user created");
}

const uploadProducts = async (productDetails , callback) => {

	var productList = [];

	var uploadProduct = await new Promise((resolve, reject) =>{
		 productDetails.forEach(async (item , index) => {

		 		let checkProduct = await new Promise((resolve , reject) => {
		 			sql = "SELECT name from product where name = '"+item.Name+"' limit 1";
		 			
		 			conn.query(sql , (err, response) =>{
		 				if (err) { throw err };
		 				resolve(Object.values(JSON.parse(JSON.stringify(response))));
		 			})
		 		});

		 		// create or update product based on result:
		 		if (checkProduct == "") {
		 			let createProduct = await new Promise((resolve , reject) => {
			 			sqlCreate = "INSERT INTO `product` (`product_id`, `name`, `price`, `created_at`, `updated_at`) VALUES ("+item.Product_ID+", '"+item.Name+"', "+item.Price+", now(), now())";
			 			
			 			conn.query(sqlCreate , (err, responseCreate) =>{
			 				if (err) { throw err };
			 				productList.push(item);
			 				resolve(productList);
			 			})
			 		});
		 		}else{
		 			let updateProduct = await new Promise((resolve , reject) => {
			 			sqlUpdate = "UPDATE `product` SET `name` = '"+item.Name+"' , updated_at = now() WHERE `name` = '"+checkProduct[0]['name']+"'";
			 			
			 			conn.query(sqlUpdate , (err, responseUpdate) =>{
			 				if (err) { throw err };

			 				productList.push(item);
			 				resolve(productList);
			 			})
			 		});
		 		}
			})
		 	callback(null , productDetails)
		});		
}

const createOrder = async (orderList , callback) => {

	var insertData = await new Promise((resolve , reject) => {
		const sql = "INSERT INTO `purchase_product` (`customer`, `productList`) VALUES ( '"+orderList.customer_name+"', '"+orderList.products+"');"
		conn.query(sql , (err , response) => {
			if (err) {
				callback(err, null);
			}
			callback(null , "Order created successfully");
		})
	});

}

const updateOrder = async (orderList , callback) => {
	// check customer exists:

	var checkCustomer = await new Promise((resolve, reject) => {
		const sql = "SELECT customer from purchase_product where customer ='"+orderList.customer_name+"'";
		conn.query(sql , (err , response) => {
			if (err) {
				callback(err, null);
			}
			resolve(response);
		})
	});

	if (checkCustomer == "") {
		callback("No Order created for this customer : "+orderList.customer_name , null);
	}else{
		var updateOrder = await new Promise((resolve, reject) => {
			const sql1 = "UPDATE `purchase_product` SET `productList` = '"+orderList.products+"' WHERE `customer` = '"+orderList.customer_name+"'";
			conn.query(sql1 , (err , response) => {
				if (err) {
					callback(err, null);
				}
				callback(null , "Product updated..!");
			})
		});
	}

}


module.exports = {
	signUp,
	uploadProducts,
	createOrder,
	updateOrder
}