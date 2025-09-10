from src.models.user import db
from datetime import datetime
import json

class Netrunner(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    alias = db.Column(db.String(80), unique=True, nullable=False)
    level = db.Column(db.Integer, default=1)
    exp = db.Column(db.Integer, default=0)
    credits = db.Column(db.Integer, default=1000)
    max_bandwidth = db.Column(db.Float, default=16.0)
    current_bandwidth = db.Column(db.Float, default=16.0)
    signal_debt = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_active = db.Column(db.DateTime, default=datetime.utcnow)

    contracts = db.relationship("Contract", backref="netrunner", lazy=True)
    epic_hacks = db.relationship("EpicHack", backref="netrunner", lazy=True)
    milestones = db.relationship("Milestone", backref="netrunner", lazy=True)
    skill_points = db.relationship("SkillPoint", backref="netrunner", lazy=True)
    data_stream_entries = db.relationship("DataStreamEntry", backref="netrunner", lazy=True)

    def __repr__(self):
        return f"<Netrunner {self.alias}>"

    def to_dict(self):
        return {
            "id": self.id,
            "alias": self.alias,
            "level": self.level,
            "exp": self.exp,
            "credits": self.credits,
            "max_bandwidth": self.max_bandwidth,
            "current_bandwidth": self.current_bandwidth,
            "signal_debt": self.signal_debt,
            "created_at": self.created_at.isoformat(),
            "last_active": self.last_active.isoformat()
        }

    def update_exp(self, amount):
        self.exp += amount
        # Example level up logic
        while self.exp >= self.level * 200 + 800:
            self.exp -= (self.level * 200 + 800)
            self.level += 1
            self.add_data_stream_entry(f"LEVEL UP: Reached Level {self.level}!", "success")

    def update_credits(self, amount):
        self.credits += amount

    def use_bandwidth(self, amount):
        self.current_bandwidth -= amount
        if self.current_bandwidth < 0:
            self.signal_debt = True
            self.add_data_stream_entry("WARNING: Bandwidth depleted. Entering Signal Debt.", "warning")
        else:
            self.signal_debt = False

    def reset_daily_bandwidth(self):
        if self.current_bandwidth > 0:
            # Convert remaining bandwidth to credits
            converted_credits = int(self.current_bandwidth * 10) # Example conversion rate
            self.credits += converted_credits
            self.add_data_stream_entry(f"BANDWIDTH_CONVERTED: {converted_credits} ¥ from remaining BW.", "info")
        self.current_bandwidth = self.max_bandwidth
        self.signal_debt = False
        self.add_data_stream_entry("BANDWIDTH_RECOVERED: Daily reset complete.", "success")

    def add_data_stream_entry(self, message, entry_type="info"):
        entry = DataStreamEntry(netrunner=self, message=message, entry_type=entry_type)
        db.session.add(entry)
        db.session.commit()

class Contract(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    netrunner_id = db.Column(db.Integer, db.ForeignKey("netrunner.id"), nullable=False)
    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=True)
    difficulty = db.Column(db.String(50), nullable=False) # e.g., Low-Profile, Standard-Op, High-Stakes
    status = db.Column(db.String(50), default="pending") # pending, active, completed, failed
    time_estimate = db.Column(db.Float, nullable=True) # in hours
    time_spent = db.Column(db.Float, default=0.0)
    progress = db.Column(db.Integer, default=0) # 0-100%
    exp_reward = db.Column(db.Integer, nullable=False)
    credit_reward = db.Column(db.Integer, nullable=False)
    contract_type = db.Column(db.String(50), default="main") # main, maintenance, epic_hack
    started_at = db.Column(db.DateTime, nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)

    def __repr__(self):
        return f"<Contract {self.title}>"

    def to_dict(self):
        return {
            "id": self.id,
            "netrunner_id": self.netrunner_id,
            "title": self.title,
            "description": self.description,
            "difficulty": self.difficulty,
            "status": self.status,
            "time_estimate": self.time_estimate,
            "time_spent": self.time_spent,
            "progress": self.progress,
            "exp_reward": self.exp_reward,
            "credit_reward": self.credit_reward,
            "contract_type": self.contract_type,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None
        }

class EpicHack(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    netrunner_id = db.Column(db.Integer, db.ForeignKey("netrunner.id"), nullable=False)
    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(50), default="pending") # pending, active, completed, failed
    progress = db.Column(db.Integer, default=0) # 0-100%
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)

    milestones = db.relationship("Milestone", backref="epic_hack", lazy=True)

    def __repr__(self):
        return f"<EpicHack {self.title}>"

    def to_dict(self):
        return {
            "id": self.id,
            "netrunner_id": self.netrunner_id,
            "title": self.title,
            "description": self.description,
            "status": self.status,
            "progress": self.progress,
            "created_at": self.created_at.isoformat(),
            "completed_at": self.completed_at.isoformat() if self.completed_at else None
        }

class Milestone(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    epic_hack_id = db.Column(db.Integer, db.ForeignKey("epic_hack.id"), nullable=False)
    netrunner_id = db.Column(db.Integer, db.ForeignKey("netrunner.id"), nullable=False)
    title = db.Column(db.String(120), nullable=False)
    status = db.Column(db.String(50), default="pending") # pending, completed
    exp_reward = db.Column(db.Integer, nullable=False)
    credit_reward = db.Column(db.Integer, nullable=False)
    completed_at = db.Column(db.DateTime, nullable=True)

    def __repr__(self):
        return f"<Milestone {self.title}>"

    def to_dict(self):
        return {
            "id": self.id,
            "epic_hack_id": self.epic_hack_id,
            "netrunner_id": self.netrunner_id,
            "title": self.title,
            "status": self.status,
            "exp_reward": self.exp_reward,
            "credit_reward": self.credit_reward,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None
        }

class SkillPoint(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    netrunner_id = db.Column(db.Integer, db.ForeignKey("netrunner.id"), nullable=False)
    skill_tree = db.Column(db.String(80), nullable=False) # e.g., System Infiltration, Hardware Maintenance
    points = db.Column(db.Integer, default=1)
    acquired_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<SkillPoint {self.skill_tree} - {self.points}>"

    def to_dict(self):
        return {
            "id": self.id,
            "netrunner_id": self.netrunner_id,
            "skill_tree": self.skill_tree,
            "points": self.points,
            "acquired_at": self.acquired_at.isoformat()
        }

class DataStreamEntry(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    netrunner_id = db.Column(db.Integer, db.ForeignKey("netrunner.id"), nullable=False)
    message = db.Column(db.Text, nullable=False)
    entry_type = db.Column(db.String(50), default="info") # info, success, warning, error
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<DataStreamEntry {self.entry_type} - {self.message[:20]}>"

    def to_dict(self):
        return {
            "id": self.id,
            "netrunner_id": self.netrunner_id,
            "message": self.message,
            "entry_type": self.entry_type,
            "created_at": self.created_at.isoformat()
        }
