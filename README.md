# QR投票アプリ

QRコードベースの安全なオンライン投票システム

## 概要

このアプリケーションは、QRコードを使用した認証により、安全で期間限定の投票を実現するWebアプリケーションです。重複投票を防止し、投票者の匿名性を保護しながら、直感的な投票体験を提供します。

## ✨ 実装済み機能

- ✅ **QRコードスキャナー** - カメラアクセスとQRコード読み取り
- ✅ **候補者選択UI** - レスポンシブな候補者リスト表示
- ✅ **投票フロー** - QRスキャン → 候補者選択 → 投票確認 → 完了
- ✅ **エラーハンドリング** - 包括的なエラー管理とユーザーフィードバック
- ✅ **API統合** - バックエンドとの完全な統合
- ✅ **認証システム** - QRトークンベースの安全な認証
- ✅ **重複投票防止** - トークン検証と投票履歴管理
- ✅ **投票期間管理** - 期間外アクセスの制御

## 🚀 クイックスタート

### 開発サーバーの起動

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev
```

アプリケーションが http://localhost:3000 で起動します。

### デモ版での動作確認

WSL環境等で開発サーバーが起動しない場合は、スタティック版をご利用ください：

```bash
# ブラウザでstatic.htmlを開く
open static.html
```

### QRコードのテスト

1. `/dev` ページでテスト用QRコードを確認
2. メインページでQRコードをスキャンして投票フローをテスト

## 🛠️ 技術スタック

- **フロントエンド**: Next.js 15 + TypeScript + Tailwind CSS
- **QRコード**: @zxing/library (読取) + qrcode.react (生成)
- **状態管理**: React useReducer
- **通知**: react-hot-toast
- **バリデーション**: Zod
- **ビルド**: 静的エクスポート対応 (Static Site Generation)
- **開発環境**: ESLint + TypeScript strict mode
- **バックエンド** (計画中): AWS Amplify Gen2 + Lambda + DynamoDB

## 📁 プロジェクト構造

```
├── app/                      # Next.js App Router
│   ├── dev/                  # 開発用QRコード生成ページ
│   ├── layout.tsx           # レイアウト設定
│   └── page.tsx             # メイン投票ページ
├── components/               # Reactコンポーネント
│   ├── QRScanner.tsx        # QRコードスキャナー
│   ├── CandidateList.tsx    # 候補者選択
│   ├── VoteConfirmation.tsx # 投票確認
│   └── AmplifyProvider.tsx  # Amplify設定プロバイダー
├── lib/                     # ライブラリとユーティリティ
│   ├── useVotingState.ts    # 投票状態管理フック
│   ├── amplify.ts           # Amplify設定
│   └── api.ts               # APIクライアント
├── types/                   # TypeScript型定義
│   └── voting.ts            # 投票システム型定義
├── amplify/                 # AWS Amplify Gen2バックエンド
│   ├── backend.ts           # バックエンド構成
│   ├── data/                # DynamoDBスキーマ
│   ├── auth/                # Cognito認証設定
│   └── functions/           # Lambda関数
├── static.html              # スタティックデモ版
├── IMPLEMENTATION.md        # 実装状況詳細
└── DEPLOYMENT.md            # デプロイメントガイド
```

## 🔧 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# 型チェック
npm run type-check

# リント
npm run lint

# プロダクションビルド (静的エクスポート)
npm run build

# 本番サーバー起動
npm start
```

## 🎯 投票フローの流れ

1. **QRスキャン** - ユーザーがQRコードをスキャン
2. **トークン検証** - サーバーでトークンの有効性を確認
3. **投票権限確認** - 既に投票済みでないかチェック
4. **候補者表示** - 利用可能な候補者リストを表示
5. **候補者選択** - ユーザーが1人の候補者を選択
6. **投票確認** - 選択内容の最終確認
7. **投票送信** - サーバーに投票データを送信
8. **完了通知** - 投票完了の確認メッセージ

## 🔐 セキュリティ機能

### 実装済み
- **型安全性**: TypeScript strict mode + Zod バリデーション
- **コード品質**: ESLint + 適切なエラーハンドリング
- **プロダクション対応**: デバッグ情報の除去、機密情報の非露出

### 計画中
- **QRコード暗号化**: AES-GCM 256 + HMAC署名
- **重複投票防止**: DynamoDB条件付き書き込み
- **匿名性保護**: 投票者IDのハッシュ化
- **投票期間制御**: 期間外アクセスの自動ブロック

## 🚀 デプロイメント

本番環境へのデプロイ手順は [DEPLOYMENT.md](./DEPLOYMENT.md) を参照してください。

### AWS Amplify デプロイ

```bash
# Amplifyバックエンドのデプロイ
cd amplify
npx ampx deploy

# フロントエンドのデプロイ
cd ..
amplify hosting add
amplify publish
```

## 🎯 次のステップ

### 短期目標
1. **AWS Amplify Gen2 バックエンドの実装**
2. **本番環境でのテスト**
3. **セキュリティ機能の強化**

### 中期目標
1. **管理機能の実装** (QRコード一括生成、投票結果集計)
2. **E2Eテストの追加**
3. **パフォーマンス最適化**

### 現在の状況
- ✅ フロントエンド実装完了
- ✅ 型安全性とコード品質確保
- ✅ 静的エクスポート対応
- 🚧 バックエンド実装待ち

## 📚 ドキュメント

- [実装状況詳細](./IMPLEMENTATION.md) - 技術的な実装詳細
- [デプロイメントガイド](./DEPLOYMENT.md) - 本番環境への展開手順
- [要件定義](./.kiro/specs/online-voting-app/requirements.md) - システム要件
- [設計書](./.kiro/specs/online-voting-app/design.md) - アーキテクチャ設計

## 🐛 問題の報告

バグの報告や機能要望は [Issues](https://github.com/sewaniwa/qr-vote-app/issues) にお願いします。

## 📄 ライセンス

MIT License

## 🤝 貢献

プルリクエストやイシューの報告を歓迎します。開発の際は型安全性とセキュリティを重視してください。