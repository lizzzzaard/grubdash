const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

//list
function list(req, res) {
    res.json({ data: orders});
}

//create
//validation for creating an order
function bodyDataHas(propertyName) {
    return function (req, res, next) {
        const { data = {} } = req.body;
        if(data[propertyName]) {
            return next();
        }
        next({
            status: 400,
            message: `Order must include a ${propertyName}`
        })
    }
}

//validation for dishes 
function dishesValidation(req, res, next) {
    const { data: { dishes } ={} }= req.body;
    //const dishesArray = Array.isArray(dishes)
    //console.log("This is the array of dishes method", dishesArray)
    //console.log("This is dishes", dishes)
    if(dishes.length === 0 || !Array.isArray(dishes) ){
        return next({
            status: 400,
            message: `Order must include at least one dish.`
        });
    }
    next();
}

//validation for quantity
function dishHasQuantity(req, res, next) {
    const { data: { dishes } = {} } = req.body;
    // in order to get an index within this type of for loop, use .entries() which gives an array of indexes and an array of new values
    for ( let [i, dish] of dishes.entries() ) {
        //console.log("This is a dish", dish)
        //console.log("This is the actual quantity", dish.quantity)
        if (!dish.quantity || dish.quantity <= 0 || !Number.isInteger(dish.quantity)) {
            return next({
                status: 400,
                message: `Dish ${i} must have a quantity that is an integer greater than 0`
            });
        }
    }
    next();
}

function create(req, res, next) {
    const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
    const newOrder = {
        id: nextId(),
        deliverTo,
        mobileNumber,
        dishes,
    }
    orders.push(newOrder);
    res.status(201).json({ data: newOrder })
}
//read
//make sure the order exists
function orderExists(req, res, next) {
    const { orderId } = req.params;
    const foundOrder = orders.find((order) => order.id === orderId);
    
    if(foundOrder) {
        res.locals.order = foundOrder;
        return next();
    }
    next({
        status: 404,
        message: `Order id not found: ${orderId}`
    });
}

function read(req, res) {
    res.json({ data: res.locals.order })
}

//update
//validation for id

function orderHasId(req, res, next) {
    const { orderId } = req.params;
    const { data: { id } = {} } = req.body;

    if(id){
        if(id === orderId) {
            return next();
        }
        next({
            status: 400,
            message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`
        });
    }
    return next();
}

//validation for status
function orderStatusValidation(req, res, next) {
    const { data: { status } = {} } = req.body;
    if(!status || status.length === 0 || status === 'invalid') {
        return next({
            status: 400,
            message: `Order must have a status of pending, preparing, out-for-delivery, delivered`
        });
    } 

    if(status === "delivered"){
        return next({
            status: 400,
            message: `A delivered order cannot be changed`
        });
    }

    next();
}

function update(req, res) {
    const order = res.locals.order;
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

    //console.log("This is dishes in my update", dishes)

    order.deliverTo = deliverTo;
    order.mobileNumber = mobileNumber;
    //should status be included here???
    order.status = status;
    order.dishes = dishes;

    res.json({ data: order })
}

//delete
function destroy(req, res, next) {
    const order = res.locals.order;
    const { orderId } = req.params;
    const index = orders.findIndex((order) => order.id === orderId)
    const deleteOrders = orders.splice(index, 1);
    if(index > -1 && order.status === 'pending'){
        deleteOrders
    } else {
        return next({
            status: 400,
            message: `An order cannot be deleted unless it is pending`
        })
    }
    res.sendStatus(204);
}

module.exports = {
    create: [
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("dishes"),
        dishesValidation,
        dishHasQuantity,
        create
    ],
    list,
    read: [orderExists, read],
    orderExists,
    update: [
        orderExists,
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("dishes"),
        dishesValidation,
        dishHasQuantity,
        orderHasId,
        orderStatusValidation,
        update
    ],
    delete: [orderExists, destroy]
}