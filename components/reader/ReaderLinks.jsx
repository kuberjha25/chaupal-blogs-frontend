/* Footer account links — SSR te hamesha "Login / Sign up" (output stable), client te reader load hon baad badalda */
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
