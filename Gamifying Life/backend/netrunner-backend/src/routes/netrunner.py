from flask import Blueprint, request, jsonify
from src.models.user import db
from src.models.netrunner import Netrunner, Contract, EpicHack, Milestone, SkillPoint, DataStreamEntry
from datetime import datetime, timedelta
import random

netrunner_bp = Blueprint('netrunner', __name__)

@netrunner_bp.route('/netrunner', methods=['POST'])
def create_netrunner():
    """Create a new Netrunner"""
    data = request.get_json()
    
    if not data or 'alias' not in data:
        return jsonify({'error': 'Alias is required'}), 400
    
    # Check if alias already exists
    existing = Netrunner.query.filter_by(alias=data['alias']).first()
    if existing:
        return jsonify({'error': 'Alias already exists'}), 409
    
    netrunner = Netrunner(
        alias=data['alias'],
        level=data.get('level', 1),
        exp=data.get('exp', 0),
        credits=data.get('credits', 1000),
        max_bandwidth=data.get('max_bandwidth', 16.0),
        current_bandwidth=data.get('current_bandwidth', 16.0)
    )
    
    db.session.add(netrunner)
    db.session.commit()
    
    # Create welcome data stream entry
    welcome_entry = DataStreamEntry(
        netrunner_id=netrunner.id,
        message=f"SYSTEM_INIT: Welcome to the Net, {netrunner.alias}",
        entry_type='success'
    )
    db.session.add(welcome_entry)
    db.session.commit()
    
    return jsonify(netrunner.to_dict()), 201

@netrunner_bp.route('/netrunner/<int:netrunner_id>', methods=['GET'])
def get_netrunner(netrunner_id):
    """Get Netrunner details"""
    netrunner = Netrunner.query.get_or_404(netrunner_id)
    
    # Update last active
    netrunner.last_active = datetime.utcnow()
    db.session.commit()
    
    result = netrunner.to_dict()
    result['exp_to_next'] = netrunner.get_exp_to_next_level()
    
    return jsonify(result)

@netrunner_bp.route('/netrunner/<int:netrunner_id>/dashboard', methods=['GET'])
def get_dashboard_data(netrunner_id):
    """Get complete dashboard data for a Netrunner"""
    netrunner = Netrunner.query.get_or_404(netrunner_id)
    
    # Get active contracts (today's tasks)
    active_contracts = Contract.query.filter_by(
        netrunner_id=netrunner_id,
        status='pending'
    ).order_by(Contract.created_at.desc()).limit(5).all()
    
    # Get recent data stream entries
    data_stream = DataStreamEntry.query.filter_by(
        netrunner_id=netrunner_id
    ).order_by(DataStreamEntry.created_at.desc()).limit(10).all()
    
    # Get skill points summary
    skill_points = SkillPoint.query.filter_by(netrunner_id=netrunner_id).all()
    skill_summary = {}
    for sp in skill_points:
        if sp.skill_tree not in skill_summary:
            skill_summary[sp.skill_tree] = 0
        skill_summary[sp.skill_tree] += sp.points
    
    return jsonify({
        'netrunner': {
            **netrunner.to_dict(),
            'exp_to_next': netrunner.get_exp_to_next_level()
        },
        'active_contracts': [contract.to_dict() for contract in active_contracts],
        'data_stream': [entry.to_dict() for entry in data_stream],
        'skill_summary': skill_summary
    })

@netrunner_bp.route('/netrunner/<int:netrunner_id>/contracts', methods=['GET'])
def get_contracts(netrunner_id):
    """Get all contracts for a Netrunner"""
    contracts = Contract.query.filter_by(netrunner_id=netrunner_id).order_by(Contract.created_at.desc()).all()
    return jsonify([contract.to_dict() for contract in contracts])

@netrunner_bp.route('/netrunner/<int:netrunner_id>/contracts', methods=['POST'])
def create_contract(netrunner_id):
    """Create a new contract"""
    data = request.get_json()
    
    if not data or 'title' not in data:
        return jsonify({'error': 'Title is required'}), 400
    
    contract = Contract(
        netrunner_id=netrunner_id,
        title=data['title'],
        description=data.get('description', ''),
        difficulty=data.get('difficulty', 'Standard-Op'),
        time_estimate=data.get('time_estimate', 1.0),
        contract_type=data.get('contract_type', 'main'),
        epic_hack_id=data.get('epic_hack_id')
    )
    
    # Calculate rewards based on difficulty and time
    contract.calculate_rewards()
    
    db.session.add(contract)
    db.session.commit()
    
    # Add data stream entry
    stream_entry = DataStreamEntry(
        netrunner_id=netrunner_id,
        message=f"NEW_CONTRACT: {contract.title} [{contract.difficulty}]",
        entry_type='info'
    )
    db.session.add(stream_entry)
    db.session.commit()
    
    return jsonify(contract.to_dict()), 201

@netrunner_bp.route('/contracts/<int:contract_id>/start', methods=['POST'])
def start_contract(contract_id):
    """Start a contract (initiate hack)"""
    contract = Contract.query.get_or_404(contract_id)
    netrunner = Netrunner.query.get_or_404(contract.netrunner_id)
    
    if contract.status != 'pending':
        return jsonify({'error': 'Contract is not in pending status'}), 400
    
    contract.status = 'active'
    db.session.commit()
    
    # Add data stream entry
    stream_entry = DataStreamEntry(
        netrunner_id=netrunner.id,
        message=f"HACK_INITIATED: {contract.title}",
        entry_type='info'
    )
    db.session.add(stream_entry)
    db.session.commit()
    
    return jsonify(contract.to_dict())

@netrunner_bp.route('/contracts/<int:contract_id>/complete', methods=['POST'])
def complete_contract(contract_id):
    """Complete a contract"""
    data = request.get_json() or {}
    contract = Contract.query.get_or_404(contract_id)
    netrunner = Netrunner.query.get_or_404(contract.netrunner_id)
    
    if contract.status not in ['active', 'pending']:
        return jsonify({'error': 'Contract cannot be completed'}), 400
    
    # Update contract
    contract.status = 'completed'
    contract.completed_at = datetime.utcnow()
    contract.progress = 100
    contract.time_spent = data.get('time_spent', contract.time_estimate or 1.0)
    
    # Calculate efficiency bonus/penalty
    efficiency_multiplier = 1.0
    if contract.time_estimate and contract.time_spent:
        if contract.time_spent <= contract.time_estimate:
            # Efficiency bonus
            efficiency_multiplier = 1.2
            bandwidth_recovery = 0.25
        else:
            # Time penalty
            efficiency_multiplier = 0.8
            bandwidth_recovery = 0
    else:
        bandwidth_recovery = 0.1
    
    # Apply signal debt penalty if active
    if netrunner.signal_debt:
        efficiency_multiplier *= 0.75
    
    # Award rewards
    exp_gained = int(contract.exp_reward * efficiency_multiplier)
    credits_gained = int(contract.credit_reward * efficiency_multiplier)
    
    netrunner.add_exp(exp_gained)
    netrunner.credits += credits_gained
    netrunner.recover_bandwidth(bandwidth_recovery)
    
    db.session.commit()
    
    # Add data stream entries
    completion_entry = DataStreamEntry(
        netrunner_id=netrunner.id,
        message=f"CONTRACT_COMPLETED: {contract.title} +{exp_gained} EXP +{credits_gained} ¥",
        entry_type='success'
    )
    db.session.add(completion_entry)
    
    if bandwidth_recovery > 0:
        bw_entry = DataStreamEntry(
            netrunner_id=netrunner.id,
            message=f"BANDWIDTH_RECOVERED: Efficient execution +{bandwidth_recovery} BW",
            entry_type='success'
        )
        db.session.add(bw_entry)
    
    db.session.commit()
    
    # Handle hack debrief if provided
    debrief = data.get('debrief')
    if debrief:
        # Award bonus for reflection
        bonus_exp = 25
        netrunner.add_exp(bonus_exp)
        
        debrief_entry = DataStreamEntry(
            netrunner_id=netrunner.id,
            message=f"HACK_DEBRIEF: Reflection bonus +{bonus_exp} EXP",
            entry_type='success'
        )
        db.session.add(debrief_entry)
        db.session.commit()
    
    return jsonify({
        'contract': contract.to_dict(),
        'netrunner': netrunner.to_dict(),
        'rewards': {
            'exp_gained': exp_gained,
            'credits_gained': credits_gained,
            'bandwidth_recovered': bandwidth_recovery
        }
    })

@netrunner_bp.route('/netrunner/<int:netrunner_id>/bandwidth/spend', methods=['POST'])
def spend_bandwidth(netrunner_id):
    """Spend bandwidth (signal noise)"""
    data = request.get_json()
    
    if not data or 'amount' not in data:
        return jsonify({'error': 'Amount is required'}), 400
    
    netrunner = Netrunner.query.get_or_404(netrunner_id)
    amount = float(data['amount'])
    activity = data.get('activity', 'Unproductive activity')
    
    # Apply signal noise penalty (higher cost)
    penalty_multiplier = data.get('penalty_multiplier', 1.5)
    actual_cost = amount * penalty_multiplier
    
    netrunner.spend_bandwidth(actual_cost)
    db.session.commit()
    
    # Add data stream entry
    stream_entry = DataStreamEntry(
        netrunner_id=netrunner_id,
        message=f"SIGNAL_NOISE: {activity} -{actual_cost} BW",
        entry_type='warning'
    )
    db.session.add(stream_entry)
    
    if netrunner.signal_debt:
        debt_entry = DataStreamEntry(
            netrunner_id=netrunner_id,
            message="SIGNAL_DEBT: System performance degraded",
            entry_type='error'
        )
        db.session.add(debt_entry)
    
    db.session.commit()
    
    return jsonify(netrunner.to_dict())

@netrunner_bp.route('/netrunner/<int:netrunner_id>/bandwidth/reset', methods=['POST'])
def reset_daily_bandwidth(netrunner_id):
    """Reset daily bandwidth"""
    netrunner = Netrunner.query.get_or_404(netrunner_id)
    
    # Convert leftover bandwidth to credits
    leftover_bandwidth = max(0, netrunner.current_bandwidth)
    bonus_credits = int(leftover_bandwidth * 100)  # 1 BW = 100 ¥
    
    if bonus_credits > 0:
        netrunner.credits += bonus_credits
        
        bonus_entry = DataStreamEntry(
            netrunner_id=netrunner_id,
            message=f"DAILY_BONUS: Leftover bandwidth converted +{bonus_credits} ¥",
            entry_type='success'
        )
        db.session.add(bonus_entry)
    
    netrunner.reset_daily_bandwidth()
    
    reset_entry = DataStreamEntry(
        netrunner_id=netrunner_id,
        message="SYSTEM_RESET: Daily bandwidth restored",
        entry_type='info'
    )
    db.session.add(reset_entry)
    
    db.session.commit()
    
    return jsonify({
        'netrunner': netrunner.to_dict(),
        'bonus_credits': bonus_credits
    })

@netrunner_bp.route('/netrunner/<int:netrunner_id>/epic-hacks', methods=['GET'])
def get_epic_hacks(netrunner_id):
    """Get all epic hacks for a Netrunner"""
    epic_hacks = EpicHack.query.filter_by(netrunner_id=netrunner_id).order_by(EpicHack.created_at.desc()).all()
    return jsonify([epic_hack.to_dict() for epic_hack in epic_hacks])

@netrunner_bp.route('/netrunner/<int:netrunner_id>/epic-hacks', methods=['POST'])
def create_epic_hack(netrunner_id):
    """Create a new epic hack"""
    data = request.get_json()
    
    if not data or 'title' not in data:
        return jsonify({'error': 'Title is required'}), 400
    
    epic_hack = EpicHack(
        netrunner_id=netrunner_id,
        title=data['title'],
        description=data.get('description', ''),
        target_date=datetime.fromisoformat(data['target_date']) if data.get('target_date') else None
    )
    
    db.session.add(epic_hack)
    db.session.commit()
    
    # Add data stream entry
    stream_entry = DataStreamEntry(
        netrunner_id=netrunner_id,
        message=f"EPIC_HACK_INITIATED: {epic_hack.title}",
        entry_type='info'
    )
    db.session.add(stream_entry)
    db.session.commit()
    
    return jsonify(epic_hack.to_dict()), 201

@netrunner_bp.route('/netrunner/<int:netrunner_id>/data-stream', methods=['GET'])
def get_data_stream(netrunner_id):
    """Get recent data stream entries"""
    limit = request.args.get('limit', 20, type=int)
    
    entries = DataStreamEntry.query.filter_by(
        netrunner_id=netrunner_id
    ).order_by(DataStreamEntry.created_at.desc()).limit(limit).all()
    
    return jsonify([entry.to_dict() for entry in entries])

@netrunner_bp.route('/netrunner/<int:netrunner_id>/skills', methods=['GET'])
def get_skills(netrunner_id):
    """Get skill points for a Netrunner"""
    skill_points = SkillPoint.query.filter_by(netrunner_id=netrunner_id).all()
    
    # Group by skill tree
    skills_by_tree = {}
    for sp in skill_points:
        if sp.skill_tree not in skills_by_tree:
            skills_by_tree[sp.skill_tree] = []
        skills_by_tree[sp.skill_tree].append(sp.to_dict())
    
    return jsonify(skills_by_tree)

# Demo data endpoint for testing
@netrunner_bp.route('/demo/setup/<int:netrunner_id>', methods=['POST'])
def setup_demo_data(netrunner_id):
    """Setup demo data for testing"""
    netrunner = Netrunner.query.get_or_404(netrunner_id)
    
    # Create some demo contracts
    demo_contracts = [
        {
            'title': 'Complete React Tutorial',
            'description': 'Learn React fundamentals and build a simple app',
            'difficulty': 'Standard-Op',
            'time_estimate': 2.0,
            'contract_type': 'main'
        },
        {
            'title': 'Morning Workout Routine',
            'description': 'Complete daily exercise routine',
            'difficulty': 'Low-Profile',
            'time_estimate': 0.75,
            'contract_type': 'maintenance'
        },
        {
            'title': 'Database Architecture Review',
            'description': 'Review and optimize database schema',
            'difficulty': 'High-Stakes',
            'time_estimate': 3.0,
            'contract_type': 'main'
        }
    ]
    
    for contract_data in demo_contracts:
        contract = Contract(
            netrunner_id=netrunner_id,
            **contract_data
        )
        contract.calculate_rewards()
        db.session.add(contract)
    
    # Create some demo data stream entries
    demo_entries = [
        "CONTRACT_COMPLETED: Morning Coffee Ritual +50 EXP",
        "BANDWIDTH_RECOVERED: Efficient coding session +0.5 BW",
        "CREDITS_EARNED: Task completion bonus +200 ¥",
        "SYSTEM_ALERT: New Epic Hack milestone available"
    ]
    
    for i, message in enumerate(demo_entries):
        entry = DataStreamEntry(
            netrunner_id=netrunner_id,
            message=message,
            entry_type='success' if 'COMPLETED' in message else 'info',
            created_at=datetime.utcnow() - timedelta(minutes=15*i)
        )
        db.session.add(entry)
    
    db.session.commit()
    
    return jsonify({'message': 'Demo data created successfully'})

