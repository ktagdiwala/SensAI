USE sensai;

INSERT INTO role (name) VALUES
('Instructor'),
('Student');

INSERT INTO user (name, email, password, apiKey, roleId) VALUES
('Stacy Smith', 	'stacy@example.com', 	'$2a$10$4R5s5kkz/1NHK3rxNUDjOeXuVry5Br1sMhqS5m/fqIeT/pozWj.bK', '', 1),  -- Instructor
('Bob Smith', 		'bob@example.com', 		'$2a$10$4R5s5kkz/1NHK3rxNUDjOeXuVry5Br1sMhqS5m/fqIeT/pozWj.bK', '', 1),  -- Instructor
('Charlie Brown', 	'charlie@example.com', 	'$2a$10$4R5s5kkz/1NHK3rxNUDjOeXuVry5Br1sMhqS5m/fqIeT/pozWj.bK', '', 2),  -- Student
('Ann Charles', 	'ann@example.com', 		'$2a$10$4R5s5kkz/1NHK3rxNUDjOeXuVry5Br1sMhqS5m/fqIeT/pozWj.bK', '', 2),  -- Student
('Dana Lee',        'dana@example.com',     '$2a$10$4R5s5kkz/1NHK3rxNUDjOeXuVry5Br1sMhqS5m/fqIeT/pozWj.bK', '', 2),
('Edward Johnson',  'edward@example.com',   '$2a$10$4R5s5kkz/1NHK3rxNUDjOeXuVry5Br1sMhqS5m/fqIeT/pozWj.bK', '', 2),
('Fiona Garcia',    'fiona@example.com',    '$2a$10$4R5s5kkz/1NHK3rxNUDjOeXuVry5Br1sMhqS5m/fqIeT/pozWj.bK', '', 2),
('George Miller',   'george@example.com',   '$2a$10$4R5s5kkz/1NHK3rxNUDjOeXuVry5Br1sMhqS5m/fqIeT/pozWj.bK', '', 2),
('Hannah Davis',    'hannah@example.com',   '$2a$10$4R5s5kkz/1NHK3rxNUDjOeXuVry5Br1sMhqS5m/fqIeT/pozWj.bK', '', 2),
('Ian Wilson',      'ian@example.com',      '$2a$10$4R5s5kkz/1NHK3rxNUDjOeXuVry5Br1sMhqS5m/fqIeT/pozWj.bK', '', 2),
('Julia Martinez',  'julia@example.com',    '$2a$10$4R5s5kkz/1NHK3rxNUDjOeXuVry5Br1sMhqS5m/fqIeT/pozWj.bK', '', 2),
('Kevin Anderson',  'kevin@example.com',    '$2a$10$4R5s5kkz/1NHK3rxNUDjOeXuVry5Br1sMhqS5m/fqIeT/pozWj.bK', '', 2),
('Laura Thomas',    'laura@example.com',    '$2a$10$4R5s5kkz/1NHK3rxNUDjOeXuVry5Br1sMhqS5m/fqIeT/pozWj.bK', '', 2),
('Michael Taylor',  'michael@example.com',  '$2a$10$4R5s5kkz/1NHK3rxNUDjOeXuVry5Br1sMhqS5m/fqIeT/pozWj.bK', '', 2),
('Nina Harris',     'nina@example.com',     '$2a$10$4R5s5kkz/1NHK3rxNUDjOeXuVry5Br1sMhqS5m/fqIeT/pozWj.bK', '', 2),
('Owen Clark',      'owen@example.com',     '$2a$10$4R5s5kkz/1NHK3rxNUDjOeXuVry5Br1sMhqS5m/fqIeT/pozWj.bK', '', 2),
('Paula Lewis',     'paula@example.com',    '$2a$10$4R5s5kkz/1NHK3rxNUDjOeXuVry5Br1sMhqS5m/fqIeT/pozWj.bK', '', 2),
('Quentin Walker',  'quentin@example.com',  '$2a$10$4R5s5kkz/1NHK3rxNUDjOeXuVry5Br1sMhqS5m/fqIeT/pozWj.bK', '', 2),
('Rachel Hall',     'rachel@example.com',   '$2a$10$4R5s5kkz/1NHK3rxNUDjOeXuVry5Br1sMhqS5m/fqIeT/pozWj.bK', '', 2),
('Samuel Young',    'samuel@example.com',   '$2a$10$4R5s5kkz/1NHK3rxNUDjOeXuVry5Br1sMhqS5m/fqIeT/pozWj.bK', '', 2),
('Tina King',       'tina@example.com',     '$2a$10$4R5s5kkz/1NHK3rxNUDjOeXuVry5Br1sMhqS5m/fqIeT/pozWj.bK', '', 2),
('Victor Allen',    'victor@example.com',   '$2a$10$4R5s5kkz/1NHK3rxNUDjOeXuVry5Br1sMhqS5m/fqIeT/pozWj.bK', '', 2);

INSERT INTO course (title) VALUES
('Computer Networking'),
('Internet Programming'),
('Operating Systems'),
('Algorithms'),
('Psychology'),
('Music Theory');

INSERT INTO quiz (title, accessCode, prompt, courseId) VALUES
('Network Basics', 'IPTCP', "This is a fairly simple quiz, so do not provide too-detailed explanations when a student initially asks for help.", 1),
('Internet Concepts', 'HTMLJS', '', 2),
('Processes and Scheduling', 'FORK', '', 3),
('Algorithm Analysis','PSEUDO','',4),
-- Course 1: Computer Networking (existing quizId 1; add 1 more)
('Routing and Switching', 'ROUTESW', 'For numeric questions, encourage students to show units in their reasoning.', 1),
-- Course 2: Internet Programming (existing quizId 2; add 1 more)
('Client-Side JavaScript', 'JSFUNC', '', 2),
-- Course 3: Operating Systems (existing quizId 3; add 1 more)
('Memory Management', 'MEMMAN', 'If a student struggles, remind them conceptually how virtual memory works before giving formulas.', 3),
-- Course 4: Algorithms (existing quizId 4; add 1 more)
('Graph Algorithms', 'GRAPH1', '', 4),
-- Course 5: Psychology (no existing quizzes; add 2)
('Introduction to Psychology', 'PSYCH1', 'Focus on clarifying terminology and giving simple, concrete examples before deeper theory.', 5),
('Cognitive Psychology', 'COGPSY', '', 5),
-- Course 6: Music Theory (no existing quizzes; add 2)
('Music Fundamentals', 'MUSIC1', 'You can describe rhythms or melodies conceptually, but do not generate or rely on actual audio.', 6),
('Harmony and Chords', 'CHORDS', '', 6);

INSERT INTO question (title, correctAns, otherAns, prompt, courseId) VALUES
('Fill in the blank: The internet is considered a ______ of networks.', 
 'network', 'circle{|}protocol', '', 1),
('Fill in the blank: Hosts are also known as _____.', 
 'end systems', 'packets{|}protocols', '', 1),
('Which of the following is the coverage level of Tier 1 ISPs?', 
 'international and national', 'regional or country based{|}local{|}none of the above', '', 1),
('True/False: Communication links can be wired or wireless.', 
 'True', 'False', '', 1),
('Calculate the transmission delay for a link with bandwidth 100 KBps to send 5 Mb data.', 
 '6.25 seconds', '50 seconds{|}0.05 seconds{|}0.005 seconds{|}None of the above', 'Note that transmission delay mainly depends upon bandwidth (R). Formula is L (bits) / R (bits/sec).', 1),
('What is a "Web Server"?  Select the most accurate answer.', 
 'Can refer to both, hardware or software', 'A computer connected to the Internet that sends files upon requests.{|}Software that controls how web users access hosted files{|}A group of computers connected to the Internet and running Unix', '', 2),
('What is the protocol that the browsers use to view web pages?', 
 'HTTP', 'IP{|}DNS{|}TCP', 'If the student asks, you can briefly explain the full form of each protocol.', 2),
('What is the way to initialize an empty array in JavaScript?', 
 'var myArray = [];', 'var myArray = {}{|}var myArray = array;{|}var myArray;', '', 2),
('When the web server sends a file or data to the browser, what is it called?', 
 'Response', 'Request{|}Confirmation{|}Reply', '', 2),
('What would the output of the following code in the browser window? <html><head>   <script> document.querySelector("h1").innerHTML = "hello"; </script></head><body><h1></h1></body></html>', 
 'It will display nothing', 'It will display: Error{|}It will display: <h1>hello </h1>{|}It will display: hello', '', 2),
('Upon the successful completion of an exec() system call, what would you expect as a return value from this call?', 
 'nothing - return value is not expected', 'zero{|}minus one', 'The exec() functions return only if an error has occurred', 3),
('How many new processes will be created as a result of the following two lines of code: fork(); fork();', 
 '3', '4{|}5', '1st fork() system call generates new process n1.  2nd fork() system call generates new processes n2 and n3.', 3),
('Six jobs are waiting to be run.  Their expected run times are 2, 8, 3, 7, 4 and 6.  In what order should they be run to minimize average response time?', 
 '2, 3, 4, 6, 7, 8', '2, 8, 3, 7, 4, 6{|}8, 7, 6, 4, 3, 2', '', 3),
('A ________ typically has its own address space, and may contain one or more ______.', 
 'process, threads', 'thread, processes{|}thread, parents{|}process, parents{|}', '', 3),
('Execution of the following statement causes a current process, called the parent, to be replicated in a newly created process, called the child: procid = fork() |
The distinction between the parent and child is the return value from the fork() system call. Match the values returned by fork() to the following: 
Parent: ______  Child: ______',
 'PID of child, zero', 'zero, PID of parent{|}PID of parent, zero{|}PID of child, PID of Parent', '', 3),
('A sorting algorithm is said to be ______ if the algorithm preserves the relative order of any two or more equal elements in its input. ',
 'stable', 'unstable{|}in-place{|}non-comparison{|}none of these.', '', 4),
('O(n2) is considered the fastest one for comparison-based sorting.',
 'False','True','',4),
('Using the Euclid’s algorithm, you are going to calculate the greatest common divisor (gcd) of gcd (4, 6). Determine the values of the first step of gcd (4, 6) as follows. Select the correct numbers for A and B:
gcd (4, 6) = gcd(A, B)',
 '6,4','4,6{|}6,2{|}4,2{|}10,6{|}4,1','',4),
('Write the sum of numbers from 1 to 22. In other words, present the result of "1 + 2 + 3 + ... + 21 + 22". [Hint: Use the formula to calculate the numbers from 1 to n.]',
 '253','251{|}250{|}252','Use the formula 1 + 2 + ... + n = (n * (n+1))/2. Do not give this formula to the student right away.',4),
('Assume that there is an undirected graph G with five vertices. What’s the maximum possible number of edges in the graph?',
 '10','5{|}25{|}15{|}20','',4),
-- ---------------------------------------
-- Questions for Quiz 5 (Routing and Switching) – courseId = 1
-- Expected questionId: 21–25
-- ---------------------------------------
('Which device operates primarily at Layer 2 (Data Link layer) of the OSI model?',
 'Switch', 'Router{|}Gateway{|}Repeater', '', 1),
('True/False: UDP is a connection-oriented transport protocol.',
 'False', 'True', '', 1),
('Which protocol is most commonly used for secure remote login to a server?',
 'SSH', 'Telnet{|}FTP{|}SMTP', '', 1),
('Fill in the blank: The time it takes for a packet to travel from sender to receiver over a link is called ______ delay.',
 'propagation', 'transmission{|}queueing{|}processing', '', 1),
('Which address is used by a switch to make forwarding decisions?',
 'MAC address', 'IP address{|}Port number{|}Subnet mask', '', 1),

-- ---------------------------------------
-- Questions for Quiz 6 (Client-Side JavaScript) – courseId = 2
-- Expected questionId: 26–30
-- ---------------------------------------
('Which HTML tag do we typically use to include an external JavaScript file?',
 '<script>', '<js>{|}<javascript>{|}<link>', '', 2),
('True/False: In JavaScript, the == operator performs type coercion when comparing values.',
 'True', 'False', '', 2),
('Which of the following is a correct way to declare a function named myFunc in JavaScript?',
 'function myFunc() {}', 'func myFunc() {}{|}function = myFunc(){|}declare myFunc()', '', 2),
('What is the output of the expression "3" + 2 in JavaScript?',
 '32', '5{|}NaN{|}Error', 'If asked, briefly explain why JavaScript concatenates instead of adding numerically.', 2),
('Which built-in method is used to parse a JSON string into a JavaScript object?',
 'JSON.parse()', 'JSON.stringify(){|}parseJSON(){|}toObject()', '', 2),

-- ---------------------------------------
-- Questions for Quiz 7 (Memory Management) – courseId = 3
-- Expected questionId: 31–35
-- ---------------------------------------
('Which of the following best describes virtual memory?',
 'A technique that gives the illusion of a large main memory using disk space', 'A type of physical RAM module{|}A cache between CPU and main memory{|}A process scheduling algorithm', '', 3),
('True/False: In paging, all page frames in physical memory have the same size.',
 'True', 'False', '', 3),
('Which replacement algorithm evicts the page that has not been used for the longest time?',
 'LRU (Least Recently Used)', 'FIFO{|}Optimal{|}Random', '', 3),
('Fill in the blank: The mapping from virtual addresses to physical addresses is handled by the ______.',
 'MMU', 'CPU scheduler{|}DMA controller{|}Disk controller', '', 3),
('Thrashing in an operating system is most closely associated with which symptom?',
 'A very high rate of page faults with little useful progress',
 'CPU utilization close to 0% with no processes in memory{|}Only I/O-bound processes in the ready queue{|}No context switches occurring',
 'Have the student reason about how often page faults occur relative to useful CPU work.',
 3),

-- ---------------------------------------
-- Questions for Quiz 8 (Graph Algorithms) – courseId = 4
-- Expected questionId: 36–40
-- ---------------------------------------
('Which of the following algorithms can be used to find the shortest path in a weighted graph with non-negative edge weights?',
 'Dijkstra''s algorithm', 'Depth-first search{|}Kruskal''s algorithm{|}Bellman-Ford with negative cycles', '', 4),
('True/False: A tree is a connected acyclic undirected graph.',
 'True', 'False', '', 4),
('Which traversal technique always explores all neighbors of a vertex before moving to the next level?',
 'Breadth-first search', 'Depth-first search{|}Topological sort{|}Dijkstra''s algorithm', '', 4),
('Fill in the blank: A graph is said to be ______ if there is a path between every pair of vertices.',
 'connected', 'complete{|}bipartite{|}acyclic', '', 4),
('Which data structure is typically used to implement a priority queue in Dijkstra''s algorithm?',
 'Min-heap', 'Stack{|}Hash table{|}Linked list', '', 4),

-- ---------------------------------------
-- Questions for Quiz 9 (Introduction to Psychology) – courseId = 5
-- Expected questionId: 41–45
-- ---------------------------------------
('Which of the following best describes psychology?',
 'The scientific study of behavior and mental processes', 'The study of stars and planets{|}The practice of diagnosing physical illnesses only{|}The study of chemical reactions', '', 5),
('True/False: A hypothesis in psychology must be testable and falsifiable.',
 'True', 'False', '', 5),
('Which perspective in psychology focuses primarily on observable behavior rather than mental processes?',
 'Behavioral perspective', 'Cognitive perspective{|}Humanistic perspective{|}Biological perspective', '', 5),
('Fill in the blank: A carefully controlled test of a hypothesis is called an ______.',
 'experiment', 'observation{|}survey{|}interview', '', 5),
('Which term refers to a factor in an experiment that is deliberately manipulated by the researcher?',
 'Independent variable', 'Dependent variable{|}Confounding variable{|}Control group', '', 5),

-- ---------------------------------------
-- Questions for Quiz 10 (Cognitive Psychology) – courseId = 5
-- Expected questionId: 46–50
-- ---------------------------------------
('Which memory system holds information for only a fraction of a second after stimulation of the senses?',
 'Sensory memory', 'Short-term memory{|}Long-term memory{|}Working memory', '', 5),
('True/False: Chunking is a strategy used to increase the amount of information we can hold in short-term memory.',
 'True', 'False', '', 5),
('Which of the following best describes selective attention?',
 'Focusing on one stimulus while ignoring others', 'Storing information for long periods{|}Rehearsing information repeatedly{|}Retrieving forgotten memories', '', 5),
('Fill in the blank: The tendency to recall items at the beginning of a list better than those in the middle is called the ______ effect.',
 'primacy', 'recency{|}von Restorff{|}spacing', '', 5),
('Problem-solving strategies that are fast but prone to error are known as ______.',
 'heuristics', 'algorithms{|}procedures{|}formulas', '', 5),

-- ---------------------------------------
-- Questions for Quiz 11 (Music Fundamentals) – courseId = 6
-- Expected questionId: 51–55
-- ---------------------------------------
('Which of the following terms refers to the speed of the beat in music?',
 'Tempo', 'Dynamics{|}Timbre{|}Harmony', '', 6),
('True/False: A quarter note typically lasts half as long as a half note.',
 'True', 'False', '', 6),
('Which clef is most commonly used for higher-pitched instruments such as the violin?',
 'Treble clef', 'Bass clef{|}Alto clef{|}Tenor clef', '', 6),
('Fill in the blank: A series of eight notes spanning an interval from one pitch to its double in frequency is called an ______.',
 'octave', 'interval{|}chord{|}scale', '', 6),
('Which of the following describes timbre in music?',
 'The quality or color of a musical sound', 'The speed of the beat{|}The loudness of the sound{|}The organization of beats into measures', '', 6),

-- ---------------------------------------
-- Questions for Quiz 12 (Harmony and Chords) – courseId = 6
-- Expected questionId: 56–60
-- ---------------------------------------
('A combination of three or more different pitches sounded together is called a ______.',
 'chord', 'scale{|}interval{|}melody', '', 6),
('True/False: A major triad consists of a root, a major third, and a perfect fifth.',
 'True', 'False', '', 6),
('Which of the following chord progressions is very common in Western tonal music?',
 'I - IV - V - I', 'II - III - VI - II{|}I - II - III - IV{|}V - VI - VII - I', '', 6),
('Fill in the blank: The note that gives a key or scale its sense of "home" is called the ______.',
 'tonic', 'dominant{|}subdominant{|}leading tone', '', 6),
('In the key of C major, which of the following is the dominant chord?',
 'G major', 'C major{|}F major{|}D minor', '', 6);

INSERT INTO quiz_questions (quizId, questionId) VALUES
(1, 1),  -- Network quiz -> Internet is considered ___.
(1, 2),  -- Network quiz -> Hosts also known as _____.
(1, 3),  -- Network quiz -> Coverage level
(1, 4),  -- Network quiz -> T/F Communication links
(1, 5),  -- Network quiz -> Calculate transmission delay
(2, 6),  -- Internet quiz -> What is web server?
(2, 7),  -- Internet quiz -> Protocol for web pages
(2, 8),  -- Internet quiz -> Initialize empty array JS
(2, 9),  -- Internet quiz -> When web server sends file to browser
(2, 10), -- Internet quiz -> Output of HTML code in browser
(3, 11), -- OS quiz
(3, 12), -- OS quiz
(3, 13), -- OS quiz
(3, 14), -- OS quiz
(3, 15), -- OS quiz
(4, 16), -- Algo quiz
(4, 17), -- Algo quiz
(4, 18), -- Algo quiz
(4, 19), -- Algo quiz
(4, 20),
-- Quiz 5 (Routing and Switching, course 1)
(5, 21),
(5, 22),
(5, 23),
(5, 24),
(5, 25),
-- Quiz 6 (Client-Side JavaScript, course 2)
(6, 26),
(6, 27),
(6, 28),
(6, 29),
(6, 30),
-- Quiz 7 (Memory Management, course 3)
(7, 31),
(7, 32),
(7, 33),
(7, 34),
(7, 35),
-- Quiz 8 (Graph Algorithms, course 4)
(8, 36),
(8, 37),
(8, 38),
(8, 39),
(8, 40),
-- Quiz 9 (Introduction to Psychology, course 5)
(9, 41),
(9, 42),
(9, 43),
(9, 44),
(9, 45),
-- Quiz 10 (Cognitive Psychology, course 5)
(10, 46),
(10, 47),
(10, 48),
(10, 49),
(10, 50),
-- Quiz 11 (Music Fundamentals, course 6)
(11, 51),
(11, 52),
(11, 53),
(11, 54),
(11, 55),
-- Quiz 12 (Harmony and Chords, course 6)
(12, 56),
(12, 57),
(12, 58),
(12, 59),
(12, 60); -- Algo quiz

INSERT INTO mistake_type (mistakeId, label, description) VALUES
(1, 'No Attempt or Guess',
 'Student answer is blank, minimal, or clearly a guess without reasoning.'),
(2, 'Conceptual Error',
 'Student uses the wrong process to solve or includes inaccurate facts or references.'),
(3, 'Misinterpreted Question',
 'Student misunderstands what the question asks or misses key details.'),
(4, 'Incomplete or Partial Answer',
 'Student gives a partially correct answer but lacks required detail or clarity.'),
(5, 'Calculation Error',
 'Student makes an arithmetic or algebraic error during computation.');