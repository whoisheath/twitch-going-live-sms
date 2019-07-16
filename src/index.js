require("dotenv").config();
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken);
const axios = require("axios");

axios.defaults.headers.common["Client-ID"] = process.env.TWITCH_CLIENTID;

// Notify that service is starting
client.messages.create({
    body: "Twitch Live SMS Notifier is now running!",
    from: process.env.TWILIO_FROM_NUMBER,
    to: process.env.MY_PHONE_NUMBER
});

const streamers = [{user_name: "el_smithereens", live: false}, {user_name: "kitboga", live: false}];

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};

// from: https://codeburst.io/javascript-async-await-with-foreach-b6ba62bbf404
// this allows us to use async/await in a forEach. Well basically it's just making our own forEach. 
async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    };
};

setInterval(asyncForEach(streamers, async (streamer) => {
    // get streamer data
    axios.get(`https://api.twitch.tv/helix/streams?user_login=${streamer.user_name}`)
    .then(res => {
        if (res.data.data[0] == undefined) {
            // when the streamer is offline or hosting, the Twitch API returns undefined, so we set streamer status to not live
            streamer.live = false;
        } else if(streamer.live !== true) {
            //* Twilio send message
            client.messages.create({
                body: `${res.data.data[0].user_name} is live now!`,
                from: process.env.TWILIO_FROM_NUMBER,
                to: process.env.MY_PHONE_NUMBER
            });
            // set live status to true
            streamer.live = true;
            }
        })
    .catch(err => console.error(err));
    // sleep for safety
    await sleep(5000);
}), 1000*streamers.length*11);
