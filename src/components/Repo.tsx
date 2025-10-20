type Props = {
  repos: any[];
  setRepos: (v: any[]) => void;
  repo: any;
  me: any;
  setRepo: (v: any) => void;
  setLog: (updater: any) => void;
  authHeaders: Record<string, string>;
  BASE: string;
};

export default function RepoSection({
  repos,
  setRepos,
  me,
  repo,
  setRepo,
  setLog,
  authHeaders,
  BASE,
}: Props) {
  const handleRepos = async () => {
    try {
      const res = await fetch(
        `${BASE}/user/repos?per_page=100&affiliation=owner&visibility=all`,
        { headers: authHeaders }
      );
      const data = await res.json();
      if (!res.ok) throw data;
      // 認証ユーザー本人がオーナーのものだけ残す
      const personal = data.filter((r: any) => r.owner.login === me.login);
      setRepos(personal);
      setLog(` リポ取得: ${personal.length}件`);
    } catch (e: any) {
      setLog(` リポ取得失敗: ${e.message}`);
    }
  };

  return (
    <section>
      <h2> リポジトリ選択</h2>
      <button onClick={handleRepos}>リポ一覧取得</button>
      <select
        onChange={(e) => setRepo(repos[Number(e.target.value)])}
        defaultValue=""
        style={{ width: '100%', padding: 8, marginTop: 8 }}
      >
        <option value="" disabled>
          選択してください
        </option>
        {repos.map((r, i) => (
          <option key={r.id} value={i}>
            {r.owner.login}/{r.name}
          </option>
        ))}
      </select>
    </section>
  );
}
