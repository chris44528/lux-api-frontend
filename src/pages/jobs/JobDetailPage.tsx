import React from 'react';
import { useParams } from 'react-router-dom';

const JobDetailPage: React.FC = () => {
  const { jobId } = useParams();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Job Details</h1>
      <p>Job ID: {jobId}</p>
      <p className="text-gray-600">Job detail page - Coming soon</p>
    </div>
  );
};

export default JobDetailPage;