import { useMemo, useState } from 'react';
import TokenSection from './components/Token';
import RepoSection from './components/Repo';
import DropSection from './components/Drop';

// 共有: GitHub API ベースURL
const BASE = 'https://api.github.com';

export default function App() {
  // 単一の情報源
  const [token, setToken] = useState('');
  const [me, setMe] = useState<any>(null);
  const [repos, setRepos] = useState<any[]>([]);
  const [repo, setRepo] = useState<any>(null);
  const [log, setLog] = useState('');

  // token から認証ヘッダを計算
  const authHeaders = useMemo(
    () => ({
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    }),
    [token]
  );

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

      {/*ドロップでアップロード*/}
      <DropSection
        repo={repo}
        setLog={setLog}
        authHeaders={authHeaders}
        BASE={BASE}
      />

      {/*ログ*/}
      <pre style={{ marginTop: 16, whiteSpace: 'pre-wrap' }}>{log}</pre>
    </main>
  );
}
