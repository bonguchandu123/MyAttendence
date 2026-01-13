import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Calendar, Clock, AlertTriangle, ChevronDown, 
  ChevronUp, Download, FileSpreadsheet, FileText 
} from 'lucide-react';
import { attendanceAPI } from '../utils/api';
import { BRANCHES, SEMESTERS, formatDate } from '../utils/helpers';
import Card from '../components/common/Card';
import Select from '../components/common/Select';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';

const Attendance = () => {
  const [stats, setStats] = useState(null);
  const [lowAttendance, setLowAttendance] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [expandedSession, setExpandedSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split('T')[0],
    branch: '',
    semester: '',
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, lowAttendanceRes, recordsRes] = await Promise.all([
        attendanceAPI.getStats({
          ...(filters.branch && { branch: filters.branch }),
          ...(filters.semester && { semester: filters.semester }),
        }),
        attendanceAPI.getLowAttendance({
          threshold: 75,
          ...(filters.branch && { branch: filters.branch }),
          ...(filters.semester && { semester: filters.semester }),
        }),
        attendanceAPI.getRecords({
          ...(filters.date && { date: filters.date }),
          ...(filters.branch && { branch: filters.branch }),
          ...(filters.semester && { semester: filters.semester }),
        }),
      ]);

      setStats(statsRes.data.data);
      setLowAttendance(lowAttendanceRes.data.data);
      setAttendanceRecords(recordsRes.data.data);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      alert('Failed to fetch attendance data');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const toggleSessionExpand = (index) => {
    setExpandedSession(expandedSession === index ? null : index);
  };

  const handleExportCSV = () => {
    const token = localStorage.getItem('token');
    const exportParams = {
      ...(filters.date && { date: filters.date }),
      ...(filters.branch && { branch: filters.branch }),
      ...(filters.semester && { semester: filters.semester }),
    };
    
    const url = attendanceAPI.exportCSV(exportParams);
    window.open(`${url}&token=${token}`, '_blank');
  };

  const handleExportSummaryCSV = () => {
    if (!filters.branch || !filters.semester) {
      alert('Please select both Branch and Semester to export summary');
      return;
    }

    const token = localStorage.getItem('token');
    const exportParams = {
      branch: filters.branch,
      semester: filters.semester,
    };
    
    const url = attendanceAPI.exportSummaryCSV(exportParams);
    window.open(`${url}&token=${token}`, '_blank');
  };

  const handleExportPDF = () => {
    // Print current page as PDF
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader size="lg" text="Loading attendance data..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-primary-900">📊 Attendance Overview</h1>
        <p className="text-primary-600 mt-1">Monitor and manage attendance records</p>
      </div>

      <Card title="🔍 Filter Attendance Records">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            label="Date"
            type="date"
            name="date"
            value={filters.date}
            onChange={handleFilterChange}
          />
          <Select
            label="Branch"
            name="branch"
            value={filters.branch}
            onChange={handleFilterChange}
            options={BRANCHES}
            placeholder="All Branches"
          />
          <Select
            label="Semester"
            name="semester"
            value={filters.semester}
            onChange={handleFilterChange}
            options={SEMESTERS}
            placeholder="All Semesters"
          />
          <div className="flex items-end">
            <Button
              variant="secondary"
              onClick={() => setFilters({ 
                date: new Date().toISOString().split('T')[0], 
                branch: '', 
                semester: '' 
              })}
              fullWidth
            >
              Reset
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-accent-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-accent-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary-600">Overall Attendance</p>
              <p className="text-2xl font-bold text-primary-900">
                {stats?.overallPercentage || 0}%
              </p>
            </div>
          </div>
          <div className="space-y-1 text-sm text-primary-600">
            <p>Total Classes: {stats?.totalSessions || 0}</p>
            <p>Present: {stats?.presentCount || 0}</p>
            <p>Absent: {stats?.absentCount || 0}</p>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-success-100 rounded-lg">
              <Calendar className="w-6 h-6 text-success-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary-600">Today's Date</p>
              <p className="text-xl font-bold text-primary-900">
                {formatDate(filters.date)}
              </p>
            </div>
          </div>
          <div className="space-y-1 text-sm text-primary-600">
            <p>Filters Applied:</p>
            <p>Branch: {filters.branch || 'All'}</p>
            <p>Semester: {filters.semester || 'All'}</p>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-warning-100 rounded-lg">
              <Clock className="w-6 h-6 text-warning-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary-600">Sessions Today</p>
              <p className="text-2xl font-bold text-primary-900">
                {attendanceRecords.length}
              </p>
            </div>
          </div>
          <div className="space-y-1 text-sm text-primary-600">
            <p>Attendance sessions marked</p>
          </div>
        </Card>
      </div>

      {/* ATTENDANCE RECORDS LIST */}
      <Card title="📋 Recent Attendance Records">
        {attendanceRecords.length === 0 ? (
          <div className="text-center py-12 text-primary-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No attendance records found for selected filters</p>
          </div>
        ) : (
          <div className="space-y-3">
            {attendanceRecords.map((session, index) => (
              <div
                key={index}
                className="border border-primary-200 rounded-lg overflow-hidden"
              >
                {/* Session Header */}
                <div className="bg-primary-50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-primary-600" />
                          <span className="text-sm font-medium text-primary-900">
                            {formatDate(session.date)}
                          </span>
                          <span className="text-xs text-primary-600">
                            ({session.day})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary-600" />
                          <span className="text-xs text-primary-600">
                            Periods: {session.periods.map(p => p.periodNumber).join(', ')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-sm font-semibold text-primary-900">
                            {session.subject.subjectName}
                          </p>
                          <p className="text-xs text-primary-600">
                            {session.subject.subjectCode} • {session.subject.branch} - Sem {session.subject.semester}
                          </p>
                        </div>
                        <div className="text-xs text-primary-600">
                          <p>👨‍🏫 {session.teacher.name}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-primary-600">Attendance</p>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-success-600">
                            ✓ {session.presentCount}
                          </span>
                          <span className="text-sm font-semibold text-error-600">
                            ✗ {session.absentCount}
                          </span>
                          <span className="text-sm text-primary-600">
                            / {session.totalStudents}
                          </span>
                        </div>
                        <p className="text-lg font-bold text-primary-900">
                          {Math.round((session.presentCount / session.totalStudents) * 100)}%
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => toggleSessionExpand(index)}
                        >
                          {expandedSession === index ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Student List */}
                {expandedSession === index && (
                  <div className="p-4 bg-white">
                    <h4 className="text-sm font-semibold text-primary-900 mb-3">
                      Student Attendance Details ({session.totalStudents} students)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                      {session.students.map((student, idx) => {
                        const hasPresent = student.periods.some(p => p.status === 'present');
                        return (
                          <div
                            key={idx}
                            className={`p-2 rounded border text-xs flex items-center justify-between ${
                              hasPresent
                                ? 'bg-success-50 border-success-200'
                                : 'bg-error-50 border-error-200'
                            }`}
                          >
                            <div>
                              <span className="font-semibold">
                                {student.rollNumber}
                              </span>
                              <span className="text-primary-600 ml-2">
                                {student.email.split('@')[0]}
                              </span>
                            </div>
                            <div className="flex gap-1">
                              {student.periods.map((period, pIdx) => (
                                <span
                                  key={pIdx}
                                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                                    period.status === 'present'
                                      ? 'bg-success-100 text-success-700'
                                      : 'bg-error-100 text-error-700'
                                  }`}
                                >
                                  P{period.periodNumber}: {period.status === 'present' ? '✓' : '✗'}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {lowAttendance.length > 0 && (
        <Card title="🔴 Low Attendance Alerts">
          <div className="bg-error-50 border border-error-200 rounded-lg p-4 mb-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-error-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-error-900">
                ⚠️ {lowAttendance.length} students below 75% threshold
              </p>
              <p className="text-xs text-error-700 mt-1">
                These students require immediate attention
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {lowAttendance.slice(0, 5).map((item, index) => (
              <div
                key={index}
                className="p-4 bg-white rounded-lg border border-primary-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-primary-900">
                      {item.student.rollNumber}
                    </p>
                    <p className="text-xs text-primary-600">
                      {item.student.branch} - Semester {item.student.semester}
                    </p>
                  </div>
                </div>
                <div className="space-y-1">
                  {item.subjects.map((subject, idx) => (
                    <p key={idx} className="text-xs text-error-700">
                      • {subject.subjectName} ({subject.subjectCode}): {subject.percentage}% 
                      ({subject.attendedClasses}/{subject.totalClasses})
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {lowAttendance.length > 5 && (
            <Button variant="secondary" fullWidth className="mt-4">
              View All ({lowAttendance.length} students)
            </Button>
          )}
        </Card>
      )}

      <Card title="📥 Export Options">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button 
            variant="secondary" 
            fullWidth
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Records (CSV)
          </Button>
          <Button 
            variant="secondary" 
            fullWidth
            onClick={handleExportSummaryCSV}
            className="flex items-center justify-center gap-2"
            disabled={!filters.branch || !filters.semester}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Summary (CSV)
          </Button>
          <Button 
            variant="secondary" 
            fullWidth
            onClick={handleExportPDF}
            className="flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Print/PDF
          </Button>
          <Button 
            variant="secondary" 
            fullWidth
            className="flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export All
          </Button>
        </div>
        {(!filters.branch || !filters.semester) && (
          <p className="text-xs text-warning-600 mt-2">
            ⚠️ Select Branch and Semester to export summary report
          </p>
        )}
      </Card>
    </div>
  );
};

export default Attendance;