// Base64化（Uint8Array→number[] 変換はスプレッドで）
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
  repo: any; // { owner: {login}, name, default_branch }
  setLog: (updater: any) => void;
  authHeaders: Record<string, string>;
  BASE: string;
};
export default function DropSection({
  repo,
  setLog,
  authHeaders,
  BASE,
}: Props) {
  const handleDrop = async (ev: React.DragEvent<HTMLDivElement>) => {
    ev.preventDefault();
    if (!repo) return alert('リポジトリを選んでください');

    const files = Array.from(ev.dataTransfer.files);
    for (const f of files) {
      try {
        const base64 = await fileToBase64(f);
        const url = `${BASE}/repos/${repo.owner.login}/${repo.name}/contents/${f.name}`;
        const body = {
          message: `add ${f.name}`,
          content: base64,
          branch: repo.default_branch,
        };

        const res = await fetch(url, {
          method: 'PUT',
          headers: { ...authHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw data;
        setLog(
          (prev: string) => prev + `\n ${f.name} → ${data.content.html_url}`
        );
      } catch (e: any) {
        setLog((prev: string) => prev + `\n ${f.name} → ${e.message}`);
      }
    }
  };
  return (
    <section>
      <h2>③ ドロップでアップロード</h2>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        style={{
          border: '2px dashed gray',
          padding: 40,
          textAlign: 'center',
          borderRadius: 12,
          background: '#fafafa',
        }}
      >
        ここにファイルをドロップ
      </div>
    </section>
  );
}
