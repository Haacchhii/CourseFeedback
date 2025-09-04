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
  { id: 'BSIT101', name: 'Introduction to Computing', instructor: 'Dr. Maria Santos', semester: 'First Semester 2025', program: 'BSIT', yearLevel: 1, status: 'Pending', classCode: 'ITCO-1001-A' },
  { id: 'BSIT102', name: 'Computer Programming 1', instructor: 'Prof. Juan Carlos', semester: 'First Semester 2025', program: 'BSIT', yearLevel: 1, status: 'Pending', classCode: 'CPRO-1001-A' },
  { id: 'BSIT103', name: 'Understanding the Self', instructor: 'Dr. Ana Lopez', semester: 'First Semester 2025', program: 'BSIT', yearLevel: 1, status: 'Pending', classCode: 'SELF-1001-A' },
  { id: 'BSIT104', name: 'Mathematics in the Modern World', instructor: 'Prof. Carlos Rivera', semester: 'First Semester 2025', program: 'BSIT', yearLevel: 1, status: 'Pending', classCode: 'MATH-1001-A' },
  { id: 'BSIT105', name: 'The Contemporary World', instructor: 'Dr. Sofia Garcia', semester: 'First Semester 2025', program: 'BSIT', yearLevel: 1, status: 'Pending', classCode: 'CONT-1001-A' },
  
  // BSIT Year 1 - Second Semester
  { id: 'BSIT106', name: 'Computer Programming 2', instructor: 'Prof. Juan Carlos', semester: 'Second Semester 2025', program: 'BSIT', yearLevel: 1, status: 'Pending', classCode: 'CPRO-1002-A' },
  { id: 'BSIT107', name: 'Computer Organization', instructor: 'Dr. Miguel Torres', semester: 'Second Semester 2025', program: 'BSIT', yearLevel: 1, status: 'Pending', classCode: 'CORG-1002-A' },
  { id: 'BSIT108', name: 'Purposive Communication', instructor: 'Prof. Isabella Reyes', semester: 'Second Semester 2025', program: 'BSIT', yearLevel: 1, status: 'Pending', classCode: 'COMM-1002-A' },
  { id: 'BSIT109', name: 'College Algebra', instructor: 'Dr. Daniel Martinez', semester: 'Second Semester 2025', program: 'BSIT', yearLevel: 1, status: 'Pending', classCode: 'ALGE-1002-A' },
  
  // BSIT Year 2 - First Semester
  { id: 'BSIT201', name: 'Data Structures and Algorithms', instructor: 'Dr. Alex Morales', semester: 'First Semester 2025', program: 'BSIT', yearLevel: 2, status: 'Pending', classCode: 'DSAL-2001-A' },
  { id: 'BSIT202', name: 'Operating Systems', instructor: 'Prof. Maya Cruz', semester: 'First Semester 2025', program: 'BSIT', yearLevel: 2, status: 'Pending', classCode: 'OPER-2001-A' },
  { id: 'BSIT203', name: 'Trigonometry', instructor: 'Dr. Lucas Hernandez', semester: 'First Semester 2025', program: 'BSIT', yearLevel: 2, status: 'Pending', classCode: 'TRIG-2001-A' },
  
  // BSIT Year 2 - Second Semester
  { id: 'BSIT204', name: 'Object-Oriented Programming', instructor: 'Prof. Zoe Valdez', semester: 'Second Semester 2025', program: 'BSIT', yearLevel: 2, status: 'Pending', classCode: 'OOPR-2002-A' },
  { id: 'BSIT205', name: 'Web Systems and Technologies', instructor: 'Dr. Ryan Perez', semester: 'Second Semester 2025', program: 'BSIT', yearLevel: 2, status: 'Pending', classCode: 'WEBS-2002-A' },
  { id: 'BSIT206', name: 'Systems Analysis & Design', instructor: 'Prof. Luna Castillo', semester: 'Second Semester 2025', program: 'BSIT', yearLevel: 2, status: 'Pending', classCode: 'SYAN-2002-A' },
  { id: 'BSIT207', name: 'Networking 1', instructor: 'Dr. Diego Mendoza', semester: 'Second Semester 2025', program: 'BSIT', yearLevel: 2, status: 'Pending', classCode: 'NETW-2002-A' },
  
  // BSIT Year 3 - First Semester
  { id: 'BSIT301', name: 'Information Management', instructor: 'Dr. Elena Rodriguez', semester: 'First Semester 2025', program: 'BSIT', yearLevel: 3, status: 'Pending', classCode: 'INFM-3001-A' },
  { id: 'BSIT302', name: 'Human Computer Interaction', instructor: 'Prof. Antonio Silva', semester: 'First Semester 2025', program: 'BSIT', yearLevel: 3, status: 'Pending', classCode: 'HCIN-3001-A' },
  { id: 'BSIT303', name: 'Networking 2', instructor: 'Dr. Carmen Vega', semester: 'First Semester 2025', program: 'BSIT', yearLevel: 3, status: 'Pending', classCode: 'NETW-3001-A' },
  { id: 'BSIT304', name: 'Capstone Project 1', instructor: 'Prof. Roberto Campos', semester: 'First Semester 2025', program: 'BSIT', yearLevel: 3, status: 'Pending', classCode: 'CAPS-3001-A' },
  
  // BSIT Year 4 - First Semester
  { id: 'BSIT401', name: 'Applications Development and Emerging Technologies', instructor: 'Dr. Patricia Moreno', semester: 'First Semester 2025', program: 'BSIT', yearLevel: 4, status: 'Pending', classCode: 'ADET-4001-A' },
  { id: 'BSIT402', name: 'Computer Troubleshooting and Repair', instructor: 'Prof. Fernando Gutierrez', semester: 'First Semester 2025', program: 'BSIT', yearLevel: 4, status: 'Pending', classCode: 'CTRP-4001-A' },
  { id: 'BSIT403', name: 'Capstone Project 2-Technopreneurship', instructor: 'Dr. Gabriela Jimenez', semester: 'First Semester 2025', program: 'BSIT', yearLevel: 4, status: 'Pending', classCode: 'CAPS-4001-A' },
  
  // BSCS Data Science Year 1 - First Semester
  { id: 'CSDS101', name: 'Introduction to Computing', instructor: 'Dr. Maria Santos', semester: 'First Semester 2025', program: 'BSCS-DS', yearLevel: 1, status: 'Pending', classCode: 'ITCO-1001-B' },
  { id: 'CSDS102', name: 'Computer Programming 1', instructor: 'Prof. Juan Carlos', semester: 'First Semester 2025', program: 'BSCS-DS', yearLevel: 1, status: 'Pending', classCode: 'CPRO-1001-B' },
  { id: 'CSDS103', name: 'Digital Design', instructor: 'Dr. Alexandra Ruiz', semester: 'First Semester 2025', program: 'BSCS-DS', yearLevel: 1, status: 'Pending', classCode: 'DDES-1001-A' },
  { id: 'CSDS104', name: 'College Algebra', instructor: 'Dr. Daniel Martinez', semester: 'First Semester 2025', program: 'BSCS-DS', yearLevel: 1, status: 'Pending', classCode: 'ALGE-1001-B' },
  
  // BSCS Data Science Year 2 - First Semester
  { id: 'CSDS201', name: 'Systems Analysis and Design', instructor: 'Prof. Luna Castillo', semester: 'First Semester 2025', program: 'BSCS-DS', yearLevel: 2, status: 'Pending', classCode: 'SYAN-2001-B' },
  { id: 'CSDS202', name: 'Object-Oriented Programming', instructor: 'Prof. Zoe Valdez', semester: 'First Semester 2025', program: 'BSCS-DS', yearLevel: 2, status: 'Pending', classCode: 'OOPR-2001-B' },
  { id: 'CSDS203', name: 'Programming Languages', instructor: 'Dr. Victor Navarro', semester: 'First Semester 2025', program: 'BSCS-DS', yearLevel: 2, status: 'Pending', classCode: 'PROG-2001-A' },
  { id: 'CSDS204', name: 'Differential Calculus', instructor: 'Prof. Beatriz Herrera', semester: 'First Semester 2025', program: 'BSCS-DS', yearLevel: 2, status: 'Pending', classCode: 'CALC-2001-A' },
  
  // BSCS Data Science Year 2 - Second Semester
  { id: 'CSDS205', name: 'Computational Statistics', instructor: 'Dr. Ricardo Delgado', semester: 'Second Semester 2025', program: 'BSCS-DS', yearLevel: 2, status: 'Pending', classCode: 'STAT-2002-A' },
  { id: 'CSDS206', name: 'Artificial Intelligence and Machine Learning', instructor: 'Prof. Natalia Vargas', semester: 'Second Semester 2025', program: 'BSCS-DS', yearLevel: 2, status: 'Pending', classCode: 'AIML-2002-A' },
  { id: 'CSDS207', name: 'Software Engineering', instructor: 'Dr. Emilio Castro', semester: 'Second Semester 2025', program: 'BSCS-DS', yearLevel: 2, status: 'Pending', classCode: 'SENG-2002-A' },
  
  // BS Cybersecurity Year 1 - First Semester
  { id: 'BSCY101', name: 'Introduction to Computers and Networking', instructor: 'Dr. Sebastian Ortega', semester: 'First Semester 2025', program: 'BS-CY', yearLevel: 1, status: 'Pending', classCode: 'ICNE-1001-A' },
  { id: 'BSCY102', name: 'Introduction to Cybersecurity', instructor: 'Prof. Valentina Espinoza', semester: 'First Semester 2025', program: 'BS-CY', yearLevel: 1, status: 'Pending', classCode: 'ICYB-1001-A' },
  { id: 'BSCY103', name: 'Programming Fundamentals', instructor: 'Dr. Alejandro Rojas', semester: 'First Semester 2025', program: 'BS-CY', yearLevel: 1, status: 'Pending', classCode: 'PROG-1001-A' },
  
  // BS Cybersecurity Year 2 - First Semester
  { id: 'BSCY201', name: 'CCNA 1 - Networking 1', instructor: 'Prof. Cristina Molina', semester: 'First Semester 2025', program: 'BS-CY', yearLevel: 2, status: 'Pending', classCode: 'CCNA-2001-A' },
  { id: 'BSCY202', name: 'Machine Learning and AI for Cybersecurity', instructor: 'Dr. Joaquin Paredes', semester: 'First Semester 2025', program: 'BS-CY', yearLevel: 2, status: 'Pending', classCode: 'MAIC-2001-A' },
  { id: 'BSCY203', name: 'Cryptography and Cryptanalysis', instructor: 'Prof. Mariana Fuentes', semester: 'First Semester 2025', program: 'BS-CY', yearLevel: 2, status: 'Pending', classCode: 'CRYP-2001-A' },
  { id: 'BSCY204', name: 'Ethical Hacking and Defense Strategy', instructor: 'Dr. Rodrigo Aguilar', semester: 'First Semester 2025', program: 'BS-CY', yearLevel: 2, status: 'Pending', classCode: 'EHDS-2001-A' },
  
  // BS Cybersecurity Year 3 - First Semester
  { id: 'BSCY301', name: 'Legal Aspects and Issues of Cybersecurity', instructor: 'Prof. Lucia Sandoval', semester: 'First Semester 2025', program: 'BS-CY', yearLevel: 3, status: 'Pending', classCode: 'LAIC-3001-A' },
  { id: 'BSCY302', name: 'Cyber Incident Analysis and Response', instructor: 'Dr. Manuel Cortez', semester: 'First Semester 2025', program: 'BS-CY', yearLevel: 3, status: 'Pending', classCode: 'CIAR-3001-A' },
  { id: 'BSCY303', name: 'Capstone Project 2', instructor: 'Prof. Esperanza Medina', semester: 'First Semester 2025', program: 'BS-CY', yearLevel: 3, status: 'Pending', classCode: 'CAPS-3001-B' },
  
  // BMA Year 1 - First Semester
  { id: 'BMA101', name: 'Introduction to Multimedia Arts', instructor: 'Dr. Adriana Salazar', semester: 'First Semester 2025', program: 'BMA', yearLevel: 1, status: 'Pending', classCode: 'IMMA-1001-A' },
  { id: 'BMA102', name: 'Drawing 1', instructor: 'Prof. Leonardo Ramirez', semester: 'First Semester 2025', program: 'BMA', yearLevel: 1, status: 'Pending', classCode: 'DRAW-1001-A' },
  { id: 'BMA103', name: 'Color Theory', instructor: 'Dr. Paloma Guerrero', semester: 'First Semester 2025', program: 'BMA', yearLevel: 1, status: 'Pending', classCode: 'COLT-1001-A' },
  
  // BMA Year 2 - First Semester
  { id: 'BMA201', name: 'Writing for New Media', instructor: 'Prof. Camilo Fernandez', semester: 'First Semester 2025', program: 'BMA', yearLevel: 2, status: 'Pending', classCode: 'WNME-2001-A' },
  { id: 'BMA202', name: 'Typography & Layout', instructor: 'Dr. Renata Varela', semester: 'First Semester 2025', program: 'BMA', yearLevel: 2, status: 'Pending', classCode: 'TYPO-2001-A' },
  { id: 'BMA203', name: '2D Animation 1', instructor: 'Prof. Esteban Cordova', semester: 'First Semester 2025', program: 'BMA', yearLevel: 2, status: 'Pending', classCode: 'ANIM-2001-A' },
  { id: 'BMA204', name: 'Digital Photography', instructor: 'Dr. Fernanda Acosta', semester: 'First Semester 2025', program: 'BMA', yearLevel: 2, status: 'Pending', classCode: 'PHOT-2001-A' },
  
  // BMA Year 3 - First Semester
  { id: 'BMA301', name: 'Fundamentals in Film and Video Production', instructor: 'Prof. Nicolas Romero', semester: 'First Semester 2025', program: 'BMA', yearLevel: 3, status: 'Pending', classCode: 'FILM-3001-A' },
  { id: 'BMA302', name: 'Game Design: Art Production', instructor: 'Dr. Catalina Vidal', semester: 'First Semester 2025', program: 'BMA', yearLevel: 3, status: 'Pending', classCode: 'GAME-3001-A' },
  { id: 'BMA303', name: '3D Modeling', instructor: 'Prof. Maximiliano Cruz', semester: 'First Semester 2025', program: 'BMA', yearLevel: 3, status: 'Pending', classCode: 'MODE-3001-A' },
  { id: 'BMA304', name: 'Web Design 1', instructor: 'Dr. Soledad Pacheco', semester: 'First Semester 2025', program: 'BMA', yearLevel: 3, status: 'Pending', classCode: 'WEBD-3001-A' },
  
  // BMA Year 4 - First Semester
  { id: 'BMA401', name: 'Business Ventures in Multimedia', instructor: 'Prof. Alejandra Montes', semester: 'First Semester 2025', program: 'BMA', yearLevel: 4, status: 'Pending', classCode: 'BVMM-4001-A' },
  { id: 'BMA402', name: 'Brand Communications', instructor: 'Dr. Salvador Herrera', semester: 'First Semester 2025', program: 'BMA', yearLevel: 4, status: 'Pending', classCode: 'BCOM-4001-A' },
  { id: 'BMA403', name: 'Portfolio Preparation and Exhibit Design', instructor: 'Prof. Antonia Rivas', semester: 'First Semester 2025', program: 'BMA', yearLevel: 4, status: 'Pending', classCode: 'PORT-4001-A' },
  { id: 'BMA404', name: 'Capstone Project 2', instructor: 'Dr. Guillermo Soto', semester: 'First Semester 2025', program: 'BMA', yearLevel: 4, status: 'Pending', classCode: 'CAPS-4001-B' }
]

export const mockHeads = [
  {
    email: 'melodydimaano@lpubatangas.edu.ph',
    name: 'Melody Dimaano',
    role: 'head',
    password: 'changeme' // You can change this to a secure password
  }
];

export const mockEvaluations = [
  {
    id: 'e1', courseId: 'CSE101', student: 'John', ratings: { clarity:4, usefulness:5, engagement:4 }, comment: 'Good course', sentiment: 'positive', anomaly: false, semester: 'Fall 2025'
  },
  {
    id: 'e2', courseId: 'CSE202', student: 'Sara', ratings: { clarity:3, usefulness:3, engagement:2 }, comment: 'Too fast paced', sentiment: 'neutral', anomaly: false, semester: 'Fall 2025'
  },
  {
    id: 'e3', courseId: 'CSE303', student: 'Mike', ratings: { clarity:1, usefulness:2, engagement:1 }, comment: 'Terrible instruction, biased grading', sentiment: 'negative', anomaly: true, semester: 'Spring 2025'
  }
]
