# buta

**buta**は命令に忠実なbotです

# I can

- 自動返信
- 任意の言語の実行
- Github issue登録
- Github pull request
- (要望があれば)Github project登録

# How to Use

このリポジトリをfork

実行させたいスクリプトを`bin/`に配置(スクリプトの先頭にシェバング(ex,`#!/usr/bin/env node`)と0755の権限が必要)

## 3. Deploy & Exec!!!

Node.js(>= v8.0.0)と実行させたいスクリプト(main.pyと仮定)の言語がinstallされたサーバーへデプロイ

環境変数をセットして`npm start`、もしくは下記のような`.env`ファイルを作成

```sh
$cat .env
export TOOL=SLACK
export APPID=X-BUTA
export TOKEN=
export MAIN_SCRIPT_NAME=main.py
$source .env && npm start
```

`nohup`と`&`での実行 or `systemctl`などを推奨

# Spec
## トリガー

bot宛にmention付きでメッセージが送られた時(botが自分自身へmentionした場合を除く)

## 実行内容

1. 依頼者宛に「受理しました」というメッセージが届く
1. 登録したスクリプトが実行される
1. 上記標準出力をメッセージとして送る（標準出力の形式によってGitHubと連携可能）

## I/F

shで`bin/your_script '<依頼者のID>' '<YYYY/MM/DD HH:mm:ss>' '<メッセージ内容>'`が実行される

- より正確には`execve("/bin/your_script", ["<依頼者のID>", "<YYYY/MM/DD HH:mm:ss>", "<メッセージ内容>"]`
  - [メッセージによるOS command injectionは起こらない](https://blog.liftsecurity.io/2014/08/19/Avoid-Command-Injection-Node.js)
- メッセージ内容にはmention部分(`@bot`)と続くスペース・改行は含まない

上記shの実行結果によってレスポンスが変わる

- エラー（終了ステータスが0以外）の場合、**依頼者宛**に「処理が失敗しました」と詳細なエラーなどが送られる
- 終了ステータスが0の場合は、標準出力がJSONの場合は続くテンプレート処理の分岐に入り、そうでない場合は標準出力が返信される
  - 標準出力をtrimして`JSON.parse()`した結果の成否で決まる

下記の点に注意

- タイムアウトは300秒
- 処理中に同ユーザーから別の処理依頼をされた場合、処理中の依頼の引用付きで「処理中です」という旨の返信を行い、依頼を無視する
- 確実に処理を行うことは保証できない
  - WebSocketの接続が途切れる、Node.jsのキューが詰まるなどで処理がスルーされる、etc

## テンプレート処理

標準出力がJSONの場合、特定のキーを含んでいればテンプレート処理がなされる。
最終的な返信は、JSON内の`"message"`キーのバリューに、各テンプレート処理特有のレスポンスを付与して返す。

### GitHub

利用には実行時に下記環境変数が必要

```
export GITHUB_HOSTNAME=github.com
export GITHUB_REPOSITORY='your_org/your_repo'
export GITHUB_AUTH='personal token or username:passwd or oauth2token'
```

personal tokenやOAuth登録はhttps://github.com/darai0512/issue-ctl#setup などを参照

|アクション|必要なキー|バリューの形式|追加されるメッセージ|
|---|---|---|---|
|issueを投稿|`github_issue`|[Parameters,Example参照](https://developer.github.com/v3/issues/#create-an-issue)|issueのURL|
|PRを投稿|`github_pr`|[Parameters,Example参照](https://developer.github.com/v3/pulls/#create-a-pull-request)|PRのURL|
