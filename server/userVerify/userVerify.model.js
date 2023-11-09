const {Schema, model} = require('mongoose');


const userVerifySchema = Schema({
    name: {
        type: String,
        require: true,
        trim: true
    },
    imageUrl: {
        type: String,
        require: true
    },
    deviceSN: {
        type: String,
        require: true
    },
    googleToken: {
        type: String,
        require: true
    },
    status: {
        type: Boolean,
        default: true
    },

},
{
    timestamp: true
});


exports.UserDivice = model('Divice', userVerifySchema);
