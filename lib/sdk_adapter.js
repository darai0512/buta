const conf = require('../conf');
const tool = conf.required.TOOL;
let setup = (token) => {}; // eslint-disable-line no-unused-vars
let post = (obj) => undefined; // eslint-disable-line no-unused-vars
let message = 'message';
let sdk;
let stream;
switch (tool) {
  case 'SLACK':
  case 'slack':
    sdk = require('@slack/client');
    message = sdk.RTM_EVENTS.MESSAG;
    setup = (token) => {
      stream = new sdk.RtmClient(token);
      stream.start();
      return stream;
    };
    post = (obj) => stream.sendMessage(obj.message, obj.channel);
    break;
}

module.exports = {
  setup,
  post,
  eventName: {
    message,
  },
};