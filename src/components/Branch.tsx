import { useEffect, useState } from 'react';

type Props = {
  repo: any; // { owner:{login}, name, default_branch }
  branch: string;
  setBranch: (v: string) => void;
  authHeaders: Record<string, string>;
  BASE: string;
  setLog: (updater: any) => void;
};

export default function BranchSection({
  repo,
  branch,
  setBranch,
  authHeaders,
  BASE,
  setLog,
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
        if (!branch) setBranch(repo.default_branch);
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

      <details style={{ marginTop: 12 }}>
        <summary>フォークの手順を見る(選択したいリポジトリがない時)</summary>
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
          <figure style={{ textAlign: 'center', margin: '8px 0' }}></figure>
        </div>
      </details>
    </section>
  );
}
