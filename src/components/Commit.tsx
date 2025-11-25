import { useId } from 'react';

type Props = {
  commitMsg: string;
  setCommitMsg: (v: string) => void;
  prTitle: string; // ★追加
  setPrTitle: (v: string) => void;
};

export default function CommitSection({
  commitMsg,
  setCommitMsg,
  prTitle,
  setPrTitle,
}: Props) {
  const id = useId();
  const prId = useId();
  return (
    <section>
      <h2> コミットメッセージ</h2>
      <label htmlFor={id} style={{ display: 'block', marginBottom: 4 }}></label>
      <input
        id={id}
        type="text"
        value={commitMsg}
        onChange={(e) => setCommitMsg(e.target.value)}
        placeholder="（例）画像を更新 / README修正 など"
        style={{ width: '100%', padding: 8 }}
      />
    </section>
  );
}
