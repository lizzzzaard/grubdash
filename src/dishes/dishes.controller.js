const path = require("path");
// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));
// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

//list
function list(req, res) {
    res.json( { data: dishes })
}

//create
//validation for create
function bodyDataHas(propertyName) {
    return function (req, res, next) {
        const { data = {} } = req.body;
        if(data[propertyName]) {
            return next();
        }
        next({
            status: 400,
            message: `Dish must include a ${propertyName}`
        })
    }
}

function create(req, res) {
    const { data: { name, description, price, image_url } = {} } = req.body;
    const newDish = {
        id: nextId(),
        name, 
        description,
        price, 
        image_url,
    };
    dishes.push(newDish);
    res.status(201).json({ data: newDish });
}

//validation for price
function priceIsValidNumber(req, res, next) {
    const { data: { price } = {} } = req.body;
    if (price <= 0 || !Number.isInteger(price)) {
        return next({
            status: 400,
            message: `Dish must have a price that is an integer greater than 0`
        })
    }
    next();
}

//validation for id
function bodyHasId(req, res, next) {
    const { dishId } = req.params;
    const { data: { id } = {} } = req.body;
    if(id) {
        if(id === dishId) {
            return next();
        }
        next({
            status: 400,
            message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`
        });
    }
    return next();
}

//read
//make a function to make sure the dish id exists
function dishExists(req, res, next) {
    const { dishId } = req.params;
    const foundDish = dishes.find((dish) => dish.id === dishId);
    if(foundDish) {
        res.locals.dish = foundDish;
        return next();
    }
    next({
        status: 404, 
        message: `Dish id not found: ${dishId}`
    });
}

function read (req, res) {
    res.json({ data: res.locals.dish})
}

//update
function update(req, res) {
    const dish = res.locals.dish;
    const { data: { name, description, price, image_url } = {} } = req.body;

    dish.name = name;
    dish.description = description;
    dish.price = price;
    dish.image_url = image_url;

    res.json({ data: dish });
}

module.exports = {
    create: [
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        priceIsValidNumber,
        create
    ],
    list,
    read: [dishExists, read],
    dishExists,
    update: [
        dishExists,
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        priceIsValidNumber,
        bodyHasId,
        update
    ],
}