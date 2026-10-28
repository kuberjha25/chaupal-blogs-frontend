import TermPage from '@/components/site/TermPage';
import { termGSSP } from '@/lib/term';

export const getServerSideProps = termGSSP('boli');

export default function BoliPage({ data }) { return <TermPage data={data} />; }
