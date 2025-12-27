from sqlalchemy.orm import Session
from app.services.heuristic import HeuristicScheduler

class SchedulingService:
    def __init__(self, db: Session):
        self.db = db

    def get_today_schedule(self, user_id: int):
        """
        Generates the daily plan using the Heuristic (Greedy) Engine.
        In the future, this method can switch to 'RLScheduler' based on a flag.
        """
        # 1. Initialize the Engine
        scheduler = HeuristicScheduler(self.db, user_id)
        
        # 2. Run Logic
        daily_plan = scheduler.generate_plan()
        
        # 3. Post-Processing (Optional)
        # You could calculate total hours scheduled here, 
        # or check if the day is 'Overloaded'.
        
        return daily_plan

    # Future Placeholders for Phase 3 (RL)
    # def get_rl_schedule(self, user_id: int):
    #     pass