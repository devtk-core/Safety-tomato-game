# 安心トマトゲーム(Safety Tomato Game)
## 概要
スイカゲームのように上からキャラクターを落とし、トマトをたくさん作るゲームです。
![プレイ画面](./img/play.png)
## 対応端末
- Webブラウザ(PC,Android,iOS等)
## リンク
https://main.d2crxhyesq64vf.amplifyapp.com/

## みんなのランキング（Cloudflare Pages）

ランキングを有効にするには、Cloudflare Pages、D1、Turnstile の設定が必要です。設定が終わるまではサイトに「ランキングは準備中です」と表示されます。Amplify の静的ホスティングだけではランキング API は動きません。

1. Cloudflare Pages でこの GitHub リポジトリを接続します。Production branch は `main`、Build command は `sh build.sh`、Build output directory は `dist` にします。
2. D1 データベースを作成し、SQL を適用します。
   ```sh
   npx wrangler d1 create safety-tomato-ranking
   npx wrangler d1 execute safety-tomato-ranking --remote --file=./migrations/0001_leaderboard.sql
   ```
3. Pages の Settings → Bindings で D1 を `DB` という名前で接続します。本番環境とプレビュー環境は、必要に応じて別の D1 を使用します。
4. Turnstile ウィジェットを作り、Pages の Settings → Variables and Secrets に `TURNSTILE_SITE_KEY` と `TURNSTILE_SECRET_KEY` を設定します。シークレットキーは Secret として保存します。許可するホスト名に Pages のドメインを登録します。
5. Pages を再デプロイし、`/api/leaderboard` に `scores` が返ることを確認します。ゲーム終了後に名前を入力し、認証を通してスコアを登録します。

ランキングは匿名で、ブラウザが送ったスコアを受け取ります。Turnstile は自動投稿を抑えるためのもので、スコア改ざんを完全には防げません。競技性が必要ならサーバー側でプレイ結果を検証する仕組みを追加してください。
