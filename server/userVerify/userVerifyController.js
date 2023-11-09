const {UserDivice} = require('./userVerify.model')

exports.verifyUser = async(req, res, next) => {
    try {
        const { name, imageUrl, deviceSN, googleToken,  } = req.body;

        if(name && imageUrl && deviceSN && googleToken){

            const divices = new UserDivice({
                name, imageUrl, deviceSN, googleToken
            })
            await divices.save();
            return res.status(200).json({
               data: {
                    status: true,
                    messages: 'Success insert data',
                    divices
               }
            })

        }else{
            return res.status(403).json({
                status: false,
                messages: 'require field missing' 
            })
        }
        
    } catch (error) {
        return res.status(403).json({
            status: false,
            messages: 'Application error' + error
        })
    }
}