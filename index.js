const {execFile} = require('child_process');
const {pr, issue} = require('issue-ctl');
const conf = require('./conf');
const sdk = require('./lib/sdk_adapter');

// check
const undefinedEnvs = [];
for (const envKey of Object.keys(conf.required)) {
  if (!conf.required[envKey]) {
    undefinedEnvs.push(envKey);
  }
}
if (undefinedEnvs.length !== 0) {
  throw new Error(`Please set environmental variables of ${undefinedEnvs.join(',')}`);
}
let githubFlag = false;
if (conf.optional.GITHUB_HOSTNAME && conf.optional.GITHUB_REPOSITORY && conf.optional.GITHUB_AUTH) {
  githubFlag = true;
}

// global
const stream = sdk.setup(conf.required.TOKEN);
const replyRe = new RegExp(`^@${conf.required.APPID}\\s+`);
const options = {
  encoding: 'utf8',
  timeout: parseInt(conf.optional.TIMEOUT_SECOND, 10) * 1000,
  env: process.env,
};
const queue = {};
const fail = (err) => console.error(err) || {};

stream.on(sdk.eventName.message, (data) => {
  if (data.user === conf.required.APPID || !replyRe.test(data.message)) {
    return;
  }
  const res = {
    message: `@${data.user} 受理しました。`,
    reply: data._id,
  };
  if (queue[data.user]) {
    res.message = `@${data.user} 下記を処理中です。\n${queue[data.user]}`;
    return sdk.post(res);
  }
  const msg = data.message.replace(replyRe, '');
  // prevent from os command injection
  execFile(`bin/${conf.required.MAIN_SCRIPT_NAME}`, [data.user, data.date, msg], options, async (err, stdout, stderr) => {
    if (err) {
      delete queue[data.user];
      res.message = `@${data.user} 処理が失敗しました\nerr=${err}\nstdout=${stdout}\nstderr=${stderr}`;
      return sdk.post(res);
    }
    let posts;
    try {
      posts = JSON.parse(stdout.trim());
    } catch (_err) {
      delete queue[data.user];
      res.message = stdout;
      return sdk.post(res);
    }
    // (optional) Template processes
    let addMsg = '';
    if (githubFlag && posts.github_issue && typeof posts.github_issue === 'object') {
      const result = await issue.post(conf.optional.GITHUB_HOSTNAME, conf.optional.GITHUB_REPOSITORY, conf.optional.GITHUB_AUTH, posts.github_issue)
        .catch(fail);
      addMsg += '\n' + result.html_url;
    }
    if (githubFlag && posts.github_pr && typeof posts.github_pr === 'object') {
      const result = await pr.post(conf.optional.GITHUB_HOSTNAME, conf.optional.GITHUB_REPOSITORY, conf.optional.GITHUB_AUTH, posts.github_pr)
        .catch(fail);
      addMsg += '\n' + result.html_url;
    }
    delete queue[data.user];
    res.message = posts.message + addMsg;
    return sdk.post(res);
  });
  sdk.post(res);
  queue[data.user] = msg.split('\n').map((line) => `> ${line}`).join('\n');
});

// 生存報告
if (conf.optional.HELLO_HOUR) {
  const hello = () => {
    sdk.post({message: '生きてます'});
    const now = new Date();
    setTimeout(hello, (new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, conf.optional.HELLO_HOUR)).getTime() - Date.now());
  };
  hello();
}