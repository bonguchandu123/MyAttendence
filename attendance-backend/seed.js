


// import fetch from 'node-fetch';

// const API_URL = 'http://localhost:3000/api/admin/students/bulk'; // Update with your API URL
// const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NjQ3MGY5YjFiYmJhYjU3NmE2ZTIxYiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2ODE5OTQ0MiwiZXhwIjoxNzcwNzkxNDQyfQ._iBAjQLQMsQjD051xwb4CXqd9SSdR7UFx3nwtvZ5JP0';

// // Generate students from 324103383001 to 324103383066
// const generateStudents = () => {
//   const students = [];
//   const startRoll = 324103383001;
//   const endRoll = 324103383066;
  
//   for (let i = startRoll; i <= endRoll; i++) {
//     students.push({
//       rollNumber: i.toString(),
//       branch: 'CSD',
//       semester: 4,
//       password: i.toString(), // Default password is roll number
//     });
//   }
  
//   return students;
// };

// async function seedStudents() {
//   try {
//     console.log('Starting to seed CSD students...\n');
//     console.log('Roll Number Range: 324103383001 to 324103383066');
//     console.log('Branch: CSD');
//     console.log('Semester: 4\n');
    
//     const students = generateStudents();
//     console.log(`Generated ${students.length} students\n`);
    
//     const response = await fetch(API_URL, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${ADMIN_TOKEN}`,
//       },
//       body: JSON.stringify({ students }),
//     });

//     const data = await response.json();

//     if (response.ok) {
//       console.log('✅ Seed completed successfully!\n');
//       console.log(`✅ Created: ${data.data.created} students`);
//       console.log(`❌ Errors: ${data.data.errors} students\n`);

//       if (data.data.errorDetails.length > 0) {
//         console.log('❌ Error Details:');
//         data.data.errorDetails.forEach(err => {
//           console.log(`  - ${err.rollNumber}: ${err.error}`);
//         });
//         console.log();
//       }

//       if (data.data.students.length > 0) {
//         console.log('✅ Sample Created Students:');
//         data.data.students.slice(0, 5).forEach(student => {
//           console.log(`  - Roll: ${student.rollNumber}`);
//           console.log(`    Email: ${student.email}`);
//           console.log(`    Branch: ${student.branch}, Semester: ${student.semester}`);
//           console.log();
//         });
        
//         if (data.data.students.length > 5) {
//           console.log(`  ... and ${data.data.students.length - 5} more students\n`);
//         }
//       }

//       console.log('📊 Summary:');
//       console.log(`  Total Students: ${students.length}`);
//       console.log(`  Successfully Created: ${data.data.created}`);
//       console.log(`  Failed: ${data.data.errors}`);
//       console.log(`  Branch: CSD`);
//       console.log(`  Semester: 4`);
//       console.log(`\n📝 Note: Default password for each student is their roll number`);
//       console.log(`📧 Email format: [rollnumber]@gvpce.ac.in\n`);
//     } else {
//       console.error('❌ Error seeding students:', data.message);
//     }
//   } catch (error) {
//     console.error('❌ Fatal error:', error.message);
//   }
// }

// // Run the seed function
// seedStudents();






























import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000/api/subjects/bulk'; // Update with your API URL
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NjQ3MGY5YjFiYmJhYjU3NmE2ZTIxYiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2ODE5OTQ0MiwiZXhwIjoxNzcwNzkxNDQyfQ._iBAjQLQMsQjD051xwb4CXqd9SSdR7UFx3nwtvZ5JP0';

const csdSubjects = [
  // SEMESTER 1
  { subjectCode: '22BM1102', subjectName: 'Multivariable Calculus', branch: 'CSD', semester: 1, credits: 3, type: 'Theory' },
  { subjectCode: '22BC1101', subjectName: 'Engineering Chemistry', branch: 'CSD', semester: 1, credits: 3, type: 'Theory' },
  { subjectCode: '22HE1101', subjectName: 'Communicative English', branch: 'CSD', semester: 1, credits: 3, type: 'Theory' },
  { subjectCode: '22EE11D3', subjectName: 'Basic Electrical and Electronics Engineering', branch: 'CSD', semester: 1, credits: 3, type: 'Theory' },
  { subjectCode: '22ES11ED', subjectName: 'Engineering Drawing', branch: 'CSD', semester: 1, credits: 3, type: 'Practical' },
  { subjectCode: '22BC1102', subjectName: 'Engineering Chemistry Lab', branch: 'CSD', semester: 1, credits: 1.5, type: 'Lab' },
  { subjectCode: '22HE1102', subjectName: 'Communicative English Lab', branch: 'CSD', semester: 1, credits: 1.5, type: 'Lab' },
  { subjectCode: '22CS1101', subjectName: 'IT Essentials and Python Programming LAB', branch: 'CSD', semester: 1, credits: 1.5, type: 'Lab' },

  // SEMESTER 2
  { subjectCode: '22BM1105', subjectName: 'Differential Equations and Integral Transforms', branch: 'CSD', semester: 2, credits: 3, type: 'Theory' },
  { subjectCode: '22BP1101', subjectName: 'Applied Physics', branch: 'CSD', semester: 2, credits: 3, type: 'Theory' },
  { subjectCode: '22EC11D2', subjectName: 'Digital Logic and Computer Design', branch: 'CSD', semester: 2, credits: 3, type: 'Theory' },
  { subjectCode: '22CT1101', subjectName: 'Programming for Problem solving using C', branch: 'CSD', semester: 2, credits: 3, type: 'Theory' },
  { subjectCode: '22ES11EW', subjectName: 'Engineering Workshop', branch: 'CSD', semester: 2, credits: 3, type: 'Practical' },
  { subjectCode: '22BP1102', subjectName: 'Applied Physics Lab', branch: 'CSD', semester: 2, credits: 1.5, type: 'Lab' },
  { subjectCode: '22CT1102', subjectName: 'Programming for Problem solving using C Lab', branch: 'CSD', semester: 2, credits: 1.5, type: 'Lab' },
  { subjectCode: '22EE11D4', subjectName: 'Basic Electrical and Electronics Engineering Lab', branch: 'CSD', semester: 2, credits: 1.5, type: 'Lab' },
  { subjectCode: '22BC11Z1', subjectName: 'Environmental Science', branch: 'CSD', semester: 2, credits: 0, type: 'Theory' },

  // SEMESTER 3
  { subjectCode: '22BM1110', subjectName: 'Linear Algebra and Applications', branch: 'CSD', semester: 3, credits: 3, type: 'Theory' },
  { subjectCode: '22CD1101', subjectName: 'Fundamentals of Data Science', branch: 'CSD', semester: 3, credits: 3, type: 'Theory' },
  { subjectCode: '22CM1102', subjectName: 'Discrete Structures', branch: 'CSD', semester: 3, credits: 3, type: 'Theory' },
  { subjectCode: '22CT1103', subjectName: 'Data Structures and Algorithms', branch: 'CSD', semester: 3, credits: 3, type: 'Theory' },
  { subjectCode: '22CT1110', subjectName: 'Operating Systems', branch: 'CSD', semester: 3, credits: 3, type: 'Theory' },
  { subjectCode: '22ME11D1', subjectName: 'Design Thinking and Innovation', branch: 'CSD', semester: 3, credits: 1.5, type: 'Practical' },
  { subjectCode: '22CD1102', subjectName: 'Data Science Lab', branch: 'CSD', semester: 3, credits: 1.5, type: 'Lab' },
  { subjectCode: '22CT1106', subjectName: 'Data Structures and Algorithms Lab', branch: 'CSD', semester: 3, credits: 1.5, type: 'Lab' },
  { subjectCode: '22HM11Z1', subjectName: 'Human Values and Professional Ethics', branch: 'CSD', semester: 3, credits: 0, type: 'Theory' },
  { subjectCode: '22CS11S1', subjectName: 'Advanced Python Programming Lab', branch: 'CSD', semester: 3, credits: 2, type: 'Lab' },

  // SEMESTER 4
  { subjectCode: '22BM1109', subjectName: 'Statistical Methods', branch: 'CSD', semester: 4, credits: 3, type: 'Theory' },
  { subjectCode: '22HM1101', subjectName: 'Accounting and Economics for Engineers', branch: 'CSD', semester: 4, credits: 3, type: 'Theory' },
  { subjectCode: '22CD1103', subjectName: 'Data Mining', branch: 'CSD', semester: 4, credits: 3, type: 'Theory' },
  { subjectCode: '22CT1105', subjectName: 'Database Management Systems', branch: 'CSD', semester: 4, credits: 3, type: 'Theory' },
  { subjectCode: '22CT1109', subjectName: 'Design and Analysis of Algorithms', branch: 'CSD', semester: 4, credits: 3, type: 'Theory' },
  { subjectCode: '22CD1104', subjectName: 'Data Mining Lab', branch: 'CSD', semester: 4, credits: 1.5, type: 'Lab' },
  { subjectCode: '22CT1108', subjectName: 'Database Management Systems Lab', branch: 'CSD', semester: 4, credits: 1.5, type: 'Lab' },
  { subjectCode: '22CS1102', subjectName: 'Design and Analysis of Algorithms Lab', branch: 'CSD', semester: 4, credits: 1.5, type: 'Lab' },
  { subjectCode: '22CM11S1', subjectName: 'Java Programming Lab', branch: 'CSD', semester: 4, credits: 2, type: 'Lab' },

  // SEMESTER 5
  { subjectCode: '22CT1152', subjectName: 'Big Data Analytics', branch: 'CSD', semester: 5, credits: 3, type: 'Theory' },
  { subjectCode: '22CS1107', subjectName: 'Machine Learning', branch: 'CSD', semester: 5, credits: 3, type: 'Theory' },
  { subjectCode: '22CM1108', subjectName: 'Automata Theory and Compiler Design', branch: 'CSD', semester: 5, credits: 3, type: 'Theory' },
  { subjectCode: '22CT1150', subjectName: 'Advanced Data Structures & Algorithms', branch: 'CSD', semester: 5, credits: 3, type: 'Theory' },
  { subjectCode: '22CT1112', subjectName: 'Computer Networks', branch: 'CSD', semester: 5, credits: 3, type: 'Theory' },
  { subjectCode: '22CM1151', subjectName: 'Business Analytics', branch: 'CSD', semester: 5, credits: 3, type: 'Theory' },
  { subjectCode: '22CM11L1', subjectName: 'Information Security (MOOCS)', branch: 'CSD', semester: 5, credits: 3, type: 'Theory' },
  { subjectCode: '22CS11L8', subjectName: 'Computer Vision (MOOCS)', branch: 'CSD', semester: 5, credits: 3, type: 'Theory' },
  { subjectCode: '22CD1105', subjectName: 'Big Data Analytics Lab', branch: 'CSD', semester: 5, credits: 1.5, type: 'Lab' },
  { subjectCode: '22CS1109', subjectName: 'Machine Learning Applications Lab', branch: 'CSD', semester: 5, credits: 1.5, type: 'Lab' },
  { subjectCode: '22HE11S1', subjectName: 'Professional Communication & Soft Skills Lab', branch: 'CSD', semester: 5, credits: 2, type: 'Lab' },
  { subjectCode: '22CD11J1', subjectName: 'Mini Project -I / Intern - I', branch: 'CSD', semester: 5, credits: 1.5, type: 'Project' },
  { subjectCode: '22HM11Z2', subjectName: 'Constitution Of India', branch: 'CSD', semester: 5, credits: 0, type: 'Theory' },

  // SEMESTER 6
  { subjectCode: '22CT1151', subjectName: 'Artificial Intelligence', branch: 'CSD', semester: 6, credits: 3, type: 'Theory' },
  { subjectCode: '22CT1155', subjectName: 'Principles of Deep Learning', branch: 'CSD', semester: 6, credits: 3, type: 'Theory' },
  { subjectCode: '22CS1152', subjectName: 'Cloud Computing', branch: 'CSD', semester: 6, credits: 3, type: 'Theory' },
  { subjectCode: '22CS1156', subjectName: 'Natural Language Processing', branch: 'CSD', semester: 6, credits: 3, type: 'Theory' },
  { subjectCode: '22CS1150', subjectName: 'Information Retrieval and Search Engines', branch: 'CSD', semester: 6, credits: 3, type: 'Theory' },
  { subjectCode: '22CD1106', subjectName: 'Artificial Intelligence Applications Lab', branch: 'CSD', semester: 6, credits: 1.5, type: 'Lab' },
  { subjectCode: '22CM1113', subjectName: 'Deep Learning Lab', branch: 'CSD', semester: 6, credits: 1.5, type: 'Lab' },
  { subjectCode: '22CD1107', subjectName: 'Data Visualisation Lab', branch: 'CSD', semester: 6, credits: 1.5, type: 'Lab' },
  { subjectCode: '22CS11S3', subjectName: 'Internet of Things Lab', branch: 'CSD', semester: 6, credits: 2, type: 'Lab' },
  { subjectCode: '22HM11Z3', subjectName: 'Essence of Indian Traditional Knowledge', branch: 'CSD', semester: 6, credits: 0, type: 'Theory' },

  // SEMESTER 7
  { subjectCode: '22HM1102', subjectName: 'Universal Human Values', branch: 'CSD', semester: 7, credits: 3, type: 'Theory' },
  { subjectCode: '22CM1152', subjectName: 'Multimodal Learning', branch: 'CSD', semester: 7, credits: 3, type: 'Theory' },
  { subjectCode: '22CS1154', subjectName: 'Unstructured Databases', branch: 'CSD', semester: 7, credits: 3, type: 'Theory' },
  { subjectCode: '22CS1155', subjectName: 'Augmented Reality and Virtual Reality', branch: 'CSD', semester: 7, credits: 3, type: 'Theory' },
  { subjectCode: '22CS11L7', subjectName: 'Introduction To Industry 4.0 And Industrial Internet of Things (MOOCs)', branch: 'CSD', semester: 7, credits: 3, type: 'Theory' },
  { subjectCode: '22CS1157', subjectName: 'Cyber Security', branch: 'CSD', semester: 7, credits: 3, type: 'Theory' },
  { subjectCode: '22CS1158', subjectName: 'Wireless Sensor Networks', branch: 'CSD', semester: 7, credits: 3, type: 'Theory' },
  { subjectCode: '22CS1159', subjectName: 'Devops', branch: 'CSD', semester: 7, credits: 3, type: 'Theory' },
  { subjectCode: '22CM11L3', subjectName: 'GPU Architectures and Programming (MOOCs)', branch: 'CSD', semester: 7, credits: 3, type: 'Theory' },
  { subjectCode: '22CS1104', subjectName: 'Software Engineering Essentials', branch: 'CSD', semester: 7, credits: 3, type: 'Theory' },
  { subjectCode: '22CS1160', subjectName: 'Blockchain Technologies', branch: 'CSD', semester: 7, credits: 3, type: 'Theory' },
  { subjectCode: '22CM1111', subjectName: 'Reinforcement Learning', branch: 'CSD', semester: 7, credits: 3, type: 'Theory' },
  { subjectCode: '22CS11L9', subjectName: 'Ethical Hacking (MOOCs)', branch: 'CSD', semester: 7, credits: 3, type: 'Theory' },
  { subjectCode: '22CD11J2', subjectName: 'Mini Project-II / Intern-II', branch: 'CSD', semester: 7, credits: 3, type: 'Project' },
  { subjectCode: '22CS11S4', subjectName: 'Blockchain Technologies Lab', branch: 'CSD', semester: 7, credits: 2, type: 'Lab' },
  { subjectCode: '22CS11S5', subjectName: 'Cyber Security Lab', branch: 'CSD', semester: 7, credits: 2, type: 'Lab' },
  { subjectCode: '22CS11S6', subjectName: 'Devops Lab', branch: 'CSD', semester: 7, credits: 2, type: 'Lab' },
  { subjectCode: '22CS11S7', subjectName: 'Unstructured Databases Lab', branch: 'CSD', semester: 7, credits: 2, type: 'Lab' },

  // SEMESTER 8
  { subjectCode: '22CD11PW', subjectName: 'Project Work', branch: 'CSD', semester: 8, credits: 12, type: 'Project' },
];

async function seedSubjects() {
  try {
    console.log('Starting to seed CSD subjects...\n');
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
      },
      body: JSON.stringify({ subjects: csdSubjects }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Seed completed successfully!\n');
      console.log(`✅ Created: ${data.data.created} subjects`);
      console.log(`❌ Errors: ${data.data.errors} subjects\n`);

      if (data.data.errorDetails.length > 0) {
        console.log('Error Details:');
        data.data.errorDetails.forEach(err => {
          console.log(`  - ${err.subjectCode}: ${err.error}`);
        });
      }

      console.log('\n📊 Summary by Semester:');
      for (let sem = 1; sem <= 8; sem++) {
        const semSubjects = csdSubjects.filter(s => s.semester === sem);
        console.log(`  Semester ${sem}: ${semSubjects.length} subjects`);
      }
    } else {
      console.error('❌ Error seeding subjects:', data.message);
    }
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
  }
}

// Run the seed function
seedSubjects();