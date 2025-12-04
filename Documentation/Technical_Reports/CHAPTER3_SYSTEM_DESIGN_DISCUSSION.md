# Chapter 3: System Design Discussion

## 3.X System Design

After the planning phase, the design phase dealt with elaborating the user requirements and system objectives into a practical and highly user-friendly interface, in which minimalism and intuitiveness dominated the thoughts of the team as a way to make the system available for any user. Based on existing institutional evaluation procedures, evaluation periods were required to follow academic semester cycles, evaluations must remain anonymous during collection but traceable for completion tracking, and results needed to be aggregated at multiple levels (course, section, department, institution-wide). These constraints ensured that the system aligned with established academic processes while maintaining data integrity and accountability.

User flowcharts were created using Draw.io to visualize the interaction patterns for each user role: students submitting evaluations, secretaries/department heads accessing aggregated reports, secretaries/department heads managing administrative tasks, and system administrators managing evaluation periods. This made it more straightforward to view the system's architecture and data flow in an organized manner.

Mock-ups were created using Figma to offer users a visualization of how the interface would look before development. The mock-ups became the blueprint for the front-end development process, ensuring that development adhered to user expectations (refer to Appendix X for mockup). The complete routing of data from the collection of student evaluations to the machine learning analysis modules (SVM and DBSCAN) and finally to the presentation of dashboards was also depicted.

React, Tailwind CSS, and Python were used to design the system, which was built entirely in Visual Studio Code. They were chosen because of their flexibility, speed, and responsiveness across device and screen sizes. React's component reusability and ecosystem support enabled efficient development of role-specific interfaces, while Tailwind CSS provided rapid prototyping capabilities. For the backend, Flask was selected for its seamless integration with machine learning libraries (Scikit-learn, NLTK, Pandas).

Supabase, a cloud-based PostgreSQL database solution, was chosen to store all structured data including users, course information, evaluation responses, and analytics results. Supabase is in charge of real-time events like notifications, fast dashboards, and user authentication. The database schema was designed following normalization principles with indexing strategies on frequently queried fields, and the advanced query capabilities of Supabase's PostgreSQL backend supported all operational and analytical requirements throughout the solution.






