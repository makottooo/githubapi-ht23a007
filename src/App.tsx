import { useMemo, useState } from 'react';
import TokenSection from './components/Token';
import RepoSection from './components/Repo';
import DropSection from './components/Drop';
import CommitSection from './components/Commit';
import BranchSection from './components/Branch';

// 共有: GitHub API ベースURL
const BASE = 'https://api.github.com';
const LKEY = 'gh_token_v1';

export default function App() {
  // 単一の情報源
  const [token, setToken] = useState('');
  const [me, setMe] = useState<any>(null);
  const [repos, setRepos] = useState<any[]>([]);
  const [repo, setRepo] = useState<any>(null);
  const [log, setLog] = useState('');
  const [commitMsg, setCommitMsg] = useState('');
  const [prTitle, setPrTitle] = useState('');
  const [branch, setBranch] = useState('');
  const [usePr, setUsePr] = useState<boolean>(true);

  // token から認証ヘッダを計算
  const authHeaders = useMemo(
    () => ({
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    }),
    [token]
  );

  const handleLogout = () => {
    setToken('');
    setMe(null);
    setRepos([]); // ついでにリポ一覧もクリア
    setRepo(null); // 選択リポもクリア
    try {
      localStorage.removeItem(LKEY);
      sessionStorage.removeItem(LKEY);
    } catch {}
    setLog(' ログアウトしました（保存済みトークンも削除）');
  };

  // 認証前はログイン画面のみ（専用画面化）
  if (!me) {
    return (
      <main style={{ maxWidth: 720, margin: '20px auto', padding: 16 }}>
        <h1>ログイン画面</h1>
        <TokenSection
          token={token}
          setToken={setToken}
          me={me}
          setMe={setMe}
          setLog={setLog}
          authHeaders={authHeaders}
          BASE={BASE}
        />

        {/* プルリク機能の利用有無を選択 */}
        <section style={{ marginTop: 16 }}>
          <h2>プルリクエスト機能の利用</h2>
          <p style={{ fontSize: 14, marginTop: 4 }}>
            このアプリでプルリクエスト（PR）まで作成しますか？
          </p>
          <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input
                type="radio"
                checked={usePr === true}
                onChange={() => setUsePr(true)}
              />
              プルリクエストを使う
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input
                type="radio"
                checked={usePr === false}
                onChange={() => setUsePr(false)}
              />
              プルリクエストは使わない（アップロードのみ）
            </label>
          </div>

          {/*  プルリクを使うときだけフォーク説明を表示 */}
          {usePr && (
            <section style={{ marginTop: 16 }}>
              <h3>フォーク（Fork）について</h3>
              <p style={{ fontSize: 13, lineHeight: 1.7 }}>
                プルリクエスト機能を使う場合は、まず GitHub 上で対象リポジトリを
                自分のアカウントにフォークしておく必要があります。
                以下の手順に従ってフォークを作成してください。
              </p>
              <details style={{ marginTop: 12 }}>
                <summary>
                  フォークの手順を見る(選択したいリポジトリがない時)
                </summary>
                <div style={{ marginTop: 8, lineHeight: 1.7 }}>
                  <h2 style={{ margin: '12px 0' }}>
                    GitHubでリポジトリをフォークする手順
                  </h2>

                  <h3>1. PUSHしたいリポジトリを開く</h3>

                  <h3>2. 画面右上の Fork を押す</h3>
                  <figure style={{ textAlign: 'center', margin: '8px 0' }}>
                    <img
                      src="/images/8.png"
                      alt="Forkボタン"
                      style={{ maxWidth: '100%', height: 'auto' }}
                    />
                    <figcaption></figcaption>
                  </figure>

                  <h3>3. Owner が自分になっていることを確認する</h3>
                  <figure style={{ textAlign: 'center', margin: '8px 0' }}>
                    <img
                      src="/images/9.png"
                      alt="Ownerの選択画面"
                      style={{ maxWidth: '100%', height: 'auto' }}
                    />
                  </figure>

                  <h3>4. Create fork を押す（完了）</h3>
                  <figure style={{ textAlign: 'center', margin: '8px 0' }}>
                    <img
                      src="/images/10.png"
                      alt="Create forkボタン"
                      style={{ maxWidth: '100%', height: 'auto' }}
                    />
                  </figure>

                  <h2>これらのことをフォーク（Fork）という</h2>
                  <figure
                    style={{ textAlign: 'center', margin: '8px 0' }}
                  ></figure>
                </div>
              </details>
            </section>
          )}
        </section>
        <pre style={{ marginTop: 16, whiteSpace: 'pre-wrap' }}>{log}</pre>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 720, margin: '20px auto', padding: 16 }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        {/* 左側：題名（1行で表示） */}
        <h1
          style={{
            margin: 0,
            fontSize: '1.9rem',
            whiteSpace: 'nowrap',
          }}
        >
          GitHub ドラッグ＆ドロップ アップロード
        </h1>

        {/* 右側：アイコン＋名前＋ログアウトボタン */}
        {me && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column', // 縦に並べる
              alignItems: 'flex-end', // 右端に寄せる
              gap: 4,
              fontSize: 15,
            }}
          >
            {/* アイコン＋名前の1行 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {me.avatar_url && (
                <img
                  src={me.avatar_url}
                  alt={me.login}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    objectFit: 'cover',
                  }}
                />
              )}
              <span>
                <strong>{me.login}</strong>
              </span>
            </div>

            {/* その下に小さめログアウトボタン */}
            <button
              onClick={handleLogout}
              style={{
                fontSize: 12,
                padding: '2px 8px',
              }}
            >
              ログアウト
            </button>
          </div>
        )}
      </header>

      {/* リポジトリ選択 */}
      <RepoSection
        repos={repos}
        setRepos={setRepos}
        me={me}
        repo={repo}
        setRepo={setRepo}
        setLog={setLog}
        authHeaders={authHeaders}
        BASE={BASE}
      />

      {/* ブランチ選択 */}
      <BranchSection
        repo={repo}
        branch={branch}
        setBranch={setBranch}
        authHeaders={authHeaders}
        BASE={BASE}
        setLog={setLog}
        usePr={usePr}
      />

      {/* コミットメッセージ */}
      <CommitSection
        commitMsg={commitMsg}
        setCommitMsg={setCommitMsg}
        prTitle={prTitle}
        setPrTitle={setPrTitle}
      />

      {/* ドロップでアップロード */}
      <DropSection
        repo={repo}
        setLog={setLog}
        branch={branch}
        authHeaders={authHeaders}
        BASE={BASE}
        commitMsg={commitMsg}
        prTitle={prTitle}
        usePr={usePr}
      />

      {/* ログ */}
      <pre style={{ marginTop: 16, whiteSpace: 'pre-wrap' }}>{log}</pre>
    </main>
  );
}
