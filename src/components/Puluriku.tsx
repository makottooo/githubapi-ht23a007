import React, { useState } from 'react';

type PulurikuProps = {
  visible: boolean;
  defaultTitle?: string;
  onSubmit: (title: string, body: string) => Promise<void> | void;
};

export default function Puluriku({
  visible,
  defaultTitle,
  onSubmit,
}: PulurikuProps) {
  const [title, setTitle] = useState(defaultTitle ?? '');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!visible) return null;

  const handleClick = async () => {
    if (!title.trim()) {
      alert('プルリクエストのタイトルを入力してください');
      return;
    }
    try {
      setSubmitting(true);
      await onSubmit(title.trim(), body);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      style={{
        marginTop: 16,
        padding: 12,
        border: '1px solid #ddd',
        borderRadius: 8,
        background: '#fafafa',
      }}
    >
      <h3 style={{ marginTop: 0 }}>プルリクエストを作成（任意）</h3>
      <p style={{ fontSize: 12, color: '#555', marginTop: 0 }}>
        必要な場合のみ、タイトルと本文を入力して「プルリクエストを作成」を押してください。
      </p>

      <label style={{ display: 'block', marginBottom: 4 }}>タイトル</label>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="例）画像ファイルの更新"
        style={{ width: '100%', padding: 8, marginBottom: 8 }}
      />

      <label style={{ display: 'block', marginBottom: 4 }}>本文（任意）</label>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        placeholder="変更内容の詳細やレビューしてほしい点などを記入できます"
        style={{ width: '100%', padding: 8, resize: 'vertical' }}
      />

      <div style={{ marginTop: 8, textAlign: 'right' }}>
        <button
          onClick={handleClick}
          disabled={submitting || !title.trim()}
          style={{ padding: '4px 12px' }}
        >
          {submitting ? '作成中...' : 'プルリクエストを作成'}
        </button>
      </div>
    </section>
  );
}
