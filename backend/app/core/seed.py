from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from backend.app.core.security import hash_password
from backend.app.models import (
    Application,
    Company,
    Internship,
    InternshipSkill,
    Mentor,
    Student,
    StudentSkill,
    Task,
    User,
    WeeklyReport,
)


def seed_database(db: Session) -> None:
    """Seeds the database with initial users, companies, internships, tasks, and reports."""
    # Check if database is already seeded
    if db.query(User).first() is not None:
        return

    now = datetime.now(timezone.utc)

    # --------------------------------------------------------------------------
    # 1. Administrators
    # --------------------------------------------------------------------------
    admin_user = User(
        email="admin@university.edu",
        hashed_password=hash_password("Admin@123"),
        full_name="Dean of Engineering (Admin)",
        role="ADMIN",
        is_active=True,
    )
    admin_demo = User(
        email="admin@demo.com",
        hashed_password=hash_password("Admin@123"),
        full_name="Dean of Engineering (Admin)",
        role="ADMIN",
        is_active=True,
    )
    db.add_all([admin_user, admin_demo])
    db.flush()

    # --------------------------------------------------------------------------
    # 2. Mentors
    # --------------------------------------------------------------------------
    mentor_user_1 = User(
        email="mentor.turing@university.edu",
        hashed_password=hash_password("Mentor@123"),
        full_name="Dr. Alan Turing",
        role="MENTOR",
        is_active=True,
    )
    mentor_demo = User(
        email="mentor@demo.com",
        hashed_password=hash_password("Mentor@123"),
        full_name="Dr. Alan Turing",
        role="MENTOR",
        is_active=True,
    )
    db.add_all([mentor_user_1, mentor_demo])
    db.flush()

    mentor_1 = Mentor(
        user_id=mentor_user_1.id,
        department="Computer Science & Engineering",
        designation="Professor & Head of Research",
        employee_id="EMP-CS-101",
    )
    mentor_demo_profile = Mentor(
        user_id=mentor_demo.id,
        department="Computer Science & Engineering",
        designation="Professor & Head of Research",
        employee_id="EMP-CS-100",
    )
    db.add_all([mentor_1, mentor_demo_profile])

    mentor_user_2 = User(
        email="mentor.lovelace@university.edu",
        hashed_password=hash_password("Mentor@123"),
        full_name="Prof. Ada Lovelace",
        role="MENTOR",
        is_active=True,
    )
    db.add(mentor_user_2)
    db.flush()

    mentor_2 = Mentor(
        user_id=mentor_user_2.id,
        department="Data Science & Artificial Intelligence",
        designation="Associate Professor",
        employee_id="EMP-DS-202",
    )
    db.add(mentor_2)
    db.flush()

    # --------------------------------------------------------------------------
    # 3. Companies
    # --------------------------------------------------------------------------
    quantum = Company(
        name="Quantum AI Labs",
        industry="Artificial Intelligence & Deep Learning",
        website="https://quantumailabs.io",
        contact_email="careers@quantumailabs.io",
        description="Pioneering autonomous agents, LLM infrastructure, and deep reinforcement learning systems.",
    )
    technova = Company(
        name="TechNova Labs",
        industry="Enterprise Cloud & Software",
        website="https://technovalabs.com",
        contact_email="internships@technovalabs.com",
        description="High-velocity software engineering, scalable backend microservices, and distributed cloud computing.",
    )
    finedge = Company(
        name="FinEdge Solutions",
        industry="Financial Technology & Analytics",
        website="https://finedgesolutions.com",
        contact_email="campus@finedge.com",
        description="Algorithmic trading infrastructure, risk modeling, and real-time quantitative financial platforms.",
    )
    cloudsphere = Company(
        name="CloudSphere Technologies",
        industry="DevOps & Cloud Infrastructure",
        website="https://cloudsphere.tech",
        contact_email="careers@cloudsphere.tech",
        description="Kubernetes orchestration, automated CI/CD pipelines, and multi-cloud resilience solutions.",
    )
    google = Company(
        name="Google Cloud",
        industry="Cloud & Enterprise Software",
        website="https://cloud.google.com",
        contact_email="university-recruiting@google.com",
        description="Global leader in cloud computing, infrastructure, and developer platforms.",
    )
    microsoft = Company(
        name="Microsoft Research",
        industry="AI & Cloud Systems",
        website="https://www.microsoft.com/research",
        contact_email="careers@microsoft.com",
        description="Pioneering computer science research and enterprise productivity tools.",
    )
    meta = Company(
        name="Meta AI",
        industry="Social Technology & AI",
        website="https://about.meta.com",
        contact_email="internships@meta.com",
        description="Connecting billions of people worldwide through cutting-edge interactive web systems.",
    )
    amazon = Company(
        name="Amazon AWS",
        industry="Cloud Infrastructure & DevOps",
        website="https://aws.amazon.com",
        contact_email="campus@amazon.com",
        description="The world's most comprehensive and broadly adopted cloud platform.",
    )
    db.add_all([quantum, technova, finedge, cloudsphere, google, microsoft, meta, amazon])
    db.flush()

    # --------------------------------------------------------------------------
    # 4. Students
    # --------------------------------------------------------------------------
    # Student 1 (Primary Demo): Rohan Patil (ON_TRACK)
    user_rohan = User(
        email="student@demo.com",
        hashed_password=hash_password("Student@123"),
        full_name="Rohan Patil",
        role="STUDENT",
        is_active=True,
    )
    db.add(user_rohan)
    db.flush()

    student_rohan = Student(
        user_id=user_rohan.id,
        roll_number="CS-2023-001",
        department="Computer Science & Engineering",
        academic_year=3,
        phone="+91-98765-43210",
    )
    db.add(student_rohan)
    db.flush()

    for s in ["Python", "Machine Learning", "SQL", "Git", "FastAPI", "React"]:
        db.add(StudentSkill(student_id=student_rohan.id, skill_name=s))

    # Student 2: Alex Chen (ON_TRACK)
    user_alex = User(
        email="student.alex@university.edu",
        hashed_password=hash_password("Student@123"),
        full_name="Alex Chen",
        role="STUDENT",
        is_active=True,
    )
    db.add(user_alex)
    db.flush()

    student_alex = Student(
        user_id=user_alex.id,
        roll_number="CS-2023-042",
        department="Computer Science & Engineering",
        academic_year=3,
        phone="+1-555-0142",
    )
    db.add(student_alex)
    db.flush()

    for s in ["Python", "FastAPI", "React", "Docker", "PostgreSQL", "Git"]:
        db.add(StudentSkill(student_id=student_alex.id, skill_name=s))

    # Student 3: Sneha Kulkarni / Sara Connor (MONITOR)
    user_sara = User(
        email="student.sara@university.edu",
        hashed_password=hash_password("Student@123"),
        full_name="Sneha Kulkarni",
        role="STUDENT",
        is_active=True,
    )
    db.add(user_sara)
    db.flush()

    student_sara = Student(
        user_id=user_sara.id,
        roll_number="DS-2023-088",
        department="Data Science & Artificial Intelligence",
        academic_year=3,
        phone="+91-98765-43211",
    )
    db.add(student_sara)
    db.flush()

    for s in ["Python", "SQL", "Statistics", "Excel", "Pandas"]:
        db.add(StudentSkill(student_id=student_sara.id, skill_name=s))

    # Student 4: Aditya Joshi / David Miller (NEEDS_ATTENTION)
    user_david = User(
        email="student.david@university.edu",
        hashed_password=hash_password("Student@123"),
        full_name="Aditya Joshi",
        role="STUDENT",
        is_active=True,
    )
    db.add(user_david)
    db.flush()

    student_david = Student(
        user_id=user_david.id,
        roll_number="CS-2023-104",
        department="Computer Science & Engineering",
        academic_year=2,
        phone="+91-98765-43212",
    )
    db.add(student_david)
    db.flush()

    for s in ["HTML", "CSS", "JavaScript"]:
        db.add(StudentSkill(student_id=student_david.id, skill_name=s))

    # Student 5: Aarav Sharma (ON_TRACK)
    user_aarav = User(
        email="student.aarav@university.edu",
        hashed_password=hash_password("Student@123"),
        full_name="Aarav Sharma",
        role="STUDENT",
        is_active=True,
    )
    db.add(user_aarav)
    db.flush()

    student_aarav = Student(
        user_id=user_aarav.id,
        roll_number="CS-2023-109",
        department="Computer Science & Engineering",
        academic_year=3,
        phone="+91-98765-43213",
    )
    db.add(student_aarav)
    db.flush()

    for s in ["AWS", "Docker", "Linux", "Python", "Git"]:
        db.add(StudentSkill(student_id=student_aarav.id, skill_name=s))

    # Student 6: Priya Deshmukh (MONITOR)
    user_priya = User(
        email="student.priya@university.edu",
        hashed_password=hash_password("Student@123"),
        full_name="Priya Deshmukh",
        role="STUDENT",
        is_active=True,
    )
    db.add(user_priya)
    db.flush()

    student_priya = Student(
        user_id=user_priya.id,
        roll_number="DS-2023-115",
        department="Data Science & Artificial Intelligence",
        academic_year=3,
        phone="+91-98765-43214",
    )
    db.add(student_priya)
    db.flush()

    for s in ["SQL", "Python", "Tableau", "Power BI", "Excel"]:
        db.add(StudentSkill(student_id=student_priya.id, skill_name=s))

    # Student 7: Maya Patel (Applicant / Exploring)
    user_maya = User(
        email="student.maya@university.edu",
        hashed_password=hash_password("Student@123"),
        full_name="Maya Patel",
        role="STUDENT",
        is_active=True,
    )
    db.add(user_maya)
    db.flush()

    student_maya = Student(
        user_id=user_maya.id,
        roll_number="CS-2023-112",
        department="Computer Science & Engineering",
        academic_year=3,
        phone="+1-555-0112",
    )
    db.add(student_maya)
    db.flush()

    for s in ["Python", "SQL", "Git", "Docker"]:
        db.add(StudentSkill(student_id=student_maya.id, skill_name=s))

    # --------------------------------------------------------------------------
    # 5. Internships
    # --------------------------------------------------------------------------
    # 1. AI/ML Intern at Quantum AI Labs (Active for Rohan Patil -> ON_TRACK)
    internship_quantum = Internship(
        title="AI/ML Intern",
        company_id=quantum.id,
        mentor_id=mentor_1.id,
        student_id=student_rohan.id,
        description="Design deep learning models, fine-tune transformer architectures, and evaluate agentic reasoning pipelines.",
        location="Remote / Bengaluru, India",
        is_remote=True,
        stipend=3500.0,
        duration_weeks=10,
        status="ACTIVE",
        start_date=now - timedelta(days=30),
        end_date=now + timedelta(days=40),
    )
    db.add(internship_quantum)
    db.flush()

    for s in ["Python", "Machine Learning", "PyTorch", "FastAPI"]:
        db.add(InternshipSkill(internship_id=internship_quantum.id, skill_name=s))

    # 2. Full Stack Cloud Software Engineer at Google Cloud (Active for Alex Chen -> ON_TRACK)
    internship_google = Internship(
        title="Full Stack Cloud Software Engineer",
        company_id=google.id,
        mentor_id=mentor_1.id,
        student_id=student_alex.id,
        description="Architect and build microservices, REST APIs, and modern web dashboards on Google Cloud Platform.",
        location="Remote / Sunnyvale, CA",
        is_remote=True,
        stipend=3500.0,
        duration_weeks=10,
        status="ACTIVE",
        start_date=now - timedelta(days=30),
        end_date=now + timedelta(days=40),
    )
    db.add(internship_google)
    db.flush()

    for s in ["Python", "FastAPI", "React", "Docker"]:
        db.add(InternshipSkill(internship_id=internship_google.id, skill_name=s))

    # 3. Python Developer Intern at TechNova Labs (Active for Sneha Kulkarni -> MONITOR)
    internship_technova = Internship(
        title="Python Developer Intern",
        company_id=technova.id,
        mentor_id=mentor_2.id,
        student_id=student_sara.id,
        description="Develop backend REST APIs, perform asynchronous data transformations, and build ETL jobs.",
        location="Remote / Pune, India",
        is_remote=True,
        stipend=3000.0,
        duration_weeks=8,
        status="ACTIVE",
        start_date=now - timedelta(days=21),
        end_date=now + timedelta(days=35),
    )
    db.add(internship_technova)
    db.flush()

    for s in ["Python", "SQL", "FastAPI", "Git"]:
        db.add(InternshipSkill(internship_id=internship_technova.id, skill_name=s))

    # 4. Frontend UX Platform Engineer at FinEdge Solutions (Active for Aditya Joshi -> NEEDS_ATTENTION)
    internship_finedge = Internship(
        title="Frontend UX Platform Engineer",
        company_id=finedge.id,
        mentor_id=mentor_1.id,
        student_id=student_david.id,
        description="Build responsive user interfaces, design system components, and optimize web app performance.",
        location="Mumbai, India",
        is_remote=False,
        stipend=2800.0,
        duration_weeks=8,
        status="ACTIVE",
        start_date=now - timedelta(days=28),
        end_date=now + timedelta(days=28),
    )
    db.add(internship_finedge)
    db.flush()

    for s in ["React", "TypeScript", "CSS", "Next.js"]:
        db.add(InternshipSkill(internship_id=internship_finedge.id, skill_name=s))

    # 5. Cloud Computing Intern at CloudSphere Technologies (Active for Aarav Sharma -> ON_TRACK)
    internship_cloud = Internship(
        title="Cloud Computing Intern",
        company_id=cloudsphere.id,
        mentor_id=mentor_2.id,
        student_id=student_aarav.id,
        description="Provision cloud infrastructure with Terraform, maintain Kubernetes clusters, and automate deployments.",
        location="Remote / Hyderabad, India",
        is_remote=True,
        stipend=3200.0,
        duration_weeks=10,
        status="ACTIVE",
        start_date=now - timedelta(days=25),
        end_date=now + timedelta(days=45),
    )
    db.add(internship_cloud)
    db.flush()

    for s in ["AWS", "Docker", "Kubernetes", "Linux"]:
        db.add(InternshipSkill(internship_id=internship_cloud.id, skill_name=s))

    # 6. Data Analyst Intern at FinEdge Solutions (Active for Priya Deshmukh -> MONITOR)
    internship_analyst = Internship(
        title="Data Analyst Intern",
        company_id=finedge.id,
        mentor_id=mentor_2.id,
        student_id=student_priya.id,
        description="Extract quantitative signals, clean datasets with Pandas and SQL, and build executive reporting dashboards.",
        location="Mumbai, India",
        is_remote=True,
        stipend=2900.0,
        duration_weeks=8,
        status="ACTIVE",
        start_date=now - timedelta(days=20),
        end_date=now + timedelta(days=36),
    )
    db.add(internship_analyst)
    db.flush()

    for s in ["SQL", "Python", "Tableau", "Excel"]:
        db.add(InternshipSkill(internship_id=internship_analyst.id, skill_name=s))

    # 7. Available Opportunities for Open Application
    internship_aws = Internship(
        title="DevOps & Cloud Infrastructure Intern",
        company_id=amazon.id,
        mentor_id=None,
        student_id=None,
        description="Automate cloud infrastructure provisioning with Terraform, containerize workloads, and configure CI/CD pipelines.",
        location="Seattle, WA",
        is_remote=True,
        stipend=3400.0,
        duration_weeks=12,
        status="AVAILABLE",
    )
    internship_msft = Internship(
        title="AI Research & System Modeling Intern",
        company_id=microsoft.id,
        mentor_id=None,
        student_id=None,
        description="Explore transformer fine-tuning, evaluate benchmarks, and optimize model inference latency.",
        location="Redmond, WA",
        is_remote=True,
        stipend=3600.0,
        duration_weeks=12,
        status="AVAILABLE",
    )
    db.add_all([internship_aws, internship_msft])
    db.flush()

    for s in ["Docker", "Kubernetes", "AWS", "CI/CD"]:
        db.add(InternshipSkill(internship_id=internship_aws.id, skill_name=s))

    for s in ["Python", "Machine Learning", "PyTorch", "C++"]:
        db.add(InternshipSkill(internship_id=internship_msft.id, skill_name=s))

    # Maya applied to AWS
    app_maya = Application(
        student_id=student_maya.id,
        internship_id=internship_aws.id,
        status="PENDING",
        applied_at=now - timedelta(days=2),
    )
    db.add(app_maya)

    # --------------------------------------------------------------------------
    # 6. Tasks and Weekly Reports for Rohan Patil (High Performer -> ON_TRACK)
    # --------------------------------------------------------------------------
    tasks_rohan = [
        ("Setup PyTorch model training pipeline & Docker image", True),
        ("Train base classification model on dataset", True),
        ("Implement REST API wrapper using FastAPI", True),
        ("Write unit tests and benchmark inference throughput", True),
        ("Package service and deploy to staging cluster", False),
    ]
    for title, completed in tasks_rohan:
        db.add(
            Task(
                internship_id=internship_quantum.id,
                student_id=student_rohan.id,
                title=title,
                is_completed=completed,
                completed_at=now - timedelta(days=4) if completed else None,
            )
        )

    reports_rohan = [
        (1, "Completed environment setup and verified CUDA acceleration.", "Minor dependency conflict resolved.", 92.0),
        (2, "Implemented model training loop and logged validation loss metrics.", "Dataset imbalance handled via resampling.", 90.0),
        (3, "Optimized inference using ONNX Runtime with 2.8x speedup.", "None.", 95.0),
        (4, "Built FastAPI prediction endpoints and integrated Swagger tests.", "All tests passing.", 92.0),
    ]
    for w, ach, chal, score in reports_rohan:
        db.add(
            WeeklyReport(
                internship_id=internship_quantum.id,
                student_id=student_rohan.id,
                week_number=w,
                achievements=ach,
                challenges=chal,
                hours_spent=40.0,
                status="REVIEWED",
                mentor_feedback="Outstanding work, exemplary technical initiative and consistent milestone delivery.",
                mentor_score=score,
                submitted_at=now - timedelta(days=(5 - w) * 7),
                reviewed_at=now - timedelta(days=(5 - w) * 7 - 1),
            )
        )

    # --------------------------------------------------------------------------
    # 7. Tasks and Reports for Alex Chen (ON_TRACK)
    # --------------------------------------------------------------------------
    tasks_alex = [
        ("Setup GCP development environment and IAM keys", True),
        ("Implement REST API endpoints using FastAPI", True),
        ("Integrate database migrations and SQLAlchemy models", True),
        ("Write integration tests with pytest", True),
        ("Deploy Docker containers to Google Cloud Run", False),
    ]
    for title, completed in tasks_alex:
        db.add(
            Task(
                internship_id=internship_google.id,
                student_id=student_alex.id,
                title=title,
                is_completed=completed,
                completed_at=now - timedelta(days=5) if completed else None,
            )
        )

    reports_alex = [
        (1, "Completed onboarding and local environment containerization.", "No major blockers.", 92.0),
        (2, "Implemented core CRUD endpoints for student management.", "Resolved race condition in DB.", 88.0),
        (3, "Optimized SQL queries and added indexing for fast lookups.", "Drafted PR for review.", 95.0),
        (4, "Built UI integration and conducted end-to-end testing.", "Ready for staging deployment.", 90.0),
    ]
    for w, ach, chal, score in reports_alex:
        db.add(
            WeeklyReport(
                internship_id=internship_google.id,
                student_id=student_alex.id,
                week_number=w,
                achievements=ach,
                challenges=chal,
                hours_spent=40.0,
                status="REVIEWED",
                mentor_feedback="Outstanding progress, clear documentation, and proactive communication.",
                mentor_score=score,
                submitted_at=now - timedelta(days=(5 - w) * 7),
                reviewed_at=now - timedelta(days=(5 - w) * 7 - 1),
            )
        )

    # --------------------------------------------------------------------------
    # 8. Tasks and Reports for Sneha Kulkarni (MONITOR)
    # --------------------------------------------------------------------------
    tasks_sara = [
        ("Data ingestion pipeline setup", True),
        ("Exploratory data analysis on customer churn", True),
        ("Train gradient boosted decision trees", False),
        ("Build interactive dashboard", False),
    ]
    for title, completed in tasks_sara:
        db.add(
            Task(
                internship_id=internship_technova.id,
                student_id=student_sara.id,
                title=title,
                is_completed=completed,
                completed_at=now - timedelta(days=10) if completed else None,
            )
        )

    reports_sara = [
        (1, "Loaded CSV datasets and performed missing value imputation.", "Some corrupted records in raw logs.", 70.0),
        (2, "Generated correlation matrix and summary visualizations.", "Feature distribution skewed.", 65.0),
    ]
    for w, ach, chal, score in reports_sara:
        db.add(
            WeeklyReport(
                internship_id=internship_technova.id,
                student_id=student_sara.id,
                week_number=w,
                achievements=ach,
                challenges=chal,
                hours_spent=35.0,
                status="REVIEWED",
                mentor_feedback="Acceptable analysis, but need deeper feature engineering and prompt report filing.",
                mentor_score=score,
                submitted_at=now - timedelta(days=(4 - w) * 7),
                reviewed_at=now - timedelta(days=(4 - w) * 7 - 1),
            )
        )

    # --------------------------------------------------------------------------
    # 9. Tasks and Reports for Aditya Joshi (NEEDS_ATTENTION)
    # --------------------------------------------------------------------------
    tasks_david = [
        ("Figma design review and component breakdown", True),
        ("Implement design system color tokens and typography", False),
        ("Build accessible navigation bar component", False),
        ("Implement responsive data table", False),
        ("Write Storybook component tests", False),
    ]
    for title, completed in tasks_david:
        db.add(
            Task(
                internship_id=internship_finedge.id,
                student_id=student_david.id,
                title=title,
                is_completed=completed,
                completed_at=now - timedelta(days=20) if completed else None,
            )
        )

    db.add(
        WeeklyReport(
            internship_id=internship_finedge.id,
            student_id=student_david.id,
            week_number=1,
            achievements="Reviewed Figma files and initialized Git repo.",
            challenges="Struggled with TypeScript configuration and CSS modules.",
            hours_spent=20.0,
            status="REVIEWED",
            mentor_feedback="Critical delay in foundational tasks. Multiple missed check-ins and overdue reports.",
            mentor_score=40.0,
            submitted_at=now - timedelta(days=21),
            reviewed_at=now - timedelta(days=20),
        )
    )

    # --------------------------------------------------------------------------
    # 10. Tasks and Reports for Aarav Sharma (ON_TRACK)
    # --------------------------------------------------------------------------
    tasks_aarav = [
        ("Setup AWS IAM roles and VPC subnets", True),
        ("Configure Terraform scripts for EC2 instances", True),
        ("Build automated container build pipeline with GitHub Actions", True),
        ("Configure CloudWatch logging and metrics alerts", False),
    ]
    for title, completed in tasks_aarav:
        db.add(
            Task(
                internship_id=internship_cloud.id,
                student_id=student_aarav.id,
                title=title,
                is_completed=completed,
                completed_at=now - timedelta(days=7) if completed else None,
            )
        )

    reports_aarav = [
        (1, "Configured AWS provider and established infrastructure code base.", "IAM policy permissions needed tuning.", 85.0),
        (2, "Completed VPC peering and verified network route tables.", "None.", 88.0),
        (3, "Integrated GitHub Actions workflow for automated image scans.", "Docker layer caching implemented.", 90.0),
    ]
    for w, ach, chal, score in reports_aarav:
        db.add(
            WeeklyReport(
                internship_id=internship_cloud.id,
                student_id=student_aarav.id,
                week_number=w,
                achievements=ach,
                challenges=chal,
                hours_spent=40.0,
                status="REVIEWED",
                mentor_feedback="Solid infrastructure foundation and clean Terraform templates.",
                mentor_score=score,
                submitted_at=now - timedelta(days=(4 - w) * 7),
                reviewed_at=now - timedelta(days=(4 - w) * 7 - 1),
            )
        )

    # --------------------------------------------------------------------------
    # 11. Tasks and Reports for Priya Deshmukh (MONITOR)
    # --------------------------------------------------------------------------
    tasks_priya = [
        ("Extract transaction logs from database", True),
        ("Clean and normalize customer payment histories", True),
        ("Build Tableau dashboard for executive summaries", False),
        ("Perform cohort churn analysis", False),
    ]
    for title, completed in tasks_priya:
        db.add(
            Task(
                internship_id=internship_analyst.id,
                student_id=student_priya.id,
                title=title,
                is_completed=completed,
                completed_at=now - timedelta(days=8) if completed else None,
            )
        )

    reports_priya = [
        (1, "Extracted 500k rows from SQL database and profiled missing values.", "Data format inconsistencies.", 75.0),
        (2, "Created normalized views and calculated monthly active customer metrics.", "Query performance required indexing.", 72.0),
    ]
    for w, ach, chal, score in reports_priya:
        db.add(
            WeeklyReport(
                internship_id=internship_analyst.id,
                student_id=student_priya.id,
                week_number=w,
                achievements=ach,
                challenges=chal,
                hours_spent=36.0,
                status="REVIEWED",
                mentor_feedback="Good data validation, recommend expediting the Tableau dashboard build.",
                mentor_score=score,
                submitted_at=now - timedelta(days=(3 - w) * 7),
                reviewed_at=now - timedelta(days=(3 - w) * 7 - 1),
            )
        )

    db.commit()
