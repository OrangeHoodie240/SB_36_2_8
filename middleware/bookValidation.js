const jsonschema = require('jsonschema');

const bookSchema = require('../json_schemas/bookSchema.json'); 
const ExpressError = require('../expressError');

function validateBook(req, res, next){
    try{    
        const results = jsonschema.validate(req.body, bookSchema); 
        if(!results.valid){
            const message = results.errors.map(err => err.stack); 
            throw new ExpressError(message, 400);
        }
        return next(); 
    }
    catch (err){
        return next(err); 
    }
}








module.exports = {validateBook}; 