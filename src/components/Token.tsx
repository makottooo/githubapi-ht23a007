import { useEffect, useId, useState } from 'react';

type Props = {
  token: string;
  setToken: (v: string) => void;
  me: any;
  setMe: (v: any) => void;
  setLog: (updater: any) => void;
  authHeaders: Record<string, string>;
  BASE: string;
};
const LKEY = 'gh_token_v1';

export default function TokenSection({
  token,
  setToken,
  me,
  setMe,
  setLog,
  authHeaders,
  BASE,
}: Props) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [remember, setRemember] = useState(true); // 「この端末に保存」

  // 保存済みトークンを復元（localStorage優先 → sessionStorage）
  useEffect(() => {
    const savedLocal = localStorage.getItem(LKEY);
    const savedSession = sessionStorage.getItem(LKEY);
    const saved = savedLocal ?? savedSession ?? '';
    if (saved) {
      setToken(saved);
      setRemember(Boolean(savedLocal));
    }
  }, [setToken]);

  // 2) token が入ったら自動認証
  useEffect(() => {
    if (!token) return;
    void handleAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const persistToken = (value: string) => {
    localStorage.removeItem(LKEY);
    sessionStorage.removeItem(LKEY);
    if (!value) return;
    if (remember) localStorage.setItem(LKEY, value);
    else sessionStorage.setItem(LKEY, value);
  };

  const handleAuth = async () => {
    try {
      setBusy(true);
      const res = await fetch(`${BASE}/user`, { headers: authHeaders });
      const data = await res.json();
      if (!res.ok) throw data;
      setMe(data);
      persistToken(token);
      setLog(` 認証OK: ${data.login}`);
    } catch (e: any) {
      persistToken('');
      setLog(` 認証失敗: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  // ログアウト＆保存削除
  const logoutAndClear = () => {
    setToken('');
    setMe(null);
    try {
      localStorage.removeItem(LKEY);
      sessionStorage.removeItem(LKEY);
    } catch {}
    setLog(' ログアウトしました（保存済みトークンも削除）');
  };
  return (
    <section>
      <h2>トークン入力</h2>
      {/* ← 認証済み(me)なら入力UIを隠す */}
      {!me && (
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          style={{ width: '100%', padding: 8 }}
        />
      )}
      <div
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          marginTop: 8,
          flexWrap: 'wrap',
        }}
      >
        {/* ← 認証済みならボタン/チェックも隠す */}
        {!me && (
          <>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                title="共有PCではOFF推奨"
              />
              この端末に保存
            </label>
            <button disabled={busy || !token} onClick={handleAuth}>
              認証確認
            </button>
          </>
        )}
        <button onClick={logoutAndClear}>ログアウト</button>
      </div>

      {/* トークン作成ガイド（認証前のみ表示） */}
      {!me && (
        <details style={{ marginTop: 12 }}>
          <summary>トークンの作成手順を見る</summary>
          <ol style={{ marginTop: 8 }}>
            <li>
              GitHubにサインイン → 右上プロフィール → <em>Settings</em>
            </li>
            <li>
              <em>Developer settings</em> → <em>Personal access tokens</em> →{' '}
              <em>Fine-grained tokens</em>
            </li>
            <li>
              <em>Generate new token</em>：対象リポジトリ／権限（
              <code>Contents: Read/Write</code>）を付与
            </li>
            <li>生成されたトークンを上の入力欄へ貼り付け（初回のみ）</li>
          </ol>
          <p style={{ fontSize: 12, opacity: 0.8 }}>
            ※
            共有PCでは保存をOFFにしてください。トークンはリポジトリに絶対コミットしないでください。
          </p>
        </details>
      )}
      {me && (
        <p style={{ marginTop: 8 }}>
          ログイン中: <strong>{me.login}</strong>
        </p>
      )}
    </section>
  );
}
