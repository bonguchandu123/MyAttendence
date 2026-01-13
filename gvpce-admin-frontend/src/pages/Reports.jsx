import React, { useState } from 'react';
import { FileText, Download, TrendingUp, Users, BookOpen } from 'lucide-react';
import { BRANCHES, SEMESTERS, getAttendanceStatus } from '../utils/helpers';
import Card from '../components/common/Card';
import Select from '../components/common/Select';
import Button from '../components/common/Button';

const Reports = () => {
  const [filters, setFilters] = useState({
    branch: '',
    semester: '',
    reportType: 'student',
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerateReport = () => {
    if (!filters.branch || !filters.semester) {
      alert('Please select branch and semester');
      return;
    }
    alert(`Generating ${filters.reportType} report for ${filters.branch} - Semester ${filters.semester}`);
  };

  const reportTypes = [
    { value: 'student', label: 'Student-wise Report' },
    { value: 'subject', label: 'Subject-wise Report' },
    { value: 'branch', label: 'Branch-wise Report' },
    { value: 'monthly', label: 'Monthly Report' },
  ];

  const sampleStudentData = [
    { rollNumber: '32410383001', name: 'Student 1', overall: 92, status: 'excellent' },
    { rollNumber: '32410383002', name: 'Student 2', overall: 88, status: 'excellent' },
    { rollNumber: '32410383003', name: 'Student 3', overall: 78, status: 'good' },
    { rollNumber: '32410383004', name: 'Student 4', overall: 72, status: 'warning' },
    { rollNumber: '32410383005', name: 'Student 5', overall: 65, status: 'critical' },
  ];

  const sampleSubjectData = [
    { code: '22CS2301', name: 'Data Structures', percentage: 86, total: 2900, present: 2494 },
    { code: '22CS2302', name: 'Operating Systems', percentage: 91, total: 2900, present: 2639 },
    { code: '22CS2303', name: 'DBMS', percentage: 78, total: 2900, present: 2262 },
  ];

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-primary-900">📊 Reports & Analytics</h1>
        <p className="text-primary-600 mt-1">Generate comprehensive attendance reports</p>
      </div>

      <Card title="🔍 Generate Report">
        <div className="space-y-4">
          <Select
            label="Report Type"
            name="reportType"
            value={filters.reportType}
            onChange={handleFilterChange}
            options={reportTypes}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Branch"
              name="branch"
              value={filters.branch}
              onChange={handleFilterChange}
              options={BRANCHES}
              placeholder="Select branch"
            />
            <Select
              label="Semester"
              name="semester"
              value={filters.semester}
              onChange={handleFilterChange}
              options={SEMESTERS}
              placeholder="Select semester"
            />
          </div>

          <Button
            variant="primary"
            icon={FileText}
            onClick={handleGenerateReport}
            fullWidth
          >
            Generate Report
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-accent-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-accent-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary-600">Overall Performance</p>
              <p className="text-2xl font-bold text-primary-900">85.4%</p>
            </div>
          </div>
          <p className="text-xs text-primary-600">All branches combined</p>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-success-100 rounded-lg">
              <Users className="w-6 h-6 text-success-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary-600">Total Students</p>
              <p className="text-2xl font-bold text-primary-900">1,247</p>
            </div>
          </div>
          <p className="text-xs text-primary-600">Across all branches</p>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-warning-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-warning-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary-600">Total Subjects</p>
              <p className="text-2xl font-bold text-primary-900">156</p>
            </div>
          </div>
          <p className="text-xs text-primary-600">Active subjects</p>
        </Card>
      </div>

      <Card title="📈 Student-wise Performance (Sample)">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-primary-200">
            <thead className="bg-primary-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-primary-900 uppercase">
                  Roll Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-primary-900 uppercase">
                  Overall %
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-primary-900 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-primary-900 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-primary-200">
              {sampleStudentData.map((student, index) => {
                const status = getAttendanceStatus(student.overall);
                return (
                  <tr key={index} className="hover:bg-primary-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-900">
                      {student.rollNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-900">
                      {student.overall}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Button variant="secondary" size="sm">
                        View Details
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="📚 Subject-wise Performance (Sample)">
        <div className="space-y-3">
          {sampleSubjectData.map((subject, index) => (
            <div key={index} className="p-4 bg-primary-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-primary-900">
                    {subject.code} - {subject.name}
                  </p>
                  <p className="text-xs text-primary-600">
                    {subject.present} / {subject.total} classes attended
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary-900">{subject.percentage}%</p>
                </div>
              </div>
              <div className="w-full bg-primary-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    subject.percentage >= 90
                      ? 'bg-success-600'
                      : subject.percentage >= 75
                      ? 'bg-accent-600'
                      : 'bg-warning-600'
                  }`}
                  style={{ width: `${subject.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="📥 Export Options">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button variant="primary" icon={Download} fullWidth>
            Download PDF
          </Button>
          <Button variant="secondary" icon={Download} fullWidth>
            Download Excel
          </Button>
          <Button variant="secondary" fullWidth>
            Email Report
          </Button>
          <Button variant="secondary" fullWidth>
            Print Report
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Reports;