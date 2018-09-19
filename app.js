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
var conversation_uuid;

//*******NOTICE:********
//*******HANDLES SINGLE SESSION ONLY. */
//*******DUE TO FEATURE RESTRICTION ON DIALOGFLOW (NEED ENTERPRISE ACCOUNT ACCESS), NO SESSION_ID IS RETURNED WITH 'ACTION'. */
//*******EACH SESSION IS MAPPED TO A SINGLE NUMBER FOR DEMO PURPOSES. */


//********************INTENT LIST********************
//1. Connect me to support
//2. Connect me to sales
//3. what is my order status?
//4 "live agent" 
//Who is nexmo
//WHo is vonage
//WHo is kevin alwell
//what do you sell?

const port = process.env.PORT || 3000;
const app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

app.get("/answer", (req, res) => {
    //TODO: Dynamic Lookup of customer record req.query.from in SF.
    //req.query.from;
    conversation_uuid = req.query.uuid;
    var user = { order: "TV" };
    var shipping;
    if (user.order) {
        shipping = "Press 1 for the status of your most recent Television studio order, press 2 for customer support, or press 3 to speak with a sales agent."
    } else {
        shipping = "Press 1 to speak with a sales agent, press 2 for customer support."
    }
    //Dial out to Dialogflow
    res.send([{
            "action": "talk",
            "text": "Hello Kevin Alwell, thank you for contacting en vision. The worlds leading high end home theater retailer. How may I direct your call?.",
            "voiceName": "Brian",
            "bargeIn": true
        }, {
            "action": "talk",
            "text": shipping,
            "voiceName": "Brian",
            "bargeIn": true
        },
        {
            "action": "input",
            "eventUrl": [process.env.BASE_URL + "/ivrEvent"],
            "maxDigits": "1",
            'timeOut': "7"
        }
    ])
})


app.all("/ivrEvent", (req, res) => {
    console.log("IN IVR: ", req.body, typeof req.body, req.body["dtmf"]);
    var ncco;

    if (req.body["dtmf"]) {
        console.log("HAS DTMF: ", req.body["dtmf"], typeof req.body["dtmf"]);
        if (req.body["dtmf"] === "1") {
            console.log("TONE IS 1", req.body["dtmf"]);
            ncco = [{
                "action": "talk",
                "text": "Your home theater order is set to arrive on Monday, October first. You may hangup, or press 2 to speak with customer service.",
                "voiceName": "Brian"
            }, {
                "action": "input",
                "eventUrl": [process.env.BASE_URL + "/ivrEvent"],
                "maxDigits": "1",
                'timeOut': "7"
            }]

        } else if (req.body["dtmf"] === "2") {
            console.log("TONE IS 2", req.body["dtmf"])
            ncco = [{
                "action": "connect",
                "from": process.env.NEXMO_NUMBER,
                "endpoint": [{
                    "type": "sip", //sip
                    "uri": "5714254597@voip.tnltd.net" //process.env.SUPPORT_NUMBER"
                }]
            }]
        } else if (req.body["dtmf"] === "3") {
            console.log("TONE IS 3", req.body["dtmf"])
            ncco = [{
                "action": "connect",
                "from": process.env.NEXMO_NUMBER,
                "endpoint": [{
                    "type": "sip", //sip
                    "uri": "15714254595@voip.tnltd.net" //process.env.SALES_NUMBER //process.env.SALES_NUMBER
                }]
            }]
        }
    }

    console.log("RETURNING ", ncco)

    res.send(ncco)
})

app.post("/event", (req, res) => {
    console.log("In event endpoint: ", req.body);

    res.sendStatus(200)
})


//EXAMPLE ACTION:

//     In Google endpoint:  { responseId: 'f10bb322-d48e-418c-ad20-c41e2cc3cd4c',
//   queryResult: 
//    { queryText: 'I\'m not a customer yet',
//      action: 'contact-sales-agent',
//      parameters: {phone:"17326157295"},
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

// CALLED FROM DIALOG FLOW ACTION
app.all("/google", (req, res) => {
    console.log("************************************")
    console.log("GOOGLE REQ: ", req.body);
    console.log("************************************")

    //TODO:IDENTIFY DYNAMIC CONVERSATION
    //originalDetectIntentRequest: { source: 'GOOGLE_TELEPHONY', payload: { telephony: [Object] } }, <-- Need enterprise account to get this object. Otherwise, redacted.

    actions.escalate(req.body.queryResult.action, conversation_uuid);

    res.sendStatus(200)
})


// ACTIONS BELOW
app.all("/contact-sales-agent", (req, res) => {
    console.log("IN: contact-sales-agent")
    res.json({
        "action": "connect",
        "timeout": "1",
        "from": process.env.NEXMO_NUMBER,
        "endpoint": [{
            "type": "phone", //sip
            "number": "17326157295" //process.env.SALES_NUMBER
        }]
    })
})

app.all("/contact-customer-service", (req, res) => {
    console.log("IN: customer service contact")
    res.json({
        "action": "connect",
        "timeout": "1",
        "from": process.env.NEXMO_NUMBER,
        "endpoint": [{
            "type": "phone", //"sip",
            "number": "17326157295" //process.env.SUPPORT_NUMBER
        }]
    })
})

//FOR SMART IVR VERSION ONLY
// app.all("/order-status", (req, res) => {
//     console.log("IN: contact-sales-agent")
//     res.json({
//         "action": "connect",
//         "timeout": "1",
//         "from": process.env.NEXMO_NUMBER,
//         "endpoint": [{
//             "type": "sip",
//             "number": process.env.SUPPORT_NUMBER
//         }]
//     })
// })

// Start server
app.listen(port, () => {
    console.log('Express server started on port ' + port);
})