import { useMemo, useState } from 'react';
import TokenSection from './components/Token';
import RepoSection from './components/Repo';
import DropSection from './components/Drop';
import CommitSection from './components/Commit';
import BranchSection from './components/Branch';

// 共有: GitHub API ベースURL
const BASE = 'https://api.github.com';

export default function App() {
  // 単一の情報源
  const [token, setToken] = useState('');
  const [me, setMe] = useState<any>(null);
  const [repos, setRepos] = useState<any[]>([]);
  const [repo, setRepo] = useState<any>(null);
  const [log, setLog] = useState('');
  const [commitMsg, setCommitMsg] = useState('');
  const [branch, setBranch] = useState('');

  // token から認証ヘッダを計算
  const authHeaders = useMemo(
    () => ({
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    }),
    [token]
  );

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
      <h1>GitHub ドラッグ＆ドロップ アップロード</h1>

      {/*トークン入力＆認証*/}
      <TokenSection
        token={token}
        setToken={setToken}
        me={me}
        setMe={setMe}
        setLog={setLog}
        authHeaders={authHeaders}
        BASE={BASE}
      />

      {/*リポジトリ選択*/}
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

      {/* ブランチ選択（新規追加） */}
      <BranchSection
        repo={repo}
        branch={branch}
        setBranch={setBranch}
        authHeaders={authHeaders}
        BASE={BASE}
        setLog={setLog}
      />

      {/* 新規: コミットメッセージ入力 */}
      <CommitSection commitMsg={commitMsg} setCommitMsg={setCommitMsg} />

      {/*ドロップでアップロード*/}
      <DropSection
        repo={repo}
        setLog={setLog}
        branch={branch}
        authHeaders={authHeaders}
        BASE={BASE}
        commitMsg={commitMsg}
      />

      {/*ログ*/}
      <pre style={{ marginTop: 16, whiteSpace: 'pre-wrap' }}>{log}</pre>
    </main>
  );
}
