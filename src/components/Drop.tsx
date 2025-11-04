import React, { useState } from 'react';

// Base64 化（大きめでも分割して安全）
async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  const parts: string[] = [];
  for (let i = 0; i < bytes.length; i += chunk) {
    const sub = bytes.subarray(i, i + chunk);
    parts.push(String.fromCharCode(...sub));
  }
  return btoa(parts.join(''));
}

type Props = {
  repo: any; // { owner:{login}, name, default_branch }
  setLog: React.Dispatch<React.SetStateAction<string>>;
  branch: string;
  authHeaders: Record<string, string>;
  BASE: string;
  commitMsg?: string;
};

// / を維持しつつ各セグメントだけエンコード（フォルダ対応も安全に）
function encodePath(path: string) {
  return path.split('/').map(encodeURIComponent).join('/');
}

type QueueItem = {
  id: string;
  file: File;
};

const genId = () =>
  globalThis.crypto && 'randomUUID' in globalThis.crypto
    ? (globalThis.crypto as Crypto).randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

// base ブランチの最新コミットSHAを取得
async function getBranchHeadSha(
  BASE: string,
  owner: string,
  repo: string,
  branch: string,
  headers: Record<string, string>
): Promise<string> {
  const url = `${BASE}/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(
    branch
  )}`;
  const res = await fetch(url, { headers });
  const data = await res.json();
  if (!res.ok) throw data;
  return data.object?.sha;
}

// base から新しいブランチを作る
async function createBranchFrom(
  BASE: string,
  owner: string,
  repo: string,
  newBranch: string,
  fromSha: string,
  headers: Record<string, string>
) {
  const url = `${BASE}/repos/${owner}/${repo}/git/refs`;
  const body = { ref: `refs/heads/${newBranch}`, sha: fromSha };
  const res = await fetch(url, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  // 既に同名がある場合は 422 が返ることがある → その場合はスキップ扱い
  if (res.status === 422) return;
  const data = await res.json();
  if (!res.ok) throw data;
}

// PR を作成（targetOwner/targetRepo 宛て）
async function createPullRequest(
  BASE: string,
  targetOwner: string,
  targetRepo: string,
  head: string, // 作業ブランチ（フォーク→本家PR時は "forkOwner:branch"）
  base: string, // 取り込み先ブランチ
  title: string,
  headers: Record<string, string>
): Promise<string> {
  const url = `${BASE}/repos/${targetOwner}/${targetRepo}/pulls`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, head, base }),
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data.html_url as string; // PRのURL
}

export default function DropSection({
  repo,
  setLog,
  branch,
  authHeaders,
  BASE,
  commitMsg = '',
}: Props): JSX.Element {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const hasRepo = !!repo;
  const hasBranch = !!branch;

  // ドロップ → すぐ PUT せず、キューに貯める
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!hasRepo) {
      alert('リポジトリを選んでください');
      return;
    }
    if (!hasBranch) {
      alert('ブランチを選んでください');
      return;
    }
    const files = Array.from(e.dataTransfer.files ?? []);
    if (files.length === 0) return;

    const items = files.map((f) => ({ id: genId(), file: f }));
    setQueue((prev) => [...prev, ...items]);
  };

  const removeOne = (id: string) =>
    setQueue((prev) => prev.filter((q) => q.id !== id));
  const clearAll = () => setQueue([]);

  // 既存なら sha を返す（404 は新規扱い）
  const getShaIfExists = async (
    owner: string,
    repoName: string,
    targetBranch: string,
    path: string
  ): Promise<string | null> => {
    const url = `${BASE}/repos/${owner}/${repoName}/contents/${encodePath(
      path
    )}?ref=${encodeURIComponent(targetBranch)}`;
    const res = await fetch(url, { headers: authHeaders });
    if (res.status === 404) return null;
    const data = await res.json();
    if (!res.ok) throw data;
    return data.sha ?? null;
  };

  // まとめてアップロード（各ファイル別コミット）
  const uploadAllAsPR = async () => {
    if (!hasRepo) {
      alert('リポジトリを選んでください');
      return;
    }
    if (!hasBranch) {
      alert('ブランチを選んでください');
      return;
    }
    if (queue.length === 0) {
      alert('アップロードするファイルがありません');
      return;
    }
    const forkOwner = repo.owner.login;
    const forkName = repo.name;
    const baseBranchOnFork = branch;
    // フォーク判定
    const isFork = Boolean(repo.fork && repo.parent);
    // === フォークしていない場合：ブランチ作成なし・PRなし・選択中ブランチに直PUTして終了 ===
    if (!isFork) {
      setLog(
        (p) =>
          p +
          `\n アップロード開始: ${queue.length}件 → ${forkOwner}/${forkName}@${baseBranchOnFork}（PRなし・新規ブランチなし）`
      );

      for (const item of queue) {
        const f = item.file;
        try {
          const base64 = await fileToBase64(f);
          const sha = await getShaIfExists(
            forkOwner,
            forkName,
            baseBranchOnFork,
            f.name
          );
          const putUrl = `${BASE}/repos/${forkOwner}/${forkName}/contents/${encodePath(
            f.name
          )}`;
          const body: any = {
            message:
              (commitMsg || '').trim() || `${sha ? 'update' : 'add'} ${f.name}`,
            content: base64,
            branch: baseBranchOnFork, // ← 選択中ブランチにそのままPUT
            ...(sha ? { sha } : {}),
          };
          const putRes = await fetch(putUrl, {
            method: 'PUT',
            headers: { ...authHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
          const data = await putRes.json();
          if (!putRes.ok) throw data;

          setLog(
            (p) => p + `\n ${f.name} → ${data.content?.html_url ?? '(no url)'}`
          );
        } catch (e: any) {
          setLog(
            (p) => p + `\n ${f.name} → 失敗: ${e?.message || JSON.stringify(e)}`
          );
        }
      }

      setLog((p) => p + `\n 完了（PRは作成していません）`);
      setQueue([]);
      alert('アップロード完了（PRなし）');
      return; // ← ここで終了（以降の作業ブランチ作成＆PR作成へは進まない）
    }
    // ======================================================================

    setLog(
      (prev: string) =>
        prev +
        `\n アップロード開始: ${queue.length}件 → ${repo.owner.login}/${repo.name}@${branch}`
    );

    // 1) フォーク側の base から作業ブランチを自動作成
    let headSha: string;
    try {
      headSha = await getBranchHeadSha(
        BASE,
        forkOwner,
        forkName,
        baseBranchOnFork,
        authHeaders
      );
    } catch (e: any) {
      setLog((p: string) => p + `\n base取得失敗: ${e?.message ?? e}`);
      return;
    }

    const workBranch = `upload-${new Date()
      .toISOString()
      .replace(/[-:T.Z]/g, '')
      .slice(0, 14)}`; // 例: upload-20251104 1230

    try {
      await createBranchFrom(
        BASE,
        forkOwner,
        forkName,
        workBranch,
        headSha,
        authHeaders
      );
      setLog((p: string) => p + `\n 作業ブランチ作成: ${workBranch}`);
    } catch (e: any) {
      setLog((p: string) => p + `\n 作業ブランチ作成失敗: ${e?.message ?? e}`);
      return;
    }
    // 2) 作業ブランチへアップロード（各ファイル別コミット）
    for (const item of queue) {
      const f = item.file;
      try {
        const base64 = await fileToBase64(f);
        const putUrl = `${BASE}/repos/${forkOwner}/${forkName}/contents/${encodePath(
          f.name
        )}`;

        // 冪等性のため、作業ブランチ側で sha を確認
        let sha: string | null = null;
        try {
          sha = await getShaIfExists(forkOwner, forkName, workBranch, f.name);
        } catch (_) {}

        const body: any = {
          message:
            (commitMsg || '').trim() ||
            `${sha ? 'update' : 'add'} ${f.name} (via ${workBranch})`,
          content: base64,
          branch: workBranch,
          ...(sha ? { sha } : {}),
        };

        const putRes = await fetch(putUrl, {
          method: 'PUT',
          headers: { ...authHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await putRes.json();
        if (!putRes.ok) throw data;

        setLog(
          (prev: string) =>
            prev + `\n ${f.name} → ${data.content?.html_url ?? '(no url)'}`
        );
      } catch (e: any) {
        const msg = e?.message || JSON.stringify(e);
        setLog((prev: string) => prev + `\n ${f.name} → 失敗: ${msg}`);
      }
    }

    // 3) PR 作成
    //    - フォークリポなら「本家」宛てに head='forkOwner:workBranch', base=parent.default_branch
    //    - フォークでなければ同一リポPR（head=workBranch, base=UI選択ブランチ）
    const targetOwner = isFork ? repo.parent.owner.login : forkOwner;
    const targetRepo = isFork ? repo.parent.name : forkName;
    const baseBranchForPR = isFork
      ? repo.parent.default_branch || 'main'
      : baseBranchOnFork;
    const headForPR = isFork ? `${forkOwner}:${workBranch}` : workBranch;

    try {
      const prTitle =
        (commitMsg || '').trim() ||
        `Upload ${queue.length} file(s) via ${workBranch}`;
      const prUrl = await createPullRequest(
        BASE,
        targetOwner,
        targetRepo,
        headForPR,
        baseBranchForPR,
        prTitle,
        authHeaders
      );
      setLog((p: string) => p + `\n PR 作成: ${prUrl}`);
      alert(`PR を作成しました:\n${prUrl}`);
    } catch (e: any) {
      setLog((p: string) => p + `\n PR作成失敗: ${e?.message ?? e}`);
    }

    setLog((prev: string) => prev + `\n 完了`);
    setQueue([]); // 終了後にキューを空に
  };

  return (
    <section>
      <h2>ドロップでアップロード</h2>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        style={{
          border: '2px dashed gray',
          padding: 40,
          textAlign: 'center',
          borderRadius: 12,
          background: '#fafafa',
          opacity: hasRepo && hasBranch ? 1 : 0.6,
          pointerEvents: hasRepo ? 'auto' : 'none',
        }}
        title={
          hasRepo
            ? 'ここに複数ファイルをドロップ'
            : '先にリポジトリを選択してください'
        }
      >
        ここにファイルをドロップ（複数可）
      </div>

      {/* キュー表示＆削除 / まとめて実行 */}
      {queue.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <p style={{ margin: 0 }}>キュー: {queue.length}件</p>
          <ul style={{ listStyle: 'none', padding: 0, marginTop: 8 }}>
            {queue.map((q) => (
              <li
                key={q.id}
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                  padding: 8,
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {q.file.name}{' '}
                  <small>({(q.file.size / 1024).toFixed(1)} KB)</small>
                </span>
                <button onClick={() => removeOne(q.id)}>削除</button>
              </li>
            ))}
          </ul>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={uploadAllAsPR}>すべてアップロード</button>
            <button onClick={clearAll}>全クリア</button>
          </div>
        </div>
      )}
    </section>
  );
}
