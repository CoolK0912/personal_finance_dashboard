from rest_framework import serializers
from transaction.models import Transaction
from django.contrib.auth.models import User
from account.models import Account
from category.models import Category

class TransactionSerializer(serializers.ModelSerializer):
    user_username = serializers.ReadOnlyField(source='user.username')
    account_name = serializers.ReadOnlyField(source='account.name')
    budget_category_name = serializers.ReadOnlyField(source='budget_category.name')
    
    class Meta:
        model = Transaction
        fields = ['id', 'user', 'amount', 'description', 'date', 'account', 'budget_category', 'type']
        read_only_fields = ['id', 'date']
