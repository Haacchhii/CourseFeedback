export const mockStudents = [
  // BSIT Students
  {
    email: 'maria.santos.bsit1@lpubatangas.edu.ph',
    name: 'Maria Santos',
    role: 'student',
    program: 'BSIT',
    yearLevel: 1,
    password: 'changeme'
  },
  {
    email: 'juan.dela.cruz.bsit2@lpubatangas.edu.ph',
    name: 'Juan Dela Cruz',
    role: 'student',
    program: 'BSIT',
    yearLevel: 2,
    password: 'changeme'
  },
  {
    email: 'ana.reyes.bsit3@lpubatangas.edu.ph',
    name: 'Ana Reyes',
    role: 'student',
    program: 'BSIT',
    yearLevel: 3,
    password: 'changeme'
  },
  {
    email: 'carlos.garcia.bsit4@lpubatangas.edu.ph',
    name: 'Carlos Garcia',
    role: 'student',
    program: 'BSIT',
    yearLevel: 4,
    password: 'changeme'
  },
  // BSCS Data Science Students
  {
    email: 'sophia.martinez.bscsds1@lpubatangas.edu.ph',
    name: 'Sophia Martinez',
    role: 'student',
    program: 'BSCS-DS',
    yearLevel: 1,
    password: 'changeme'
  },
  {
    email: 'miguel.lopez.bscsds2@lpubatangas.edu.ph',
    name: 'Miguel Lopez',
    role: 'student',
    program: 'BSCS-DS',
    yearLevel: 2,
    password: 'changeme'
  },
  {
    email: 'isabella.torres.bscsds3@lpubatangas.edu.ph',
    name: 'Isabella Torres',
    role: 'student',
    program: 'BSCS-DS',
    yearLevel: 3,
    password: 'changeme'
  },
  // BSCS General Students
  {
    email: 'daniel.rivera.bscs1@lpubatangas.edu.ph',
    name: 'Daniel Rivera',
    role: 'student',
    program: 'BSCS',
    yearLevel: 1,
    password: 'changeme'
  },
  {
    email: 'camila.flores.bscs2@lpubatangas.edu.ph',
    name: 'Camila Flores',
    role: 'student',
    program: 'BSCS',
    yearLevel: 2,
    password: 'changeme'
  },
  {
    email: 'alex.morales.bscs3@lpubatangas.edu.ph',
    name: 'Alex Morales',
    role: 'student',
    program: 'BSCS',
    yearLevel: 3,
    password: 'changeme'
  },
  // BS Cybersecurity Students
  {
    email: 'lucas.hernandez.bscy1@lpubatangas.edu.ph',
    name: 'Lucas Hernandez',
    role: 'student',
    program: 'BS-CY',
    yearLevel: 1,
    password: 'changeme'
  },
  {
    email: 'maya.cruz.bscy2@lpubatangas.edu.ph',
    name: 'Maya Cruz',
    role: 'student',
    program: 'BS-CY',
    yearLevel: 2,
    password: 'changeme'
  },
  {
    email: 'ethan.ramos.bscy3@lpubatangas.edu.ph',
    name: 'Ethan Ramos',
    role: 'student',
    program: 'BS-CY',
    yearLevel: 3,
    password: 'changeme'
  },
  // BMA Students
  {
    email: 'zoe.valdez.bma1@lpubatangas.edu.ph',
    name: 'Zoe Valdez',
    role: 'student',
    program: 'BMA',
    yearLevel: 1,
    password: 'changeme'
  },
  {
    email: 'ryan.perez.bma2@lpubatangas.edu.ph',
    name: 'Ryan Perez',
    role: 'student',
    program: 'BMA',
    yearLevel: 2,
    password: 'changeme'
  },
  {
    email: 'luna.castillo.bma3@lpubatangas.edu.ph',
    name: 'Luna Castillo',
    role: 'student',
    program: 'BMA',
    yearLevel: 3,
    password: 'changeme'
  },
  {
    email: 'diego.mendoza.bma4@lpubatangas.edu.ph',
    name: 'Diego Mendoza',
    role: 'student',
    program: 'BMA',
    yearLevel: 4,
    password: 'changeme'
  }
];

export const mockCourses = [
  // BSIT Year 1 - First Semester
  { id: 'BSIT101', name: 'Introduction to Computing', instructor: 'Dr. Maria Santos', semester: 'First Semester 2025', program: 'BSIT', yearLevel: 1, status: 'Pending', classCode: 'ITCO-1001-A', enrolledStudents: 45 },
  { id: 'BSIT102', name: 'Computer Programming 1', instructor: 'Prof. Juan Carlos', semester: 'First Semester 2025', program: 'BSIT', yearLevel: 1, status: 'Pending', classCode: 'CPRO-1001-A', enrolledStudents: 43 },
  { id: 'BSIT103', name: 'Understanding the Self', instructor: 'Dr. Ana Lopez', semester: 'First Semester 2025', program: 'BSIT', yearLevel: 1, status: 'Pending', classCode: 'SELF-1001-A', enrolledStudents: 47 },
  { id: 'BSIT104', name: 'Mathematics in the Modern World', instructor: 'Prof. Carlos Rivera', semester: 'First Semester 2025', program: 'BSIT', yearLevel: 1, status: 'Pending', classCode: 'MATH-1001-A', enrolledStudents: 42 },
  { id: 'BSIT105', name: 'The Contemporary World', instructor: 'Dr. Sofia Garcia', semester: 'First Semester 2025', program: 'BSIT', yearLevel: 1, status: 'Pending', classCode: 'CONT-1001-A', enrolledStudents: 46 },
  
  // BSIT Year 1 - Second Semester
  { id: 'BSIT106', name: 'Computer Programming 2', instructor: 'Prof. Juan Carlos', semester: 'Second Semester 2025', program: 'BSIT', yearLevel: 1, status: 'Pending', classCode: 'CPRO-1002-A', enrolledStudents: 41 },
  { id: 'BSIT107', name: 'Computer Organization', instructor: 'Dr. Miguel Torres', semester: 'Second Semester 2025', program: 'BSIT', yearLevel: 1, status: 'Pending', classCode: 'CORG-1002-A', enrolledStudents: 39 },
  { id: 'BSIT108', name: 'Purposive Communication', instructor: 'Prof. Isabella Reyes', semester: 'Second Semester 2025', program: 'BSIT', yearLevel: 1, status: 'Pending', classCode: 'COMM-1002-A', enrolledStudents: 44 },
  { id: 'BSIT109', name: 'College Algebra', instructor: 'Dr. Daniel Martinez', semester: 'Second Semester 2025', program: 'BSIT', yearLevel: 1, status: 'Pending', classCode: 'ALGE-1002-A', enrolledStudents: 40 },
  
  // BSIT Year 2 - First Semester
  { id: 'BSIT201', name: 'Data Structures and Algorithms', instructor: 'Dr. Alex Morales', semester: 'First Semester 2025', program: 'BSIT', yearLevel: 2, status: 'Pending', classCode: 'DSAL-2001-A', enrolledStudents: 38 },
  { id: 'BSIT202', name: 'Operating Systems', instructor: 'Prof. Maya Cruz', semester: 'First Semester 2025', program: 'BSIT', yearLevel: 2, status: 'Pending', classCode: 'OPER-2001-A', enrolledStudents: 36 },
  { id: 'BSIT203', name: 'Trigonometry', instructor: 'Dr. Lucas Hernandez', semester: 'First Semester 2025', program: 'BSIT', yearLevel: 2, status: 'Pending', classCode: 'TRIG-2001-A', enrolledStudents: 37 },
  
  // BSIT Year 2 - Second Semester
  { id: 'BSIT204', name: 'Object-Oriented Programming', instructor: 'Prof. Zoe Valdez', semester: 'Second Semester 2025', program: 'BSIT', yearLevel: 2, status: 'Pending', classCode: 'OOPR-2002-A', enrolledStudents: 35 },
  { id: 'BSIT205', name: 'Web Systems and Technologies', instructor: 'Dr. Ryan Perez', semester: 'Second Semester 2025', program: 'BSIT', yearLevel: 2, status: 'Pending', classCode: 'WEBS-2002-A', enrolledStudents: 33 },
  { id: 'BSIT206', name: 'Systems Analysis & Design', instructor: 'Prof. Luna Castillo', semester: 'Second Semester 2025', program: 'BSIT', yearLevel: 2, status: 'Pending', classCode: 'SYAN-2002-A', enrolledStudents: 34 },
  { id: 'BSIT207', name: 'Networking 1', instructor: 'Dr. Diego Mendoza', semester: 'Second Semester 2025', program: 'BSIT', yearLevel: 2, status: 'Pending', classCode: 'NETW-2002-A', enrolledStudents: 32 },
  
  // BSIT Year 3 - First Semester
  { id: 'BSIT301', name: 'Information Management', instructor: 'Dr. Elena Rodriguez', semester: 'First Semester 2025', program: 'BSIT', yearLevel: 3, status: 'Pending', classCode: 'INFM-3001-A', enrolledStudents: 31 },
  { id: 'BSIT302', name: 'Human Computer Interaction', instructor: 'Prof. Antonio Silva', semester: 'First Semester 2025', program: 'BSIT', yearLevel: 3, status: 'Pending', classCode: 'HCIN-3001-A', enrolledStudents: 29 },
  { id: 'BSIT303', name: 'Networking 2', instructor: 'Dr. Carmen Vega', semester: 'First Semester 2025', program: 'BSIT', yearLevel: 3, status: 'Pending', classCode: 'NETW-3001-A', enrolledStudents: 30 },
  { id: 'BSIT304', name: 'Capstone Project 1', instructor: 'Prof. Roberto Campos', semester: 'First Semester 2025', program: 'BSIT', yearLevel: 3, status: 'Pending', classCode: 'CAPS-3001-A', enrolledStudents: 28 },
  
  // BSIT Year 4 - First Semester
  { id: 'BSIT401', name: 'Applications Development and Emerging Technologies', instructor: 'Dr. Patricia Moreno', semester: 'First Semester 2025', program: 'BSIT', yearLevel: 4, status: 'Pending', classCode: 'ADET-4001-A', enrolledStudents: 27 },
  { id: 'BSIT402', name: 'Computer Troubleshooting and Repair', instructor: 'Prof. Fernando Gutierrez', semester: 'First Semester 2025', program: 'BSIT', yearLevel: 4, status: 'Pending', classCode: 'CTRP-4001-A', enrolledStudents: 25 },
  { id: 'BSIT403', name: 'Capstone Project 2-Technopreneurship', instructor: 'Dr. Gabriela Jimenez', semester: 'First Semester 2025', program: 'BSIT', yearLevel: 4, status: 'Pending', classCode: 'CAPS-4001-A', enrolledStudents: 26 },
  
  // BSCS Data Science Year 1 - First Semester
  { id: 'CSDS101', name: 'Introduction to Computing', instructor: 'Dr. Maria Santos', semester: 'First Semester 2025', program: 'BSCS-DS', yearLevel: 1, status: 'Pending', classCode: 'ITCO-1001-B', enrolledStudents: 32 },
  { id: 'CSDS102', name: 'Computer Programming 1', instructor: 'Prof. Juan Carlos', semester: 'First Semester 2025', program: 'BSCS-DS', yearLevel: 1, status: 'Pending', classCode: 'CPRO-1001-B', enrolledStudents: 30 },
  { id: 'CSDS103', name: 'Digital Design', instructor: 'Dr. Alexandra Ruiz', semester: 'First Semester 2025', program: 'BSCS-DS', yearLevel: 1, status: 'Pending', classCode: 'DDES-1001-A', enrolledStudents: 31 },
  { id: 'CSDS104', name: 'College Algebra', instructor: 'Dr. Daniel Martinez', semester: 'First Semester 2025', program: 'BSCS-DS', yearLevel: 1, status: 'Pending', classCode: 'ALGE-1001-B', enrolledStudents: 29 },
  
  // BSCS Data Science Year 2 - First Semester
  { id: 'CSDS201', name: 'Systems Analysis and Design', instructor: 'Prof. Luna Castillo', semester: 'First Semester 2025', program: 'BSCS-DS', yearLevel: 2, status: 'Pending', classCode: 'SYAN-2001-B', enrolledStudents: 28 },
  { id: 'CSDS202', name: 'Object-Oriented Programming', instructor: 'Prof. Zoe Valdez', semester: 'First Semester 2025', program: 'BSCS-DS', yearLevel: 2, status: 'Pending', classCode: 'OOPR-2001-B', enrolledStudents: 27 },
  { id: 'CSDS203', name: 'Programming Languages', instructor: 'Dr. Victor Navarro', semester: 'First Semester 2025', program: 'BSCS-DS', yearLevel: 2, status: 'Pending', classCode: 'PROG-2001-A', enrolledStudents: 26 },
  { id: 'CSDS204', name: 'Differential Calculus', instructor: 'Prof. Beatriz Herrera', semester: 'First Semester 2025', program: 'BSCS-DS', yearLevel: 2, status: 'Pending', classCode: 'CALC-2001-A', enrolledStudents: 25 },
  
  // BSCS Data Science Year 2 - Second Semester
  { id: 'CSDS205', name: 'Computational Statistics', instructor: 'Dr. Ricardo Delgado', semester: 'Second Semester 2025', program: 'BSCS-DS', yearLevel: 2, status: 'Pending', classCode: 'STAT-2002-A', enrolledStudents: 24 },
  { id: 'CSDS206', name: 'Artificial Intelligence and Machine Learning', instructor: 'Prof. Natalia Vargas', semester: 'Second Semester 2025', program: 'BSCS-DS', yearLevel: 2, status: 'Pending', classCode: 'AIML-2002-A', enrolledStudents: 23 },
  { id: 'CSDS207', name: 'Software Engineering', instructor: 'Dr. Emilio Castro', semester: 'Second Semester 2025', program: 'BSCS-DS', yearLevel: 2, status: 'Pending', classCode: 'SENG-2002-A', enrolledStudents: 22 },
  
  // BS Cybersecurity Year 1 - First Semester
  { id: 'BSCY101', name: 'Introduction to Computers and Networking', instructor: 'Dr. Sebastian Ortega', semester: 'First Semester 2025', program: 'BS-CY', yearLevel: 1, status: 'Pending', classCode: 'ICNE-1001-A', enrolledStudents: 35 },
  { id: 'BSCY102', name: 'Introduction to Cybersecurity', instructor: 'Prof. Valentina Espinoza', semester: 'First Semester 2025', program: 'BS-CY', yearLevel: 1, status: 'Pending', classCode: 'ICYB-1001-A', enrolledStudents: 33 },
  { id: 'BSCY103', name: 'Programming Fundamentals', instructor: 'Dr. Alejandro Rojas', semester: 'First Semester 2025', program: 'BS-CY', yearLevel: 1, status: 'Pending', classCode: 'PROG-1001-A', enrolledStudents: 34 },
  
  // BS Cybersecurity Year 2 - First Semester
  { id: 'BSCY201', name: 'CCNA 1 - Networking 1', instructor: 'Prof. Cristina Molina', semester: 'First Semester 2025', program: 'BS-CY', yearLevel: 2, status: 'Pending', classCode: 'CCNA-2001-A', enrolledStudents: 26 },
  { id: 'BSCY202', name: 'Machine Learning and AI for Cybersecurity', instructor: 'Dr. Joaquin Paredes', semester: 'First Semester 2025', program: 'BS-CY', yearLevel: 2, status: 'Pending', classCode: 'MAIC-2001-A', enrolledStudents: 25 },
  { id: 'BSCY203', name: 'Cryptography and Cryptanalysis', instructor: 'Prof. Mariana Fuentes', semester: 'First Semester 2025', program: 'BS-CY', yearLevel: 2, status: 'Pending', classCode: 'CRYP-2001-A', enrolledStudents: 24 },
  { id: 'BSCY204', name: 'Ethical Hacking and Defense Strategy', instructor: 'Dr. Rodrigo Aguilar', semester: 'First Semester 2025', program: 'BS-CY', yearLevel: 2, status: 'Pending', classCode: 'EHDS-2001-A', enrolledStudents: 23 },
  
  // BS Cybersecurity Year 3 - First Semester
  { id: 'BSCY301', name: 'Legal Aspects and Issues of Cybersecurity', instructor: 'Prof. Lucia Sandoval', semester: 'First Semester 2025', program: 'BS-CY', yearLevel: 3, status: 'Pending', classCode: 'LAIC-3001-A', enrolledStudents: 20 },
  { id: 'BSCY302', name: 'Cyber Incident Analysis and Response', instructor: 'Dr. Manuel Cortez', semester: 'First Semester 2025', program: 'BS-CY', yearLevel: 3, status: 'Pending', classCode: 'CIAR-3001-A', enrolledStudents: 19 },
  { id: 'BSCY303', name: 'Capstone Project 2', instructor: 'Prof. Esperanza Medina', semester: 'First Semester 2025', program: 'BS-CY', yearLevel: 3, status: 'Pending', classCode: 'CAPS-3001-B', enrolledStudents: 18 },
  
  // BMA Year 1 - First Semester
  { id: 'BMA101', name: 'Introduction to Multimedia Arts', instructor: 'Dr. Adriana Salazar', semester: 'First Semester 2025', program: 'BMA', yearLevel: 1, status: 'Pending', classCode: 'IMMA-1001-A', enrolledStudents: 42 },
  { id: 'BMA102', name: 'Drawing 1', instructor: 'Prof. Leonardo Ramirez', semester: 'First Semester 2025', program: 'BMA', yearLevel: 1, status: 'Pending', classCode: 'DRAW-1001-A', enrolledStudents: 40 },
  { id: 'BMA103', name: 'Color Theory', instructor: 'Dr. Paloma Guerrero', semester: 'First Semester 2025', program: 'BMA', yearLevel: 1, status: 'Pending', classCode: 'COLT-1001-A', enrolledStudents: 41 },
  
  // BMA Year 2 - First Semester
  { id: 'BMA201', name: 'Writing for New Media', instructor: 'Prof. Camilo Fernandez', semester: 'First Semester 2025', program: 'BMA', yearLevel: 2, status: 'Pending', classCode: 'WNME-2001-A', enrolledStudents: 35 },
  { id: 'BMA202', name: 'Typography & Layout', instructor: 'Dr. Renata Varela', semester: 'First Semester 2025', program: 'BMA', yearLevel: 2, status: 'Pending', classCode: 'TYPO-2001-A', enrolledStudents: 33 },
  { id: 'BMA203', name: '2D Animation 1', instructor: 'Prof. Esteban Cordova', semester: 'First Semester 2025', program: 'BMA', yearLevel: 2, status: 'Pending', classCode: 'ANIM-2001-A', enrolledStudents: 34 },
  { id: 'BMA204', name: 'Digital Photography', instructor: 'Dr. Fernanda Acosta', semester: 'First Semester 2025', program: 'BMA', yearLevel: 2, status: 'Pending', classCode: 'PHOT-2001-A', enrolledStudents: 32 },
  
  // BMA Year 3 - First Semester
  { id: 'BMA301', name: 'Fundamentals in Film and Video Production', instructor: 'Prof. Nicolas Romero', semester: 'First Semester 2025', program: 'BMA', yearLevel: 3, status: 'Pending', classCode: 'FILM-3001-A', enrolledStudents: 28 },
  { id: 'BMA302', name: 'Game Design: Art Production', instructor: 'Dr. Catalina Vidal', semester: 'First Semester 2025', program: 'BMA', yearLevel: 3, status: 'Pending', classCode: 'GAME-3001-A', enrolledStudents: 27 },
  { id: 'BMA303', name: '3D Modeling', instructor: 'Prof. Maximiliano Cruz', semester: 'First Semester 2025', program: 'BMA', yearLevel: 3, status: 'Pending', classCode: 'MODE-3001-A', enrolledStudents: 26 },
  { id: 'BMA304', name: 'Web Design 1', instructor: 'Dr. Soledad Pacheco', semester: 'First Semester 2025', program: 'BMA', yearLevel: 3, status: 'Pending', classCode: 'WEBD-3001-A', enrolledStudents: 25 },
  
  // BMA Year 4 - First Semester
  { id: 'BMA401', name: 'Business Ventures in Multimedia', instructor: 'Prof. Alejandra Montes', semester: 'First Semester 2025', program: 'BMA', yearLevel: 4, status: 'Pending', classCode: 'BVMM-4001-A', enrolledStudents: 22 },
  { id: 'BMA402', name: 'Brand Communications', instructor: 'Dr. Salvador Herrera', semester: 'First Semester 2025', program: 'BMA', yearLevel: 4, status: 'Pending', classCode: 'BCOM-4001-A', enrolledStudents: 21 },
  { id: 'BMA403', name: 'Portfolio Preparation and Exhibit Design', instructor: 'Prof. Antonia Rivas', semester: 'First Semester 2025', program: 'BMA', yearLevel: 4, status: 'Pending', classCode: 'PORT-4001-A', enrolledStudents: 20 },
  { id: 'BMA404', name: 'Capstone Project 2', instructor: 'Dr. Guillermo Soto', semester: 'First Semester 2025', program: 'BMA', yearLevel: 4, status: 'Pending', classCode: 'CAPS-4001-B', enrolledStudents: 19 }
]

export const mockHeads = [
  {
    email: 'melodydimaano@lpubatangas.edu.ph',
    name: 'Melody Dimaano',
    role: 'head',
    department: 'Information Technology',
    assignedPrograms: ['BSIT'], // Only see BSIT courses
    password: 'changeme'
  },
  {
    email: 'dr.rivera@lpubatangas.edu.ph',
    name: 'Dr. Ricardo Rivera',
    role: 'head',
    department: 'Computer Science',
    assignedPrograms: ['BSCS', 'BSCS-DS'], // Only see BSCS and BSCS-DS courses
    password: 'changeme'
  },
  {
    email: 'prof.santos@lpubatangas.edu.ph',
    name: 'Prof. Ana Santos',
    role: 'head',
    department: 'Cybersecurity',
    assignedPrograms: ['BS-CY'], // Only see BS-CY courses
    password: 'changeme'
  },
  {
    email: 'dr.mendoza@lpubatangas.edu.ph',
    name: 'Dr. Luis Mendoza',
    role: 'head',
    department: 'Multimedia Arts',
    assignedPrograms: ['BMA'], // Only see BMA courses
    password: 'changeme'
  }
];

// Admins (Secretaries) have global access to ALL programs
export const mockAdmins = [
  {
    email: 'admin@lpubatangas.edu.ph',
    name: 'Ms. Patricia Cruz',
    role: 'admin',
    department: 'Academic Affairs',
    assignedPrograms: ['BSIT', 'BSCS', 'BSCS-DS', 'BS-CY', 'BMA'], // Global access to ALL programs
    password: 'admin123'
  },
  {
    email: 'registrar.admin@lpubatangas.edu.ph',
    name: 'Mrs. Carmen Rodriguez',
    role: 'admin',
    department: 'Registrar Office',
    assignedPrograms: ['BSIT', 'BSCS', 'BSCS-DS', 'BS-CY', 'BMA'], // Global access to ALL programs
    password: 'admin123'
  }
];

// Legacy export for backward compatibility
export const mockSecretaries = mockAdmins;

export const mockEvaluations = [
  // BSIT Course Evaluations - Introduction to Computing
  {
    id: 'e1', 
    courseId: 'BSIT101', 
    student: 'Maria Santos', 
    studentId: 'maria.santos.bsit1@lpubatangas.edu.ph',
    ratings: { clarity: 4.5, usefulness: 4.8, engagement: 4.2, organization: 4.4 }, 
    comment: 'Dr. Santos explains concepts very clearly and uses excellent examples. The practical exercises really helped me understand programming fundamentals.', 
    sentiment: 'positive', 
    anomaly: false, 
    semester: 'First 2023',
    rating: 4.5
  },
  {
    id: 'e2', 
    courseId: 'BSIT101', 
    student: 'Juan Dela Cruz', 
    studentId: 'juan.dela.cruz.bsit2@lpubatangas.edu.ph',
    ratings: { clarity: 3.8, usefulness: 4.0, engagement: 3.5, organization: 3.9 }, 
    comment: 'Good course content but the pace was a bit fast for beginners. More step-by-step tutorials would be helpful.', 
    sentiment: 'neutral', 
    anomaly: false, 
    semester: 'First 2023',
    rating: 3.8
  },
  {
    id: 'e3', 
    courseId: 'BSIT101', 
    student: 'Carlos Garcia', 
    studentId: 'carlos.garcia.bsit4@lpubatangas.edu.ph',
    ratings: { clarity: 4.9, usefulness: 4.7, engagement: 4.8, organization: 4.6 }, 
    comment: 'Outstanding instructor! Very patient and always available for questions. The course structure is well-organized and builds concepts progressively.', 
    sentiment: 'positive', 
    anomaly: false, 
    semester: 'Second 2023',
    rating: 4.8
  },
  {
    id: 'e4', 
    courseId: 'BSIT101', 
    student: 'Ana Reyes', 
    studentId: 'ana.reyes.bsit3@lpubatangas.edu.ph',
    ratings: { clarity: 4.2, usefulness: 4.5, engagement: 4.0, organization: 4.3 }, 
    comment: 'The course materials were well organized and the instructor explained concepts clearly. I particularly enjoyed the practical exercises.', 
    sentiment: 'positive', 
    anomaly: false, 
    semester: 'First 2023',
    rating: 4.3
  },

  // Computer Programming 1 - BSIT102
  {
    id: 'e5', 
    courseId: 'BSIT102', 
    student: 'Maria Santos', 
    studentId: 'maria.santos.bsit1@lpubatangas.edu.ph',
    ratings: { clarity: 4.0, usefulness: 4.3, engagement: 3.8, organization: 4.1 }, 
    comment: 'Prof. Carlos teaches programming very well. The assignments are challenging but fair. Could use more coding examples during lectures.', 
    sentiment: 'positive', 
    anomaly: false, 
    semester: 'First 2023',
    rating: 4.1
  },
  {
    id: 'e6', 
    courseId: 'BSIT102', 
    student: 'Juan Dela Cruz', 
    studentId: 'juan.dela.cruz.bsit2@lpubatangas.edu.ph',
    ratings: { clarity: 3.2, usefulness: 3.5, engagement: 2.8, organization: 3.0 }, 
    comment: 'The programming concepts are difficult to follow. Need more time for hands-on practice and slower explanation of complex topics.', 
    sentiment: 'neutral', 
    anomaly: false, 
    semester: 'Second 2023',
    rating: 3.1
  },

  // BSCS Data Science Course Evaluations
  {
    id: 'e7', 
    courseId: 'CSDS102', 
    student: 'Sophia Martinez', 
    studentId: 'sophia.martinez.bscsds1@lpubatangas.edu.ph',
    ratings: { clarity: 4.6, usefulness: 4.8, engagement: 4.4, organization: 4.7 }, 
    comment: 'Excellent introduction to programming for data science. Prof. Carlos relates everything to real-world applications which makes it very engaging.', 
    sentiment: 'positive', 
    anomaly: false, 
    semester: 'First 2023',
    rating: 4.6
  },
  {
    id: 'e8', 
    courseId: 'CSDS205', 
    student: 'Miguel Lopez', 
    studentId: 'miguel.lopez.bscsds2@lpubatangas.edu.ph',
    ratings: { clarity: 4.4, usefulness: 4.9, engagement: 4.2, organization: 4.5 }, 
    comment: 'Dr. Delgado makes statistics accessible and relevant to data science. The practical projects really help understand the concepts.', 
    sentiment: 'positive', 
    anomaly: false, 
    semester: 'Second 2023',
    rating: 4.5
  },
  {
    id: 'e9', 
    courseId: 'CSDS206', 
    student: 'Sophia Martinez', 
    studentId: 'sophia.martinez.bscsds1@lpubatangas.edu.ph',
    ratings: { clarity: 4.8, usefulness: 4.9, engagement: 4.7, organization: 4.8 }, 
    comment: 'Mind-blowing course! Prof. Vargas is incredibly knowledgeable about AI and ML. The hands-on projects with real datasets are amazing.', 
    sentiment: 'positive', 
    anomaly: false, 
    semester: 'Second 2023',
    rating: 4.8
  },

  // Cybersecurity Course Evaluations
  {
    id: 'e10', 
    courseId: 'BSCY102', 
    student: 'Ethan Ramos', 
    studentId: 'ethan.ramos.bscy3@lpubatangas.edu.ph',
    ratings: { clarity: 4.3, usefulness: 4.6, engagement: 4.5, organization: 4.2 }, 
    comment: 'Prof. Espinoza makes cybersecurity concepts very interesting. The case studies of real cyber attacks are eye-opening.', 
    sentiment: 'positive', 
    anomaly: false, 
    semester: 'First 2023',
    rating: 4.4
  },
  {
    id: 'e11', 
    courseId: 'BSCY204', 
    student: 'Ethan Ramos', 
    studentId: 'ethan.ramos.bscy3@lpubatangas.edu.ph',
    ratings: { clarity: 4.7, usefulness: 4.8, engagement: 4.9, organization: 4.6 }, 
    comment: 'Fantastic hands-on course! Dr. Aguilar teaches ethical hacking responsibly and the defense strategies are very practical.', 
    sentiment: 'positive', 
    anomaly: false, 
    semester: 'First 2023',
    rating: 4.7
  },

  // BMA Course Evaluations
  {
    id: 'e12', 
    courseId: 'BMA102', 
    student: 'Zoe Valdez', 
    studentId: 'zoe.valdez.bma1@lpubatangas.edu.ph',
    ratings: { clarity: 4.1, usefulness: 4.4, engagement: 4.6, organization: 4.0 }, 
    comment: 'Prof. Ramirez is a skilled artist and teacher. The drawing techniques are fundamental and well-explained. Studio time is valuable.', 
    sentiment: 'positive', 
    anomaly: false, 
    semester: 'First 2023',
    rating: 4.3
  },
  {
    id: 'e13', 
    courseId: 'BMA103', 
    student: 'Luna Castillo', 
    studentId: 'luna.castillo.bma3@lpubatangas.edu.ph',
    ratings: { clarity: 4.5, usefulness: 4.7, engagement: 4.3, organization: 4.4 }, 
    comment: 'Dr. Guerrero has deep knowledge of color theory. The practical applications in digital design projects are very helpful.', 
    sentiment: 'positive', 
    anomaly: false, 
    semester: 'First 2023',
    rating: 4.5
  },
  {
    id: 'e14', 
    courseId: 'BMA201', 
    student: 'Diego Mendoza', 
    studentId: 'diego.mendoza.bma4@lpubatangas.edu.ph',
    ratings: { clarity: 3.8, usefulness: 4.2, engagement: 3.9, organization: 3.7 }, 
    comment: 'Good content for new media writing but could use more modern examples. Social media writing techniques need updating.', 
    sentiment: 'neutral', 
    anomaly: false, 
    semester: 'First 2023',
    rating: 3.9
  },

  // Some Negative/Problematic Evaluations for Anomaly Detection
  {
    id: 'e15', 
    courseId: 'BSIT303', 
    student: 'Anonymous Student', 
    studentId: 'anonymous@student.com',
    ratings: { clarity: 2.1, usefulness: 2.5, engagement: 1.8, organization: 2.0 }, 
    comment: 'The instructor often comes to class late and seems unprepared. Lectures are confusing and assignments are unclear. Very disappointed.', 
    sentiment: 'negative', 
    anomaly: true, 
    semester: 'Second 2023',
    rating: 2.1
  },
  {
    id: 'e16', 
    courseId: 'CSDS207', 
    student: 'Anonymous Student', 
    studentId: 'anonymous2@student.com',
    ratings: { clarity: 1.9, usefulness: 2.2, engagement: 1.5, organization: 1.8 }, 
    comment: 'Poor communication from instructor. Grading criteria are unclear and feedback is minimal. Course needs major improvements.', 
    sentiment: 'negative', 
    anomaly: true, 
    semester: 'Second 2023',
    rating: 1.9
  },

  // Additional Positive Evaluations for Balance
  {
    id: 'e17', 
    courseId: 'BSIT401', 
    student: 'Carlos Garcia', 
    studentId: 'carlos.garcia.bsit4@lpubatangas.edu.ph',
    ratings: { clarity: 4.6, usefulness: 4.8, engagement: 4.7, organization: 4.5 }, 
    comment: 'Dr. Moreno is excellent at connecting theoretical concepts with practical applications. The emerging technologies section is cutting-edge.', 
    sentiment: 'positive', 
    anomaly: false, 
    semester: 'First 2023',
    rating: 4.6
  },
  {
    id: 'e18', 
    courseId: 'BSCY301', 
    student: 'Ethan Ramos', 
    studentId: 'ethan.ramos.bscy3@lpubatangas.edu.ph',
    ratings: { clarity: 4.2, usefulness: 4.5, engagement: 4.0, organization: 4.3 }, 
    comment: 'Prof. Sandoval provides great insights into legal aspects of cybersecurity. Very relevant for understanding compliance requirements.', 
    sentiment: 'positive', 
    anomaly: false, 
    semester: 'First 2023',
    rating: 4.3
  },
  {
    id: 'e19', 
    courseId: 'BMA404', 
    student: 'Diego Mendoza', 
    studentId: 'diego.mendoza.bma4@lpubatangas.edu.ph',
    ratings: { clarity: 4.4, usefulness: 4.7, engagement: 4.6, organization: 4.5 }, 
    comment: 'Dr. Soto provides excellent guidance for capstone projects. His industry experience brings valuable insights to the creative process.', 
    sentiment: 'positive', 
    anomaly: false, 
    semester: 'First 2023',
    rating: 4.6
  }
]
