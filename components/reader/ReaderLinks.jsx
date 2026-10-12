/* Footer account links — always "Login / Sign up" in SSR (stable output); changes on the client once the reader loads */
import { firstName, useReader } from '@/lib/reader';

export default function ReaderLinks() {
  const { reader, logout, openAuth } = useReader();

  if (!reader) {
    return (
      <button className="linkbtn" type="button" onClick={() => openAuth('login')}>Login / Sign up</button>
    );
  }
  return (
    <span className="raccount">
      <span>Hi {firstName(reader)}</span>
      <span aria-hidden="true">·</span>
      <button className="linkbtn" type="button" onClick={logout}>Logout</button>
      <span aria-hidden="true">·</span>
      <button className="linkbtn" type="button" onClick={() => openAuth('delete')}>Delete my account</button>
    </span>
  );
}
