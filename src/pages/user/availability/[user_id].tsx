import { GetServerSideProps } from 'next';
import AvailabilityForm from '@/components/AvailabilityForm';
import redis from '@/lib/redis';


interface UserPageProps {
  initialData: any
}

function UserAvailabilityPage({ initialData }: UserPageProps) {
  return <AvailabilityForm initialData={initialData} />;
}

export const getServerSideProps: GetServerSideProps = async (context) => {

  const { user_id } = context.params as { user_id: string };
  let availability = { userId : user_id , data : [] }; // Default empty fields

  try {
    const data = await redis.get(user_id);
    if (data) availability = { userId : user_id , data: JSON.parse(data)};
  } catch (err) {
    console.error(err);
  }

  return { props: { initialData: availability } };
};

export default UserAvailabilityPage;
