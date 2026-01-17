import React, { useEffect, useState } from 'react';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Loader from '../components/common/Loader';
import Pagination from '../components/common/Pagination';
import { contactAPI } from '../utils/api';

const ContactSubmissions = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const limit = 10;

  useEffect(() => {
    fetchSubmissions();
  }, [currentPage]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);

      const res = await contactAPI.getSubmissons({
        page: currentPage,
        limit,
      });

      setData(res.data.data || []);

      const total = res.data.pagination?.total || 0;
      setTotalPages(Math.ceil(total / limit));
    } catch (error) {
      console.error('Error fetching contact submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      header: 'Name',
      accessor: 'name',
    },
    {
      header: 'Email',
      accessor: 'email',
    },
    {
      header: 'Subject',
      accessor: 'subject',
    },
    {
      header: 'Category',
      accessor: 'category',
      render: (row) => row.category?.toUpperCase(),
    },
    {
      header: 'Priority',
      accessor: 'priority',
      render: (row) => row.priority?.toUpperCase(),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => row.status?.replace('_', ' ').toUpperCase(),
    },
    {
      header: 'Submitted At',
      accessor: 'createdAt',
      render: (row) => new Date(row.createdAt).toLocaleString(),
    },
  ];

  return (
    <div className="space-y-6">
      <Card
        title="Contact Submissions"
        subtitle="Support requests submitted by users"
      >
        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader text="Loading submissions..." />
          </div>
        ) : (
          <>
            <Table
              columns={columns}
              data={data}
              emptyMessage="No contact submissions found"
            />

            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default ContactSubmissions;
