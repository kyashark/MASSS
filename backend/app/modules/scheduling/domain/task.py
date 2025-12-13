from dataclasses import dataclass

@dataclass
class Task:
    id: int
    title: str
    category: str
    is_completed: bool

    # Domain Logic: Check if task is urgent
    def is_urgent(self) -> bool:
        return self.category == "Exam" and not self.is_completed