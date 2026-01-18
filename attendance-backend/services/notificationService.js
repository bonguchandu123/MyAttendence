import Student from '../models/Student.js';
import Attendance from '../models/Attendance.js';
import Subject from '../models/Subject.js';
import { messaging } from '../config/firebase.js';
import cron from 'node-cron';

/**
 * Service to handle automated notifications
 */
class NotificationService {
  
  /**
   * Check and send low attendance alerts
   * Runs daily at 8:00 PM
   */
  static scheduleLowAttendanceAlerts() {
    // Run every day at 8:00 PM
    cron.schedule('0 20 * * *', async () => {
      console.log('Running scheduled low attendance check...');
      
      try {
        const students = await Student.find({
          isActive: true,
          fcmToken: { $ne: null },
          'notificationSettings.notifications': true,
        });

        let alertsSent = 0;
        let alertsFailed = 0;

        for (const student of students) {
          const subjects = await Subject.find({
            branch: student.branch,
            semester: student.semester,
            isActive: true,
          });

          for (const subject of subjects) {
            const attendanceData = await Attendance.getStudentSubjectAttendance(
              student._id,
              subject._id
            );

            // Send alert if attendance is below 75% and they have attended at least 5 classes
            if (attendanceData.percentage < 75 && attendanceData.totalClasses >= 5) {
              try {
                const classesNeeded = Math.ceil(
                  (75 * attendanceData.totalClasses - 100 * attendanceData.attendedClasses) /
                  (100 - 75)
                );

                await messaging.send({
                  notification: {
                    title: '⚠️ Low Attendance Alert',
                    body: `Your ${subject.subjectName} attendance is ${attendanceData.percentage}%. You need to attend ${classesNeeded} more classes to reach 75%.`,
                  },
                  data: {
                    type: 'low_attendance',
                    subjectId: subject._id.toString(),
                    subjectName: subject.subjectName,
                    percentage: attendanceData.percentage.toString(),
                    classesNeeded: classesNeeded.toString(),
                    title: '⚠️ Low Attendance Alert',
                  },
                  token: student.fcmToken,
                });

                alertsSent++;
              } catch (error) {
                console.error(`Failed to send alert to ${student.rollNumber}:`, error);
                alertsFailed++;
              }
            }
          }
        }

        console.log(`Low attendance alerts: ${alertsSent} sent, ${alertsFailed} failed`);
      } catch (error) {
        console.error('Error in scheduled low attendance check:', error);
      }
    });
  }

  /**
   * Send weekly attendance summary
   * Runs every Sunday at 7:00 PM
   */
  static scheduleWeeklySummary() {
    // Run every Sunday at 7:00 PM
    cron.schedule('0 19 * * 0', async () => {
      console.log('Sending weekly attendance summary...');
      
      try {
        const students = await Student.find({
          isActive: true,
          fcmToken: { $ne: null },
          'notificationSettings.notifications': true,
        });

        let summariesSent = 0;

        for (const student of students) {
          try {
            // Calculate overall attendance
            const overallAttendance = await student.getOverallAttendance();

            let emoji = '✓';
            let message = 'Keep up the good work!';
            
            if (overallAttendance < 75) {
              emoji = '⚠️';
              message = 'Please attend classes regularly to improve your attendance.';
            } else if (overallAttendance >= 90) {
              emoji = '🌟';
              message = 'Excellent attendance! Keep it up!';
            }

            await messaging.send({
              notification: {
                title: `${emoji} Weekly Attendance Summary`,
                body: `Your overall attendance: ${overallAttendance}%. ${message}`,
              },
              data: {
                type: 'attendance_reminder',
                percentage: overallAttendance.toString(),
                title: `${emoji} Weekly Attendance Summary`,
              },
              token: student.fcmToken,
            });

            summariesSent++;
          } catch (error) {
            console.error(`Failed to send summary to ${student.rollNumber}:`, error);
          }
        }

        console.log(`Weekly summaries sent: ${summariesSent}`);
      } catch (error) {
        console.error('Error sending weekly summaries:', error);
      }
    });
  }

  /**
   * Send morning reminder for students with classes today
   * Runs every weekday at 7:30 AM
   */
  static scheduleDailyReminders() {
    // Run Monday-Friday at 7:30 AM
    cron.schedule('30 7 * * 1-5', async () => {
      console.log('Sending daily attendance reminders...');
      
      try {
        const students = await Student.find({
          isActive: true,
          fcmToken: { $ne: null },
          'notificationSettings.notifications': true,
        });

        let remindersSent = 0;

        for (const student of students) {
          try {
            await messaging.send({
              notification: {
                title: '📚 Good Morning!',
                body: 'Don\'t forget to attend your classes today. Every class counts!',
              },
              data: {
                type: 'attendance_reminder',
                title: '📚 Good Morning!',
              },
              token: student.fcmToken,
            });

            remindersSent++;
          } catch (error) {
            console.error(`Failed to send reminder to ${student.rollNumber}:`, error);
          }
        }

        console.log(`Daily reminders sent: ${remindersSent}`);
      } catch (error) {
        console.error('Error sending daily reminders:', error);
      }
    });
  }

  /**
   * Send notification when attendance is marked
   */
  static async sendAttendanceMarkedNotification(student, subject, status, percentage) {
    try {
      if (!student.fcmToken || !student.notificationSettings?.notifications) {
        return { success: false, reason: 'No FCM token or notifications disabled' };
      }

      const isPresent = status === 'present';
      const isLowAttendance = percentage < 75;

      let title, body, type;

      if (isPresent) {
        if (percentage >= 90) {
          title = '🌟 Attendance Marked';
          body = `Excellent! You were marked present in ${subject.subjectName}. Keep it up! (${percentage}%)`;
        } else {
          title = '✓ Attendance Marked';
          body = `You were marked present in ${subject.subjectName}. Current: ${percentage}%`;
        }
        type = 'attendance_marked';
      } else {
        if (isLowAttendance) {
          title = '⚠️ Low Attendance Alert';
          body = `You were marked absent in ${subject.subjectName}. Your attendance dropped to ${percentage}%! Please attend next classes.`;
          type = 'low_attendance';
        } else {
          title = '✗ Attendance Marked';
          body = `You were marked absent in ${subject.subjectName}. Current: ${percentage}%`;
          type = 'attendance_marked';
        }
      }

      await messaging.send({
        notification: { title, body },
        data: {
          type,
          subjectId: subject._id.toString(),
          subjectName: subject.subjectName,
          status,
          percentage: percentage.toString(),
          title,
        },
        token: student.fcmToken,
      });

      return { success: true };
    } catch (error) {
      console.error('Error sending attendance notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Initialize all scheduled jobs
   */
  static initializeScheduledJobs() {
    console.log('Initializing notification scheduled jobs...');
    
    this.scheduleLowAttendanceAlerts();
    this.scheduleWeeklySummary();
    this.scheduleDailyReminders();
    
    console.log('All notification jobs scheduled successfully!');
  }
}

export default NotificationService;