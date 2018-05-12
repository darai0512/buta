module.exports = {
  required: {
    TOOL: process.env.TOOL,
    APPID: process.env.APPID,
    TOKEN: process.env.TOKEN,
    MAIN_SCRIPT_NAME: process.env.MAIN_SCRIPT_NAME,
  },
  optional: {
    TIMEOUT_SECOND: 300,
    HELLO_HOUR: 10,
    GITHUB_HOSTNAME: process.env.GITHUB_HOSTNAME,
    GITHUB_REPOSITORY: process.env.GITHUB_REPOSITORY,
    GITHUB_AUTH: process.env.GITHUB_AUTH,
  },
};