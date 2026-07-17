from enum import Enum

class Role(str, Enum):
    SYSTEM_ADMINISTRATOR = "System Administrator"
    CANDIDATE_EMPLOYEE = "Candidate/Employee"
    CLIENT_MANAGER = "Client Manager"
    HR_TEAM = "HR Team"
    ACCOUNTS_TEAM = "Accounts Team"
    CLIENT = "Client"
