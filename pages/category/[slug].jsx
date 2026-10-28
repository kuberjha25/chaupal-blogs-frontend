import TermPage from '@/components/site/TermPage';
import { termGSSP } from '@/lib/term';

export const getServerSideProps = termGSSP('category');

export default function CategoryPage({ data }) { return <TermPage data={data} />; }
