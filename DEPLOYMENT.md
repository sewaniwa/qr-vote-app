# QR投票アプリ デプロイメントガイド

## 🚀 デプロイメント手順

### 1. 前提条件

- **Node.js 18+** がインストール済み
- **Git** がインストール済み
- **AWS CLI** がインストールされ、設定済み（バックエンド使用時）
- **AWS Amplify CLI v12+** がインストール済み（バックエンド使用時）

```bash
# バックエンド使用時のみ必要
npm install -g @aws-amplify/cli
```

### 1.1. フロントエンドのみ（静的サイト）の場合

**現在のステータス**: フロントエンドは完全に実装済みで、静的サイトとしてデプロイ可能

```bash
# プロダクションビルド
npm run build

# 生成された out/ ディレクトリを任意の静的ホスティングサービスにデプロイ
# - Vercel
# - Netlify  
# - GitHub Pages
# - AWS S3 + CloudFront
```

### 1.2. Amplify バックエンドのデプロイ（今後の実装）

**注意**: バックエンド機能は現在未実装です。以下は将来の実装計画です。

```bash
# Amplifyディレクトリに移動
cd amplify

# 依存関係のインストール
npm install

# Amplifyプロジェクトの初期化
amplify init

# サンドボックス環境でのテスト
npx ampx sandbox

# 本番環境へのデプロイ
npx ampx deploy --branch main
```

## 🌐 静的サイトホスティング (推奨)

### Vercel でのデプロイ

```bash
# Vercel CLI のインストール
npm i -g vercel

# デプロイ実行
vercel

# プロダクション環境にデプロイ
vercel --prod
```

### Netlify でのデプロイ

```bash
# Netlify CLI のインストール
npm install -g netlify-cli

# ビルド
npm run build

# デプロイ
netlify deploy --dir=out

# プロダクション環境にデプロイ
netlify deploy --prod --dir=out
```

### GitHub Pages でのデプロイ

1. リポジトリの Settings > Pages に移動
2. Source を "GitHub Actions" に設定
3. 以下のワークフローファイルを作成: `.github/workflows/deploy.yml`

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./out
```

## 🔧 環境変数の設定 (バックエンド実装後)

```bash
cp .env.example .env.local
# 生成された値で .env.local を更新
```

## 🔧 設定

### DynamoDB テーブル構成

Amplifyが以下のテーブルを自動作成します：

1. **VotingSession** - 投票セッション管理
2. **Candidate** - 候補者情報
3. **VotingToken** - QRコードトークン
4. **Vote** - 投票記録

### Lambda 関数

以下のLambda関数が作成されます：

- `verify-qr-token` - QRトークン検証
- `cast-vote` - 投票処理
- `get-candidates` - 候補者取得
- `check-voting-period` - 投票期間確認
- `generate-qr-codes` - QRコード生成（管理者用）

### API エンドポイント

```
POST /verify-qr-token    - QRトークン検証
POST /cast-vote          - 投票送信
GET  /get-candidates     - 候補者リスト取得
GET  /check-voting-period - 投票期間確認
POST /generate-qr-codes  - QRコード生成
```

## 🔐 セキュリティ設定

### 1. 環境変数

```bash
# 強力なシークレットキーを生成
openssl rand -base64 32  # TOKEN_SECRET用
openssl rand -base64 32  # SESSION_SECRET用  
openssl rand -base64 32  # VOTER_HASH_SECRET用
```

### 2. IAM ロール

Lambda関数に必要な最小権限：

- DynamoDB: GetItem, PutItem, UpdateItem, Query
- CloudWatch: CreateLogGroup, CreateLogStream, PutLogEvents

### 3. API Gateway設定

- CORS設定の有効化
- API キー認証の設定
- レート制限の実装

## 📊 モニタリング

### CloudWatch メトリクス

- Lambda関数の実行時間
- DynamoDB の読み取り/書き込み容量
- API Gateway のリクエスト数

### アラート設定

```bash
# エラー率のアラート
aws cloudwatch put-metric-alarm \
  --alarm-name "VotingApp-ErrorRate" \
  --alarm-description "High error rate in voting app" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold
```

## 🧪 テストデータ

### 候補者データの投入

```bash
# DynamoDBに候補者データを投入
aws dynamodb put-item \
  --table-name Candidate-XXXXXXXXXXXX-XXXXX \
  --item '{
    "candidateId": {"S": "1"},
    "name": {"S": "田中太郎"}, 
    "description": {"S": "経験豊富なリーダー"},
    "votingSessionId": {"S": "session-1"},
    "displayOrder": {"N": "1"}
  }'
```

### QRコードの生成

管理者APIを使用してQRコードを生成：

```bash
curl -X POST \
  https://your-api-gateway-url/generate-qr-codes \
  -H "Authorization: Bearer your-admin-token" \
  -H "Content-Type: application/json" \
  -d '{
    "count": 10,
    "votingSessionId": "session-1"
  }'
```

## 🔧 トラブルシューティング

### よくある問題

1. **Lambda関数のタイムアウト**
   - タイムアウト時間を増加（最大15分）
   - DynamoDB接続の最適化

2. **CORS エラー**
   - API Gateway のCORS設定を確認
   - プリフライトリクエストの許可

3. **DynamoDB スループット不足**
   - オンデマンド課金に変更
   - またはキャパシティの増加

### ログの確認

```bash
# Lambda関数のログ
aws logs tail /aws/lambda/verify-qr-token --follow

# API Gatewayのログ  
aws logs tail API-Gateway-Execution-Logs_XXXXXXXXX/prod --follow
```

## 📈 スケーリング

### 同時投票者数の見積もり

- 1,000人同時投票: 基本設定で対応可能
- 10,000人同時投票: Lambda同時実行数とDynamoDB容量の調整が必要
- 100,000人同時投票: 追加のアーキテクチャ変更が必要

### 最適化のポイント

1. DynamoDB のホットパーティション回避
2. Lambda のコールドスタート対策
3. CloudFront によるキャッシュ活用
4. API Gateway のキャッシュ有効化

## 💾 バックアップ

### DynamoDB バックアップ

```bash
# ポイントインタイムリカバリの有効化
aws dynamodb put-backup-policy \
  --table-name VotingToken-XXXXXXXXXXXX-XXXXX \
  --backup-policy Status=ENABLED
```

### データのエクスポート

```bash
# 投票結果のエクスポート
aws dynamodb scan \
  --table-name Vote-XXXXXXXXXXXX-XXXXX \
  --output json > voting-results.json
```