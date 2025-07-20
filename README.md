# オンライン投票アプリ

QRコードベースの安全なオンライン投票システム

## 概要

このアプリケーションは、QRコードを使用した認証により、安全で期間限定の投票を実現するWebアプリケーションです。重複投票を防止し、投票者の匿名性を保護しながら、直感的な投票体験を提供します。

## 主な機能

- 🔐 QRコードベースの安全な認証
- 🗳️ 直感的な候補者選択インターフェース
- 🚫 重複投票防止システム
- ⏰ 期間限定投票機能
- 📱 レスポンシブデザイン（モバイル対応）
- 🔒 投票者の匿名性保護

## 技術スタック

- **フロントエンド**: Next.js 14 + TypeScript + Tailwind CSS
- **バックエンド**: AWS Amplify Gen2 + AWS CDK
- **認証**: Amazon Cognito
- **データベース**: Amazon DynamoDB
- **ホスティング**: AWS Amplify Hosting

## 開発開始方法

### 前提条件

- Node.js 18以上
- AWS CLI設定済み
- Git

### セットアップ

1. リポジトリのクローン
```bash
git clone <repository-url>
cd online-voting-app
```

2. 依存関係のインストール
```bash
npm install
```

3. AWS設定
```bash
aws configure
```

### 実装の進め方

このプロジェクトは仕様駆動開発（Spec-Driven Development）で構築されています。

1. **仕様書の確認**
   - `.kiro/specs/online-voting-app/requirements.md` - 要件定義
   - `.kiro/specs/online-voting-app/design.md` - 設計書
   - `.kiro/specs/online-voting-app/tasks.md` - 実装計画

2. **実装の開始**
   - `tasks.md`ファイルを開く
   - 各タスクの「Start task」ボタンをクリックして順次実装

3. **推奨実装順序**
   - プロジェクト基盤構築
   - データモデル実装
   - 認証システム構築
   - API実装
   - フロントエンド実装
   - テスト・最適化

## プロジェクト構造

```
├── .kiro/
│   └── specs/online-voting-app/    # 仕様書
├── src/
│   ├── components/                 # Reactコンポーネント
│   ├── pages/                     # Next.jsページ
│   ├── lib/                       # ユーティリティ
│   └── types/                     # TypeScript型定義
├── amplify/                       # AWS Amplify設定
├── cdk/                          # AWS CDK構成
└── tests/                        # テストファイル
```

## セキュリティ

- QRコードはAES-GCM 256 + HMAC署名で暗号化
- DynamoDB条件付き書き込みによる重複投票防止
- 投票者の匿名性を保護するハッシュ化
- 監査証跡の完全性保証

## ライセンス

MIT License

## 貢献

プルリクエストやイシューの報告を歓迎します。実装前に仕様書を確認し、要件に沿った開発をお願いします。