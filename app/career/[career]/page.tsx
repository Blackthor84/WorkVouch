import { fetchCareerData } from '@/lib/careers';

type CareerPageProps = {
  params: { career: string };
};

const CareerPage = async ({ params }: CareerPageProps) => {
  const { career } = params;

  // fetch data if needed
  const data = await fetchCareerData(career);

  if (!data) {
    return (
      <div>
        <h1>Career not found</h1>
        <p>The career "{career}" could not be found.</p>
      </div>
    );
  }

  return (
    <div>
      <h1>{data.name}</h1>
      {data.description && <p>{data.description}</p>}
      {/* render your data */}
    </div>
  );
};

export default CareerPage;
