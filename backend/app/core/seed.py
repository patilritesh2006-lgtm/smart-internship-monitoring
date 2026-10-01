import re
from datetime import datetime, timedelta, timezone
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session
from backend.app.core.security import hash_password
from backend.app.models import (
    Application,
    Certificate,
    Company,
    Internship,
    InternshipSkill,
    Intervention,
    KnowledgeHandoff,
    Mentor,
    Message,
    Notification,
    SkillDependency,
    Student,
    StudentSkill,
    Task,
    User,
    WeeklyReport,
)


def seed_database(db: Session) -> None:
    """Seeds the database with initial users, companies, internships, tasks, and reports."""
    ensure_schema_columns(db)
    # Check if database is already seeded
    if db.query(User).first() is not None:
        ensure_required_seed_data(db)
        return

    now = datetime.now(timezone.utc)

    # --------------------------------------------------------------------------
    # 1. Administrator (Enforce EXACTLY ONE Admin Account)
    # --------------------------------------------------------------------------
    admin_user = User(
        email="admin@university.edu",
        hashed_password=hash_password("Admin@123"),
        full_name="Dean of Engineering (Admin)",
        role="ADMIN",
        is_active=True,
    )
    db.add(admin_user)
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
        employee_id="MNT-001",
    )
    mentor_demo_profile = Mentor(
        user_id=mentor_demo.id,
        department="Computer Science & Engineering",
        designation="Professor & Head of Research",
        employee_id="MNT-002",
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
        employee_id="MNT-003",
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
    ensure_required_seed_data(db)


def ensure_schema_columns(db: Session) -> None:
    """Safely adds newly introduced columns to existing SQLite tables if missing."""
    try:
        bind = db.get_bind()
        inspector = inspect(bind)
        tables = set(inspector.get_table_names())
        if "students" in tables:
            cols = {c["name"] for c in inspector.get_columns("students")}
            if "mentor_id" not in cols:
                db.execute(
                    text("ALTER TABLE students ADD COLUMN mentor_id INTEGER REFERENCES mentors(id) ON DELETE SET NULL")
                )
                db.commit()
        if "companies" in tables:
            cols = {c["name"] for c in inspector.get_columns("companies")}
            if "is_active" not in cols:
                db.execute(
                    text("ALTER TABLE companies ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT 1")
                )
                db.commit()
        if "internships" in tables:
            cols = {c["name"] for c in inspector.get_columns("internships")}
            if "deadline" not in cols:
                db.execute(
                    text("ALTER TABLE internships ADD COLUMN deadline DATETIME")
                )
                db.commit()
            if "domain" not in cols:
                db.execute(
                    text("ALTER TABLE internships ADD COLUMN domain VARCHAR(100) NOT NULL DEFAULT 'Software Development'")
                )
                db.commit()
            if "completion_status" not in cols:
                db.execute(
                    text("ALTER TABLE internships ADD COLUMN completion_status VARCHAR(50) NOT NULL DEFAULT 'IN_PROGRESS'")
                )
                db.commit()
        if "weekly_reports" in tables:
            cols = {c["name"] for c in inspector.get_columns("weekly_reports")}
            if "evidence_url" not in cols:
                db.execute(
                    text("ALTER TABLE weekly_reports ADD COLUMN evidence_url VARCHAR(500)")
                )
                db.commit()
        if "applications" in tables:
            cols = {c["name"] for c in inspector.get_columns("applications")}
            app_migrations = [
                ("application_data", "TEXT"),
                ("submitted_skills", "TEXT"),
                ("skill_match_percentage", "FLOAT NOT NULL DEFAULT 0.0"),
                ("matched_skills", "TEXT"),
                ("missing_skills", "TEXT"),
                ("skill_recommendation", "TEXT"),
            ]
            for col_name, col_type in app_migrations:
                if col_name not in cols:
                    db.execute(text(f"ALTER TABLE applications ADD COLUMN {col_name} {col_type}"))
                    db.commit()
        if "tasks" in tables:
            cols = {c["name"] for c in inspector.get_columns("tasks")}
            task_migrations = [
                ("application_id", "INTEGER REFERENCES applications(id) ON DELETE SET NULL"),
                ("mentor_id", "INTEGER REFERENCES mentors(id) ON DELETE SET NULL"),
                ("priority", "VARCHAR(50) NOT NULL DEFAULT 'MEDIUM'"),
                ("status", "VARCHAR(50) NOT NULL DEFAULT 'PENDING'"),
            ]
            for col_name, col_type in task_migrations:
                if col_name not in cols:
                    db.execute(text(f"ALTER TABLE tasks ADD COLUMN {col_name} {col_type}"))
                    db.commit()
    except Exception:
        db.rollback()


def generate_next_mentor_id(db: Session) -> str:
    """Generates the next permanent unique Mentor ID in MNT-001, MNT-002, ... format."""
    existing_ids = [
        m.employee_id.strip().upper()
        for m in db.query(Mentor).all()
        if m.employee_id and m.employee_id.strip()
    ]
    used_set = set(existing_ids)
    max_num = 0
    for eid in existing_ids:
        match = re.match(r"^MNT-(\d+)$", eid)
        if match:
            num = int(match.group(1))
            if num > max_num:
                max_num = num
    next_num = max_num + 1
    while True:
        candidate = f"MNT-{next_num:03d}"
        if candidate not in used_set:
            return candidate
        next_num += 1


def ensure_unique_mentor_ids(db: Session) -> None:
    """Ensures every User with role MENTOR has a Mentor profile and a permanent unique MNT-XXX ID."""
    mentor_users = db.query(User).filter(User.role == "MENTOR").order_by(User.id.asc()).all()
    for u in mentor_users:
        existing_profile = db.query(Mentor).filter(Mentor.user_id == u.id).first()
        if not existing_profile:
            new_id = generate_next_mentor_id(db)
            db.add(
                Mentor(
                    user_id=u.id,
                    department="Computer Science & Engineering",
                    designation="Assistant Professor",
                    employee_id=new_id,
                )
            )
            db.flush()

    all_mentors = db.query(Mentor).order_by(Mentor.id.asc()).all()
    seen_mnt_ids: set[str] = set()
    needs_assignment: list[Mentor] = []

    for m in all_mentors:
        raw_id = (m.employee_id or "").strip().upper()
        if re.match(r"^MNT-\d{3,}$", raw_id) and raw_id not in seen_mnt_ids:
            if m.employee_id != raw_id:
                m.employee_id = raw_id
            seen_mnt_ids.add(raw_id)
        else:
            needs_assignment.append(m)

    if needs_assignment:
        for idx, m in enumerate(needs_assignment):
            m.employee_id = f"TMP-MNT-{m.id}-{idx}"
        db.flush()

        next_num = 1
        for m in needs_assignment:
            while f"MNT-{next_num:03d}" in seen_mnt_ids:
                next_num += 1
            assigned_code = f"MNT-{next_num:03d}"
            m.employee_id = assigned_code
            seen_mnt_ids.add(assigned_code)
            next_num += 1
        db.commit()


def infer_internship_domain(title: str, description: str, company_industry: str = "") -> str:
    """Deterministically infers the canonical domain for an internship from its title/description."""
    combined = f"{title} {description} {company_industry}".lower()
    if "devops" in combined or "ci/cd" in combined or "terraform" in combined:
        return "DevOps"
    if "site reliability" in combined or "cloud" in combined or "aws" in combined or "gke" in combined:
        if "ai" in title.lower() or "watsonx" in title.lower():
            return "Artificial Intelligence"
        return "Cloud Computing"
    if "machine learning" in combined or "ml" in title.lower() or "pytorch" in combined:
        if "ai research" in title.lower() or "generative" in title.lower() or "watsonx" in title.lower():
            return "Artificial Intelligence"
        return "Machine Learning"
    if "artificial intelligence" in combined or "ai" in title.lower() or "llm" in combined:
        return "Artificial Intelligence"
    if "data science" in combined or "churn" in combined or "predictive" in combined:
        return "Data Science"
    if "data analy" in combined or "tableau" in combined or "business intelligence" in combined or "quantitative" in combined:
        return "Data Analytics"
    if "frontend" in combined or "full-stack" in combined or "react" in combined or "web" in combined:
        if "ui/ux" in combined or "design system" in combined or "figma" in combined:
            return "UI/UX"
        return "Web Development"
    if "cyber" in combined or "security" in combined:
        return "Cyber Security"
    if "iot" in combined or "sensor" in combined:
        return "IoT"
    if "embedded" in combined or "firmware" in combined:
        return "Embedded Systems"
    if "blockchain" in combined or "web3" in combined:
        return "Blockchain"
    if "network" in combined:
        return "Networking"
    return "Software Development"


def ensure_required_seed_data(db: Session) -> None:
    """Idempotently ensures:
    1. Student.mentor_id is synced with active Internship.mentor_id where not set.
    2. At least 5 international companies (Microsoft, Google, IBM, Amazon, Adobe) exist with AVAILABLE internships.
    3. Initial student-mentor messages and persistent notifications exist without duplication.
    4. Every mentor has a permanent unique MNT-XXX Mentor ID.
    5. Every internship has a valid domain, SkillDependency edges exist, and demo KnowledgeHandoff exists.
    """
    now = datetime.now(timezone.utc)

    # 1. Sync Student.mentor_id from active/completed Internship if Student.mentor_id is None
    students = db.query(Student).all()
    for student in students:
        if student.mentor_id is None:
            active_int = (
                db.query(Internship)
                .filter(Internship.student_id == student.id, Internship.mentor_id.isnot(None))
                .order_by(Internship.id.desc())
                .first()
            )
            if active_int and active_int.mentor_id:
                student.mentor_id = active_int.mentor_id

    db.flush()

    # Find default faculty mentors for open internship listings
    mentor_turing = (
        db.query(Mentor)
        .join(User, Mentor.user_id == User.id)
        .filter(User.email == "mentor.turing@university.edu")
        .first()
    )
    if not mentor_turing:
        mentor_turing = db.query(Mentor).first()

    mentor_lovelace = (
        db.query(Mentor)
        .join(User, Mentor.user_id == User.id)
        .filter(User.email == "mentor.lovelace@university.edu")
        .first()
    ) or mentor_turing

    # Ensure a 3rd faculty mentor exists so Admin has a rich faculty roster
    mentor_hopper_user = db.query(User).filter(User.email == "mentor.hopper@university.edu").first()
    if not mentor_hopper_user:
        mentor_hopper_user = User(
            email="mentor.hopper@university.edu",
            hashed_password=hash_password("Mentor@123"),
            full_name="Dr. Grace Hopper",
            role="MENTOR",
            is_active=True,
        )
        db.add(mentor_hopper_user)
        db.flush()
        mentor_hopper = Mentor(
            user_id=mentor_hopper_user.id,
            department="Software Systems & Distributed Computing",
            designation="Distinguished Professor",
            employee_id=generate_next_mentor_id(db),
        )
        db.add(mentor_hopper)
        db.flush()

    ensure_unique_mentor_ids(db)

    # 2. Idempotently ensure at least 5 international companies (Microsoft, Google, IBM, Amazon, Adobe)
    international_catalog = [
        {
            "company_name": "Microsoft",
            "industry": "Cloud Computing & Enterprise AI",
            "website": "https://www.microsoft.com",
            "contact_email": "university@microsoft.com",
            "company_desc": "Global technology corporation building Azure cloud infrastructure, Copilot AI systems, and developer tools.",
            "title": "Software Engineering Intern — Azure AI Platform",
            "domain": "Artificial Intelligence",
            "location": "Redmond, WA / Hybrid",
            "is_remote": True,
            "stipend": 3500.0,
            "duration_weeks": 12,
            "description": "Build distributed microservices and telemetry pipelines for Azure OpenAI and enterprise cloud workloads.",
            "skills": ["Python", "C#", "Docker", "Kubernetes", "Azure", "REST APIs"],
            "mentor_id": mentor_turing.id if mentor_turing else None,
        },
        {
            "company_name": "Google",
            "industry": "Search, Cloud & Artificial Intelligence",
            "website": "https://careers.google.com",
            "contact_email": "internships@google.com",
            "company_desc": "Multinational technology leader in search engines, cloud computing, Kubernetes, and Gemini AI models.",
            "title": "Site Reliability & Cloud Engineering Intern",
            "domain": "Cloud Computing",
            "location": "Mountain View, CA / Remote",
            "is_remote": True,
            "stipend": 3800.0,
            "duration_weeks": 12,
            "description": "Engineer high-availability distributed storage systems, automated observability tooling, and GKE cluster scaling.",
            "skills": ["Go", "Python", "Kubernetes", "Docker", "Linux", "SQL"],
            "mentor_id": mentor_turing.id if mentor_turing else None,
        },
        {
            "company_name": "IBM",
            "industry": "Enterprise Hybrid Cloud & Quantum Computing",
            "website": "https://www.ibm.com/careers",
            "contact_email": "campus.global@ibm.com",
            "company_desc": "Global leader in hybrid cloud architecture via Red Hat OpenShift, watsonx enterprise AI, and quantum computing.",
            "title": "AI & Hybrid Cloud Engineering Intern (watsonx)",
            "domain": "Machine Learning",
            "location": "Armonk, NY / Remote",
            "is_remote": True,
            "stipend": 3100.0,
            "duration_weeks": 10,
            "description": "Develop enterprise LLM governance workflows, RAG evaluation pipelines, and containerized microservices on OpenShift.",
            "skills": ["Python", "Machine Learning", "Docker", "FastAPI", "SQL", "Git"],
            "mentor_id": mentor_lovelace.id if mentor_lovelace else None,
        },
        {
            "company_name": "Amazon",
            "industry": "Cloud Infrastructure (AWS) & Global E-Commerce",
            "website": "https://www.amazon.jobs",
            "contact_email": "aws-student-programs@amazon.com",
            "company_desc": "Global pioneer in cloud computing (AWS), high-throughput distributed logistics, and machine learning systems.",
            "title": "Software Development Engineer (SDE) Intern — AWS Core",
            "domain": "Software Development",
            "location": "Seattle, WA / Hybrid",
            "is_remote": False,
            "stipend": 3600.0,
            "duration_weeks": 12,
            "description": "Design and scale low-latency serverless compute primitives, IAM security policies, and DynamoDB replication workflows.",
            "skills": ["Java", "Python", "AWS", "Docker", "Distributed Systems", "SQL"],
            "mentor_id": mentor_turing.id if mentor_turing else None,
        },
        {
            "company_name": "Adobe",
            "industry": "Digital Media, Creative Cloud & Generative AI",
            "website": "https://www.adobe.com/careers.html",
            "contact_email": "university-talent@adobe.com",
            "company_desc": "Global software leader powering digital experiences, Creative Cloud, Document Cloud, and Firefly generative AI.",
            "title": "Full-Stack & Generative Media Engineering Intern",
            "domain": "Web Development",
            "location": "San Jose, CA / Remote",
            "is_remote": True,
            "stipend": 3300.0,
            "duration_weeks": 10,
            "description": "Build responsive web studio interfaces and high-throughput media rendering APIs powered by Adobe Firefly services.",
            "skills": ["TypeScript", "React", "Python", "FastAPI", "AWS", "GraphQL"],
            "mentor_id": mentor_lovelace.id if mentor_lovelace else None,
        },
    ]

    for item in international_catalog:
        company = db.query(Company).filter(Company.name == item["company_name"]).first()
        if not company:
            company = Company(
                name=item["company_name"],
                industry=item["industry"],
                website=item["website"],
                contact_email=item["contact_email"],
                description=item["company_desc"],
            )
            db.add(company)
            db.flush()

        existing_available = (
            db.query(Internship)
            .filter(Internship.company_id == company.id, Internship.status == "AVAILABLE")
            .first()
        )
        if not existing_available:
            existing_internship = (
                db.query(Internship)
                .filter(Internship.company_id == company.id, Internship.title == item["title"])
                .first()
            )
            if existing_internship and existing_internship.student_id is None:
                existing_internship.status = "AVAILABLE"
                existing_internship.domain = item["domain"]
            else:
                new_int = Internship(
                    title=item["title"],
                    company_id=company.id,
                    mentor_id=item["mentor_id"],
                    domain=item["domain"],
                    description=item["description"],
                    location=item["location"],
                    is_remote=item["is_remote"],
                    stipend=item["stipend"],
                    duration_weeks=item["duration_weeks"],
                    status="AVAILABLE",
                    start_date=now + timedelta(days=14),
                    end_date=now + timedelta(days=14 + item["duration_weeks"] * 7),
                )
                db.add(new_int)
                db.flush()
                for skill in item["skills"]:
                    db.add(InternshipSkill(internship_id=new_int.id, skill_name=skill))

    # Backfill valid domains & completion_status on all internships
    for intr in db.query(Internship).all():
        if not intr.domain or intr.domain == "Software Development":
            inferred = infer_internship_domain(
                intr.title or "",
                intr.description or "",
                intr.company.industry if intr.company else "",
            )
            intr.domain = inferred
        if intr.status == "COMPLETED":
            intr.completion_status = "COMPLETED"
        elif not intr.completion_status:
            intr.completion_status = "IN_PROGRESS"
    db.flush()

    # Ensure Maya Patel has PENDING applications on AVAILABLE internships and active students have APPROVED application records
    maya_user = db.query(User).filter(User.email == "student.maya@university.edu").first()
    if maya_user and maya_user.student_profile:
        maya_st = maya_user.student_profile
        maya_apps = db.query(Application).filter(Application.student_id == maya_st.id).all()
        for app_item in maya_apps:
            if app_item.status != "PENDING":
                app_item.status = "PENDING"
            if app_item.internship and app_item.internship.student_id == maya_st.id:
                app_item.internship.status = "AVAILABLE"
                app_item.internship.student_id = None
        db.flush()
        msft_int = db.query(Internship).filter(Internship.title.like("Software Engineering Intern%Azure%")).first()
        if msft_int and not db.query(Application).filter(Application.student_id == maya_st.id, Application.internship_id == msft_int.id).first():
            db.add(
                Application(
                    student_id=maya_st.id,
                    internship_id=msft_int.id,
                    status="PENDING",
                    applied_at=now - timedelta(days=1),
                )
            )
            db.flush()

    for active_int in db.query(Internship).filter(Internship.status == "ACTIVE", Internship.student_id.isnot(None)).all():
        if not active_int.student_id or active_int.status != "ACTIVE":
            continue
        if not db.query(Application).filter(Application.student_id == active_int.student_id, Application.internship_id == active_int.id).first():
            db.add(
                Application(
                    student_id=active_int.student_id,
                    internship_id=active_int.id,
                    status="APPROVED",
                    applied_at=now - timedelta(days=25),
                )
            )

    db.flush()

    # 3. Seed initial realistic student <-> mentor communication where mentor is assigned
    all_students = db.query(Student).all()
    for st in all_students:
        if not st.mentor_id:
            continue
        mentor = db.query(Mentor).filter(Mentor.id == st.mentor_id).first()
        if not mentor or not mentor.user or not st.user:
            continue

        existing_msg = (
            db.query(Message)
            .filter(Message.student_id == st.id, Message.mentor_id == mentor.id)
            .first()
        )
        if not existing_msg:
            msg1 = Message(
                sender_id=mentor.user_id,
                receiver_id=st.user_id,
                student_id=st.id,
                mentor_id=mentor.id,
                content=f"Hello {st.user.full_name}, I have been assigned as your faculty mentor. Please keep your weekly logbooks and milestone tasks updated.",
                is_read=True,
                created_at=now - timedelta(days=2),
            )
            msg2 = Message(
                sender_id=st.user_id,
                receiver_id=mentor.user_id,
                student_id=st.id,
                mentor_id=mentor.id,
                content=f"Thank you {mentor.user.full_name}! I will keep my internship tasks and weekly reports updated on schedule.",
                is_read=True,
                created_at=now - timedelta(days=1, hours=18),
            )
            db.add_all([msg1, msg2])

    db.flush()

    # 3b. Seed initial faculty interventions if none exist
    if db.query(Intervention).count() < 2:
        david_user = db.query(User).filter(User.email == "student.david@university.edu").first()
        sara_user = db.query(User).filter(User.email == "student.sara@university.edu").first()
        if david_user and david_user.student_profile and mentor_turing:
            if not db.query(Intervention).filter(Intervention.student_id == david_user.student_profile.id).first():
                db.add(
                    Intervention(
                        student_id=david_user.student_profile.id,
                        mentor_id=mentor_turing.id,
                        intervention_type="1-on-1 Academic Check-in",
                        notes="Reviewed TypeScript setup blockers and scheduled twice-weekly pair programming sessions.",
                        action_taken="Assigned technical peer buddy and adjusted Week 3 milestone scope.",
                        status="COMPLETED",
                        created_at=now - timedelta(days=5),
                    )
                )
        if sara_user and sara_user.student_profile and mentor_lovelace:
            if not db.query(Intervention).filter(Intervention.student_id == sara_user.student_profile.id).first():
                db.add(
                    Intervention(
                        student_id=sara_user.student_profile.id,
                        mentor_id=mentor_lovelace.id,
                        intervention_type="Milestone Schedule Review",
                        notes="Checked progress on customer churn GBDT training pipeline and clarified feature engineering deliverables.",
                        action_taken="Set Friday checkpoint for Week 3 report submission.",
                        status="COMPLETED",
                        created_at=now - timedelta(days=3),
                    )
                )
        db.flush()

    # 3c. Ensure at least one SUBMITTED weekly report exists for Mentor pending review queue
    if db.query(WeeklyReport).filter(WeeklyReport.status == "SUBMITTED").count() == 0:
        rohan_user = db.query(User).filter(User.email == "student@demo.com").first()
        if rohan_user and rohan_user.student_profile:
            rohan_int = db.query(Internship).filter(Internship.student_id == rohan_user.student_profile.id, Internship.status == "ACTIVE").first()
            if rohan_int and not db.query(WeeklyReport).filter(WeeklyReport.student_id == rohan_user.student_profile.id, WeeklyReport.week_number == 5).first():
                db.add(
                    WeeklyReport(
                        internship_id=rohan_int.id,
                        student_id=rohan_user.student_profile.id,
                        week_number=5,
                        achievements="Containerized FastAPI inference service and ran load testing on staging cluster.",
                        challenges="Tuning Kubernetes HPA thresholds for GPU burst traffic.",
                        evidence_url="https://github.com/rohanpatil/quantum-ai-inference/pull/18",
                        hours_spent=40.0,
                        status="SUBMITTED",
                        submitted_at=now - timedelta(hours=6),
                    )
                )
        db.flush()

    # Backfill evidence_url on existing weekly reports if null
    for rep in db.query(WeeklyReport).filter(WeeklyReport.evidence_url.is_(None)).all():
        rep.evidence_url = f"https://github.com/university-internships/submission-week-{rep.week_number}-rep-{rep.id}"
    db.flush()

    # 3d. Repair any orphaned mentor_id references (e.g. from deleted test mentors) and backfill Application skill gap + internship-specific tasks
    valid_mentor_ids = {m.id for m in db.query(Mentor).all()}
    if mentor_turing:
        for st in db.query(Student).all():
            if st.mentor_id is not None and st.mentor_id not in valid_mentor_ids:
                st.mentor_id = mentor_turing.id
        for intr in db.query(Internship).all():
            if intr.mentor_id is not None and intr.mentor_id not in valid_mentor_ids:
                intr.mentor_id = mentor_turing.id
        db.flush()

    # Clean up generic placeholder onboarding tasks ("Complete company onboarding and security orientation" with due_date=None)
    # and replace with internship-specific tasks for active/applied students
    try:
        import json
        from intelligence.app.skill_gap import analyze_skill_gap
        from backend.app.routers.internships import generate_internship_specific_tasks

        generic_titles = {
            "Complete company onboarding and security orientation",
            "Set up local development and repository environment",
            "Review project architecture documentation and backlog",
            "Implement first sprint feature milestone",
            "Conduct code review and submit Week 1 progress report",
        }
        generic_tasks = db.query(Task).filter(Task.title.in_(generic_titles), Task.due_date.is_(None)).all()
        for gt in generic_tasks:
            db.delete(gt)
        db.flush()

        for app in db.query(Application).all():
            st = app.student
            intr = app.internship
            if not st or not intr:
                continue
            st_skills = [s.skill_name for s in st.skills if s.skill_name]
            req_skills = [s.skill_name for s in intr.skills if s.skill_name]
            gap = analyze_skill_gap(st_skills, req_skills)
            if not app.submitted_skills:
                app.submitted_skills = json.dumps(st_skills)
            if not app.matched_skills or not app.missing_skills or app.skill_match_percentage == 0.0:
                app.skill_match_percentage = float(gap.match_percentage)
                app.matched_skills = json.dumps(gap.matched_skills)
                app.missing_skills = json.dumps(gap.missing_skills)
                app.skill_recommendation = gap.recommendation
            if not app.application_data and st.user:
                app.application_data = json.dumps(
                    {
                        "full_name": st.user.full_name,
                        "email": st.user.email,
                        "phone": st.phone or "+91-9876543210",
                        "college": "University Institute of Technology",
                        "degree": "B.Tech",
                        "department": st.department,
                        "current_year": st.academic_year,
                        "graduation_year": 2026 + max(0, 4 - (st.academic_year or 3)),
                        "technical_skills": st_skills,
                        "cgpa": "8.8",
                        "project_title": f"{intr.title} Prototype",
                        "project_description": f"Academic and lab implementation aligned with {intr.title}.",
                        "project_technologies": ", ".join(st_skills[:4]),
                    }
                )
            # Ensure internship-specific tasks exist for this application
            generate_internship_specific_tasks(
                db=db,
                student_id=st.id,
                internship=intr,
                application_id=app.id,
                mentor_id=st.mentor_id or intr.mentor_id,
                missing_skills=gap.missing_skills,
            )

        for t in db.query(Task).all():
            if t.is_completed and t.status != "COMPLETED":
                t.status = "COMPLETED"
            elif not t.status:
                t.status = "PENDING"
            if not t.priority:
                t.priority = "MEDIUM"
        db.flush()
    except Exception:
        pass

    # 3e. Seed default SkillDependency edges if none exist
    if db.query(SkillDependency).count() == 0:
        default_dependencies = [
            # AI / ML Track
            ("Machine Learning", "Python", "REQUIRES", "Python syntax, NumPy, and data structures are required before Machine Learning."),
            ("Deep Learning", "Machine Learning", "REQUIRES", "Supervised/unsupervised ML fundamentals are required before Deep Learning."),
            ("PyTorch", "Machine Learning", "REQUIRES", "Core Machine Learning concepts are required before building neural networks in PyTorch."),
            ("Computer Vision", "Deep Learning", "REQUIRES", "Convolutional neural networks and Deep Learning are required before Computer Vision."),
            ("NLP", "Deep Learning", "REQUIRES", "Sequence models and Deep Learning fundamentals are required before NLP/Transformers."),
            # Web Development Track
            ("CSS", "HTML", "REQUIRES", "HTML document structure is required before styling with CSS."),
            ("JavaScript", "CSS", "REQUIRES", "HTML & CSS layout fundamentals are recommended before interactive DOM scripting with JavaScript."),
            ("TypeScript", "JavaScript", "REQUIRES", "Core ES6+ JavaScript proficiency is required before static typing with TypeScript."),
            ("React", "JavaScript", "REQUIRES", "JavaScript closures, async/await, and ES modules are required before React."),
            ("Next.js", "React", "REQUIRES", "React component and hook architecture is required before full-stack Next.js."),
            ("GraphQL", "REST APIs", "REQUIRES", "HTTP and REST API fundamentals are required before GraphQL schema design."),
            # Data Science & Analytics Track
            ("Data Analysis", "Python", "REQUIRES", "Python programming fundamentals are required before Data Analysis."),
            ("Pandas", "Data Analysis", "REQUIRES", "Data Analysis concepts are required before tabular manipulation with Pandas."),
            ("Data Analytics", "SQL", "REQUIRES", "Relational querying with SQL is required before Data Analytics."),
            ("Tableau", "Data Analytics", "REQUIRES", "Data Analytics & KPI modeling are required before building Tableau dashboards."),
            ("Power BI", "Data Analytics", "REQUIRES", "Data Analytics & relational modeling are required before Power BI."),
            # Backend & Cloud / DevOps Track
            ("FastAPI", "Python", "REQUIRES", "Python type hints and async fundamentals are required before FastAPI."),
            ("REST APIs", "Python", "REQUIRES", "Backend programming fundamentals are required before designing REST APIs."),
            ("Docker", "Linux", "REQUIRES", "Linux CLI, processes, and file system fundamentals are required before Docker containerization."),
            ("Kubernetes", "Docker", "REQUIRES", "Container packaging with Docker is required before Kubernetes orchestration."),
            ("CI/CD", "Git", "REQUIRES", "Version control with Git is required before configuring CI/CD pipelines."),
            ("AWS", "Linux", "REQUIRES", "Linux networking and OS fundamentals are required before AWS cloud engineering."),
            ("Azure", "Docker", "REQUIRES", "Containerization fundamentals are required before enterprise Azure deployment."),
            ("Distributed Systems", "Docker", "REQUIRES", "Containerized service fundamentals are required before Distributed Systems."),
        ]
        for skill, prereq, rel, desc in default_dependencies:
            db.add(
                SkillDependency(
                    skill=skill,
                    prerequisite_skill=prereq,
                    relationship=rel,
                    description=desc,
                )
            )
        db.flush()

    # 3f. Seed initial KnowledgeHandoff record for Rohan Patil if none exist
    if db.query(KnowledgeHandoff).count() == 0:
        rohan_user = db.query(User).filter(User.email == "student@demo.com").first()
        if rohan_user and rohan_user.student_profile:
            rohan_st = rohan_user.student_profile
            rohan_int = db.query(Internship).filter(Internship.student_id == rohan_st.id).first()
            if rohan_int:
                db.add(
                    KnowledgeHandoff(
                        student_id=rohan_st.id,
                        mentor_id=rohan_st.mentor_id or rohan_int.mentor_id,
                        internship_id=rohan_int.id,
                        title="ONNX Inference Pipeline & FastAPI Microservice Handoff",
                        overview="Comprehensive architecture and operational handoff for the Quantum AI Labs low-latency model inference service.",
                        completed_work="1. Built PyTorch training and quantization pipeline.\n2. Exported model to ONNX Runtime with 2.8x throughput gain.\n3. Wrapped inference engine in an async FastAPI service with Prometheus metrics.",
                        technologies="Python, PyTorch, ONNX Runtime, FastAPI, Docker, SQL, Git",
                        learned_concepts="Dynamic quantization, CUDA memory pinning, async request batching, and OpenAPI schema validation.",
                        implementation_notes="Model weights are loaded lazily at FastAPI startup via lifespan context manager. Batch size is configurable via MODEL_MAX_BATCH env variable.",
                        challenges="High tail latency (p99 > 450ms) under concurrent GPU burst traffic.",
                        solutions="Implemented dynamic micro-batching queue with a 10ms window and ONNX graph optimization level ORT_ENABLE_ALL.",
                        resources="https://onnxruntime.ai/docs/\nhttps://fastapi.tiangolo.com/advanced/events/",
                        repository_url="https://github.com/rohanpatil/quantum-ai-inference",
                        deployment_url="https://staging-inference.quantumailabs.io/docs",
                        pending_work="Configure Kubernetes Horizontal Pod Autoscaler (HPA) custom GPU metrics on production cluster.",
                        recommendations="Next intern should integrate Triton Inference Server for multi-model ensemble routing.",
                        known_issues="Cold start takes ~4.2 seconds when pulling weights from object storage.",
                        final_notes="All unit and load tests are documented in tests/benchmark_inference.py.",
                        status="SUBMITTED",
                    )
                )
                db.flush()

    # 4. Seed / sync notifications idempotently
    sync_all_notifications(db)
    db.commit()


def sync_all_notifications(db: Session) -> None:
    """Idempotently generates database notifications for Mentor Assignments, Pending Work, and Deadlines/Reminders."""
    students = db.query(Student).all()
    for st in students:
        if not st.user:
            continue

        # A. Mentor assignment notifications
        if st.mentor_id:
            mentor = db.query(Mentor).filter(Mentor.id == st.mentor_id).first()
            if mentor and mentor.user:
                student_notif_msg = f"{mentor.user.full_name} has been assigned as your mentor."
                exists_st = (
                    db.query(Notification)
                    .filter(
                        Notification.user_id == st.user_id,
                        Notification.notification_type == "MENTOR_ASSIGNMENT",
                        Notification.message == student_notif_msg,
                    )
                    .first()
                )
                if not exists_st:
                    db.add(
                        Notification(
                            user_id=st.user_id,
                            title="Faculty Mentor Assigned",
                            message=student_notif_msg,
                            notification_type="MENTOR_ASSIGNMENT",
                            is_read=False,
                        )
                    )

                mentor_notif_msg = f"Admin assigned {st.user.full_name} to you."
                # Notify canonical mentor user and demo mentor alias if applicable
                mentor_user_ids = [mentor.user_id]
                if mentor.user.email == "mentor.turing@university.edu":
                    demo_u = db.query(User).filter(User.email == "mentor@demo.com").first()
                    if demo_u:
                        mentor_user_ids.append(demo_u.id)

                for m_uid in mentor_user_ids:
                    exists_m = (
                        db.query(Notification)
                        .filter(
                            Notification.user_id == m_uid,
                            Notification.notification_type == "MENTOR_ASSIGNMENT",
                            Notification.message == mentor_notif_msg,
                        )
                        .first()
                    )
                    if not exists_m:
                        db.add(
                            Notification(
                                user_id=m_uid,
                                title="New Student Assigned",
                                message=mentor_notif_msg,
                                notification_type="MENTOR_ASSIGNMENT",
                                is_read=False,
                            )
                        )

        # B. Pending Work Notifications from real DB incomplete tasks
        pending_tasks = (
            db.query(Task)
            .filter(Task.student_id == st.id, Task.is_completed == False)  # noqa: E712
            .all()
        )
        if pending_tasks:
            pending_msg = f"You have pending internship work: {len(pending_tasks)} incomplete milestone task(s) awaiting completion."
            exists_pw = (
                db.query(Notification)
                .filter(
                    Notification.user_id == st.user_id,
                    Notification.notification_type == "PENDING_WORK",
                )
                .first()
            )
            if not exists_pw:
                db.add(
                    Notification(
                        user_id=st.user_id,
                        title="Pending Internship Work",
                        message=pending_msg,
                        notification_type="PENDING_WORK",
                        is_read=False,
                    )
                )

        # C. Reminder Notifications from real DB active internships / reports
        active_internship = (
            db.query(Internship)
            .filter(Internship.student_id == st.id, Internship.status == "ACTIVE")
            .first()
        )
        if active_internship:
            reports_count = (
                db.query(WeeklyReport)
                .filter(WeeklyReport.student_id == st.id, WeeklyReport.internship_id == active_internship.id)
                .count()
            )
            next_week = reports_count + 1
            reminder_msg = (
                f"Reminder: Submit your Week {next_week} progress report for '{active_internship.title}' "
                f"and review upcoming task deadlines."
            )
            exists_rem = (
                db.query(Notification)
                .filter(
                    Notification.user_id == st.user_id,
                    Notification.notification_type == "REMINDER",
                )
                .first()
            )
            if not exists_rem:
                db.add(
                    Notification(
                        user_id=st.user_id,
                        title="Weekly Report & Deadline Reminder",
                        message=reminder_msg,
                        notification_type="REMINDER",
                        is_read=False,
                    )
                )

