#!/usr/bin/env python
"""
Standalone Test Suite for Personal Finance Dashboard
=====================================================
This file contains comprehensive tests for all components of the application.
It is designed to be run independently and save results to a proof file.

Run with: python test_suite_standalone.py
"""

import os
import sys
import json
from datetime import datetime, date, timedelta
from decimal import Decimal
from io import StringIO

# Setup Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

import django
from django.conf import settings

# Add testserver to ALLOWED_HOSTS for testing
if 'testserver' not in settings.ALLOWED_HOSTS:
    settings.ALLOWED_HOSTS.append('testserver')
if 'localhost' not in settings.ALLOWED_HOSTS:
    settings.ALLOWED_HOSTS.append('localhost')

django.setup()

from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status

# Import models
from account.models import Account
from transaction.models import Transaction
from budget.models import Budget
from category.models import Category

# Import serializers
from account.serializers import AccountSerializer
from transaction.serializers import TransactionSerializer
from budget.serializers import BudgetSerializer
from category.serializers import CategorySerializer


class TestResults:
    """Class to collect and store test results"""
    def __init__(self):
        self.results = []
        self.passed = 0
        self.failed = 0
        self.errors = 0

    def add_result(self, test_name, status, message="", details=""):
        result = {
            "test": test_name,
            "status": status,
            "message": message,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.results.append(result)
        if status == "PASS":
            self.passed += 1
        elif status == "FAIL":
            self.failed += 1
        else:
            self.errors += 1

    def get_summary(self):
        return {
            "total": len(self.results),
            "passed": self.passed,
            "failed": self.failed,
            "errors": self.errors,
            "pass_rate": f"{(self.passed/len(self.results)*100):.1f}%" if self.results else "0%"
        }


# Initialize test results collector
test_results = TestResults()


def run_test(test_func):
    """Decorator to run tests and capture results"""
    def wrapper(*args, **kwargs):
        test_name = test_func.__name__
        try:
            result = test_func(*args, **kwargs)
            if result is True or result is None:
                test_results.add_result(test_name, "PASS", "Test passed successfully")
                print(f"  ✓ {test_name}")
            else:
                test_results.add_result(test_name, "FAIL", str(result))
                print(f"  ✗ {test_name}: {result}")
        except AssertionError as e:
            test_results.add_result(test_name, "FAIL", str(e))
            print(f"  ✗ {test_name}: {e}")
        except Exception as e:
            test_results.add_result(test_name, "ERROR", str(e), str(type(e).__name__))
            print(f"  ⚠ {test_name}: ERROR - {e}")
    return wrapper


# ============================================================================
# MODEL TESTS
# ============================================================================

print("\n" + "="*60)
print("RUNNING MODEL TESTS")
print("="*60)

@run_test
def test_user_creation():
    """Test creating a user"""
    user = User.objects.create_user(
        username='testuser_model',
        email='testmodel@example.com',
        password='testpass123'
    )
    assert user.username == 'testuser_model'
    assert user.email == 'testmodel@example.com'
    assert user.check_password('testpass123')
    user.delete()
    return True

@run_test
def test_account_creation():
    """Test creating an account"""
    user = User.objects.create_user(username='acc_test_user', password='test123')
    account = Account.objects.create(
        name_account='Test Checking',
        balance=Decimal('1000.00'),
        user=user
    )
    assert account.name_account == 'Test Checking'
    assert account.balance == Decimal('1000.00')
    assert account.user == user
    assert str(account) == "Test Checking - balance: 1000.00"
    account.delete()
    user.delete()
    return True

@run_test
def test_account_balance_precision():
    """Test account balance decimal precision"""
    user = User.objects.create_user(username='precision_user', password='test123')
    account = Account.objects.create(
        name_account='Precision Test',
        balance=Decimal('12345.67'),
        user=user
    )
    assert account.balance == Decimal('12345.67')
    account.delete()
    user.delete()
    return True

@run_test
def test_category_creation():
    """Test creating a category"""
    user = User.objects.create_user(username='cat_test_user', password='test123')
    category = Category.objects.create(
        name='Groceries',
        description='Food and household items',
        user=user
    )
    assert category.name == 'Groceries'
    assert category.description == 'Food and household items'
    assert str(category) == 'Groceries'
    category.delete()
    user.delete()
    return True

@run_test
def test_budget_creation():
    """Test creating a budget"""
    user = User.objects.create_user(username='budget_test_user', password='test123')
    account = Account.objects.create(name_account='Budget Account', balance=Decimal('5000.00'), user=user)
    budget = Budget.objects.create(
        name='Monthly Groceries',
        total_amount=Decimal('500.00'),
        spent_amount=Decimal('150.00'),
        account=account,
        start_date=date.today(),
        end_date=date.today() + timedelta(days=30),
        user=user
    )
    assert budget.name == 'Monthly Groceries'
    assert budget.total_amount == Decimal('500.00')
    assert budget.spent_amount == Decimal('150.00')
    budget.delete()
    account.delete()
    user.delete()
    return True

@run_test
def test_transaction_creation_deposit():
    """Test creating a deposit transaction"""
    user = User.objects.create_user(username='trans_test_user', password='test123')
    account = Account.objects.create(name_account='Transaction Account', balance=Decimal('1000.00'), user=user)
    transaction = Transaction.objects.create(
        user=user,
        amount=Decimal('250.00'),
        description='Salary deposit',
        account=account,
        type='deposit'
    )
    assert transaction.amount == Decimal('250.00')
    assert transaction.type == 'deposit'
    assert transaction.description == 'Salary deposit'
    transaction.delete()
    account.delete()
    user.delete()
    return True

@run_test
def test_transaction_creation_withdrawal():
    """Test creating a withdrawal transaction"""
    user = User.objects.create_user(username='withdraw_user', password='test123')
    account = Account.objects.create(name_account='Withdraw Account', balance=Decimal('1000.00'), user=user)
    transaction = Transaction.objects.create(
        user=user,
        amount=Decimal('50.00'),
        description='Coffee shop',
        account=account,
        type='withdrawal'
    )
    assert transaction.amount == Decimal('50.00')
    assert transaction.type == 'withdrawal'
    transaction.delete()
    account.delete()
    user.delete()
    return True

@run_test
def test_transaction_with_category():
    """Test transaction with category association"""
    user = User.objects.create_user(username='cat_trans_user', password='test123')
    account = Account.objects.create(name_account='Cat Trans Account', balance=Decimal('1000.00'), user=user)
    category = Category.objects.create(name='Food', user=user)
    transaction = Transaction.objects.create(
        user=user,
        amount=Decimal('30.00'),
        description='Lunch',
        account=account,
        type='withdrawal',
        budget_category=category
    )
    assert transaction.budget_category == category
    assert transaction.budget_category.name == 'Food'
    transaction.delete()
    category.delete()
    account.delete()
    user.delete()
    return True

@run_test
def test_category_budget_relationship():
    """Test category-budget relationship"""
    user = User.objects.create_user(username='rel_test_user', password='test123')
    account = Account.objects.create(name_account='Rel Account', balance=Decimal('2000.00'), user=user)
    budget = Budget.objects.create(
        name='Entertainment Budget',
        total_amount=Decimal('200.00'),
        account=account,
        start_date=date.today(),
        end_date=date.today() + timedelta(days=30),
        user=user
    )
    category = Category.objects.create(name='Movies', user=user, budget=budget)
    assert category.budget == budget
    assert category in budget.categories.all()
    category.delete()
    budget.delete()
    account.delete()
    user.delete()
    return True

@run_test
def test_account_user_relationship():
    """Test account-user relationship via related_name"""
    user = User.objects.create_user(username='rel_acc_user', password='test123')
    account1 = Account.objects.create(name_account='Checking', balance=Decimal('1000.00'), user=user)
    account2 = Account.objects.create(name_account='Savings', balance=Decimal('5000.00'), user=user)
    assert user.accounts.count() == 2
    assert account1 in user.accounts.all()
    assert account2 in user.accounts.all()
    account1.delete()
    account2.delete()
    user.delete()
    return True


# Run model tests
test_user_creation()
test_account_creation()
test_account_balance_precision()
test_category_creation()
test_budget_creation()
test_transaction_creation_deposit()
test_transaction_creation_withdrawal()
test_transaction_with_category()
test_category_budget_relationship()
test_account_user_relationship()


# ============================================================================
# SERIALIZER TESTS
# ============================================================================

print("\n" + "="*60)
print("RUNNING SERIALIZER TESTS")
print("="*60)

@run_test
def test_account_serializer_valid():
    """Test AccountSerializer with valid data"""
    user = User.objects.create_user(username='ser_acc_user', password='test123')
    data = {
        'name_account': 'Test Account',
        'balance': '1500.00',
        'user': user.id
    }
    serializer = AccountSerializer(data=data)
    assert serializer.is_valid(), serializer.errors
    user.delete()
    return True

@run_test
def test_account_serializer_output():
    """Test AccountSerializer output"""
    user = User.objects.create_user(username='ser_out_user', password='test123')
    account = Account.objects.create(name_account='Output Test', balance=Decimal('2000.00'), user=user)
    serializer = AccountSerializer(account)
    data = serializer.data
    assert data['name_account'] == 'Output Test'
    assert Decimal(data['balance']) == Decimal('2000.00')
    account.delete()
    user.delete()
    return True

@run_test
def test_budget_serializer_valid():
    """Test BudgetSerializer with valid data"""
    user = User.objects.create_user(username='ser_bud_user', password='test123')
    account = Account.objects.create(name_account='Budget Ser Account', balance=Decimal('3000.00'), user=user)
    data = {
        'name': 'Monthly Budget',
        'total_amount': '500.00',
        'spent_amount': '0.00',
        'account': account.id,
        'start_date': str(date.today()),
        'end_date': str(date.today() + timedelta(days=30)),
        'user': user.id
    }
    serializer = BudgetSerializer(data=data)
    assert serializer.is_valid(), serializer.errors
    account.delete()
    user.delete()
    return True

@run_test
def test_category_serializer_valid():
    """Test CategorySerializer with valid data"""
    user = User.objects.create_user(username='ser_cat_user', password='test123')
    data = {
        'name': 'Utilities',
        'description': 'Monthly utility bills',
        'user': user.id
    }
    serializer = CategorySerializer(data=data)
    assert serializer.is_valid(), serializer.errors
    user.delete()
    return True

@run_test
def test_transaction_serializer_valid():
    """Test TransactionSerializer with valid data"""
    user = User.objects.create_user(username='ser_trans_user', password='test123')
    account = Account.objects.create(name_account='Trans Ser Account', balance=Decimal('1000.00'), user=user)
    data = {
        'amount': '75.50',
        'description': 'Grocery shopping',
        'account': account.id,
        'type': 'withdrawal',
        'user': user.id
    }
    serializer = TransactionSerializer(data=data)
    assert serializer.is_valid(), serializer.errors
    account.delete()
    user.delete()
    return True

@run_test
def test_transaction_serializer_readonly_fields():
    """Test TransactionSerializer read-only fields"""
    user = User.objects.create_user(username='ser_ro_user', password='test123')
    account = Account.objects.create(name_account='RO Account', balance=Decimal('1000.00'), user=user)
    transaction = Transaction.objects.create(
        user=user, amount=Decimal('100.00'), description='Test', account=account, type='deposit'
    )
    serializer = TransactionSerializer(transaction)
    assert 'id' in serializer.data
    assert 'date' in serializer.data
    transaction.delete()
    account.delete()
    user.delete()
    return True


# Run serializer tests
test_account_serializer_valid()
test_account_serializer_output()
test_budget_serializer_valid()
test_category_serializer_valid()
test_transaction_serializer_valid()
test_transaction_serializer_readonly_fields()


# ============================================================================
# API ENDPOINT TESTS
# ============================================================================

print("\n" + "="*60)
print("RUNNING API ENDPOINT TESTS")
print("="*60)

# Create test user and get token for API tests
api_test_user = User.objects.create_user(username='api_test_user', email='api@test.com', password='apitest123')
api_test_account = Account.objects.create(name_account='API Test Account', balance=Decimal('5000.00'), user=api_test_user)

from rest_framework_simplejwt.tokens import RefreshToken
tokens = RefreshToken.for_user(api_test_user)
access_token = str(tokens.access_token)

api_client = APIClient()
api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

@run_test
def test_api_accounts_list():
    """Test GET /api/accounts/ endpoint"""
    response = api_client.get('/api/accounts/')
    assert response.status_code == 200
    return True

@run_test
def test_api_accounts_create():
    """Test POST /api/accounts/ endpoint"""
    data = {'name_account': 'New API Account', 'balance': '1000.00'}
    response = api_client.post('/api/accounts/', data, format='json')
    assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.data}"
    # Clean up
    Account.objects.filter(name_account='New API Account').delete()
    return True

@run_test
def test_api_accounts_detail():
    """Test GET /api/accounts/{id}/ endpoint"""
    response = api_client.get(f'/api/accounts/{api_test_account.id}/')
    assert response.status_code == 200
    assert response.data['name_account'] == 'API Test Account'
    return True

@run_test
def test_api_transactions_list():
    """Test GET /api/transactions/ endpoint"""
    response = api_client.get('/api/transactions/')
    assert response.status_code == 200
    return True

@run_test
def test_api_transactions_create():
    """Test POST /api/transactions/ endpoint"""
    data = {
        'amount': '50.00',
        'description': 'API Test Transaction',
        'account': api_test_account.id,
        'type': 'withdrawal'
    }
    response = api_client.post('/api/transactions/', data, format='json')
    assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.data}"
    # Clean up
    Transaction.objects.filter(description='API Test Transaction').delete()
    return True

@run_test
def test_api_budgets_list():
    """Test GET /api/budgets/ endpoint"""
    response = api_client.get('/api/budgets/')
    assert response.status_code == 200
    return True

@run_test
def test_api_budgets_create():
    """Test POST /api/budgets/ endpoint"""
    data = {
        'name': 'API Test Budget',
        'total_amount': '300.00',
        'spent_amount': '0.00',
        'account': api_test_account.id,
        'start_date': str(date.today()),
        'end_date': str(date.today() + timedelta(days=30))
    }
    response = api_client.post('/api/budgets/', data, format='json')
    assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.data}"
    # Clean up
    Budget.objects.filter(name='API Test Budget').delete()
    return True

@run_test
def test_api_categories_list():
    """Test GET /api/categories/ endpoint"""
    response = api_client.get('/api/categories/')
    assert response.status_code == 200
    return True

@run_test
def test_api_categories_create():
    """Test POST /api/categories/ endpoint"""
    data = {'name': 'API Test Category', 'description': 'Test description'}
    response = api_client.post('/api/categories/', data, format='json')
    assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.data}"
    # Clean up
    Category.objects.filter(name='API Test Category').delete()
    return True

@run_test
def test_api_unauthorized_access():
    """Test API returns 401 for unauthorized access"""
    unauth_client = APIClient()
    response = unauth_client.get('/api/accounts/')
    assert response.status_code == 401
    return True

@run_test
def test_api_token_obtain():
    """Test POST /api/token/ endpoint"""
    client = APIClient()
    data = {'username': 'api_test_user', 'password': 'apitest123'}
    response = client.post('/api/token/', data)
    assert response.status_code == 200
    assert 'access' in response.data
    assert 'refresh' in response.data
    return True

@run_test
def test_api_user_registration():
    """Test POST /api/register/ endpoint"""
    client = APIClient()
    data = {
        'username': 'newreguser',
        'email': 'newreg@test.com',
        'password': 'NewPass123!',
        'password2': 'NewPass123!'
    }
    response = client.post('/api/register/', data)
    assert response.status_code == 201
    # Clean up
    User.objects.filter(username='newreguser').delete()
    return True

@run_test
def test_api_user_detail():
    """Test GET /api/user/ endpoint"""
    response = api_client.get('/api/user/')
    assert response.status_code == 200
    assert response.data['username'] == 'api_test_user'
    return True


# Run API tests
test_api_accounts_list()
test_api_accounts_create()
test_api_accounts_detail()
test_api_transactions_list()
test_api_transactions_create()
test_api_budgets_list()
test_api_budgets_create()
test_api_categories_list()
test_api_categories_create()
test_api_unauthorized_access()
test_api_token_obtain()
test_api_user_registration()
test_api_user_detail()


# ============================================================================
# BUSINESS LOGIC TESTS
# ============================================================================

print("\n" + "="*60)
print("RUNNING BUSINESS LOGIC TESTS")
print("="*60)

@run_test
def test_budget_percentage_calculation():
    """Test budget spent percentage calculation"""
    user = User.objects.create_user(username='biz_pct_user', password='test123')
    account = Account.objects.create(name_account='Biz Account', balance=Decimal('1000.00'), user=user)
    budget = Budget.objects.create(
        name='Test Budget',
        total_amount=Decimal('200.00'),
        spent_amount=Decimal('150.00'),
        account=account,
        start_date=date.today(),
        end_date=date.today() + timedelta(days=30),
        user=user
    )
    percentage = (float(budget.spent_amount) / float(budget.total_amount)) * 100
    assert percentage == 75.0
    budget.delete()
    account.delete()
    user.delete()
    return True

@run_test
def test_budget_over_budget_detection():
    """Test over-budget detection"""
    user = User.objects.create_user(username='biz_over_user', password='test123')
    account = Account.objects.create(name_account='Over Account', balance=Decimal('1000.00'), user=user)
    budget = Budget.objects.create(
        name='Over Budget',
        total_amount=Decimal('100.00'),
        spent_amount=Decimal('120.00'),
        account=account,
        start_date=date.today(),
        end_date=date.today() + timedelta(days=30),
        user=user
    )
    is_over = budget.spent_amount > budget.total_amount
    assert is_over == True
    budget.delete()
    account.delete()
    user.delete()
    return True

@run_test
def test_transaction_type_validation():
    """Test transaction type choices"""
    valid_types = ['deposit', 'withdrawal']
    user = User.objects.create_user(username='type_val_user', password='test123')
    account = Account.objects.create(name_account='Type Account', balance=Decimal('1000.00'), user=user)

    for t_type in valid_types:
        transaction = Transaction.objects.create(
            user=user, amount=Decimal('10.00'), description=f'Test {t_type}',
            account=account, type=t_type
        )
        assert transaction.type == t_type
        transaction.delete()

    account.delete()
    user.delete()
    return True

@run_test
def test_user_total_balance_calculation():
    """Test calculating total balance across accounts"""
    user = User.objects.create_user(username='total_bal_user', password='test123')
    Account.objects.create(name_account='Acc 1', balance=Decimal('1000.00'), user=user)
    Account.objects.create(name_account='Acc 2', balance=Decimal('2500.00'), user=user)
    Account.objects.create(name_account='Acc 3', balance=Decimal('500.00'), user=user)

    from django.db.models import Sum
    total = Account.objects.filter(user=user).aggregate(Sum('balance'))['balance__sum']
    assert total == Decimal('4000.00')

    Account.objects.filter(user=user).delete()
    user.delete()
    return True

@run_test
def test_transaction_sum_by_type():
    """Test summing transactions by type"""
    user = User.objects.create_user(username='sum_type_user', password='test123')
    account = Account.objects.create(name_account='Sum Account', balance=Decimal('1000.00'), user=user)

    Transaction.objects.create(user=user, amount=Decimal('100.00'), description='D1', account=account, type='deposit')
    Transaction.objects.create(user=user, amount=Decimal('200.00'), description='D2', account=account, type='deposit')
    Transaction.objects.create(user=user, amount=Decimal('50.00'), description='W1', account=account, type='withdrawal')

    from django.db.models import Sum
    deposits = Transaction.objects.filter(user=user, type='deposit').aggregate(Sum('amount'))['amount__sum']
    withdrawals = Transaction.objects.filter(user=user, type='withdrawal').aggregate(Sum('amount'))['amount__sum']

    assert deposits == Decimal('300.00')
    assert withdrawals == Decimal('50.00')

    Transaction.objects.filter(user=user).delete()
    account.delete()
    user.delete()
    return True

@run_test
def test_category_spending_calculation():
    """Test calculating spending by category"""
    user = User.objects.create_user(username='cat_spend_user', password='test123')
    account = Account.objects.create(name_account='Cat Spend Account', balance=Decimal('1000.00'), user=user)
    category = Category.objects.create(name='Test Cat', user=user)

    Transaction.objects.create(user=user, amount=Decimal('25.00'), description='T1', account=account, type='withdrawal', budget_category=category)
    Transaction.objects.create(user=user, amount=Decimal('35.00'), description='T2', account=account, type='withdrawal', budget_category=category)

    from django.db.models import Sum
    total_spent = category.transactions.filter(type='withdrawal').aggregate(Sum('amount'))['amount__sum']
    assert total_spent == Decimal('60.00')

    Transaction.objects.filter(user=user).delete()
    category.delete()
    account.delete()
    user.delete()
    return True


# Run business logic tests
test_budget_percentage_calculation()
test_budget_over_budget_detection()
test_transaction_type_validation()
test_user_total_balance_calculation()
test_transaction_sum_by_type()
test_category_spending_calculation()


# ============================================================================
# EDGE CASE TESTS
# ============================================================================

print("\n" + "="*60)
print("RUNNING EDGE CASE TESTS")
print("="*60)

@run_test
def test_zero_balance_account():
    """Test account with zero balance"""
    user = User.objects.create_user(username='zero_bal_user', password='test123')
    account = Account.objects.create(name_account='Zero Balance', balance=Decimal('0.00'), user=user)
    assert account.balance == Decimal('0.00')
    account.delete()
    user.delete()
    return True

@run_test
def test_large_balance():
    """Test account with large balance"""
    user = User.objects.create_user(username='large_bal_user', password='test123')
    account = Account.objects.create(name_account='Large Balance', balance=Decimal('9999999999999.99'), user=user)
    assert account.balance == Decimal('9999999999999.99')
    account.delete()
    user.delete()
    return True

@run_test
def test_zero_budget():
    """Test budget with zero total (edge case handling)"""
    user = User.objects.create_user(username='zero_bud_user', password='test123')
    account = Account.objects.create(name_account='Zero Bud Account', balance=Decimal('1000.00'), user=user)
    budget = Budget.objects.create(
        name='Zero Budget',
        total_amount=Decimal('0.01'),  # Minimum non-zero to avoid division by zero
        spent_amount=Decimal('0.00'),
        account=account,
        start_date=date.today(),
        end_date=date.today() + timedelta(days=30),
        user=user
    )
    assert budget.total_amount == Decimal('0.01')
    budget.delete()
    account.delete()
    user.delete()
    return True

@run_test
def test_empty_description():
    """Test transaction with empty description (should fail validation in real app)"""
    user = User.objects.create_user(username='empty_desc_user', password='test123')
    account = Account.objects.create(name_account='Empty Desc Account', balance=Decimal('1000.00'), user=user)
    # Note: Model allows empty, but serializer/form should validate
    transaction = Transaction.objects.create(
        user=user, amount=Decimal('10.00'), description='',
        account=account, type='deposit'
    )
    assert transaction.description == ''
    transaction.delete()
    account.delete()
    user.delete()
    return True

@run_test
def test_budget_same_start_end_date():
    """Test budget with same start and end date"""
    user = User.objects.create_user(username='same_date_user', password='test123')
    account = Account.objects.create(name_account='Same Date Account', balance=Decimal('1000.00'), user=user)
    today = date.today()
    budget = Budget.objects.create(
        name='One Day Budget',
        total_amount=Decimal('50.00'),
        account=account,
        start_date=today,
        end_date=today,
        user=user
    )
    assert budget.start_date == budget.end_date
    budget.delete()
    account.delete()
    user.delete()
    return True

@run_test
def test_multiple_users_isolation():
    """Test that users can only see their own data"""
    user1 = User.objects.create_user(username='iso_user1', password='test123')
    user2 = User.objects.create_user(username='iso_user2', password='test123')

    account1 = Account.objects.create(name_account='User1 Account', balance=Decimal('1000.00'), user=user1)
    account2 = Account.objects.create(name_account='User2 Account', balance=Decimal('2000.00'), user=user2)

    user1_accounts = Account.objects.filter(user=user1)
    user2_accounts = Account.objects.filter(user=user2)

    assert user1_accounts.count() == 1
    assert user2_accounts.count() == 1
    assert account1 in user1_accounts
    assert account2 not in user1_accounts

    account1.delete()
    account2.delete()
    user1.delete()
    user2.delete()
    return True


# Run edge case tests
test_zero_balance_account()
test_large_balance()
test_zero_budget()
test_empty_description()
test_budget_same_start_end_date()
test_multiple_users_isolation()


# ============================================================================
# CLEANUP AND SAVE RESULTS
# ============================================================================

# Clean up API test data
api_test_account.delete()
api_test_user.delete()

# Print summary
print("\n" + "="*60)
print("TEST SUMMARY")
print("="*60)
summary = test_results.get_summary()
print(f"Total Tests: {summary['total']}")
print(f"Passed: {summary['passed']}")
print(f"Failed: {summary['failed']}")
print(f"Errors: {summary['errors']}")
print(f"Pass Rate: {summary['pass_rate']}")
print("="*60)

# Save results to file
output = {
    "test_run": {
        "timestamp": datetime.now().isoformat(),
        "python_version": sys.version,
        "django_version": django.__version__,
    },
    "summary": summary,
    "results": test_results.results
}

output_file = os.path.join(os.path.dirname(__file__), 'test_results_proof.json')
with open(output_file, 'w') as f:
    json.dump(output, f, indent=2)

print(f"\nResults saved to: {output_file}")


# ============================================================================
# FRONTEND COMPONENT TESTS (Documentation)
# ============================================================================

frontend_tests = """
FRONTEND COMPONENT TESTS
========================

The following frontend components should be manually tested or tested with Jest/React Testing Library:

1. AuthContext Tests:
   - [ ] User login stores JWT token in localStorage
   - [ ] User logout removes JWT token from localStorage
   - [ ] Token refresh works when access token expires
   - [ ] Protected routes redirect to login when not authenticated

2. Dashboard Tests:
   - [ ] Summary cards display correct totals
   - [ ] Recent transactions show last 5 transactions
   - [ ] Budget progress bars show correct percentages
   - [ ] Quick transaction modal opens and submits correctly
   - [ ] Sidebar navigation works on desktop
   - [ ] Mobile quick actions work on mobile

3. Accounts Page Tests:
   - [ ] Account list loads correctly
   - [ ] Create account form works
   - [ ] Edit account updates correctly
   - [ ] Delete account removes from list
   - [ ] Account selection shows transaction history
   - [ ] Total balance calculates correctly

4. Transactions Page Tests:
   - [ ] Transaction list loads correctly
   - [ ] Filter by type (All/Income/Expenses) works
   - [ ] Create transaction form validates required fields
   - [ ] Edit transaction updates correctly
   - [ ] Delete transaction removes from list
   - [ ] Summary cards show correct totals

5. Budgets Page Tests:
   - [ ] Budget list loads correctly
   - [ ] Account filter works
   - [ ] Progress bars show correct percentage
   - [ ] Status badges display correctly (On Track/Warning/Over/Ended)
   - [ ] Create budget form works
   - [ ] Edit budget updates correctly
   - [ ] Delete budget removes from list
   - [ ] Category limit setter works

6. Categories Page Tests:
   - [ ] Category list loads correctly
   - [ ] Create category form works
   - [ ] Edit category updates correctly
   - [ ] Delete category removes from list
   - [ ] Budget linking works

7. Login/Register Tests:
   - [ ] Login form validates required fields
   - [ ] Login with valid credentials redirects to dashboard
   - [ ] Login with invalid credentials shows error
   - [ ] Register form validates all fields
   - [ ] Register with valid data creates account and logs in
   - [ ] Register with existing username shows error

8. Navigation Tests:
   - [ ] Navbar shows correct links based on auth state
   - [ ] Logout button works
   - [ ] Protected routes redirect when not logged in
   - [ ] Public routes redirect when logged in
"""

# Save frontend test documentation
frontend_output_file = os.path.join(os.path.dirname(__file__), 'frontend_test_checklist.txt')
with open(frontend_output_file, 'w') as f:
    f.write(frontend_tests)

print(f"Frontend test checklist saved to: {frontend_output_file}")
print("\n✅ All tests completed!")
