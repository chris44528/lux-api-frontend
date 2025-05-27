import { useParams } from 'react-router-dom';
import HolidayRequestForm from '@/components/holidays/HolidayRequestForm';

export default function HolidayRequestPage() {
  const { id } = useParams<{ id?: string }>();
  const requestId = id && id !== 'new' ? parseInt(id) : undefined;

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <HolidayRequestForm requestId={requestId} />
      </div>
    </div>
  );
}