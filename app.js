require('dotenv').config()
var express = require('express');
var bodyParser = require('body-parser');
var actions = require('./action.js');
var Nexmo = require('nexmo');
var nexmo = new Nexmo({
    apiKey: process.env.API_KEY,
    apiSecret: process.env.API_SECRET,
    applicationId: process.env.APPLICATION_ID,
    privateKey: process.env.PRIVATE_KEY_PATH,
}, {
    debug: true
});


//*******NOTICE:********
//*******HANDLES SINGLE SESSION ONLY. */
//*******DUE TO FEATURE RESTRICTION ON DIALOGFLOW (NEED ENTERPRISE ACCOUNT ACCESS), NO SESSION_ID IS RETURNED WITH 'ACTION'. */
//*******EACH SESSION IS MAPPED TO A SINGLE NUMBER FOR DEMO PURPOSES. */

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
    
    //TODO: Dynamic Lookup of customer record req.query.from in SF.

    res.send([{
            "action": "talk",
            "text": "Hello, thank you for contacting en vision. The worlds leading high end home theater retailer."
        },
        {
            "action": "connect",
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
    console.log("In Google endpoint: ", req.body, req.body.originalDetectIntentRequest.payload.telephony);
    console.log("************************************")
    console.log("GOOGLE REQ: ", req);
    console.log("************************************")
    //TODO:IDENTIFY CONVERSATION

    //     In Google endpoint:  { responseId: 'f10bb322-d48e-418c-ad20-c41e2cc3cd4c',
    //   queryResult: 
    //    { queryText: 'I\'m not a customer yet',
    //      action: 'contact-sales-agent',
    //      parameters: {},
    //      allRequiredParamsPresent: true,
    //      fulfillmentText: 'Okay, I am going to connect you with a Sales agent. Please wait for a moment while I find someone who is available.',
    //      fulfillmentMessages: [ [Object] ],
    //      intent: 
    //       { name: 'projects/dreamforce-voice-bot-2018/agent/intents/7c62dc72-24f8-41b9-b772-f4c1ef750d37',
    //         displayName: 'contact-sales-agent' },
    //      intentDetectionConfidence: 0.8,
    //      languageCode: 'en-us' },
    //   originalDetectIntentRequest: { source: 'GOOGLE_TELEPHONY', payload: { telephony: [Object] } },
    //   session: 'projects/dreamforce-voice-bot-2018/agent/sessions/756t5aSJQzae-pGJowa2lg' }
    actions.escalate(req.body.queryResult.action);

    res.sendStatus(200)
})

// Start server
app.listen(port, () => {
    console.log('Express server started on port ' + port);
})