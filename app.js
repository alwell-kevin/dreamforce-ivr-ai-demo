require('dotenv').config()
var express = require('express');
var bodyParser = require('body-parser');

var Nexmo = require('nexmo');
var nexmo = new Nexmo({
    apiKey: process.env.API_KEY,
    apiSecret: process.env.API_SECRET,
    applicationId: process.env.APPLICATION_ID,
    privateKey: process.env.PRIVATE_KEY_PATH,
}, {
    debug: true
});

const port = process.env.PORT || 3000;
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

app.get("/answer", (req, res) => {
    //dial out to dialogflow
    dialogflowEnabled = true
    fails = []
    res.send([{
            "action": "talk",
            "text": "Hello, please wait while we connect you"
        },
        {
            "action": "connect",
            "timeout": "1",
            "from": req.query.from,
            "endpoint": [{
                "type": "phone",
                "number": process.env.DIALOGFLOW_NUMBER
            }]
        },
        {
            "action": "conversation",
            "name": process.env.CONFERENCE_NAME,
            "endOnExit": "true"
        }
    ])
})

app.post("/event", (req, res) => {
    console.log("In event endpoint: ", req.body);
    res.sendStatus(200)
})

app.all("/google", (req, res) => {
    console.log("In Google endpoint: ", req.body);

    res.sendStatus(200)
})

// Start server
app.listen(port, () => {
    console.log('Express server started on port ' + port);
})