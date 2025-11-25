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
      />

      {/* ログ */}
      <pre style={{ marginTop: 16, whiteSpace: 'pre-wrap' }}>{log}</pre>
    </main>
  );
}
