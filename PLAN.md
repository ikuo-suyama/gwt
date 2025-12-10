# gwt - Git Worktree Manager CLI 実装計画

## 概要

Fish shell の `gwtree` 関数を TypeScript で再実装し、npm でインストール可能な CLI ツール `gwt` を作成します。

## プロジェクト構造

```
gwtree/
├── src/
│   ├── commands/          # サブコマンド実装
│   │   ├── add.ts        # worktree 作成（デフォルトコマンド）
│   │   ├── list.ts       # 対話式リスト表示
│   │   ├── delete.ts     # worktree 削除
│   │   ├── switch.ts     # worktree 切り替え
│   │   ├── prune.ts      # クリーンアップ
│   │   └── sync.ts       # rebase実行（grbd相当）
│   ├── lib/              # コアロジック
│   │   ├── git.ts        # Git操作ラッパー
│   │   ├── worktree.ts   # worktree管理ロジック
│   │   ├── branch.ts     # ブランチ操作
│   │   ├── path.ts       # パス操作ユーティリティ
│   │   └── env.ts        # .envファイル操作
│   ├── utils/            # ユーティリティ
│   │   ├── logger.ts     # カラー出力
│   │   ├── errors.ts     # エラー型定義
│   │   └── validation.ts # 入力検証
│   ├── types/            # TypeScript型定義
│   │   └── index.ts
│   ├── cli.ts            # CLIエントリーポイント
│   └── index.ts          # ライブラリエクスポート
├── tests/
│   ├── unit/             # ユニットテスト
│   ├── integration/      # 統合テスト
│   └── e2e/             # E2Eテスト
├── package.json
├── tsconfig.json
├── README.md
├── PLAN.md
└── LICENSE.md
```

## 技術スタック

### コア依存関係
- **Commander.js** - CLI フレームワーク（サブコマンド、オプション解析）
- **simple-git** - Git 操作ライブラリ（worktree、branch、remote操作）
- **inquirer** - 対話的プロンプト（list コマンドの UI）
- **chalk** - ターミナル文字装飾（色付け）
- **ora** - スピナー表示
- **fs-extra** - ファイルシステム操作（.env コピー）

### 開発ツール
- **TypeScript** 5.x
- **Vitest** - テストフレームワーク
- **ESLint + Prettier** - コード品質

## コマンド仕様

### 1. `gwt add [branch-name]` (デフォルトコマンド)

**目的**: 新しい worktree を作成

**処理フロー**:
1. ブランチ名を決定
   - 引数あり → そのブランチ名を使用
   - 引数なし → `git branch --show-current` で現在ブランチを取得
2. git remote から default branch を取得
3. ブランチの存在確認
   - ローカルに存在 → そのブランチを使用
   - リモートに存在 → チェックアウト
   - 存在しない → base branch から新規作成
4. worktree パスを生成: `../<current_dir>-<safe_branch_name>`
5. `git worktree add` を実行
6. .env ファイルをコピー（デフォルト ON）
7. worktree ディレクトリに移動
8. 自動リベース実行（デフォルト ON）

**オプション**:
- `--no-rebase`: 自動リベースをスキップ
- `--no-env`: .env コピーをスキップ
- `--base <branch>`: base branch を明示指定
- `--path <path>`: カスタム worktree パス

### 2. `gwt list` (対話式)

**目的**: worktree をリスト表示し、アクションを実行

**処理フロー**:
1. `git worktree list --porcelain` で全 worktree 取得
2. カラー表示でリスト化
3. inquirer で対話メニュー表示（Switch/Delete/Cancel）
4. 選択されたアクションを実行

### 3. `gwt delete [path]`

**目的**: worktree を削除

### 4. `gwt switch [path]`

**目的**: 既存 worktree に切り替え

### 5. `gwt prune`

**目的**: 削除済み worktree をクリーンアップ

### 6. `gwt sync`

**目的**: 現在ブランチを base branch にリベース（grbd 相当）

## 実装フェーズ

### Phase 1: 基礎実装
- プロジェクトセットアップ
- Git サービス実装
- パス・ブランチユーティリティ
- エラーハンドリング基盤

### Phase 2: コアコマンド
- `add` コマンド実装
- `sync` コマンド実装
- `prune` コマンド実装
- .env コピー機能

### Phase 3: 対話機能
- `list` コマンド実装
- `delete` コマンド実装
- `switch` コマンド実装
- UI/UX 改善

### Phase 4: テスト・ドキュメント
- ユニットテスト
- 統合テスト
- E2E テスト
- 使用例作成

### Phase 5: リリース準備
- npm パッケージ設定
- マルチプラットフォームテスト
- npm 公開

## 成功基準

✅ すべてのサブコマンドが期待通り動作
✅ 既存の Fish shell 実装と同等の機能
✅ npm でグローバルインストール可能
✅ テストカバレッジ 80% 以上
✅ マルチプラットフォーム動作確認
✅ 使いやすいドキュメント完備
