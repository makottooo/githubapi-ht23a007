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
  setLog: (updater: any) => void;
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
  const getShaIfExists = async (path: string): Promise<string | null> => {
    const url = `${BASE}/repos/${repo.owner.login}/${
      repo.name
    }/contents/${encodePath(path)}?ref=${encodeURIComponent(branch)}`;
    const res = await fetch(url, { headers: authHeaders });
    if (res.status === 404) return null;
    const data = await res.json();
    if (!res.ok) throw data;
    return data.sha ?? null;
  };

  // まとめてアップロード（各ファイル別コミット）
  const uploadAll = async () => {
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

    setLog(
      (prev: string) =>
        prev +
        `\n アップロード開始: ${queue.length}件 → ${repo.owner.login}/${repo.name}@${branch}`
    );

    for (const item of queue) {
      const f = item.file;
      try {
        // 1) 既存確認（sha取得）
        const sha = await getShaIfExists(f.name);

        // 2) PUT（新規 or 更新）
        const base64 = await fileToBase64(f);
        const putUrl = `${BASE}/repos/${repo.owner.login}/${
          repo.name
        }/contents/${encodePath(f.name)}`;
        const body: any = {
          message: commitMsg.trim() || `${sha ? 'update' : 'add'} ${f.name}`,
          content: base64,
          branch,
          ...(sha ? { sha } : {}),
        };

        const putRes = await fetch(putUrl, {
          method: 'PUT',
          headers: { ...authHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await putRes.json();
        if (!putRes.ok) throw data;

        // 3) ログ表示
        setLog(
          (prev: string) =>
            prev + `\n ${f.name} → ${data.content?.html_url ?? '(no url)'}`
        );
      } catch (e: any) {
        const msg = e?.message || JSON.stringify(e);
        setLog((prev: string) => prev + `\n ${f.name} → 失敗: ${msg}`);
      }
    }

    setLog((prev: string) => prev + `\n 完了`);
    clearAll(); // 成否に関わらずキューを空に
  };

  // 必ず JSX を返す
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
            <button onClick={uploadAll}>すべてアップロード</button>
            <button onClick={clearAll}>全クリア</button>
          </div>
        </div>
      )}
    </section>
  );
}
