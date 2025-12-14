import { useEffect, useState } from 'react';

type Props = {
  repo: any; // { owner:{login}, name, default_branch }
  branch: string;
  setBranch: (v: string) => void;
  authHeaders: Record<string, string>;
  BASE: string;
  setLog: (updater: any) => void;
  usePr: boolean;
};

export default function BranchSection({
  repo,
  branch,
  setBranch,
  authHeaders,
  BASE,
  setLog,
  usePr,
}: Props) {
  const [branches, setBranches] = useState<string[]>([]);
  const hasRepo = !!repo;

  useEffect(() => {
    const fetchBranches = async () => {
      if (!repo) return;
      try {
        const url = `${BASE}/repos/${repo.owner.login}/${repo.name}/branches?per_page=100`;
        const res = await fetch(url, { headers: authHeaders });
        const data = await res.json();
        if (!res.ok) throw data;
        const names = data.map((b: any) => b.name as string);
        setBranches(names);
        // 初期選択：branch 未設定なら default_branch
        //if (!branch) setBranch(repo.default_branch);
        setBranches(names);
        const next = names.includes(branch) ? branch : repo.default_branch;
        setBranch(next);
        setLog((p: string) => p + `\n ブランチ取得: ${names.length}件`);
      } catch (e: any) {
        setLog((p: string) => p + `\n ブランチ取得失敗: ${e?.message ?? e}`);
      }
    };
    fetchBranches();
    // repo が変わったときに更新
  }, [repo]);

  return (
    <section>
      <h2>ブランチ選択</h2>
      <select
        disabled={!hasRepo || branches.length === 0}
        value={branch || ''}
        onChange={(e) => setBranch(e.target.value)}
        style={{ width: '100%', padding: 8, marginTop: 8 }}
        title={
          hasRepo
            ? 'アップロード先ブランチを選択'
            : '先にリポジトリを選択してください'
        }
      >
        {branch === '' && <option value="">選択してください</option>}
        {branches.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
      {branch && (
        <p style={{ marginTop: 8 }}>
          選択中ブランチ: <code>{branch}</code>
        </p>
      )}
    </section>
  );
}
