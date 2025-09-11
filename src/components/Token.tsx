type Props = {
  token: string;
  setToken: (v: string) => void;
  me: any;
  setMe: (v: any) => void;
  setLog: (updater: any) => void;
  authHeaders: Record<string, string>;
  BASE: string;
};

export default function TokenSection({
  token,
  setToken,
  me,
  setMe,
  setLog,
  authHeaders,
  BASE,
}: Props) {
  const handleAuth = async () => {
    try {
      const res = await fetch(`${BASE}/user`, { headers: authHeaders });
      const data = await res.json();
      if (!res.ok) throw data;
      setMe(data);
      setLog(` 認証OK: ${data.login}`);
    } catch (e: any) {
      setLog(` 認証失敗: ${e.message}`);
    }
  };
  return (
    <section>
      <h2>① トークン入力</h2>
      <input
        type="password"
        placeholder="Personal Access Token"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        style={{ width: '100%', padding: 8 }}
      />
      <button onClick={handleAuth} style={{ marginTop: 8 }}>
        認証確認
      </button>
      {me && <p>ログイン中: {me.login}</p>}
    </section>
  );
}
