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

          {/* ここから置き換え */}
          <div style={{ marginTop: 8, lineHeight: 1.7 }}>
            <h2 style={{ margin: '12px 0' }}>githubトークンの作り方</h2>

            <h3>1. Githubにサインインする</h3>
            <p>
              <a href="https://github.co.jp/" target="_blank" rel="noreferrer">
                https://github.co.jp/
              </a>
            </p>

            <h3>2. 右上のプロフィールを押す</h3>
            <figure style={{ textAlign: 'center', margin: '8px 0' }}>
              <img
                src="/images/1.png"
                alt="プロフィールメニュー"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
              <figcaption></figcaption>
            </figure>

            <h3>3. Settings（設定）を開く</h3>
            <figure style={{ textAlign: 'center', margin: '8px 0' }}>
              <img
                src="/images/2.png"
                alt="Settings"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </figure>

            <h3>4. Developer settings → Personal access tokens</h3>
            <figure style={{ textAlign: 'center', margin: '8px 0' }}>
              <img
                src="/images/3.png"
                alt="Developer settings"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </figure>

            <h3>5. Fine-grained tokens を選択</h3>
            <figure style={{ textAlign: 'center', margin: '8px 0' }}>
              <img
                src="/images/4.png"
                alt="Fine-grained tokens"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </figure>

            <h3>6. Generate new token を押す</h3>
            <figure style={{ textAlign: 'center', margin: '8px 0' }}>
              <img
                src="/images/5.png"
                alt="Generate new token"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </figure>

            <h3>7. token 設定（Repository access）</h3>
            <p>
              Token name / Expiration
              を設定（用途が伝わる名前に。期限は必要に応じて）
              →repoのチェックマークを押す →Generate token を押して発行
            </p>
            <figure style={{ textAlign: 'center', margin: '8px 0' }}>
              <img
                src="/images/6.png"
                alt="Generate new token"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </figure>

            <h3>8. トークンを発行（Generate token）</h3>
            <p>
              生成されたトークンは一度しか表示されません。安全な場所に保存してください。
            </p>
            <figure style={{ textAlign: 'center', margin: '8px 0' }}>
              <img
                src="/images/7.png"
                alt="Generate new token"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </figure>
            <h3>9. アプリの入力欄に貼り付け（初回のみ）</h3>
            <p>
              共有PCでは保存をOFFにしてください。トークンはリポジトリに絶対コミットしないこと。
            </p>
          </div>
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
